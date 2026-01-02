'use server';

import { serverDb } from '@/lib/firebase-server';
import { verifyAuthToken } from '@/lib/firebase-admin';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import type { QuoteDocument } from '@/types/saas';

/**
 * Save a quote to Firestore
 */
export async function saveQuoteAction(params: {
  idToken: string;
  quote: Omit<QuoteDocument, 'id' | 'companyId' | 'createdBy' | 'createdAt'>;
}): Promise<{ success: boolean; quoteId?: string; error?: string }> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = doc(serverDb, 'users', verification.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData.companyId;

    // Generate quote ID
    const quoteId = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const quoteData: QuoteDocument = {
      id: quoteId,
      companyId,
      createdBy: verification.uid,
      createdAt: new Date().toISOString(),
      ...params.quote,
    };

    await setDoc(doc(serverDb, 'quotes', quoteId), quoteData);

    return { success: true, quoteId };
  } catch (error) {
    console.error('Error saving quote:', error);
    return { success: false, error: 'Failed to save quote' };
  }
}

/**
 * Update quote status
 */
export async function updateQuoteStatusAction(params: {
  idToken: string;
  quoteId: string;
  status: QuoteDocument['status'];
}): Promise<{ success: boolean; error?: string }> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = doc(serverDb, 'users', verification.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const quoteRef = doc(serverDb, 'quotes', params.quoteId);
    const quoteDoc = await getDoc(quoteRef);
    
    if (!quoteDoc.exists()) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify quote belongs to user's company
    const quoteData = quoteDoc.data();
    const userData = userDoc.data();
    
    if (quoteData.companyId !== userData.companyId) {
      return { success: false, error: 'Unauthorized' };
    }

    const updateData: Record<string, any> = { status: params.status };
    
    if (params.status === 'sent') {
      updateData.sentAt = new Date().toISOString();
    } else if (params.status === 'viewed') {
      updateData.viewedAt = new Date().toISOString();
    } else if (params.status === 'accepted' || params.status === 'rejected') {
      updateData.respondedAt = new Date().toISOString();
    }

    await updateDoc(quoteRef, updateData);

    return { success: true };
  } catch (error) {
    console.error('Error updating quote status:', error);
    return { success: false, error: 'Failed to update quote' };
  }
}

/**
 * Get quotes for a lead
 */
export async function getLeadQuotesAction(params: {
  idToken: string;
  leadId: string;
}): Promise<{ success: boolean; quotes?: QuoteDocument[]; error?: string }> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = doc(serverDb, 'users', verification.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData.companyId;

    const quotesQuery = query(
      collection(serverDb, 'quotes'),
      where('companyId', '==', companyId),
      where('leadId', '==', params.leadId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const snapshot = await getDocs(quotesQuery);
    const quotes = snapshot.docs.map(doc => doc.data() as QuoteDocument);

    return { success: true, quotes };
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return { success: false, error: 'Failed to fetch quotes' };
  }
}

/**
 * Get company branding for quote generation
 */
export async function getCompanyBrandingAction(params: {
  idToken: string;
}): Promise<{ 
  success: boolean; 
  branding?: {
    name: string;
    logoUrl?: string;
    primaryColor?: string;
    tagline?: string;
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  }; 
  error?: string 
}> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userRef = doc(serverDb, 'users', verification.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyRef = doc(serverDb, 'companies', userData.companyId);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      return { success: false, error: 'Company not found' };
    }

    const company = companyDoc.data();
    const branding = company.companyBranding || {};

    return { 
      success: true, 
      branding: {
        name: company.name || 'Your Company',
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor || '#10b981',
        tagline: branding.tagline,
        phone: company.phone,
        email: company.registeredEmail || company.adminEmail,
        address: company.address,
        website: company.website,
      }
    };
  } catch (error) {
    console.error('Error fetching company branding:', error);
    return { success: false, error: 'Failed to fetch branding' };
  }
}
