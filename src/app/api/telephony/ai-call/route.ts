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
    const { to, leadId, leadName, companyId, script, firstMessage, assistantId, provider: preferredProvider } = body;

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
    // API keys are stored encrypted in the company document's apiKeys field
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : {};
    const encryptedApiKeys = companyData?.apiKeys || {};

    console.log('[AI Telephony] Available integrations:', Object.keys(encryptedApiKeys));
    console.log('[AI Telephony] Vapi config exists:', !!encryptedApiKeys?.vapi);
    console.log('[AI Telephony] Bland config exists:', !!encryptedApiKeys?.bland);

    // Fetch AI Calling configuration (script, voice, business info)
    const aiCallingConfigDoc = await adminDb.collection('companies').doc(companyId).collection('settings').doc('aiCalling').get();
    const aiCallingConfig = aiCallingConfigDoc.exists ? aiCallingConfigDoc.data() : null;
    
    console.log('[AI Telephony] AI Calling config found:', !!aiCallingConfig);

    // Import decryption function
    const { decryptApiKeyServerSide } = await import('@/lib/encryption-server');

    // Build telephony config from saved API keys (decrypt them first)
    const config: TelephonyConfig = {};

    if (encryptedApiKeys?.vapi) {
      console.log('[AI Telephony] Vapi keys found:', Object.keys(encryptedApiKeys.vapi));
      try {
        const apiKey = decryptApiKeyServerSide(encryptedApiKeys.vapi.apiKey);
        const decryptedAssistantId = encryptedApiKeys.vapi.assistantId ? decryptApiKeyServerSide(encryptedApiKeys.vapi.assistantId) : undefined;
        console.log('[AI Telephony] Vapi API key decrypted, length:', apiKey?.length || 0);
        if (apiKey) {
          config.vapi = {
            apiKey,
            assistantId: decryptedAssistantId,
          };
        } else {
          console.error('[AI Telephony] Vapi API key is empty after decryption');
        }
      } catch (e) {
        console.error('[AI Telephony] Failed to decrypt Vapi keys:', e);
      }
    }

    if (encryptedApiKeys?.bland) {
      console.log('[AI Telephony] Bland keys found:', Object.keys(encryptedApiKeys.bland));
      try {
        const apiKey = decryptApiKeyServerSide(encryptedApiKeys.bland.apiKey);
        console.log('[AI Telephony] Bland API key decrypted, length:', apiKey?.length || 0);
        if (apiKey) {
          config.bland = {
            apiKey,
          };
        } else {
          console.error('[AI Telephony] Bland API key is empty after decryption');
        }
      } catch (e) {
        console.error('[AI Telephony] Failed to decrypt Bland keys:', e);
      }
    }

    console.log('[AI Telephony] Config providers available:', {
      vapi: !!config.vapi?.apiKey,
      bland: !!config.bland?.apiKey
    });

    // Format phone number
    const formattedPhone = formatPhoneForCall(to);

    // Build the script from AI Calling config if not provided
    let finalScript = script;
    let finalFirstMessage = firstMessage;
    let finalVoice = 'maya';
    let maxDuration = 300;

    if (aiCallingConfig) {
      // Use configured voice
      finalVoice = aiCallingConfig.voice || 'maya';
      maxDuration = aiCallingConfig.maxCallDuration || 300;

      // Build script with variable replacements
      if (!finalScript && aiCallingConfig.defaultScript) {
        finalScript = aiCallingConfig.defaultScript
          .replace(/\{\{company_name\}\}/g, aiCallingConfig.companyName || 'our company')
          .replace(/\{\{product_service\}\}/g, aiCallingConfig.productService || 'our services')
          .replace(/\{\{special_offer\}\}/g, aiCallingConfig.specialOffer || '')
          .replace(/\{\{lead_name\}\}/g, leadName || 'there');
      }

      // Generate first message from config
      if (!finalFirstMessage && aiCallingConfig.companyName) {
        finalFirstMessage = leadName
          ? `Hello ${leadName}, this is a call from ${aiCallingConfig.companyName}. How are you doing today?`
          : `Hello, this is a call from ${aiCallingConfig.companyName}. How are you doing today?`;
      }
    }

    // Fallback defaults
    if (!finalFirstMessage) {
      finalFirstMessage = leadName
        ? `Hello ${leadName}, this is a call from our team. How can I help you today?`
        : 'Hello, this is a call from our team. How can I help you today?';
    }

    console.log('[AI Telephony] Final script length:', finalScript?.length || 0);
    console.log('[AI Telephony] Voice:', finalVoice);
    console.log('[AI Telephony] Max duration:', maxDuration);

    // Initiate AI call with preferred provider if specified
    const result = await makeAICall(config, {
      to: formattedPhone,
      assistantId,
      script: finalScript,
      voice: finalVoice,
      firstMessage: finalFirstMessage,
      metadata: {
        leadId: leadId || '',
        leadName: leadName || '',
        companyId,
        type: 'ai-outbound',
      },
    }, preferredProvider as 'vapi' | 'bland' | undefined);

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
