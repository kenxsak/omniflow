import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';
import { 
  sendUnifiedWhatsAppBulk, 
  type UnifiedWhatsAppConfig,
  type UnifiedWhatsAppRecipient 
} from '@/lib/unified-whatsapp-service';

/**
 * Webhook Action: Send WhatsApp
 * Used by Zapier, Pabbly, Make, n8n to send WhatsApp messages via OmniFlow
 * 
 * POST /api/webhooks/actions/send-whatsapp
 * Headers: Authorization: Bearer {api_key}
 * Body: { to, templateName, parameters?, languageCode? }
 */

interface SendWhatsAppRequest {
  to: string | string[];           // Phone number(s) with country code
  templateName: string;            // WhatsApp template name
  parameters?: string[];           // Template variable values
  languageCode?: string;           // Language code (default: en)
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid Authorization header' }, 
        { status: 401 }
      );
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Extract company ID from API key (format: omni_{companyId}_live)
    const keyParts = apiKey.split('_');
    if (keyParts.length < 3 || keyParts[0] !== 'omni') {
      return NextResponse.json(
        { success: false, error: 'Invalid API key format' }, 
        { status: 401 }
      );
    }
    
    const companyId = keyParts[1];
    
    if (!adminDb) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' }, 
        { status: 500 }
      );
    }

    // Get company and verify it exists
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key - company not found' }, 
        { status: 401 }
      );
    }

    const company = companyDoc.data();
    const apiKeys = company?.apiKeys || {};

    // Parse request body
    let requestBody: SendWhatsAppRequest;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' }, 
        { status: 400 }
      );
    }

    const { to, templateName, parameters, languageCode } = requestBody;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: to (phone number)' }, 
        { status: 400 }
      );
    }

    if (!templateName) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: templateName' }, 
        { status: 400 }
      );
    }

    // Format phone numbers
    const phoneNumbers = Array.isArray(to) ? to : [to];
    const formattedRecipients: UnifiedWhatsAppRecipient[] = phoneNumbers.map(phone => {
      // Remove non-digits
      let formatted = phone.replace(/\D/g, '');
      
      // Add India country code if 10 digits
      if (formatted.length === 10) {
        formatted = '91' + formatted;
      }
      
      return {
        phone: formatted,
        parameters: parameters || [],
      };
    });

    // Build WhatsApp config from company's API keys
    const whatsappConfig: UnifiedWhatsAppConfig = {};
    let hasProvider = false;

    // Check for Authkey/WMart CPaaS
    if (apiKeys.authkey?.apiKey) {
      whatsappConfig.authkey = {
        apiKey: await decryptApiKeyServerSide(apiKeys.authkey.apiKey),
      };
      hasProvider = true;
    }

    // Check for AiSensy
    if (apiKeys.aisensy?.apiKey) {
      whatsappConfig.aisensy = {
        apiKey: await decryptApiKeyServerSide(apiKeys.aisensy.apiKey),
        campaignName: apiKeys.aisensy.campaignName,
      };
      hasProvider = true;
    }

    // Check for Gupshup
    if (apiKeys.gupshup?.apiKey) {
      whatsappConfig.gupshup = {
        apiKey: await decryptApiKeyServerSide(apiKeys.gupshup.apiKey),
        appName: apiKeys.gupshup.appName || apiKeys.gupshup.srcName,
        srcName: apiKeys.gupshup.srcName || apiKeys.gupshup.appName,
        source: apiKeys.gupshup.phoneNumber,
      };
      hasProvider = true;
    }

    // Check for Meta WhatsApp Cloud API
    if (apiKeys.metaWhatsApp?.phoneNumberId && apiKeys.metaWhatsApp?.accessToken) {
      whatsappConfig.meta = {
        phoneNumberId: apiKeys.metaWhatsApp.phoneNumberId,
        accessToken: await decryptApiKeyServerSide(apiKeys.metaWhatsApp.accessToken),
        wabaId: apiKeys.metaWhatsApp.wabaId,
      };
      hasProvider = true;
    }

    if (!hasProvider) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No WhatsApp provider configured. Please set up Meta WhatsApp, WMart CPaaS, AiSensy, or Gupshup in Settings > Integrations.' 
        }, 
        { status: 400 }
      );
    }

    // Send WhatsApp messages
    const result = await sendUnifiedWhatsAppBulk(whatsappConfig, {
      templateName,
      recipients: formattedRecipients,
      languageCode: languageCode || 'en',
    });

    // Log the webhook call
    const duration = Date.now() - startTime;
    await adminDb.collection('companies').doc(companyId).collection('webhookLogs').add({
      type: 'send-whatsapp',
      timestamp: new Date().toISOString(),
      success: result.success,
      provider: result.provider,
      recipientCount: formattedRecipients.length,
      sentCount: result.totalSent,
      failedCount: result.totalFailed,
      duration,
      error: result.error || null,
      metadata: {
        templateName,
        hasParameters: !!parameters && parameters.length > 0,
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        provider: result.provider,
        totalSent: result.totalSent,
        totalFailed: result.totalFailed,
        results: result.results,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send WhatsApp messages',
          provider: result.provider,
          totalSent: result.totalSent,
          totalFailed: result.totalFailed,
          results: result.results,
          timestamp: new Date().toISOString(),
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook send-whatsapp error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }, 
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
