import { NextRequest, NextResponse } from 'next/server';
import { makeCall, formatPhoneForCall, checkTRAICompliance, TelephonyConfig } from '@/lib/telephony-api';
import { adminDb } from '@/lib/firebase-admin';

/**
 * API Route: Initiate a phone call
 * POST /api/telephony/call
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, leadId, leadName, companyId, type = 'outbound', recordCall = true } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Company ID is required' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ success: false, error: 'Database not initialized' }, { status: 500 });
    }

    // Fetch company's telephony API keys from Firestore
    const apiKeysDoc = await adminDb.collection('companies').doc(companyId).collection('settings').doc('apiKeys').get();
    const apiKeys = apiKeysDoc.exists ? apiKeysDoc.data() : {};

    // Build telephony config from saved API keys
    const config: TelephonyConfig = {};

    if (apiKeys?.plivo) {
      config.plivo = {
        authId: apiKeys.plivo.authId,
        authToken: apiKeys.plivo.authToken,
        phoneNumber: apiKeys.plivo.phoneNumber,
      };
    }

    if (apiKeys?.exotel) {
      config.exotel = {
        sid: apiKeys.exotel.sid,
        apiKey: apiKeys.exotel.apiKey,
        apiToken: apiKeys.exotel.apiToken,
        subdomain: apiKeys.exotel.subdomain || 'api4',
        callerId: apiKeys.exotel.callerId,
      };
    }

    if (apiKeys?.twilio) {
      config.twilio = {
        accountSid: apiKeys.twilio.accountSid,
        authToken: apiKeys.twilio.authToken,
        phoneNumber: apiKeys.twilio.phoneNumber,
      };
    }

    // Format phone number
    const formattedPhone = formatPhoneForCall(to);

    // Check TRAI compliance for Indian numbers
    if (formattedPhone.startsWith('+91')) {
      const compliance = checkTRAICompliance();
      if (!compliance.compliant) {
        return NextResponse.json({
          success: false,
          error: 'TRAI compliance check failed',
          issues: compliance.issues,
        }, { status: 400 });
      }
    }

    // Initiate call
    const result = await makeCall(config, {
      to: formattedPhone,
      recordCall,
      metadata: {
        leadId: leadId || '',
        leadName: leadName || '',
        type,
      },
    });

    if (result.success) {
      // Log call initiation to Firestore
      await adminDb.collection('companies').doc(companyId).collection('callLogs').add({
        callId: result.callId,
        provider: result.provider,
        to: formattedPhone,
        leadId: leadId || null,
        leadName: leadName || null,
        type,
        status: 'initiated',
        createdAt: new Date(),
      });

      console.log('[Telephony] Call initiated:', {
        callId: result.callId,
        provider: result.provider,
        to: formattedPhone,
        leadId,
      });

      return NextResponse.json({
        success: true,
        callId: result.callId,
        provider: result.provider,
        status: result.status,
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error,
      provider: result.provider,
    }, { status: 500 });
  } catch (error) {
    console.error('[Telephony API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate call',
    }, { status: 500 });
  }
}
