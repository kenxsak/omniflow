'use server';

/**
 * Facebook Lead Ads Server Actions
 * 
 * Handles configuration management, manual sync, and webhook logs
 * for Facebook Lead Ads integration.
 */

import { db } from '@/lib/firebase-admin';
import { encryptApiKey, decryptApiKey } from '@/lib/encryption';
import {
  FacebookLeadsConfig,
  FacebookSyncResult,
  FacebookConnectionTestResult,
  FacebookWebhookLog,
} from '@/types/facebook-leads';
import {
  validateAccessToken,
  fetchRecentLeads,
  mapFacebookLeadToCRM,
  generateVerifyToken,
} from '@/lib/facebook-leads-api';

// ============================================
// Configuration Actions
// ============================================

/**
 * Save Facebook Lead Ads configuration for a company
 */
export async function saveFacebookLeadsConfig(
  companyId: string,
  config: {
    appId: string;
    appSecret: string;
    pageAccessToken: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    if (!config.appId || !config.appSecret || !config.pageAccessToken) {
      return { success: false, error: 'All fields are required' };
    }

    // Validate the access token first
    const validation = await validateAccessToken(config.pageAccessToken);
    
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid access token' };
    }

    // Get existing config to preserve verify token
    const integrationRef = db.collection('companies').doc(companyId)
      .collection('integrations').doc('facebook_leads');
    
    const existingDoc = await integrationRef.get();
    const existingConfig = existingDoc.exists ? existingDoc.data() as FacebookLeadsConfig : null;

    // Encrypt sensitive fields
    const encryptedAppSecret = await encryptApiKey(config.appSecret);
    const encryptedAccessToken = await encryptApiKey(config.pageAccessToken);

    // Generate verify token if not exists
    const verifyToken = existingConfig?.verifyToken || generateVerifyToken();

    const configToSave: FacebookLeadsConfig = {
      appId: config.appId,
      appSecret: encryptedAppSecret,
      pageAccessToken: encryptedAccessToken,
      verifyToken,
      pageId: validation.pageId,
      pageName: validation.pageName,
      isConnected: true,
      createdAt: existingConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await integrationRef.set(configToSave);

    return { success: true };
  } catch (error) {
    console.error('[Facebook Leads] Error saving config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save configuration' 
    };
  }
}

/**
 * Get Facebook Lead Ads configuration for a company
 */
export async function getFacebookLeadsConfig(
  companyId: string
): Promise<{
  success: boolean;
  config?: {
    appId: string;
    verifyToken: string;
    pageId?: string;
    pageName?: string;
    isConnected: boolean;
    lastSyncAt?: string;
  };
  error?: string;
}> {
  try {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    const integrationRef = db.collection('companies').doc(companyId)
      .collection('integrations').doc('facebook_leads');
    
    const doc = await integrationRef.get();

    if (!doc.exists) {
      return { 
        success: true, 
        config: {
          appId: '',
          verifyToken: generateVerifyToken(),
          isConnected: false,
        }
      };
    }

    const data = doc.data() as FacebookLeadsConfig;

    // Return config without sensitive fields
    return {
      success: true,
      config: {
        appId: data.appId,
        verifyToken: data.verifyToken,
        pageId: data.pageId,
        pageName: data.pageName,
        isConnected: data.isConnected,
        lastSyncAt: data.lastSyncAt,
      },
    };
  } catch (error) {
    console.error('[Facebook Leads] Error getting config:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get configuration' 
    };
  }
}

/**
 * Test Facebook connection
 */
