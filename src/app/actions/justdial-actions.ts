'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import type { JustDialSettings } from '@/types/justdial';

/**
 * Get JustDial settings for a company
 */
export async function getJustDialSettingsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; settings?: JustDialSettings; webhookUrl?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const settingsDoc = await adminDb.collection('justdialSettings').doc(companyId).get();
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';
    const webhookUrl = `${baseUrl}/api/webhooks/justdial?companyId=${companyId}`;

    if (!settingsDoc.exists) {
      return {
        success: true,
        settings: {
          companyId,
          enabled: false,
          apiKey: '',
          autoCreateLead: true,
          notifyOnNewLead: true,
          totalLeadsReceived: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        webhookUrl,
      };
    }

    return {
      success: true,
      settings: settingsDoc.data() as JustDialSettings,
      webhookUrl,
    };
  } catch (error) {
    console.error('Error fetching JustDial settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

/**
 * Save JustDial settings
 */
export async function saveJustDialSettingsAction(params: {
  idToken: string;
  settings: Partial<JustDialSettings>;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const existingDoc = await adminDb.collection('justdialSettings').doc(companyId).get();
    const now = new Date().toISOString();

    if (existingDoc.exists) {
      await adminDb.collection('justdialSettings').doc(companyId).update({
        ...params.settings,
        updatedAt: now,
      });
    } else {
      await adminDb.collection('justdialSettings').doc(companyId).set({
        companyId,
        enabled: false,
        apiKey: '',
        autoCreateLead: true,
        notifyOnNewLead: true,
        totalLeadsReceived: 0,
        ...params.settings,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving JustDial settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Generate a new API key
 */
export async function generateJustDialKeyAction(params: {
  idToken: string;
}): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const apiKey = `jd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;

    await adminDb.collection('justdialSettings').doc(companyId).set({
      apiKey,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true, apiKey };
  } catch (error) {
    console.error('Error generating JustDial key:', error);
    return { success: false, error: 'Failed to generate key' };
  }
}

/**
 * Get JustDial lead statistics
 */
export async function getJustDialStatsAction(params: {
  idToken: string;
}): Promise<{ 
  success: boolean; 
  stats?: { totalLeads: number; thisMonth: number; lastSync?: string }; 
  error?: string 
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const settingsDoc = await adminDb.collection('justdialSettings').doc(companyId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() as JustDialSettings : null;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthQuery = await adminDb.collection('leads')
      .where('companyId', '==', companyId)
      .where('source', '==', 'justdial')
      .where('createdAt', '>=', startOfMonth.toISOString())
      .get();

    return {
      success: true,
      stats: {
        totalLeads: settings?.totalLeadsReceived || 0,
        thisMonth: thisMonthQuery.size,
        lastSync: settings?.lastSyncAt,
      },
    };
  } catch (error) {
    console.error('Error fetching JustDial stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}
