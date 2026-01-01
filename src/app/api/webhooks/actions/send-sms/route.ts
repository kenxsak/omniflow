import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';

/**
 * Webhook Action: Send SMS
 * Used by Zapier, Pabbly, Make, n8n to send SMS via OmniFlow
 * 
 * POST /api/webhooks/actions/send-sms
 * Headers: Authorization: Bearer {api_key}
 * Body: { to, message, templateId? }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Extract company ID from API key
    const keyParts = apiKey.split('_');
    if (keyParts.length < 3 || keyParts[0] !== 'omni') {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }
    
    const companyId = keyParts[1];
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get company and API keys
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 401 });
    }

    const company = companyDoc.data();
    const smsConfig = company?.apiKeys?.msg91 || company?.apiKeys?.fast2sms;
    
    if (!smsConfig?.apiKey) {
      return NextResponse.json({ 
        error: 'SMS provider not configured. Please set up MSG91 or Fast2SMS in Settings.' 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const { to, message, templateId } = body;

    if (!to || !message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 });
    }

    // Format phone number
    let formattedPhone = to.replace(/\D/g, '');
    if (formattedPhone.startsWith('91') && formattedPhone.length === 12) {
      // Already has country code
    } else if (formattedPhone.length === 10) {
      formattedPhone = '91' + formattedPhone;
    }

    // Decrypt API key
    const decryptedApiKey = await decryptApiKeyServerSide(smsConfig.apiKey);

    // Determine which provider to use and send
    let result;
    if (company?.apiKeys?.msg91) {
      // Send via MSG91
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': decryptedApiKey,
        },
        body: JSON.stringify({
          template_id: templateId || smsConfig.templateId,
          mobiles: formattedPhone,
          VAR1: message,
        }),
      });
      result = await response.json();
    } else {
      // Send via Fast2SMS
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': decryptedApiKey,
        },
        body: JSON.stringify({
          route: 'q',
          message: message,
          numbers: formattedPhone,
        }),
      });
      result = await response.json();
    }

    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully',
      provider: company?.apiKeys?.msg91 ? 'msg91' : 'fast2sms',
      result,
    });

  } catch (error) {
    console.error('Webhook send-sms error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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
