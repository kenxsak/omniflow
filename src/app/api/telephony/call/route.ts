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
    // API keys are stored encrypted in the company document's apiKeys field
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : {};
    const encryptedApiKeys = companyData?.apiKeys || {};

    // Import decryption function
    const { decryptApiKeyServerSide } = await import('@/lib/encryption-server');

    // Build telephony config from saved API keys (decrypt them first)
    const config: TelephonyConfig = {};

    if (encryptedApiKeys?.plivo) {
      try {
        const authId = decryptApiKeyServerSide(encryptedApiKeys.plivo.authId);
        const authToken = decryptApiKeyServerSide(encryptedApiKeys.plivo.authToken);
        const phoneNumber = encryptedApiKeys.plivo.phoneNumber ? decryptApiKeyServerSide(encryptedApiKeys.plivo.phoneNumber) : undefined;
        if (authId && authToken) {
          config.plivo = { authId, authToken, phoneNumber: phoneNumber || '' };
        }
      } catch (e) {
        console.error('[Telephony] Failed to decrypt Plivo keys:', e);
      }
    }

    if (encryptedApiKeys?.exotel) {
      try {
        const sid = decryptApiKeyServerSide(encryptedApiKeys.exotel.sid);
        const apiKey = decryptApiKeyServerSide(encryptedApiKeys.exotel.apiKey);
        const apiToken = decryptApiKeyServerSide(encryptedApiKeys.exotel.apiToken);
        const callerId = encryptedApiKeys.exotel.callerId ? decryptApiKeyServerSide(encryptedApiKeys.exotel.callerId) : undefined;
        const subdomain = encryptedApiKeys.exotel.subdomain ? decryptApiKeyServerSide(encryptedApiKeys.exotel.subdomain) : 'api4';
        if (sid && apiKey && apiToken) {
          config.exotel = { sid, apiKey, apiToken, subdomain, callerId: callerId || '' };
        }
      } catch (e) {
        console.error('[Telephony] Failed to decrypt Exotel keys:', e);
      }
    }

    if (encryptedApiKeys?.twilio) {
      try {
        const accountSid = decryptApiKeyServerSide(encryptedApiKeys.twilio.accountSid);
        const authToken = decryptApiKeyServerSide(encryptedApiKeys.twilio.authToken);
        const phoneNumber = encryptedApiKeys.twilio.phoneNumber ? decryptApiKeyServerSide(encryptedApiKeys.twilio.phoneNumber) : undefined;
        if (accountSid && authToken) {
          config.twilio = { accountSid, authToken, phoneNumber: phoneNumber || '' };
        }
      } catch (e) {
        console.error('[Telephony] Failed to decrypt Twilio keys:', e);
      }
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
