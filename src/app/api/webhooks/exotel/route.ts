import { NextRequest, NextResponse } from 'next/server';

/**
 * Exotel Webhook Handler
 * Handles call status updates and events from Exotel (India)
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const event = Object.fromEntries(body.entries());

    console.log('[Exotel Webhook] Received event:', event);

    const callSid = event.CallSid as string;
    const status = event.Status as string;
    const direction = event.Direction as string;
    const from = event.From as string;
    const to = event.To as string;
    const duration = event.Duration as string;
    const recordingUrl = event.RecordingUrl as string;
    const startTime = event.StartTime as string;
    const endTime = event.EndTime as string;

    // Log call event for analytics
    console.log('[Exotel] Call event:', {
      callSid,
      status,
      direction,
      from,
      to,
      duration,
      recordingUrl,
      startTime,
      endTime,
    });

    // TODO: Store call record in Firestore
    // TODO: Update lead activity timeline
    // TODO: Trigger AI transcription if recording available

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Exotel Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Passthru applet response
export async function GET() {
  // Exotel uses passthru applets for call flow
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello, this call is being connected. Please wait.</Say>
  <Dial timeout="30">
    <Number></Number>
  </Dial>
</Response>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
