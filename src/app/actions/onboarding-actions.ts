'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { Company } from '@/types/saas';

export type ChecklistItem = 
  | 'addedContacts'
  | 'sentFirstCampaign'
  | 'createdDigitalCard'
  | 'invitedTeamMember'
  | 'triedAI'
  | 'setupAutomation'
  | 'launchedMultiChannel';

export interface OnboardingProgress {
  completed: boolean;
  completedAt?: string;
  skippedAt?: string;
  checklist: {
    addedContacts: boolean;
    sentFirstCampaign: boolean;
    createdDigitalCard: boolean;
    invitedTeamMember: boolean;
    triedAI: boolean;
    setupAutomation: boolean;
    launchedMultiChannel: boolean;
  };
  checklistCompletedAt?: {
    addedContacts?: string;
    sentFirstCampaign?: string;
    createdDigitalCard?: string;
    invitedTeamMember?: string;
    triedAI?: string;
    setupAutomation?: string;
    launchedMultiChannel?: string;
  };
}

export async function getOnboardingProgress(companyId: string): Promise<OnboardingProgress | null> {
  if (!adminDb || !companyId) return null;
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    
    if (!companySnap.exists) {
      return null;
    }
    
    const companyData = companySnap.data() as Company;
    return companyData?.onboardingProgress || null;
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return null;
  }
}

export async function updateChecklistItem(
  companyId: string,
  item: ChecklistItem,
  completed: boolean = true
): Promise<{ success: boolean; message: string }> {
  if (!adminDb || !companyId) {
    return { success: false, message: 'Invalid parameters' };
  }
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    
    if (!companySnap.exists) {
      return { success: false, message: 'Company not found' };
    }
    
    const currentData = companySnap.data() as Company;
    const currentProgress = currentData?.onboardingProgress || {
      completed: false,
      checklist: {
        addedContacts: false,
        sentFirstCampaign: false,
        createdDigitalCard: false,
        invitedTeamMember: false,
        triedAI: false,
        setupAutomation: false,
        launchedMultiChannel: false,
      },
      checklistCompletedAt: {},
    };
    
    const updatedChecklist = {
      ...currentProgress.checklist,
      [item]: completed,
    };
    
    const allComplete = Object.values(updatedChecklist).every(val => val === true);
    
    const updates: any = {
      'onboardingProgress.checklist': updatedChecklist,
    };
    
    if (completed) {
      updates[`onboardingProgress.checklistCompletedAt.${item}`] = new Date().toISOString();
    } else {
      const { FieldValue } = await import('firebase-admin/firestore');
      updates[`onboardingProgress.checklistCompletedAt.${item}`] = FieldValue.delete();
    }
    
    if (allComplete && !currentProgress.completed) {
      updates['onboardingProgress.completed'] = true;
      updates['onboardingProgress.completedAt'] = new Date().toISOString();
    }
    
    await companyRef.update(updates);
    
    return { success: true, message: `Checklist item ${item} updated` };
  } catch (error) {
    console.error('Error updating checklist item:', error);
    return { success: false, message: 'Failed to update checklist item' };
  }
}

export async function skipOnboarding(companyId: string): Promise<{ success: boolean; message: string }> {
  if (!adminDb || !companyId) {
    return { success: false, message: 'Invalid parameters' };
  }
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    
    await companyRef.update({
      'onboardingProgress.completed': true,
      'onboardingProgress.skippedAt': new Date().toISOString(),
    });
    
    return { success: true, message: 'Onboarding skipped' };
  } catch (error) {
    console.error('Error skipping onboarding:', error);
    return { success: false, message: 'Failed to skip onboarding' };
  }
}

export async function completeOnboarding(companyId: string): Promise<{ success: boolean; message: string }> {
  if (!adminDb || !companyId) {
    return { success: false, message: 'Invalid parameters' };
  }
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    
    await companyRef.update({
      'onboardingProgress.completed': true,
      'onboardingProgress.completedAt': new Date().toISOString(),
    });
    
    return { success: true, message: 'Onboarding completed' };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, message: 'Failed to complete onboarding' };
  }
}

export async function initializeOnboardingProgress(companyId: string): Promise<{ success: boolean; message: string }> {
  if (!adminDb || !companyId) {
    return { success: false, message: 'Invalid parameters' };
  }
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    
    if (!companySnap.exists) {
      return { success: false, message: 'Company not found' };
    }
    
    const currentData = companySnap.data() as Company;
    
    if (currentData?.onboardingProgress?.checklist) {
      return { success: true, message: 'Onboarding already initialized' };
    }
    
    await companyRef.update({
      'onboardingProgress': {
        completed: false,
        checklist: {
          addedContacts: false,
          sentFirstCampaign: false,
          createdDigitalCard: false,
          invitedTeamMember: false,
          triedAI: false,
          setupAutomation: false,
          launchedMultiChannel: false,
        },
        checklistCompletedAt: {},
      },
    });
    
    return { success: true, message: 'Onboarding progress initialized' };
  } catch (error) {
    console.error('Error initializing onboarding progress:', error);
    return { success: false, message: 'Failed to initialize onboarding progress' };
  }
}

/**
 * Set up company locale settings (country, timezone, currency)
 * Called during onboarding or when user updates their location settings
 */
export async function setupCompanyLocale(
  companyId: string,
  localeData: {
    country?: string;
    countryCode?: string;
    timezone?: string;
    currencyCode?: string;
    callingCode?: string;
  }
): Promise<{ success: boolean; message: string }> {
  if (!adminDb || !companyId) {
    return { success: false, message: 'Invalid parameters' };
  }
  
  try {
    const companyRef = adminDb.collection('companies').doc(companyId);
    const companySnap = await companyRef.get();
    
    if (!companySnap.exists) {
      return { success: false, message: 'Company not found' };
    }
    
    const updates: Record<string, any> = {};
    
    if (localeData.country) updates.country = localeData.country;
    if (localeData.countryCode) updates.countryCode = localeData.countryCode;
    if (localeData.timezone) updates.timezone = localeData.timezone;
    if (localeData.currencyCode) updates.currencyCode = localeData.currencyCode;
    if (localeData.callingCode) updates.callingCode = localeData.callingCode;
    
    if (Object.keys(updates).length > 0) {
      await companyRef.update(updates);
    }
    
    return { success: true, message: 'Company locale settings updated' };
  } catch (error) {
    console.error('Error setting up company locale:', error);
    return { success: false, message: 'Failed to update locale settings' };
  }
}
