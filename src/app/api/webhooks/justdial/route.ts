/**
 * JustDial Lead Webhook
 * Receives leads from JustDial and creates them in our CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { JustDialLead, JustDialSettings, MappedJustDialLead } from '@/types/justdial';

export async function POST(request: NextRequest) {
  try {
    const companyId = request.nextUrl.searchParams.get('companyId');
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    
    if (!companyId) {
      return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const settingsDoc = await adminDb.collection('justdialSettings').doc(companyId).get();
    
    if (!settingsDoc.exists) {
      return NextResponse.json({ error: 'JustDial integration not configured' }, { status: 404 });
    }

    const settings = settingsDoc.data() as JustDialSettings;
    
    if (!settings.enabled) {
      return NextResponse.json({ error: 'JustDial integration is disabled' }, { status: 403 });
    }

    if (settings.apiKey && apiKey !== settings.apiKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    const body = await request.json();
    const leads: JustDialLead[] = Array.isArray(body) ? body : body.leads ? body.leads : [body];

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No leads in payload' }, { status: 400 });
    }

    const results: { success: boolean; leadId?: string; jdLeadId: string; error?: string }[] = [];

    for (const jdLead of leads) {
      try {
        // Check for duplicate
        const existingQuery = await adminDb.collection('leads')
          .where('companyId', '==', companyId)
          .where('attributes.JUSTDIAL_LEAD_ID', '==', jdLead.leadid)
          .limit(1)
          .get();

        if (!existingQuery.empty) {
          results.push({ success: false, jdLeadId: jdLead.leadid, error: 'Duplicate lead' });
          continue;
        }

        const mappedLead: MappedJustDialLead = {
          name: jdLead.name || 'Unknown',
          email: jdLead.email || '',
          phone: jdLead.mobile || '',
          city: jdLead.city,
          source: 'justdial',
          sourceId: jdLead.leadid,
          notes: `JustDial Lead - Category: ${jdLead.category}`,
          attributes: {
            JUSTDIAL_LEAD_ID: jdLead.leadid,
            JUSTDIAL_CATEGORY: jdLead.category || '',
            CITY: jdLead.city,
            AREA: jdLead.area,
          },
        };

        if (settings.autoCreateLead) {
          const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          const now = new Date().toISOString();

          await adminDb.collection('leads').doc(leadId).set({
            id: leadId,
            companyId,
            name: mappedLead.name,
            email: mappedLead.email,
            phone: mappedLead.phone,
            source: 'justdial',
            status: 'new',
            stage: settings.defaultStage || 'new',
            pipelineId: settings.defaultPipeline,
            assignedTo: settings.defaultAssignee,
            notes: mappedLead.notes,
            attributes: mappedLead.attributes,
            createdAt: now,
            updatedAt: now,
            lastActivityAt: now,
          });

          await adminDb.collection('webhookLogs').add({
            companyId,
            source: 'justdial',
            event: 'lead_received',
            leadId,
            payload: jdLead,
            createdAt: now,
          });

          results.push({ success: true, leadId, jdLeadId: jdLead.leadid });

          if (settings.notifyOnNewLead) {
            await adminDb.collection('notificationQueue').add({
              companyId,
              type: 'new_lead',
              source: 'justdial',
              leadId,
              leadName: mappedLead.name,
              leadPhone: mappedLead.phone,
              category: jdLead.category,
              notifyEmail: settings.notifyEmail,
              notifyWhatsApp: settings.notifyWhatsApp,
              createdAt: now,
            });
          }
        } else {
          results.push({ success: true, jdLeadId: jdLead.leadid });
        }
      } catch (leadError) {
        console.error('Error processing JustDial lead:', leadError);
        results.push({ success: false, jdLeadId: jdLead.leadid, error: 'Failed to process' });
      }
    }

    await adminDb.collection('justdialSettings').doc(companyId).update({
      lastSyncAt: new Date().toISOString(),
      totalLeadsReceived: (settings.totalLeadsReceived || 0) + results.filter(r => r.success).length,
    });

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error('JustDial webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  return NextResponse.json({
    status: 'ok',
    message: 'JustDial webhook endpoint is active',
    companyId: companyId || 'not provided',
    timestamp: new Date().toISOString(),
  });
}
