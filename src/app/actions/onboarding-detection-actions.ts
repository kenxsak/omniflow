'use server';

import { serverDb as db } from '@/lib/firebase-server';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { updateChecklistItem, type ChecklistItem } from './onboarding-actions';

export interface OnboardingDetectionResult {
  addedContacts: { completed: boolean; count: number };
  sentFirstCampaign: { completed: boolean; count: number };
  createdDigitalCard: { completed: boolean; count: number };
  invitedTeamMember: { completed: boolean; count: number };
  triedAI: { completed: boolean; count: number };
  setupAutomation: { completed: boolean; count: number };
  launchedMultiChannel: { completed: boolean; count: number };
}

/**
 * Detects actual user progress by checking real data in the database
 * This provides accurate onboarding status based on what the user has actually done
 */
export async function detectOnboardingProgress(companyId: string): Promise<OnboardingDetectionResult | null> {
  if (!db || !companyId) return null;

  try {
    const result: OnboardingDetectionResult = {
      addedContacts: { completed: false, count: 0 },
      sentFirstCampaign: { completed: false, count: 0 },
      createdDigitalCard: { completed: false, count: 0 },
      invitedTeamMember: { completed: false, count: 0 },
      triedAI: { completed: false, count: 0 },
      setupAutomation: { completed: false, count: 0 },
      launchedMultiChannel: { completed: false, count: 0 },
    };

    // Check contacts (leads) - need 10+ to be considered complete
    const leadsRef = collection(db, 'leads');
    const leadsQuery = query(leadsRef, where('companyId', '==', companyId), limit(15));
    const leadsSnap = await getDocs(leadsQuery);
    result.addedContacts.count = leadsSnap.size;
    result.addedContacts.completed = leadsSnap.size >= 10;

    // Check email campaigns sent
    const campaignsRef = collection(db, 'campaigns');
    const campaignsQuery = query(
      campaignsRef, 
      where('companyId', '==', companyId),
      where('status', '==', 'sent'),
      limit(5)
    );
    const campaignsSnap = await getDocs(campaignsQuery);
    result.sentFirstCampaign.count = campaignsSnap.size;
    result.sentFirstCampaign.completed = campaignsSnap.size >= 1;

    // Check digital cards created
    const cardsRef = collection(db, 'digitalCards');
    const cardsQuery = query(cardsRef, where('companyId', '==', companyId), limit(5));
    const cardsSnap = await getDocs(cardsQuery);
    result.createdDigitalCard.count = cardsSnap.size;
    result.createdDigitalCard.completed = cardsSnap.size >= 1;

    // Check team members (users in company excluding the owner)
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('companyId', '==', companyId), limit(10));
    const usersSnap = await getDocs(usersQuery);
    result.invitedTeamMember.count = Math.max(0, usersSnap.size - 1); // Exclude owner
    result.invitedTeamMember.completed = usersSnap.size > 1;

    // Check AI usage (check company's AI analytics or content generation history)
    const companyRef = doc(db, 'companies', companyId);
    const companySnap = await getDoc(companyRef);
    if (companySnap.exists()) {
      const companyData = companySnap.data();
      const aiCreditsUsed = companyData?.aiAnalytics?.currentMonth?.creditsUsed || 0;
      result.triedAI.count = aiCreditsUsed;
      result.triedAI.completed = aiCreditsUsed > 0;
    }

    // Check automations setup
    const automationsRef = collection(db, 'automations');
    const automationsQuery = query(automationsRef, where('companyId', '==', companyId), limit(5));
    const automationsSnap = await getDocs(automationsQuery);
    result.setupAutomation.count = automationsSnap.size;
    result.setupAutomation.completed = automationsSnap.size >= 1;

    // Check multi-channel campaigns (campaigns with multiple channels)
    const multiChannelQuery = query(
      campaignsRef,
      where('companyId', '==', companyId),
      where('channels', 'array-contains-any', ['sms', 'whatsapp']),
      limit(5)
    );
    try {
      const multiChannelSnap = await getDocs(multiChannelQuery);
      result.launchedMultiChannel.count = multiChannelSnap.size;
      result.launchedMultiChannel.completed = multiChannelSnap.size >= 1;
    } catch {
      // If query fails (field doesn't exist), check for any campaign with type
      result.launchedMultiChannel.completed = false;
    }

    return result;
  } catch (error) {
    console.error('Error detecting onboarding progress:', error);
    return null;
  }
}

/**
 * Syncs detected progress with stored onboarding progress
 * Updates the checklist items based on actual user activity
 */
export async function syncOnboardingProgress(companyId: string): Promise<{
  success: boolean;
  updated: ChecklistItem[];
  detection: OnboardingDetectionResult | null;
}> {
  if (!companyId) {
    return { success: false, updated: [], detection: null };
  }

  try {
    const detection = await detectOnboardingProgress(companyId);
    if (!detection) {
      return { success: false, updated: [], detection: null };
    }

    const updated: ChecklistItem[] = [];
    const items: ChecklistItem[] = [
      'addedContacts',
      'sentFirstCampaign', 
      'createdDigitalCard',
      'invitedTeamMember',
      'triedAI',
      'setupAutomation',
      'launchedMultiChannel',
    ];

    // Update each item if it's now completed
    for (const item of items) {
      if (detection[item].completed) {
        const result = await updateChecklistItem(companyId, item, true);
        if (result.success) {
          updated.push(item);
        }
      }
    }

    return { success: true, updated, detection };
  } catch (error) {
    console.error('Error syncing onboarding progress:', error);
    return { success: false, updated: [], detection: null };
  }
}
