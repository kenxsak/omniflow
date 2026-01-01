/**
 * Facebook Lead Ads Webhook Endpoint
 * 
 * Handles:
 * - GET: Webhook verification challenge from Facebook
 * - POST: Lead notifications from Facebook
 * 
 * @see https://developers.facebook.com/docs/marketing-api/guides/lead-ads/
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import {
  verifyFacebookSignature,
  fetchLeadDetails,
  mapFacebookLeadToCRM,
} from '@/lib/facebook-leads-api';
import { decryptApiKey } from '@/lib/encryption';
import {
  FacebookWebhookPayload,
  FacebookWebhookLog,
  FacebookLeadsConfig,
} from '@/types/facebook-leads';

// ============================================
// GET - Webhook Verification
// ============================================

/**
 * Handle Facebook webhook verification challenge
 * 
 * Facebook sends a GET request with:
 * - hub.mode: 'subscribe'
 * - hub.verify_token: The token we configured
 * - hub.challenge: A random string to echo back
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('[Facebook Webhook] Verification request:', { mode, token: token?.slice(0, 8) + '...' });

  // Validate required parameters
  if (!mode || !token || !challenge) {
    return new NextResponse('Missing parameters', { status: 400 });
  }

  // Must be a subscribe request
  if (mode !== 'subscribe') {
    return new NextResponse('Invalid mode', { status: 400 });
  }

  // Find company with matching verify token
  try {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.get();
    
    let verified = false;
    
    for (const doc of snapshot.docs) {
      const integrationRef = doc.ref.collection('integrations').doc('facebook_leads');
      const integrationDoc = await integrationRef.get();
      
      if (integrationDoc.exists) {
        const config = integrationDoc.data() as FacebookLeadsConfig;
        if (config.verifyToken === token) {
          verified = true;
          
          // Log verification event
          await logWebhookEvent(doc.id, {
            eventType: 'verification',
            processed: true,
          });
          
          break;
        }
      }
    }

    if (verified) {
      console.log('[Facebook Webhook] Verification successful');
      // Return the challenge as plain text (Facebook requirement)
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.log('[Facebook Webhook] Verification failed - token not found');
    return new NextResponse('Invalid verify token', { status: 403 });
  } catch (error) {
    console.error('[Facebook Webhook] Verification error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// ============================================
// POST - Lead Notifications
// ============================================

/**
 * Handle incoming lead notifications from Facebook
 * 
 * Facebook sends a POST request with:
 * - X-Hub-Signature-256 header for verification
 * - JSON body with lead notification data
 */
