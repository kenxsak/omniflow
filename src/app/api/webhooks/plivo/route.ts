import { NextRequest, NextResponse } from 'next/server';

/**
 * Plivo Webhook Handler
 * Handles call status updates and events from Plivo
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const event = Object.fromEntries(body.entries());

    console.log('[Plivo Webhook] Received event:', event);

    const callUuid = event.CallUUID as string;
    const callStatus = event.CallStatus as string;
    const direction = event.Direction as string;
    const from = event.From as string;
    const to = event.To as string;
    const duration = event.Duration as string;
    const recordingUrl = event.RecordUrl as string;

    // Log call event for analytics
    console.log('[Plivo] Call event:', {
      callUuid,
      callStatus,
      direction,
      from,
      to,
      duration,
      recordingUrl,
    });

    // TODO: Store call record in Firestore
    // TODO: Update lead activity timeline
    // TODO: Trigger AI transcription if recording available

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Plivo Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Answer URL - Returns TwiML-like XML for call handling
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  // Default answer response - connect to agent or play message
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Speak>Hello, this call is being connected. Please wait.</Speak>
  <Wait length="2"/>
</Response>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
