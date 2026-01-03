/**
 * IndiaMART Lead Webhook
 * Receives leads from IndiaMART CRM API and creates them in our CRM
 * 
 * IndiaMART sends leads via POST request with lead data
 * Docs: https://seller.indiamart.com/leadmanager/
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { IndiaMartLead, IndiaMartSettings, MappedIndiaMartLead } from '@/types/indiamart';

export async function POST(request: NextRequest) {
  try {
    // Get company ID from query params or headers
    const companyId = request.nextUrl.searchParams.get('companyId');
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'Missing companyId parameter' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Verify company and settings
    const settingsDoc = await adminDb.collection('indiamartSettings').doc(companyId).get();
    
    if (!settingsDoc.exists) {
      return NextResponse.json(
        { error: 'IndiaMART integration not configured for this company' },
        { status: 404 }
      );
    }

    const settings = settingsDoc.data() as IndiaMartSettings;
    
    if (!settings.enabled) {
      return NextResponse.json(
        { error: 'IndiaMART integration is disabled' },
        { status: 403 }
      );
    }

    // Verify API key if set
    if (settings.crmKey && apiKey !== settings.crmKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Parse the incoming lead data
    const body = await request.json();
    
    // IndiaMART can send single lead or array
    const leads: IndiaMartLead[] = Array.isArray(body) ? body : 
      body.leads ? body.leads : [body];

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No leads in payload' },
        { status: 400 }
      );
    }

    const results: { success: boolean; leadId?: string; queryId: string; error?: string }[] = [];

    for (const indiamartLead of leads) {
      try {
        // Check for duplicate
        const existingQuery = await adminDb.collection('leads')
          .where('companyId', '==', companyId)
          .where('attributes.INDIAMART_QUERY_ID', '==', indiamartLead.UNIQUE_QUERY_ID)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          results.push({
            success: false,
            queryId: indiamartLead.UNIQUE_QUERY_ID,
            error: 'Duplicate lead - already exists',
          });
          continue;
        }

        // Map IndiaMART lead to our CRM format
        const mappedLead: MappedIndiaMartLead = {
          name: indiamartLead.SENDER_NAME || 'Unknown',
          email: indiamartLead.SENDER_EMAIL || '',
          phone: indiamartLead.SENDER_MOBILE || '',
          company: indiamartLead.SENDER_COMPANY,
          city: indiamartLead.SENDER_CITY,
          state: indiamartLead.SENDER_STATE,
          source: 'indiamart',
          sourceId: indiamartLead.UNIQUE_QUERY_ID,
          notes: `IndiaMART Inquiry: ${indiamartLead.SUBJECT}\n\n${indiamartLead.QUERY_MESSAGE}`,
          attributes: {
            INDIAMART_QUERY_ID: indiamartLead.UNIQUE_QUERY_ID,
            INDIAMART_PRODUCT: indiamartLead.QUERY_PRODUCT_NAME || indiamartLead.SUBJECT,
            INDIAMART_CATEGORY: indiamartLead.QUERY_MCAT_NAME || '',
            INDIAMART_MESSAGE: indiamartLead.QUERY_MESSAGE || '',
            COMPANY_NAME: indiamartLead.SENDER_COMPANY,
            CITY: indiamartLead.SENDER_CITY,
            STATE: indiamartLead.SENDER_STATE,
            PINCODE: indiamartLead.SENDER_PINCODE,
          },
        };

        // Create lead in CRM
        if (settings.autoCreateLead) {
          const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const now = new Date().toISOString();

          const leadData = {
            id: leadId,
            companyId,
            name: mappedLead.name,
            email: mappedLead.email,
            phone: mappedLead.phone,
            source: 'indiamart',
            status: 'new',
            stage: settings.defaultStage || 'new',
            pipelineId: settings.defaultPipeline,
            assignedTo: settings.defaultAssignee,
            notes: mappedLead.notes,
            attributes: mappedLead.attributes,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
          };

          await adminDb.collection('leads').doc(leadId).set(leadData);

          // Log the webhook event
          await adminDb.collection('webhookLogs').add({
            companyId,
            source: 'indiamart',
            event: 'lead_received',
            leadId,
            payload: indiamartLead,
            createdAt: now,
          });

          results.push({
            success: true,
            leadId,
            queryId: indiamartLead.UNIQUE_QUERY_ID,
          });

          // Send notification if enabled
          if (settings.notifyOnNewLead) {
            // Queue notification (handled by separate service)
            await adminDb.collection('notificationQueue').add({
              companyId,
              type: 'new_lead',
              source: 'indiamart',
              leadId,
              leadName: mappedLead.name,
              leadPhone: mappedLead.phone,
              product: mappedLead.attributes.INDIAMART_PRODUCT,
              notifyEmail: settings.notifyEmail,
              notifyWhatsApp: settings.notifyWhatsApp,
              createdAt: now,
            });
          }
        } else {
          results.push({
            success: true,
            queryId: indiamartLead.UNIQUE_QUERY_ID,
          });
        }
      } catch (leadError) {
        console.error('Error processing IndiaMART lead:', leadError);
        results.push({
          success: false,
          queryId: indiamartLead.UNIQUE_QUERY_ID,
          error: 'Failed to process lead',
        });
      }
    }

    // Update settings with sync info
    await adminDb.collection('indiamartSettings').doc(companyId).update({
      lastSyncAt: new Date().toISOString(),
      totalLeadsReceived: (settings.totalLeadsReceived || 0) + results.filter(r => r.success).length,
    });

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('IndiaMART webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to verify webhook is working
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  
  return NextResponse.json({
    status: 'ok',
    message: 'IndiaMART webhook endpoint is active',
    companyId: companyId || 'not provided',
    timestamp: new Date().toISOString(),
  });
}
