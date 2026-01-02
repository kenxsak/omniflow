import { NextRequest, NextResponse } from 'next/server';

/**
 * Bland.ai Webhook Handler
 * Handles AI voice call events and transcriptions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('[Bland Webhook] Received event:', body);

    const {
      call_id,
      status,
      completed,
      call_length,
      to,
      from,
      transcript,
      summary,
      recording_url,
      concatenated_transcript,
      analysis,
    } = body;

    // Log call event
    console.log('[Bland] Call event:', {
      call_id,
      status,
      completed,
      call_length,
      to,
      from,
    });

    if (completed) {
      // Call completed - store full details
      console.log('[Bland] Call completed:', {
        call_id,
        duration: call_length,
        transcript: concatenated_transcript,
        summary,
        recording_url,
        analysis,
      });

      // TODO: Store call record in Firestore
      // TODO: Update lead activity timeline
      // TODO: Store transcript and summary
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bland Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
