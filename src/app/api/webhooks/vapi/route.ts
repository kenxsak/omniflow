import { NextRequest, NextResponse } from 'next/server';

/**
 * Vapi.ai Webhook Handler
 * Handles AI voice call events and transcriptions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Vapi Webhook] Received event:', body);

    const { type, call, transcript, summary } = body;

    switch (type) {
      case 'call-started':
        console.log('[Vapi] Call started:', call?.id);
        break;

      case 'call-ended':
        console.log('[Vapi] Call ended:', {
          callId: call?.id,
          duration: call?.duration,
          endedReason: call?.endedReason,
        });
        // TODO: Store call record in Firestore
        break;

      case 'transcript':
        console.log('[Vapi] Transcript received:', transcript);
        // TODO: Store transcript in Firestore
        break;

      case 'function-call':
        // Handle function calls from AI assistant
        console.log('[Vapi] Function call:', body.functionCall);
        break;

      case 'hang':
        console.log('[Vapi] Call hung up');
        break;

      case 'speech-update':
        // Real-time speech updates
        break;

      case 'status-update':
        console.log('[Vapi] Status update:', body.status);
        break;

      case 'end-of-call-report':
        console.log('[Vapi] End of call report:', {
          summary,
          transcript: body.transcript,
          recordingUrl: body.recordingUrl,
        });
        // TODO: Store complete call report
        // TODO: Update lead activity timeline
        break;

      default:
        console.log('[Vapi] Unknown event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Vapi Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
