'use server';

import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';

// Validation schema for Sales Page lead capture
const SalesPageLeadSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  email: z.string().email({ message: "Invalid email address." }),
  phone: z.string()
    .min(10, { message: "Phone number must be at least 10 digits." })
    .regex(/^\+?[1-9]\d{7,14}$/, { message: "Please enter a valid phone number with country code." }),
  message: z.string().optional().refine(
    (message) => {
      if (!message) return true;
      const linkCount = (message.match(/http:\/\//g) || []).length + (message.match(/https:\/\//g) || []).length;
      return linkCount <= 1;
    },
    { message: "Message contains too many links." }
  ),
  honeypot: z.string().nullable().optional(),
});

export type SalesPageLeadInput = z.infer<typeof SalesPageLeadSchema>;

export interface SalesPageLeadResponse {
  success: boolean;
  message: string;
  leadId?: string;
  errors?: { field: string, message: string }[];
}

/**
 * Generate a beautiful HTML email notification for new leads
 */
function generateLeadNotificationEmail(
  leadName: string,
  leadEmail: string,
  leadPhone: string | undefined,
  leadMessage: string | undefined,
  pageTitle: string,
  pageUrl: string,
  companyName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🎉 New Lead Captured!</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Someone is interested in your offer</p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <!-- Lead Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600;">Contact Information</h2>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 13px;">Name</span><br>
                          <span style="color: #111827; font-size: 15px; font-weight: 500;">${leadName}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 13px;">Email</span><br>
                          <a href="mailto:${leadEmail}" style="color: #6366f1; font-size: 15px; font-weight: 500; text-decoration: none;">${leadEmail}</a>
                        </td>
                      </tr>
                      ${leadPhone ? `
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                          <span style="color: #6b7280; font-size: 13px;">Phone</span><br>
                          <a href="tel:${leadPhone}" style="color: #6366f1; font-size: 15px; font-weight: 500; text-decoration: none;">${leadPhone}</a>
                        </td>
                      </tr>
                      ` : ''}
                      ${leadMessage ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 13px;">Message</span><br>
                          <span style="color: #111827; font-size: 15px; line-height: 1.5;">${leadMessage}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Source Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0; color: #92400e; font-size: 13px;">
                      <strong>Source:</strong> ${pageTitle}<br>
                      <a href="${pageUrl}" style="color: #92400e; text-decoration: underline;">${pageUrl}</a>
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${leadEmail}?subject=Re: Your inquiry about ${pageTitle}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                      Reply to ${leadName} →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
                This lead has been automatically saved to your CRM in OmniFlow.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Powered by <strong>OmniFlow</strong> • Lead Capture for ${companyName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send email notification to business owner about new lead
 */
async function sendLeadNotificationEmail(
  companyId: string,
  ownerEmail: string,
  leadData: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    pageTitle: string;
    pageUrl: string;
  }
): Promise<boolean> {
  try {
    if (!adminDb) return false;
    
    // Get company details and SMTP config
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    const company = companyDoc.data();
    
    if (!company) return false;
    
    const companyName = company.name || 'Your Business';
    
    // Check if company has SMTP configured
    const smtpConfig = company.apiKeys?.smtp;
    
    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      // Use company's SMTP
      const config: SMTPConfig = {
        host: decryptApiKeyServerSide(smtpConfig.host),
        port: smtpConfig.port || '587',
        username: decryptApiKeyServerSide(smtpConfig.username),
        password: decryptApiKeyServerSide(smtpConfig.password),
        fromEmail: smtpConfig.fromEmail ? decryptApiKeyServerSide(smtpConfig.fromEmail) : decryptApiKeyServerSide(smtpConfig.username),
        fromName: smtpConfig.fromName ? decryptApiKeyServerSide(smtpConfig.fromName) : companyName,
      };
      
      const htmlContent = generateLeadNotificationEmail(
        leadData.name,
        leadData.email,
        leadData.phone,
        leadData.message,
        leadData.pageTitle,
        leadData.pageUrl,
        companyName
      );
      
      const result = await sendEmailSMTP(config, {
        to: ownerEmail,
        subject: `🎉 New Lead: ${leadData.name} from ${leadData.pageTitle}`,
        html: htmlContent,
        text: `New lead captured!\n\nName: ${leadData.name}\nEmail: ${leadData.email}\nPhone: ${leadData.phone || 'Not provided'}\nMessage: ${leadData.message || 'No message'}\n\nSource: ${leadData.pageTitle}\n${leadData.pageUrl}`,
      });
      
      if (result.success) {
        console.log('✅ Lead notification email sent via SMTP');
        return true;
      }
    }
    
    // If no SMTP, try system SMTP from env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const systemConfig: SMTPConfig = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || '587',
        username: process.env.SMTP_USER,
        password: process.env.SMTP_PASSWORD,
        fromEmail: process.env.SMTP_USER,
        fromName: 'OmniFlow Notifications',
      };
      
      const htmlContent = generateLeadNotificationEmail(
        leadData.name,
        leadData.email,
        leadData.phone,
        leadData.message,
        leadData.pageTitle,
        leadData.pageUrl,
        companyName
      );
      
      const result = await sendEmailSMTP(systemConfig, {
        to: ownerEmail,
        subject: `🎉 New Lead: ${leadData.name} from ${leadData.pageTitle}`,
        html: htmlContent,
        text: `New lead captured!\n\nName: ${leadData.name}\nEmail: ${leadData.email}\nPhone: ${leadData.phone || 'Not provided'}\nMessage: ${leadData.message || 'No message'}\n\nSource: ${leadData.pageTitle}\n${leadData.pageUrl}`,
      });
      
      if (result.success) {
        console.log('✅ Lead notification email sent via system SMTP');
        return true;
      }
    }
    
    console.log('ℹ️ No email provider configured, skipping notification');
    return false;
    
  } catch (error) {
    console.error('Error sending lead notification email:', error);
    return false;
  }
}

