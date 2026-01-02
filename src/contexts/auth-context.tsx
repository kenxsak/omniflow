
"use client";

import React, { createContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import type { AppUser, Company } from '@/types/saas';
import { addAppUser } from '@/lib/saas-data';
import { seedInitialData } from '@/lib/mock-data';
import { getFirebaseAuth, isFirebaseConfigured, getFirebaseDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';


const IMPERSONATOR_UID_KEY = 'omniFlowImpersonatorUid'; // Use session storage for this
const ACTIVE_COMPANY_KEY = 'omniFlowActiveCompanyId'; // For agency mode company switching

interface AuthContextType {
  appUser: AppUser | null;
  user?: AppUser | null;
  idToken?: string | null;
  company: Company | null; // Add company to context
  firebaseUser: FirebaseUser | null;
  impersonatingUser: AppUser | null; // The original superadmin
  loading: boolean;
  isFirebaseConfigured: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isUser: boolean;
  isAgencyUser: boolean; // New: true if user can manage multiple companies
  agencyCompanies: Company[]; // New: list of companies user can access
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password?: string) => Promise<{ success: boolean; error?: string; user?: AppUser }>;
  logout: () => void;
  startImpersonation: (targetUser: AppUser) => void;
  stopImpersonation: () => void;
  refreshAuthContext: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  switchCompany: (companyId: string) => Promise<void>; // New: switch active company for agency users
}

export const AuthContext = createContext<AuthContextType>({
    appUser: null,
    user: null,
    idToken: null,
    company: null,
    firebaseUser: null,
    impersonatingUser: null,
    loading: true,
    isFirebaseConfigured: false,
    isSuperAdmin: false,
    isAdmin: false,
    isManager: false,
    isUser: false,
    isAgencyUser: false,
    agencyCompanies: [],
    login: async () => ({ success: false, error: 'Auth not initialized' }),
    signup: async () => ({ success: false, error: 'Auth not initialized' }),
    logout: () => {},
    startImpersonation: () => {},
    stopImpersonation: () => {},
    refreshAuthContext: async () => {},
    getIdToken: async () => null,
    switchCompany: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [impersonatingUser, setImpersonatingUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [agencyCompanies, setAgencyCompanies] = useState<Company[]>([]);

  // Fetch company for a given companyId
  const fetchCompanyById = useCallback(async (companyId: string): Promise<Company | null> => {
    if (!companyId || !getFirebaseDb()) return null;
    try {
      const companySnap = await getDoc(doc(getFirebaseDb()!, "companies", companyId));
      return companySnap.exists() ? { id: companySnap.id, ...companySnap.data() } as Company : null;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }, []);

  // Fetch all agency companies for agency users
  const fetchAgencyCompanies = useCallback(async (user: AppUser | null) => {
    if (!user?.isAgencyUser || !user?.agencyCompanyIds?.length || !getFirebaseDb()) {
      setAgencyCompanies([]);
      return;
    }
    
    try {
      const companies: Company[] = [];
      
      // Always include the user's primary company first
      if (user.companyId) {
        const primaryCompany = await fetchCompanyById(user.companyId);
        if (primaryCompany) companies.push(primaryCompany);
      }
      
      // Fetch all agency client companies
      for (const companyId of user.agencyCompanyIds) {
        if (companyId !== user.companyId) { // Don't duplicate primary
          const clientCompany = await fetchCompanyById(companyId);
          if (clientCompany) companies.push(clientCompany);
        }
      }
      
      setAgencyCompanies(companies);
    } catch (error) {
      console.error('Error fetching agency companies:', error);
      setAgencyCompanies([]);
    }
  }, [fetchCompanyById]);

  const fetchUserAndCompany = useCallback(async (user: AppUser | null) => {
    if (!user) {
      setCompany(null);
      setAgencyCompanies([]);
      return;
    }
    
    // Check for stored active company (agency mode)
    const storedActiveCompanyId = sessionStorage.getItem(ACTIVE_COMPANY_KEY);
    const activeCompanyId = user.isAgencyUser && storedActiveCompanyId 
      ? storedActiveCompanyId 
      : user.companyId;
    
    if (activeCompanyId) {
      const activeCompany = await fetchCompanyById(activeCompanyId);
      setCompany(activeCompany);
    } else {
      setCompany(null);
    }
    
    // Fetch agency companies if user is an agency user
    await fetchAgencyCompanies(user);
  }, [fetchCompanyById, fetchAgencyCompanies]);

  const fetchFullContext = useCallback(async (currentFirebaseUser: FirebaseUser | null) => {
    if (!getFirebaseDb() || !currentFirebaseUser) {
        setAppUser(null);
        setCompany(null);
        setImpersonatingUser(null);
        setIdToken(null);
        return;
    }
    try {
        // Fetch fresh ID token
        const freshIdToken = await currentFirebaseUser.getIdToken();
        setIdToken(freshIdToken);
        
        const impersonatorUid = sessionStorage.getItem(IMPERSONATOR_UID_KEY);
        if (impersonatorUid) {
             const impersonatorSnap = await getDoc(doc(getFirebaseDb()!, "users", impersonatorUid));
             const impersonator = impersonatorSnap.exists() ? { ...impersonatorSnap.data() as AppUser, idToken: freshIdToken } : null;
             const impersonatedUid = currentFirebaseUser?.uid;
             if (impersonator && impersonatedUid) {
                 const impersonatedSnap = await getDoc(doc(getFirebaseDb()!, "users", impersonatedUid));
                 const impersonatedUser = impersonatedSnap.exists() ? { ...impersonatedSnap.data() as AppUser, idToken: freshIdToken } : null;
                 setImpersonatingUser(impersonator);
                 setAppUser(impersonatedUser);
                 await fetchUserAndCompany(impersonatedUser);
             } else {
                 sessionStorage.removeItem(IMPERSONATOR_UID_KEY);
                 setImpersonatingUser(null);
                 const userSnap = await getDoc(doc(getFirebaseDb()!, "users", currentFirebaseUser.uid));
                 let currentUser = userSnap?.exists() ? { ...userSnap.data() as AppUser, idToken: freshIdToken } : null;
                 
                 // Create user document if it doesn't exist
                 if (!currentUser && currentFirebaseUser.email) {
                     const { user: newUser } = await addAppUser({
                         uid: currentFirebaseUser.uid,
                         email: currentFirebaseUser.email,
                     });
                     currentUser = { ...newUser, idToken: freshIdToken };
                 }
                 
                 setAppUser(currentUser);
                 await fetchUserAndCompany(currentUser);
             }
        } else {
            const userSnap = await getDoc(doc(getFirebaseDb()!, "users", currentFirebaseUser.uid));
            let currentUser = userSnap?.exists() ? { ...userSnap.data() as AppUser, idToken: freshIdToken } : null;
            
            // Create user document if it doesn't exist
            if (!currentUser && currentFirebaseUser.email) {
                const { user: newUser } = await addAppUser({
                    uid: currentFirebaseUser.uid,
                    email: currentFirebaseUser.email,
                });
                currentUser = { ...newUser, idToken: freshIdToken };
            }
            
            setAppUser(currentUser);
            await fetchUserAndCompany(currentUser);
            setImpersonatingUser(null);
        }
    } catch(e) {
        console.error("Error fetching user context from Firestore:", e);
        setAppUser(null);
        setCompany(null);
        setImpersonatingUser(null);
        setIdToken(null);
    }
  }, [fetchUserAndCompany]);
  
  const refreshAuthContext = useCallback(async () => {
    if (firebaseUser) {
        setLoading(true);
        try {
            const freshIdToken = await firebaseUser.getIdToken(true);
            setIdToken(freshIdToken);
            
            // Update appUser with fresh token
            setAppUser(prev => prev ? { ...prev, idToken: freshIdToken } : null);
            
            // Try to update session cookie, don't block on failure
            fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken: freshIdToken }),
            }).catch(err => console.warn('[Auth] Session refresh failed:', err.message));
        } catch (error) {
            console.error('[Auth] Error refreshing token:', error);
        }
        await fetchFullContext(firebaseUser);
        setLoading(false);
    }
  }, [firebaseUser, fetchFullContext]);

  useEffect(() => {
    if (!firebaseUser) return;
    
    const refreshToken = async () => {
      try {
        console.log('[Auth] Auto-refreshing token...');
        const freshIdToken = await firebaseUser.getIdToken(true);
        setIdToken(freshIdToken);
        
        // Update appUser with fresh token
        setAppUser(prev => prev ? { ...prev, idToken: freshIdToken } : null);
        
        // Try to update session cookie, but don't fail if network is unavailable
        try {
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: freshIdToken }),
          });
          console.log('[Auth] Token refreshed successfully');
        } catch (fetchError) {
          // Network error - session cookie update failed but token is still valid locally
          console.warn('[Auth] Could not update session cookie (network issue), token still valid locally');
        }
      } catch (error) {
        // Only log if it's not a network error (user might be offline)
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
          console.error('[Auth] Error auto-refreshing token:', error);
        } else {
          console.warn('[Auth] Token refresh skipped - network unavailable');
        }
      }
    };
    
    // Refresh token every 30 minutes (Firebase tokens expire at 60 minutes)
    const intervalId = setInterval(refreshToken, 30 * 60 * 1000);
    
    // Also refresh when user returns to the tab (visibility change)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Tab became visible, refreshing token...');
        refreshToken();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [firebaseUser]);


   useEffect(() => {
    if (!getFirebaseAuth()) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(getFirebaseAuth()!, async (user) => {
        setLoading(true);
        setFirebaseUser(user);
        if (user) {
            try {
                const idToken = await user.getIdToken();
                // Try to set session cookie, but don't block on failure
                fetch('/api/auth/session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                }).catch(err => console.warn('[Auth] Session cookie update failed:', err.message));
            } catch (error) {
                console.error('[Auth] Error getting ID token:', error);
            }
            await fetchFullContext(user);
        } else {
            // Try to delete session cookie, but don't block on failure
            fetch('/api/auth/session', { method: 'DELETE' })
                .catch(err => console.warn('[Auth] Session cookie delete failed:', err.message));
            setAppUser(null);
            setCompany(null);
            setImpersonatingUser(null);
            sessionStorage.removeItem(IMPERSONATOR_UID_KEY);
        }
        setLoading(false);
    });
    return () => unsubscribe();
  }, [fetchFullContext]);


  const login = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
     if (!getFirebaseAuth() || !getFirebaseDb()) return { success: false, error: "Firebase not configured." };
    if (!password) return { success: false, error: "Password is required." };
    try {
        const userCredential = await signInWithEmailAndPassword(getFirebaseAuth()!, email, password);
        const idToken = await userCredential.user.getIdToken();
        await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
        });
        await fetchFullContext(userCredential.user);
        return { success: true };
    } catch (error: any) {
        console.error("Firebase login error:", error);
        return { success: false, error: error.message };
    }
  };
  
  const signup = async (email: string, password?: string): Promise<{ success: boolean; error?: string; user?: AppUser }> => {
      if (!getFirebaseAuth() || !getFirebaseDb()) return { success: false, error: "Firebase not configured." };
      if (!password) return { success: false, error: "Password is required." };

      try {
          const userCredential = await createUserWithEmailAndPassword(getFirebaseAuth()!, email, password);
          const { user: newUser, isNewCompany } = await addAppUser(userCredential.user);
          
          if (isNewCompany && newUser.companyId && newUser.role === 'admin') {
              await seedInitialData(newUser.companyId, newUser.email);
          }
          
          await signOut(getFirebaseAuth()!);

          return { success: true, user: newUser };
      } catch (error: any) {
           console.error("Firebase signup error:", error);
           if (error.code === 'getFirebaseAuth()/email-already-in-use') {
               return { success: false, error: 'A user with this email already exists.'};
           }
           return { success: false, error: error.message };
      }
  };


  const logout = async () => {
    if (!getFirebaseAuth()) return;
    
    // Clear local state immediately for faster UX
    setAppUser(null);
    setFirebaseUser(null);
    setImpersonatingUser(null);
    setCompany(null);
    setIdToken(null);
    setAgencyCompanies([]);
    sessionStorage.removeItem(IMPERSONATOR_UID_KEY);
    sessionStorage.removeItem(ACTIVE_COMPANY_KEY);
    
    // Fire and forget - don't wait for these
    fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    signOut(getFirebaseAuth()!).catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  const startImpersonation = (targetUser: AppUser) => {
      if (appUser && firebaseUser && appUser.role === 'superadmin') {
          sessionStorage.setItem(IMPERSONATOR_UID_KEY, appUser.uid); 
           setImpersonatingUser(appUser);
           setAppUser(targetUser);
           fetchUserAndCompany(targetUser);
      }
  };

  const stopImpersonation = async () => {
      const impersonatorUid = sessionStorage.getItem(IMPERSONATOR_UID_KEY);
      if (impersonatorUid && getFirebaseDb()) {
          const impersonatorSnap = await getDoc(doc(getFirebaseDb()!, "users", impersonatorUid));
          if (impersonatorSnap.exists()) {
            const impersonatorUser = impersonatorSnap.data() as AppUser;
            setAppUser(impersonatorUser);
            await fetchUserAndCompany(impersonatorUser);
          }
          sessionStorage.removeItem(IMPERSONATOR_UID_KEY);
          setImpersonatingUser(null);
      }
  };

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!firebaseUser) return null;
    try {
      const token = await firebaseUser.getIdToken();
      return token;
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }, [firebaseUser]);

  // Switch active company for agency users
  const switchCompany = useCallback(async (companyId: string) => {
    if (!appUser?.isAgencyUser) {
      console.warn('[Auth] switchCompany called but user is not an agency user');
      return;
    }
    
    // Verify user has access to this company
    const hasAccess = companyId === appUser.companyId || 
                      appUser.agencyCompanyIds?.includes(companyId);
    
    if (!hasAccess) {
      console.error('[Auth] User does not have access to company:', companyId);
      return;
    }
    
    // Store active company in session
    sessionStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
    
    // Fetch and set the new active company
    const newCompany = await fetchCompanyById(companyId);
    setCompany(newCompany);
    
    console.log('[Auth] Switched to company:', newCompany?.name || companyId);
  }, [appUser, fetchCompanyById]);
  
  const isSuperAdmin = appUser?.role === 'superadmin';
  const isAdmin = appUser?.role === 'admin';
  const isManager = appUser?.role === 'manager';
  const isUser = appUser?.role === 'user';
  const isAgencyUser = appUser?.isAgencyUser ?? false;
  
  const value = {
    appUser,
    user: appUser,
    idToken,
    company,
    firebaseUser,
    impersonatingUser,
    loading,
    isFirebaseConfigured,
    isSuperAdmin,
    isAdmin,
    isManager,
    isUser,
    isAgencyUser,
    agencyCompanies,
    login,
    signup,
    logout,
    startImpersonation,
    stopImpersonation,
    refreshAuthContext,
    getIdToken,
    switchCompany,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
