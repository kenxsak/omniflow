'use server';

import { adminDb } from '@/lib/firebase-admin';
import { sendTransactionalEmail as sendBrevoEmail } from '@/services/brevo';
import { sendTransactionalEmail as sendSenderEmail } from '@/lib/sender-client';
import { sendBulkAuthkeyWhatsApp } from '@/lib/authkey-client';
import { sendBulkWhatsAppAiSensy } from '@/lib/aisensy-client';

interface UserTarget {
  id: string;
  email: string;
  name: string;
  phone?: string;
  companyName: string;
  planId: string;
}

interface CompanyTarget {
  id: string;
  name: string;
  adminEmail: string;
  planId: string;
  userCount: number;
}

interface SendEmailParams {
  subject: string;
  content: string;
  targetType: 'all' | 'plan' | 'selected';
  targetPlan?: string;
  selectedEmails?: string[];
}

interface SendWhatsAppParams {
  templateName: string;
  parameters: string[];
  targetType: 'all' | 'plan' | 'selected';
  targetPlan?: string;
  selectedPhones?: string[];
}

/**
 * Get all platform users for targeting
 */
export async function getPlatformUsers(): Promise<{
  success: boolean;
  users?: UserTarget[];
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const usersSnapshot = await adminDb.collection('users').limit(500).get();
    const users: UserTarget[] = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Get company info
      let companyName = 'Unknown';
      let planId = 'free';
      
      if (userData.companyId) {
        const companyDoc = await adminDb.collection('companies').doc(userData.companyId).get();
        if (companyDoc.exists) {
          const companyData = companyDoc.data();
          companyName = companyData?.name || 'Unknown';
          planId = companyData?.planId || 'free';
        }
      }

      users.push({
        id: userDoc.id,
        email: userData.email || '',
        name: userData.name || userData.email?.split('@')[0] || 'User',
        phone: userData.phone,
        companyName,
        planId,
      });
    }

    return { success: true, users };
  } catch (error) {
    console.error('Error fetching platform users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

/**
 * Get all platform companies for targeting
 */
export async function getPlatformCompanies(): Promise<{
  success: boolean;
  companies?: CompanyTarget[];
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const companiesSnapshot = await adminDb.collection('companies').limit(200).get();
    const companies: CompanyTarget[] = [];

    for (const companyDoc of companiesSnapshot.docs) {
      const companyData = companyDoc.data();
      
      // Count users in this company
      const usersSnapshot = await adminDb
        .collection('users')
        .where('companyId', '==', companyDoc.id)
        .count()
        .get();

      companies.push({
        id: companyDoc.id,
        name: companyData.name || 'Unknown',
        adminEmail: companyData.adminEmail || companyData.registeredEmail || '',
        planId: companyData.planId || 'free',
        userCount: usersSnapshot.data().count,
      });
    }

    return { success: true, companies };
  } catch (error) {
    console.error('Error fetching platform companies:', error);
    return { success: false, error: 'Failed to fetch companies' };
  }
}

/**
 * Send platform-wide email using platform credentials
 */
export async function sendPlatformEmail(params: SendEmailParams): Promise<{
  success: boolean;
  sentCount?: number;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const { subject, content, targetType, targetPlan, selectedEmails } = params;

  // Get platform email credentials
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderApiKey = process.env.SENDER_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || 'noreply@worldmart.in';
  const senderName = process.env.BREVO_SENDER_NAME || process.env.SENDER_NAME || 'Platform';

  if (!brevoApiKey && !senderApiKey) {
    return { success: false, error: 'No email provider configured. Add BREVO_API_KEY or SENDER_API_KEY to environment.' };
  }

  try {
    // Get target users
    let targetEmails: { email: string; name: string }[] = [];

    if (targetType === 'selected' && selectedEmails) {
      // Use selected emails
      const usersResult = await getPlatformUsers();
      if (usersResult.success && usersResult.users) {
        targetEmails = usersResult.users
          .filter(u => selectedEmails.includes(u.email))
          .map(u => ({ email: u.email, name: u.name }));
      }
    } else if (targetType === 'plan' && targetPlan) {
      // Filter by plan
      const usersResult = await getPlatformUsers();
      if (usersResult.success && usersResult.users) {
        targetEmails = usersResult.users
          .filter(u => u.planId === targetPlan)
          .map(u => ({ email: u.email, name: u.name }));
      }
    } else {
      // All users
      const usersResult = await getPlatformUsers();
      if (usersResult.success && usersResult.users) {
        targetEmails = usersResult.users.map(u => ({ email: u.email, name: u.name }));
      }
    }

    if (targetEmails.length === 0) {
      return { success: false, error: 'No recipients found' };
    }

    // Send emails (batch processing)
    let sentCount = 0;
    const batchSize = 50;

    for (let i = 0; i < targetEmails.length; i += batchSize) {
      const batch = targetEmails.slice(i, i + batchSize);
      
      for (const recipient of batch) {
        // Personalize content
        const personalizedContent = content
          .replace(/\{\{name\}\}/gi, recipient.name)
          .replace(/\{\{email\}\}/gi, recipient.email);

        try {
          let result;
          
          if (brevoApiKey) {
            result = await sendBrevoEmail(
              brevoApiKey,
              senderEmail,
              senderName,
              recipient.email,
              recipient.name,
              subject,
              personalizedContent
            );
          } else if (senderApiKey) {
            result = await sendSenderEmail(
              senderApiKey,
              senderEmail,
              senderName,
              recipient.email,
              recipient.name,
              subject,
              personalizedContent
            );
          }

          if (result?.success) {
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < targetEmails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log the campaign
    await adminDb.collection('platform_campaigns').add({
      type: 'email',
      subject,
      targetType,
      targetPlan: targetPlan || null,
      recipientCount: targetEmails.length,
      sentCount,
      createdAt: new Date().toISOString(),
    });

    return { success: true, sentCount };
  } catch (error) {
    console.error('Error sending platform email:', error);
    return { success: false, error: 'Failed to send emails' };
  }
}

/**
 * Send platform-wide WhatsApp using platform credentials
 */
export async function sendPlatformWhatsApp(params: SendWhatsAppParams): Promise<{
  success: boolean;
  sentCount?: number;
  error?: string;
}> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const { templateName, parameters, targetType, targetPlan, selectedPhones } = params;

  // Get platform WhatsApp credentials
  const authkeyApiKey = process.env.AUTHKEY_API_KEY;
  const aisensyApiKey = process.env.AISENSY_API_KEY;

  if (!authkeyApiKey && !aisensyApiKey) {
    return { success: false, error: 'No WhatsApp provider configured. Add AUTHKEY_API_KEY or AISENSY_API_KEY to environment.' };
  }

  try {
    // Get target users with phone numbers
    const usersResult = await getPlatformUsers();
    if (!usersResult.success || !usersResult.users) {
      return { success: false, error: 'Failed to fetch users' };
    }

    let targetUsers = usersResult.users.filter(u => u.phone);

    if (targetType === 'selected' && selectedPhones) {
      targetUsers = targetUsers.filter(u => u.phone && selectedPhones.includes(u.phone));
    } else if (targetType === 'plan' && targetPlan) {
      targetUsers = targetUsers.filter(u => u.planId === targetPlan);
    }

    if (targetUsers.length === 0) {
      return { success: false, error: 'No recipients with phone numbers found' };
    }

    // Format phone numbers and prepare recipients
    const recipients = targetUsers.map(user => {
      let phone = (user.phone || '').replace(/[\s\-\(\)]/g, '');
      if (!phone.startsWith('+') && !phone.startsWith('91')) {
        phone = '91' + phone;
      }
      phone = phone.replace(/^\+/, '');
      
      return {
        phone,
        name: user.name,
        parameters: parameters.length > 0 ? parameters : [user.name.split(' ')[0] || 'there'],
      };
    });

    let sentCount = 0;

    // Send via Authkey (preferred)
    if (authkeyApiKey) {
      try {
        const result = await sendBulkAuthkeyWhatsApp(
          { apiKey: authkeyApiKey },
          {
            templateName,
            templateType: 'text',
            recipients: recipients.map(r => ({
              phone: r.phone,
              parameters: r.parameters,
            })),
          }
        );

        if (result.success) {
          sentCount = result.totalSent || 0;
        }
      } catch (error) {
        console.error('Authkey WhatsApp error:', error);
      }
    }

    // Fallback to AiSensy if Authkey failed
    if (sentCount === 0 && aisensyApiKey) {
      try {
        const result = await sendBulkWhatsAppAiSensy(
          { apiKey: aisensyApiKey, campaignName: `Platform: ${templateName}` },
          {
            campaignName: `Platform: ${templateName}`,
            recipients: recipients.map(r => ({
              whatsappNumber: r.phone,
              userName: r.name,
              templateParams: r.parameters,
            })),
          }
        );

        if (result.success) {
          sentCount = recipients.length; // AiSensy doesn't return individual counts
        }
      } catch (error) {
        console.error('AiSensy WhatsApp error:', error);
      }
    }

    // Log the campaign
    await adminDb.collection('platform_campaigns').add({
      type: 'whatsapp',
      templateName,
      targetType,
      targetPlan: targetPlan || null,
      recipientCount: recipients.length,
      sentCount,
      createdAt: new Date().toISOString(),
    });

    return { success: true, sentCount };
  } catch (error) {
    console.error('Error sending platform WhatsApp:', error);
    return { success: false, error: 'Failed to send WhatsApp messages' };
  }
}