export async function POST(request: NextRequest) {
  // Always return 200 to Facebook to prevent retry storms
  // Handle errors internally
  
  let rawBody: string;
  let payload: FacebookWebhookPayload;
  
  try {
    rawBody = await request.text();
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error('[Facebook Webhook] Invalid JSON payload');
    return NextResponse.json({ received: true });
  }

  console.log('[Facebook Webhook] Received notification:', {
    object: payload.object,
    entries: payload.entry?.length || 0,
  });

  // Must be a page object
  if (payload.object !== 'page') {
    console.log('[Facebook Webhook] Ignoring non-page object');
    return NextResponse.json({ received: true });
  }

  // Get signature from header
  const signature = request.headers.get('x-hub-signature-256') || '';

  // Process each entry
  for (const entry of payload.entry || []) {
    const pageId = entry.id;
    
    // Find company with this page ID
    const companyConfig = await findCompanyByPageId(pageId);
    
    if (!companyConfig) {
      console.log('[Facebook Webhook] No company found for page:', pageId);
      continue;
    }

    const { companyId, config } = companyConfig;

    // Verify signature
    const appSecret = await decryptApiKey(config.appSecret);
    if (!verifyFacebookSignature(rawBody, signature, appSecret)) {
      console.error('[Facebook Webhook] Signature verification failed for company:', companyId);
      
      await logWebhookEvent(companyId, {
        eventType: 'error',
        error: 'Signature verification failed',
        payload: { pageId },
        processed: false,
      });
      
      continue;
    }

    // Process each change (lead)
    for (const change of entry.changes || []) {
      if (change.field !== 'leadgen') {
        continue;
      }

      const leadgenValue = change.value;
      const facebookLeadId = leadgenValue.leadgen_id;

      console.log('[Facebook Webhook] Processing lead:', facebookLeadId);

      try {
        // Fetch full lead data from Facebook
        const accessToken = await decryptApiKey(config.pageAccessToken);
        const leadData = await fetchLeadDetails(facebookLeadId, accessToken);

        if (!leadData) {
          throw new Error('Failed to fetch lead details from Facebook');
        }

        // Map to CRM format
        const mappedLead = mapFacebookLeadToCRM(leadData, config.pageName);

        // Check for existing lead with same Facebook ID or email
        const existingLead = await findExistingLead(companyId, facebookLeadId, mappedLead.email);

        let crmLeadId: string;

        if (existingLead) {
          // Update existing lead
          await db.collection('companies').doc(companyId)
            .collection('leads').doc(existingLead.id)
            .update({
              ...mappedLead,
              updatedAt: new Date().toISOString(),
            });
          crmLeadId = existingLead.id;
          console.log('[Facebook Webhook] Updated existing lead:', crmLeadId);
        } else {
          // Create new lead
          const leadRef = await db.collection('companies').doc(companyId)
            .collection('leads').add({
              ...mappedLead,
              companyId,
              status: 'new',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          crmLeadId = leadRef.id;
          console.log('[Facebook Webhook] Created new lead:', crmLeadId);
        }

        // Log successful processing
        await logWebhookEvent(companyId, {
          eventType: 'lead_processed',
          facebookLeadId,
          crmLeadId,
          processed: true,
        });

        // Log activity
        await db.collection('companies').doc(companyId)
          .collection('activityLog').add({
            type: 'lead_created',
            entityType: 'lead',
            entityId: crmLeadId,
            description: `Lead captured from Facebook Lead Ad`,
            metadata: {
              source: 'facebook_lead_ad',
              facebookLeadId,
              pageName: config.pageName,
            },
            timestamp: new Date().toISOString(),
          });

      } catch (error) {
        console.error('[Facebook Webhook] Error processing lead:', error);
        
        await logWebhookEvent(companyId, {
          eventType: 'error',
          facebookLeadId,
          error: error instanceof Error ? error.message : 'Unknown error',
          payload: leadgenValue,
          processed: false,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

// ============================================
// Helper Functions
// ============================================

/**
 * Find company configuration by Facebook Page ID
 */
async function findCompanyByPageId(pageId: string): Promise<{
  companyId: string;
  config: FacebookLeadsConfig;
} | null> {
  try {
    const companiesRef = db.collection('companies');
    const snapshot = await companiesRef.get();
    
    for (const doc of snapshot.docs) {
      const integrationRef = doc.ref.collection('integrations').doc('facebook_leads');
      const integrationDoc = await integrationRef.get();
      
      if (integrationDoc.exists) {
        const config = integrationDoc.data() as FacebookLeadsConfig;
        if (config.pageId === pageId && config.isConnected) {
          return { companyId: doc.id, config };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Facebook Webhook] Error finding company:', error);
    return null;
  }
}

/**
 * Find existing lead by Facebook ID or email
 */
async function findExistingLead(
  companyId: string,
  facebookLeadId: string,
  email: string
): Promise<{ id: string } | null> {
  try {
    const leadsRef = db.collection('companies').doc(companyId).collection('leads');
    
    // First try to find by Facebook lead ID
    const fbQuery = await leadsRef
      .where('sourceDetails.facebookLeadId', '==', facebookLeadId)
      .limit(1)
      .get();
    
    if (!fbQuery.empty) {
      return { id: fbQuery.docs[0].id };
    }
    
    // Then try to find by email
    if (email) {
      const emailQuery = await leadsRef
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (!emailQuery.empty) {
        return { id: emailQuery.docs[0].id };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Facebook Webhook] Error finding existing lead:', error);
    return null;
  }
}

/**
 * Log webhook event for debugging
 */
async function logWebhookEvent(
  companyId: string,
  event: Partial<FacebookWebhookLog>
): Promise<void> {
  try {
    const logsRef = db.collection('companies').doc(companyId)
      .collection('facebookWebhookLogs');
    
    await logsRef.add({
      ...event,
      companyId,
      timestamp: new Date().toISOString(),
    });
    
    // Keep only last 100 logs
    const oldLogs = await logsRef
      .orderBy('timestamp', 'desc')
      .offset(100)
      .get();
    
    const batch = db.batch();
    oldLogs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  } catch (error) {
    console.error('[Facebook Webhook] Error logging event:', error);
  }
}
