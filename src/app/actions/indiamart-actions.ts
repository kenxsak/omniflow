'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import type { IndiaMartSettings } from '@/types/indiamart';

/**
 * Get IndiaMART settings for a company
 */
export async function getIndiaMartSettingsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; settings?: IndiaMartSettings; webhookUrl?: string; error?: string }> {
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

    const settingsDoc = await adminDb.collection('indiamartSettings').doc(companyId).get();
    
    // Generate webhook URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com';
    const webhookUrl = `${baseUrl}/api/webhooks/indiamart?companyId=${companyId}`;

    if (!settingsDoc.exists) {
      // Return default settings
      return {
        success: true,
        settings: {
          companyId,
          enabled: false,
          mobileNumber: '',
          crmKey: '',
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
      settings: settingsDoc.data() as IndiaMartSettings,
      webhookUrl,
    };
  } catch (error) {
    console.error('Error fetching IndiaMART settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

/**
 * Save IndiaMART settings
 */
export async function saveIndiaMartSettingsAction(params: {
  idToken: string;
  settings: Partial<IndiaMartSettings>;
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

    const existingDoc = await adminDb.collection('indiamartSettings').doc(companyId).get();
    const now = new Date().toISOString();

    if (existingDoc.exists) {
      await adminDb.collection('indiamartSettings').doc(companyId).update({
        ...params.settings,
        updatedAt: now,
      });
    } else {
      await adminDb.collection('indiamartSettings').doc(companyId).set({
        companyId,
        enabled: false,
        mobileNumber: '',
        crmKey: '',
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
    console.error('Error saving IndiaMART settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Generate a new CRM key for webhook authentication
 */
export async function generateIndiaMartKeyAction(params: {
  idToken: string;
}): Promise<{ success: boolean; crmKey?: string; error?: string }> {
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

    // Generate a secure random key
    const crmKey = `im_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 15)}`;

    await adminDb.collection('indiamartSettings').doc(companyId).set({
      crmKey,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true, crmKey };
  } catch (error) {
    console.error('Error generating IndiaMART key:', error);
    return { success: false, error: 'Failed to generate key' };
  }
}

/**
 * Get IndiaMART lead statistics
 */
export async function getIndiaMartStatsAction(params: {
  idToken: string;
}): Promise<{ 
  success: boolean; 
  stats?: { 
    totalLeads: number; 
    thisMonth: number; 
    lastSync?: string;
  }; 
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

    // Get settings for total count
    const settingsDoc = await adminDb.collection('indiamartSettings').doc(companyId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() as IndiaMartSettings : null;

    // Count leads from IndiaMART this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthQuery = await adminDb.collection('leads')
      .where('companyId', '==', companyId)
      .where('source', '==', 'indiamart')
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
    console.error('Error fetching IndiaMART stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

/**
 * Test IndiaMART webhook connection
 */
export async function testIndiaMartWebhookAction(params: {
  idToken: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
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

    // Check if settings exist and are enabled
    const settingsDoc = await adminDb.collection('indiamartSettings').doc(companyId).get();
    
    if (!settingsDoc.exists) {
      return { success: false, error: 'IndiaMART integration not configured' };
    }

    const settings = settingsDoc.data() as IndiaMartSettings;
    
    if (!settings.enabled) {
      return { success: false, error: 'IndiaMART integration is disabled' };
    }

    // Log test event
    await adminDb.collection('webhookLogs').add({
      companyId,
      source: 'indiamart',
      event: 'test_connection',
      createdAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Webhook is configured correctly. Waiting for leads from IndiaMART.',
    };
  } catch (error) {
    console.error('Error testing IndiaMART webhook:', error);
    return { success: false, error: 'Failed to test webhook' };
  }
}
