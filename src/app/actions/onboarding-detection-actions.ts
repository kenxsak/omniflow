'use server';

import { adminDb } from '@/lib/firebase-admin';
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
  if (!adminDb || !companyId) return null;

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
    const leadsSnap = await adminDb.collection('leads')
      .where('companyId', '==', companyId)
      .limit(15)
      .get();
    result.addedContacts.count = leadsSnap.size;
    result.addedContacts.completed = leadsSnap.size >= 10;

    // Check email campaigns sent
    const campaignsSnap = await adminDb.collection('campaigns')
      .where('companyId', '==', companyId)
      .where('status', '==', 'sent')
      .limit(5)
      .get();
    result.sentFirstCampaign.count = campaignsSnap.size;
    result.sentFirstCampaign.completed = campaignsSnap.size >= 1;

    // Check digital cards created
    const cardsSnap = await adminDb.collection('digitalCards')
      .where('companyId', '==', companyId)
      .limit(5)
      .get();
    result.createdDigitalCard.count = cardsSnap.size;
    result.createdDigitalCard.completed = cardsSnap.size >= 1;

    // Check team members (users in company excluding the owner)
    const usersSnap = await adminDb.collection('users')
      .where('companyId', '==', companyId)
      .limit(10)
      .get();
    result.invitedTeamMember.count = Math.max(0, usersSnap.size - 1); // Exclude owner
    result.invitedTeamMember.completed = usersSnap.size > 1;

    // Check AI usage (check company's AI analytics or content generation history)
    const companySnap = await adminDb.collection('companies').doc(companyId).get();
    if (companySnap.exists) {
      const companyData = companySnap.data();
      const aiCreditsUsed = companyData?.aiAnalytics?.currentMonth?.creditsUsed || 0;
      result.triedAI.count = aiCreditsUsed;
      result.triedAI.completed = aiCreditsUsed > 0;
    }

    // Check automations setup
    const automationsSnap = await adminDb.collection('automations')
      .where('companyId', '==', companyId)
      .limit(5)
      .get();
    result.setupAutomation.count = automationsSnap.size;
    result.setupAutomation.completed = automationsSnap.size >= 1;

    // Check multi-channel campaigns (campaigns with multiple channels)
    try {
      const multiChannelSnap = await adminDb.collection('campaigns')
        .where('companyId', '==', companyId)
        .where('channels', 'array-contains-any', ['sms', 'whatsapp'])
        .limit(5)
        .get();
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
