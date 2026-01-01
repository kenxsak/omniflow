import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import { sendTransactionalEmail as sendBrevoEmail } from '@/services/brevo';
import { sendTransactionalEmail as sendSenderEmail } from '@/lib/sender-client';

/**
 * Webhook Action: Send Email
 * Used by Zapier, Pabbly, Make, n8n to send emails via OmniFlow
 * 
 * POST /api/webhooks/actions/send-email
 * Headers: Authorization: Bearer {api_key}
 * Body: { to, subject, body?, htmlBody?, from?, replyTo?, variables? }
 */

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  body?: string;
  htmlBody?: string;
  from?: {
    email?: string;
    name?: string;
  };
  replyTo?: string;
  variables?: Record<string, string>;
  tags?: string[];
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
    let requestBody: SendEmailRequest;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' }, 
        { status: 400 }
      );
    }

    const { to, subject, body, htmlBody, from, replyTo, variables } = requestBody;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: to' }, 
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: subject' }, 
        { status: 400 }
      );
    }

    if (!body && !htmlBody) {
      return NextResponse.json(
        { success: false, error: 'Either body or htmlBody is required' }, 
        { status: 400 }
      );
    }

    // Validate email format
    const recipients = Array.isArray(to) ? to : [to];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: `Invalid email format: ${email}` }, 
          { status: 400 }
        );
      }
    }

    // Process variables in content if provided
    let processedBody = body || '';
    let processedHtmlBody = htmlBody || '';
    
    if (variables && typeof variables === 'object') {
      for (const [key, value] of Object.entries(variables)) {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedBody = processedBody.replace(placeholder, String(value));
        processedHtmlBody = processedHtmlBody.replace(placeholder, String(value));
      }
    }

    // Determine which email provider to use and send
    let result: { success: boolean; messageId?: string; error?: string };
    let provider = 'none';

    // Priority: SMTP > Brevo > Sender
    if (apiKeys.smtp?.host && apiKeys.smtp?.username && apiKeys.smtp?.password) {
      provider = 'smtp';
      
      const smtpConfig: SMTPConfig = {
        host: apiKeys.smtp.host,
        port: apiKeys.smtp.port || '587',
        username: apiKeys.smtp.username,
        password: await decryptApiKeyServerSide(apiKeys.smtp.password),
        fromEmail: from?.email || apiKeys.smtp.fromEmail || apiKeys.smtp.username,
        fromName: from?.name || apiKeys.smtp.fromName || company?.name || 'OmniFlow',
      };

      result = await sendEmailSMTP(smtpConfig, {
        to: recipients,
        subject,
        text: processedBody || undefined,
        html: processedHtmlBody || undefined,
      });
      
    } else if (apiKeys.brevo?.apiKey) {
      provider = 'brevo';
      
      const decryptedApiKey = await decryptApiKeyServerSide(apiKeys.brevo.apiKey);
      const senderEmail = from?.email || apiKeys.brevo.senderEmail;
      const senderName = from?.name || apiKeys.brevo.senderName || company?.name || 'OmniFlow';

      if (!senderEmail) {
        return NextResponse.json(
          { success: false, error: 'Brevo sender email not configured' }, 
          { status: 400 }
        );
      }

      result = await sendBrevoEmail(
        decryptedApiKey,
        senderEmail,
        senderName,
        recipients[0], // Brevo transactional sends to single recipient
        recipients[0].split('@')[0], // Use email prefix as name
        subject,
        processedHtmlBody || `<p>${processedBody}</p>`
      );
      
    } else if (apiKeys.sender?.apiKey) {
      provider = 'sender';
      
      const decryptedApiKey = await decryptApiKeyServerSide(apiKeys.sender.apiKey);
      const senderEmail = from?.email || apiKeys.sender.senderEmail;
      const senderName = from?.name || apiKeys.sender.senderName || company?.name || 'OmniFlow';

      if (!senderEmail) {
        return NextResponse.json(
          { success: false, error: 'Sender.net sender email not configured' }, 
          { status: 400 }
        );
      }

      result = await sendSenderEmail(
        decryptedApiKey,
        senderEmail,
        senderName,
        recipients[0],
        recipients[0].split('@')[0], // Use email prefix as name
        subject,
        processedHtmlBody || `<p>${processedBody}</p>`
      );
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No email provider configured. Please set up SMTP, Brevo, or Sender.net in Settings > Integrations.' 
        }, 
        { status: 400 }
      );
    }

    // Log the webhook call
    const duration = Date.now() - startTime;
    await adminDb.collection('companies').doc(companyId).collection('webhookLogs').add({
      type: 'send-email',
      timestamp: new Date().toISOString(),
      success: result.success,
      provider,
      recipientCount: recipients.length,
      duration,
      error: result.error || null,
      // Don't log full content for privacy
      metadata: {
        subject: subject.substring(0, 100),
        hasHtml: !!htmlBody,
        hasVariables: !!variables,
      },
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        provider,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send email',
          provider,
          timestamp: new Date().toISOString(),
        }, 
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook send-email error:', error);
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