export async function testFacebookConnection(
  companyId: string
): Promise<FacebookConnectionTestResult> {
  try {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    const integrationRef = db.collection('companies').doc(companyId)
      .collection('integrations').doc('facebook_leads');
    
    const doc = await integrationRef.get();

    if (!doc.exists) {
      return { success: false, error: 'Facebook integration not configured' };
    }

    const config = doc.data() as FacebookLeadsConfig;

    // Decrypt and validate token
    const accessToken = await decryptApiKey(config.pageAccessToken);
    const validation = await validateAccessToken(accessToken);

    if (validation.valid) {
      // Update page info if changed
      if (validation.pageName !== config.pageName || validation.pageId !== config.pageId) {
        await integrationRef.update({
          pageId: validation.pageId,
          pageName: validation.pageName,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return validation;
  } catch (error) {
    console.error('[Facebook Leads] Error testing connection:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    };
  }
}

// ============================================
// Sync Actions
// ============================================

/**
 * Manually sync recent leads from Facebook
 */
export async function syncRecentFacebookLeads(
  companyId: string
): Promise<FacebookSyncResult> {
  try {
    if (!companyId) {
      return { success: false, synced: 0, skipped: 0, errors: 0, errorMessages: ['Company ID is required'] };
    }

    const integrationRef = db.collection('companies').doc(companyId)
      .collection('integrations').doc('facebook_leads');
    
    const doc = await integrationRef.get();

    if (!doc.exists) {
      return { success: false, synced: 0, skipped: 0, errors: 0, errorMessages: ['Facebook integration not configured'] };
    }

    const config = doc.data() as FacebookLeadsConfig;

    if (!config.isConnected || !config.pageId) {
      return { success: false, synced: 0, skipped: 0, errors: 0, errorMessages: ['Facebook not connected'] };
    }

    // Decrypt access token
    const accessToken = await decryptApiKey(config.pageAccessToken);

    // Fetch leads from last 7 days
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const leads = await fetchRecentLeads(config.pageId, accessToken, since);

    let synced = 0;
    let skipped = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    for (const lead of leads) {
      try {
        // Check if lead already exists
        const existingQuery = await db.collection('companies').doc(companyId)
          .collection('leads')
          .where('sourceDetails.facebookLeadId', '==', lead.id)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          skipped++;
          continue;
        }

        // Map and save lead
        const mappedLead = mapFacebookLeadToCRM(lead, config.pageName);

        await db.collection('companies').doc(companyId)
          .collection('leads').add({
            ...mappedLead,
            companyId,
            status: 'new',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

        synced++;
      } catch (error) {
        errors++;
        errorMessages.push(`Lead ${lead.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Update last sync time
    await integrationRef.update({
      lastSyncAt: new Date().toISOString(),
    });

    return {
      success: true,
      synced,
      skipped,
      errors,
      errorMessages: errorMessages.length > 0 ? errorMessages : undefined,
    };
  } catch (error) {
    console.error('[Facebook Leads] Error syncing leads:', error);
    return { 
      success: false, 
      synced: 0, 
      skipped: 0, 
      errors: 1,
      errorMessages: [error instanceof Error ? error.message : 'Sync failed'] 
    };
  }
}

// ============================================
// Webhook Log Actions
// ============================================

/**
 * Get recent webhook logs
 */
export async function getFacebookWebhookLogs(
  companyId: string,
  limit: number = 50
): Promise<{
  success: boolean;
  logs?: FacebookWebhookLog[];
  error?: string;
}> {
  try {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    const logsRef = db.collection('companies').doc(companyId)
      .collection('facebookWebhookLogs');
    
    const snapshot = await logsRef
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs: FacebookWebhookLog[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as FacebookWebhookLog));

    return { success: true, logs };
  } catch (error) {
    console.error('[Facebook Leads] Error getting webhook logs:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get logs' 
    };
  }
}

/**
 * Disconnect Facebook integration
 */
export async function disconnectFacebookLeads(
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!companyId) {
      return { success: false, error: 'Company ID is required' };
    }

    const integrationRef = db.collection('companies').doc(companyId)
      .collection('integrations').doc('facebook_leads');
    
    await integrationRef.update({
      isConnected: false,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('[Facebook Leads] Error disconnecting:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to disconnect' 
    };
  }
}
