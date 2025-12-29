import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';

// CORS headers for cross-origin requests (embed forms)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Universal Lead Capture API
 * Works like Web3Forms - accepts form submissions from any website
 * 
 * Required fields:
 * - access_key: Company's unique access key (from settings)
 * - name: Lead's name
 * - email: Lead's email
 * 
 * Optional fields:
 * - phone: Lead's phone
 * - message: Lead's message
 * - source: Custom source identifier
 * - _honeypot: Spam protection field (must be empty)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data (supports both JSON and FormData)
    let data: Record<string, string> = {};
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          data[key] = value;
        }
      });
    } else {
      // Try JSON as fallback
      try {
        data = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, message: 'Invalid request format' },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Validate access key
    const accessKey = data.access_key || data.accessKey;
    if (!accessKey) {
      return NextResponse.json(
        { success: false, message: 'Missing access_key. Get your key from OmniFlow Settings.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Honeypot spam check
    const honeypot = data._honeypot || data.honeypot || data.website || '';
    if (honeypot.trim() !== '') {
      // Silently accept but don't process (bot thinks it worked)
      console.log('[Embed Lead] Honeypot triggered - spam blocked');
      return NextResponse.json(
        { success: true, message: 'Thank you! Your submission has been received.' },
        { headers: corsHeaders }
      );
    }

    // Validate required fields
    const name = data.name || data.Name || data.fullname || data.full_name || '';
    const email = data.email || data.Email || data.EMAIL || '';
    
    // Get phone - combine country_code + phone_number if provided separately
    let phone = data.phone || data.Phone || data.tel || data.mobile || '';
    if (data.country_code && data.phone_number) {
      const countryCode = data.country_code;
      const phoneNumber = (data.phone_number || '').replace(/\D/g, '');
      phone = countryCode + phoneNumber;
    }
    
    if (!name.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    if (!email.trim() || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate phone is required and has proper format
    if (!phone.trim()) {
      return NextResponse.json(
        { success: false, message: 'Phone number is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Validate phone format (should start with + and have at least 8 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      return NextResponse.json(
        { success: false, message: 'Please enter a valid phone number with country code' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Spam check: too many links in message
    const message = data.message || data.Message || data.comments || data.inquiry || '';
    const linkCount = (message.match(/http:\/\//g) || []).length + (message.match(/https:\/\//g) || []).length;
    if (linkCount > 2) {
      console.log('[Embed Lead] Too many links - spam blocked');
      return NextResponse.json(
        { success: true, message: 'Thank you! Your submission has been received.' },
        { headers: corsHeaders }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { success: false, message: 'Service temporarily unavailable' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Find company by access key
    const companiesSnapshot = await adminDb
      .collection('companies')
      .where('embedAccessKey', '==', accessKey)
      .limit(1)
      .get();

    if (companiesSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Invalid access_key. Check your key in OmniFlow Settings.' },
        { status: 401, headers: corsHeaders }
      );
    }

    const companyDoc = companiesSnapshot.docs[0];
    const company = companyDoc.data();
    const companyId = companyDoc.id;
    const ownerId = company.ownerId;

    // Get optional fields
    const source = data.source || data.Source || data._source || 'Embed Form';
    const subject = data.subject || data.Subject || '';

    // Build notes from all extra fields
    const standardFields = ['access_key', 'accessKey', 'name', 'Name', 'fullname', 'full_name', 
      'email', 'Email', 'EMAIL', 'phone', 'Phone', 'tel', 'mobile', 'message', 'Message', 
      'comments', 'inquiry', 'source', 'Source', '_source', 'subject', 'Subject',
      '_honeypot', 'honeypot', 'website', '_gotcha', 'country_code', 'phone_number'];
    
    let extraFields = '';
    Object.entries(data).forEach(([key, value]) => {
      if (!standardFields.includes(key) && value && typeof value === 'string' && value.trim()) {
        extraFields += `${key}: ${value}\n`;
      }
    });

    const fullNotes = [
      `Lead captured via Embed Form`,
      source !== 'Embed Form' ? `Source: ${source}` : '',
      subject ? `Subject: ${subject}` : '',
      message ? `\nMessage:\n${message}` : '',
      extraFields ? `\nAdditional Info:\n${extraFields}` : '',
    ].filter(Boolean).join('\n');

    // Create lead
    const leadData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      status: 'New' as const,
      source: `Embed Form - ${source}`,
      notes: fullNotes,
      assignedTo: ownerId || undefined,
      companyId: companyId,
      brevoSyncStatus: 'unsynced' as const,
      hubspotSyncStatus: 'unsynced' as const,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastContacted: admin.firestore.FieldValue.serverTimestamp(),
    };

    const leadRef = await adminDb.collection('leads').add(leadData);
    console.log('✅ Lead created via Embed Form:', leadRef.id);

    // Update company stats
    try {
      await adminDb.collection('companies').doc(companyId).update({
        'embedStats.totalLeads': admin.firestore.FieldValue.increment(1),
        'embedStats.lastLeadAt': admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      // Stats update is optional
    }

    // Send email notification (async)
    sendLeadNotification(companyId, company, {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message,
      source,
      subject,
    }).catch(err => console.error('Notification error:', err));

    // Return success with redirect support
    const redirectUrl = data.redirect || data._redirect || data.success_url;
    
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl, { headers: corsHeaders });
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Thank you! Your submission has been received.',
        leadId: leadRef.id,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Embed lead error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendLeadNotification(
  companyId: string,
  company: any,
  lead: { name: string; email: string; phone?: string; message?: string; source?: string; subject?: string }
) {
  try {
    // Get owner email
    const ownerId = company.ownerId;
    if (!ownerId || !adminDb) return;

    const ownerDoc = await adminDb.collection('users').doc(ownerId).get();
    const ownerEmail = ownerDoc.data()?.email;
    if (!ownerEmail) return;

    const companyName = company.name || 'Your Business';

    // Generate email HTML
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:24px;">🎉 New Lead from Embed Form!</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">${lead.source || 'Website Form'}</p>
</td></tr>
<tr><td style="padding:40px;">
<table width="100%" style="background:#f9fafb;border-radius:8px;padding:24px;margin-bottom:24px;">
<tr><td>
<h2 style="margin:0 0 16px;color:#111827;font-size:18px;">Contact Information</h2>
<table width="100%">
<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
<span style="color:#6b7280;font-size:13px;">Name</span><br>
<span style="color:#111827;font-size:15px;font-weight:500;">${lead.name}</span>
</td></tr>
<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
<span style="color:#6b7280;font-size:13px;">Email</span><br>
<a href="mailto:${lead.email}" style="color:#6366f1;font-size:15px;font-weight:500;text-decoration:none;">${lead.email}</a>
</td></tr>
${lead.phone ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
<span style="color:#6b7280;font-size:13px;">Phone</span><br>
<a href="tel:${lead.phone}" style="color:#6366f1;font-size:15px;font-weight:500;text-decoration:none;">${lead.phone}</a>
</td></tr>` : ''}
${lead.subject ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">
<span style="color:#6b7280;font-size:13px;">Subject</span><br>
<span style="color:#111827;font-size:15px;">${lead.subject}</span>
</td></tr>` : ''}
${lead.message ? `<tr><td style="padding:8px 0;">
<span style="color:#6b7280;font-size:13px;">Message</span><br>
<span style="color:#111827;font-size:15px;line-height:1.5;">${lead.message}</span>
</td></tr>` : ''}
</table>
</td></tr></table>
<table width="100%"><tr><td align="center">
<a href="mailto:${lead.email}?subject=Re: ${lead.subject || 'Your inquiry'}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
Reply to ${lead.name} →
</a>
</td></tr></table>
<p style="margin:24px 0 0;color:#6b7280;font-size:13px;text-align:center;">
This lead has been saved to your CRM in OmniFlow.
</p>
</td></tr>
<tr><td style="background:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
<p style="margin:0;color:#9ca3af;font-size:12px;">
Powered by <strong>OmniFlow</strong> • Lead Capture for ${companyName}
</p>
</td></tr>
</table>
</td></tr></table>
</body>
</html>`;

    // Try company SMTP first
    const smtpConfig = company.apiKeys?.smtp;
    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      const config: SMTPConfig = {
        host: decryptApiKeyServerSide(smtpConfig.host),
        port: smtpConfig.port || '587',
        username: decryptApiKeyServerSide(smtpConfig.username),
        password: decryptApiKeyServerSide(smtpConfig.password),
        fromEmail: smtpConfig.fromEmail ? decryptApiKeyServerSide(smtpConfig.fromEmail) : decryptApiKeyServerSide(smtpConfig.username),
        fromName: smtpConfig.fromName ? decryptApiKeyServerSide(smtpConfig.fromName) : companyName,
      };
      
      await sendEmailSMTP(config, {
        to: ownerEmail,
        subject: `🎉 New Lead: ${lead.name} via Embed Form`,
        html,
      });
      return;
    }

    // Try system SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      await sendEmailSMTP({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
        username: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_USER,
        fromName: 'OmniFlow Notifications',
      }, {
        to: ownerEmail,
        subject: `🎉 New Lead: ${lead.name} via Embed Form`,
        html,
      });
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
