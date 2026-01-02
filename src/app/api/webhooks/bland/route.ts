import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Bland.ai Webhook Handler
 * Receives call completion events with transcripts and recordings
 * 
 * Webhook events from Bland.ai:
 * - call.completed: Call finished with transcript
 * - call.failed: Call failed to connect
 * - call.answered: Call was answered
 */

interface BlandWebhookPayload {
  call_id: string;
  status: 'completed' | 'failed' | 'answered' | 'no-answer' | 'busy' | 'voicemail';
  to: string;
  from?: string;
  duration?: number; // in seconds
  transcript?: string;
  recording_url?: string;
  summary?: string;
  analysis?: {
    sentiment?: string;
    key_points?: string[];
    action_items?: string[];
  };
  metadata?: {
    leadId?: string;
    leadName?: string;
    companyId?: string;
    type?: string;
  };
  created_at?: string;
  ended_at?: string;
  answered_by?: string;
  error_message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: BlandWebhookPayload = await request.json();
    
    console.log('[Bland Webhook] Received event:', {
      call_id: payload.call_id,
      status: payload.status,
      to: payload.to,
      duration: payload.duration,
      hasTranscript: !!payload.transcript,
      hasRecording: !!payload.recording_url,
    });

    // Extract company ID from metadata
    const companyId = payload.metadata?.companyId;
    const leadId = payload.metadata?.leadId;

    if (!companyId) {
      console.warn('[Bland Webhook] No companyId in metadata, cannot save call data');
      return NextResponse.json({ received: true, warning: 'No companyId in metadata' });
    }

    if (!adminDb) {
      console.error('[Bland Webhook] Database not initialized');
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Find and update the existing call log
    const callLogsRef = adminDb.collection('companies').doc(companyId).collection('callLogs');
    const existingCallQuery = await callLogsRef.where('callId', '==', payload.call_id).limit(1).get();

    const callData = {
      callId: payload.call_id,
      provider: 'bland',
      to: payload.to,
      from: payload.from || null,
      status: payload.status,
      duration: payload.duration || 0,
      transcript: payload.transcript || null,
      recordingUrl: payload.recording_url || null,
      summary: payload.summary || null,
      analysis: payload.analysis || null,
      leadId: leadId || null,
      leadName: payload.metadata?.leadName || null,
      answeredBy: payload.answered_by || null,
      errorMessage: payload.error_message || null,
      startedAt: payload.created_at ? new Date(payload.created_at) : null,
      endedAt: payload.ended_at ? new Date(payload.ended_at) : null,
      webhookReceivedAt: new Date(),
    };

    if (!existingCallQuery.empty) {
      // Update existing call log
      const docId = existingCallQuery.docs[0].id;
      await callLogsRef.doc(docId).update(callData);
      console.log('[Bland Webhook] Updated call log:', docId);
    } else {
      // Create new call log if not found
      const newDoc = await callLogsRef.add({
        ...callData,
        type: 'ai-outbound',
        createdAt: new Date(),
      });
      console.log('[Bland Webhook] Created new call log:', newDoc.id);
    }

    // If we have a leadId, also add to the lead's activity timeline
    if (leadId) {
      try {
        const activityData = {
          type: 'ai_call_completed',
          description: generateActivityDescription(payload),
          timestamp: new Date(),
          callId: payload.call_id,
          duration: payload.duration || 0,
          status: payload.status,
          hasTranscript: !!payload.transcript,
          hasRecording: !!payload.recording_url,
          transcript: payload.transcript?.substring(0, 500) || null, // Store first 500 chars
          recordingUrl: payload.recording_url || null,
          createdBy: 'AI Agent (Bland.ai)',
        };

        await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('leads')
          .doc(leadId)
          .collection('activities')
          .add(activityData);

        console.log('[Bland Webhook] Added activity to lead:', leadId);
      } catch (activityError) {
        console.error('[Bland Webhook] Failed to add activity to lead:', activityError);
      }
    }

    return NextResponse.json({ 
      received: true, 
      callId: payload.call_id,
      status: payload.status,
    });
  } catch (error) {
    console.error('[Bland Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

function generateActivityDescription(payload: BlandWebhookPayload): string {
  const duration = payload.duration ? `${Math.floor(payload.duration / 60)}m ${payload.duration % 60}s` : 'unknown duration';
  
  switch (payload.status) {
    case 'completed':
      return `AI call completed (${duration}). ${payload.summary || 'Call transcript available.'}`;
    case 'answered':
      return `AI call answered by ${payload.answered_by || 'recipient'}`;
    case 'no-answer':
      return 'AI call - No answer';
    case 'busy':
      return 'AI call - Line busy';
    case 'voicemail':
      return 'AI call - Went to voicemail';
    case 'failed':
      return `AI call failed: ${payload.error_message || 'Unknown error'}`;
    default:
      return `AI call status: ${payload.status}`;
  }
}

// Handle GET for webhook verification (some services require this)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'Bland.ai Webhook',
    timestamp: new Date().toISOString(),
  });
}
