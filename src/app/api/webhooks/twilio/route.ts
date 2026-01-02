import { NextRequest, NextResponse } from 'next/server';

/**
 * Twilio Webhook Handler
 * Handles call status updates and events from Twilio
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const event = Object.fromEntries(body.entries());

    console.log('[Twilio Webhook] Received event:', event);

    const callSid = event.CallSid as string;
    const callStatus = event.CallStatus as string;
    const direction = event.Direction as string;
    const from = event.From as string;
    const to = event.To as string;
    const duration = event.CallDuration as string;
    const recordingUrl = event.RecordingUrl as string;

    // Log call event for analytics
    console.log('[Twilio] Call event:', {
      callSid,
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
    console.error('[Twilio Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Voice URL - Returns TwiML for call handling
export async function GET() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello, this call is being connected. Please wait.</Say>
  <Pause length="2"/>
</Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
