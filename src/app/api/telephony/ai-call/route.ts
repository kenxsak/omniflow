import { NextRequest, NextResponse } from 'next/server';
import { makeAICall, formatPhoneForCall, TelephonyConfig } from '@/lib/telephony-api';
import { adminDb } from '@/lib/firebase-admin';

/**
 * API Route: Initiate an AI voice call
 * POST /api/telephony/ai-call
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, leadId, leadName, companyId, script, firstMessage, assistantId } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    // Fetch company's AI voice API keys from Firestore
    const apiKeysDoc = await adminDb.collection('companies').doc(companyId).collection('settings').doc('apiKeys').get();
    const apiKeys = apiKeysDoc.exists ? apiKeysDoc.data() : {};

    // Build telephony config from saved API keys
    const config: TelephonyConfig = {};

    if (apiKeys?.vapi) {
      config.vapi = {
        apiKey: apiKeys.vapi.apiKey,
        assistantId: apiKeys.vapi.assistantId,
      };
    }

    if (apiKeys?.bland) {
      config.bland = {
        apiKey: apiKeys.bland.apiKey,
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneForCall(to);

    // Generate default first message if not provided
    const defaultFirstMessage = leadName
      ? `Hello ${leadName}, this is a call from our team. How can I help you today?`
      : 'Hello, this is a call from our team. How can I help you today?';

    // Initiate AI call
    const result = await makeAICall(config, {
      to: formattedPhone,
      assistantId,
      script,
      firstMessage: firstMessage || defaultFirstMessage,
      metadata: {
        leadId: leadId || '',
        leadName: leadName || '',
        type: 'ai-outbound',
      },
    });

    if (result.success) {
      // Log AI call initiation to Firestore
      await adminDb.collection('companies').doc(companyId).collection('callLogs').add({
        callId: result.callId,
        provider: result.provider,
        to: formattedPhone,
        leadId: leadId || null,
        leadName: leadName || null,
        type: 'ai-outbound',
        status: 'initiated',
        createdAt: new Date(),
      });

      console.log('[AI Telephony] Call initiated:', {
        callId: result.callId,
        provider: result.provider,
        to: formattedPhone,
        leadId,
      });

      return NextResponse.json({
        success: true,
        callId: result.callId,
        provider: result.provider,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      provider: result.provider,
    }, { status: 500 });
  } catch (error) {
    console.error('[AI Telephony API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate AI call',
    }, { status: 500 });
  }
}