/**
 * Submit a lead from a Sales Page / Landing Page
 * This is a public action that doesn't require authentication
 */
export async function submitSalesPageLead(
  postId: string,
  formData: SalesPageLeadInput
): Promise<SalesPageLeadResponse> {
  try {
    // Honeypot check
    if (formData.honeypot && formData.honeypot.trim() !== "") {
      console.warn("[Sales Page Lead] Honeypot triggered - spam blocked");
      return { success: true, message: "Thank you! We'll be in touch soon." };
    }

    // Validate input
    const validationResult = SalesPageLeadSchema.safeParse(formData);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return { 
        success: false, 
        message: "Please check your information.", 
        errors: fieldErrors 
      };
    }

    const { name, email, phone, message } = validationResult.data;

    if (!adminDb) {
      console.error('❌ Database not initialized');
      return {
        success: false,
        message: "Service temporarily unavailable. Please try again."
      };
    }

    // Get the Social Post to find the company owner
    const postDoc = await adminDb.collection('socialPosts').doc(postId).get();
    
    if (!postDoc.exists) {
      console.error('❌ Sales Page not found:', postId);
      return {
        success: false,
        message: "Page not found. Please contact us directly."
      };
    }

    const post = postDoc.data();
    const companyId = post?.companyId;

    if (!companyId) {
      console.error('❌ Sales Page missing companyId');
      return {
        success: false,
        message: "Configuration error. Please try again."
      };
    }

    // Get company to find owner
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    const company = companyDoc.data();
    const ownerId = company?.ownerId;
    
    // Get owner's email for notification
    let ownerEmail: string | undefined;
    if (ownerId) {
      const ownerDoc = await adminDb.collection('users').doc(ownerId).get();
      ownerEmail = ownerDoc.data()?.email;
    }

    // Determine source based on platform
    const platform = post?.platform || 'SalesLandingPage';
    const sourceName = platform === 'BlogPost' ? 'Blog Post' : 'Sales Page';
    const pageTitle = post?.originalTopic || 'Untitled Page';
    const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://omniflow.app'}/blog/${postId}`;

    // Create lead data
    const leadData = {
      name,
      email,
      phone: phone || undefined,
      status: 'New' as const,
      source: `${sourceName} - Lead Capture`,
      sourceMetadata: {
        postId: postId,
        postUrl: pageUrl,
        postTitle: pageTitle,
        platform: platform,
      },
      notes: message 
        ? `Lead captured from ${sourceName}.\n\nPage: ${pageTitle}\n\nMessage:\n${message}`
        : `Lead captured from ${sourceName}: ${pageTitle}`,
      assignedTo: ownerId || undefined,
      companyId: companyId,
      brevoSyncStatus: 'unsynced' as const,
      hubspotSyncStatus: 'unsynced' as const,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastContacted: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save lead to Firestore
    const leadsRef = adminDb.collection('leads');
    const leadDocRef = await leadsRef.add(leadData);
    const leadId = leadDocRef.id;

    console.log('✅ Lead created from Sales Page:', leadId);

    // Update post analytics (optional - track conversions)
    try {
      await adminDb.collection('socialPosts').doc(postId).update({
        'analytics.leadsGenerated': admin.firestore.FieldValue.increment(1),
        'analytics.lastLeadAt': admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (e) {
      // Analytics update is optional, don't fail the lead capture
      console.warn('Could not update post analytics:', e);
    }

    // Send email notification to business owner (async, don't wait)
    if (ownerEmail) {
      sendLeadNotificationEmail(companyId, ownerEmail, {
        name,
        email,
        phone: phone || undefined,
        message: message || undefined,
        pageTitle,
        pageUrl,
      }).catch(err => console.error('Failed to send notification:', err));
    }

    return {
      success: true,
      leadId: leadId,
      message: "Thank you! We've received your information and will contact you soon."
    };

  } catch (error) {
    console.error('❌ Error submitting Sales Page lead:', error);
    return {
      success: false,
      message: "An error occurred. Please try again."
    };
  }
}
