"use client";

import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendEmailVerification, type Auth } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig, isFirebaseConfigured } from '@/lib/firebase-config';
import { convertErrorToFriendly } from '@/lib/friendly-messages';
import { addAppUser } from '@/lib/saas-data';
import { seedInitialData } from '@/lib/mock-data';

let auth: Auth | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (getApps().length === 0) {
    try {
      const app = initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      auth = null;
    }
  } else {
    const app = getApp();
    auth = getAuth(app);
  }
}

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  requiresEmailVerification?: boolean;
  requires2FA?: boolean;
}

async function setSessionCookie(idToken: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('Failed to set session cookie:', response.status);
      return false;
    }
    
    const data = await response.json();
    console.log('[Auth] Session cookie set:', data.success);
    return data.success === true;
  } catch (error) {
    console.error('Failed to set session cookie:', error);
    return false;
  }
}

export async function lightweightLogin(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    const friendlyError = convertErrorToFriendly('auth/configuration-error');
    return {
      success: false,
      error: friendlyError.description,
    };
  }

  try {
    console.log('[Auth] Attempting login for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Auth] Firebase login successful, uid:', userCredential.user.uid);
    
    // Check if email is verified
    // Allow existing users (created before email verification was required) to login
    // by checking if their account was created more than 1 hour ago
    const creationTime = userCredential.user.metadata.creationTime;
    const accountAge = creationTime ? Date.now() - new Date(creationTime).getTime() : Infinity;
    const isLegacyUser = accountAge > 60 * 60 * 1000; // More than 1 hour old = legacy user
    
    if (!userCredential.user.emailVerified && !isLegacyUser) {
      console.log('[Auth] Email not verified for new user, sending verification email...');
      try {
        await sendEmailVerification(userCredential.user);
      } catch (verifyError) {
        console.warn('[Auth] Could not send verification email:', verifyError);
      }
      await signOut(auth);
      return {
        success: false,
        error: 'Please verify your email before logging in. A new verification email has been sent.',
        requiresEmailVerification: true,
      };
    }
    
    // Check if 2FA is enabled for this user
    let twoFactorEnabled = false;
    try {
      const twoFactorResponse = await fetch('/api/auth/check-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userCredential.user.uid }),
      });
      
      if (twoFactorResponse.ok) {
        const twoFactorCheck = await twoFactorResponse.json();
        twoFactorEnabled = twoFactorCheck.enabled === true;
      }
    } catch (twoFactorError) {
      console.warn('[Auth] Could not check 2FA status:', twoFactorError);
      // Continue with login if 2FA check fails
    }
    
    if (twoFactorEnabled) {
      console.log('[Auth] 2FA is enabled, requiring verification...');
      // Sign out temporarily - user needs to verify 2FA first
      try {
        await signOut(auth);
        console.log('[Auth] Signed out for 2FA verification');
      } catch (signOutError) {
        console.warn('[Auth] Sign out error (continuing anyway):', signOutError);
      }
      // Store credentials temporarily for 2FA completion
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('pending2FA', JSON.stringify({
          userId: userCredential.user.uid,
          email: email,
        }));
        sessionStorage.setItem('pending2FAPassword', password);
        // Redirect to separate 2FA verification page
        window.location.href = '/login/verify-2fa?uid=' + userCredential.user.uid;
      }
      return {
        success: false,
        requires2FA: true,
        userId: userCredential.user.uid,
      };
    }
    
    const idToken = await userCredential.user.getIdToken();
    console.log('[Auth] Got ID token');
    
    // Ensure user document exists in Firestore (handles users who registered before fix)
    try {
      console.log('[Auth] Ensuring user document exists...');
      await addAppUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
      console.log('[Auth] User document ready');
    } catch (userError) {
      console.error('[Auth] Error ensuring user document exists:', userError);
      // Continue with login even if this fails - user might already exist
    }
    
    const cookieSet = await setSessionCookie(idToken);
    console.log('[Auth] Cookie set result:', cookieSet);

    return {
      success: true,
      userId: userCredential.user.uid,
    };
  } catch (error: any) {
    console.error('[Auth] Login error:', error);
    const friendlyError = convertErrorToFriendly(error.code || 'auth/operation-failed');
    return {
      success: false,
      error: friendlyError.description,
    };
  }
}

export async function lightweightSignup(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    const friendlyError = convertErrorToFriendly('auth/configuration-error');
    return {
      success: false,
      error: friendlyError.description,
    };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Send email verification
    try {
      await sendEmailVerification(userCredential.user);
      console.log('[Auth] Verification email sent to:', email);
    } catch (verifyError) {
      console.warn('[Auth] Could not send verification email:', verifyError);
    }
    
    // Create the user document in Firestore
    const { user: newUser, isNewCompany } = await addAppUser({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
    });
    
    // Seed initial data for new companies
    if (isNewCompany && newUser.companyId && newUser.role === 'admin') {
      await seedInitialData(newUser.companyId, newUser.email);
    }
    
    // Sign out after signup - user needs to verify email first
    await signOut(auth);

    return {
      success: true,
      userId: userCredential.user.uid,
      requiresEmailVerification: true,
    };
  } catch (error: any) {
    console.error('Signup error:', error);
    const friendlyError = convertErrorToFriendly(error.code || 'auth/operation-failed');
    return {
      success: false,
      error: friendlyError.description,
    };
  }
}

/**
 * Resend email verification to the current user
 */
export async function resendVerificationEmail(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    // Sign in temporarily to send verification
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    if (userCredential.user.emailVerified) {
      await signOut(auth);
      return { success: false, error: 'Email is already verified. Please login.' };
    }
    
    await sendEmailVerification(userCredential.user);
    await signOut(auth);
    
    return { success: true };
  } catch (error: any) {
    console.error('Resend verification error:', error);
    const friendlyError = convertErrorToFriendly(error.code || 'auth/operation-failed');
    return { success: false, error: friendlyError.description };
  }
}

/**
 * Complete login after 2FA verification
 * Re-authenticates and sets the session cookie
 */
export async function completeLoginAfter2FA(email: string, password: string): Promise<AuthResult> {
  if (!isFirebaseConfigured || !auth) {
    return { success: false, error: 'Firebase not configured' };
  }

  try {
    console.log('[Auth] Completing login after 2FA for:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    const idToken = await userCredential.user.getIdToken();
    console.log('[Auth] Got ID token after 2FA');
    
    // Ensure user document exists
    try {
      await addAppUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
      });
    } catch (userError) {
      console.error('[Auth] Error ensuring user document exists:', userError);
    }
    
    const cookieSet = await setSessionCookie(idToken);
    console.log('[Auth] Cookie set result after 2FA:', cookieSet);

    return {
      success: true,
      userId: userCredential.user.uid,
    };
  } catch (error: any) {
    console.error('[Auth] Complete login after 2FA error:', error);
    const friendlyError = convertErrorToFriendly(error.code || 'auth/operation-failed');
    return { success: false, error: friendlyError.description };
  }
}
