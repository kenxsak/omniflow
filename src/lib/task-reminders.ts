'use server';

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { decryptApiKeyServerSide, isEncrypted } from '@/lib/encryption-server';
import { sendTransactionalEmail } from '@/services/brevo';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import type { Task } from '@/types/task';
import type { StoredApiKeys } from '@/types/integrations';

interface TaskReminderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface UserTaskSummary {
  userId: string;
  userName: string;
  userEmail: string;
  overdueTasks: Task[];
  todayTasks: Task[];
  tomorrowTasks: Task[];
  highPriorityTasks: Task[];
}

interface CompanyApiKeys {
  brevo?: { apiKey?: string; senderEmail?: string; senderName?: string };
  smtp?: {
    host?: string;
    port?: string;
    username?: string;
    password?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

async function getCompanyApiKeys(companyId: string): Promise<CompanyApiKeys> {
  if (!adminDb) {
    console.warn('Firebase Admin not initialized');
    return {};
  }

  try {
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();

    if (!companyDoc.exists) {
      console.warn(`Company ${companyId} not found`);
      return {};
    }

    const companyData = companyDoc.data();
    const storedKeys = (companyData?.apiKeys || {}) as StoredApiKeys;
    const decryptedKeys: CompanyApiKeys = {};

    for (const [serviceId, serviceKeys] of Object.entries(storedKeys)) {
      if (!serviceKeys || typeof serviceKeys !== 'object') continue;
      if (serviceId !== 'brevo' && serviceId !== 'smtp') continue;

      const decryptedServiceKeys: Record<string, string> = {};

      for (const [fieldId, value] of Object.entries(serviceKeys as Record<string, any>)) {
        if (value === null || value === undefined) {
          decryptedServiceKeys[fieldId] = '';
          continue;
        }

        try {
          if (isEncrypted(value)) {
            decryptedServiceKeys[fieldId] = decryptApiKeyServerSide(value);
          } else if (typeof value === 'string') {
            decryptedServiceKeys[fieldId] = value;
          } else {
            decryptedServiceKeys[fieldId] = String(value);
          }
        } catch (err) {
          console.warn(`Failed to decrypt ${serviceId}.${fieldId}`, err);
          decryptedServiceKeys[fieldId] = '';
        }
      }

      (decryptedKeys as any)[serviceId] = decryptedServiceKeys;
    }

    return decryptedKeys;
  } catch (error) {
    console.error('Error fetching company API keys:', error);
    return {};
  }
}

async function getCompanyName(companyId: string): Promise<string> {
  if (!adminDb) return 'Our Business';

  try {
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    return companyDoc.data()?.name || 'Our Business';
  } catch {
    return 'Our Business';
  }
}


function generateTaskReminderEmailHTML(
  userName: string,
  summary: UserTaskSummary,
  companyName: string
): string {
  const formatTaskList = (tasks: Task[], color: string) => {
    if (tasks.length === 0) return '';
    
    return tasks.map(task => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 500; color: #1a1a1a; font-size: 14px;">${task.title}</div>
          <div style="font-size: 12px; color: #718096; margin-top: 4px;">
            Due: ${format(new Date(task.dueDate), 'MMM d, yyyy')} • Priority: ${task.priority}
            ${task.leadName ? ` • Lead: ${task.leadName}` : ''}
          </div>
        </td>
        <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; text-align: right;">
          <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 600; background-color: ${color}20; color: ${color};">
            ${task.status}
          </span>
        </td>
      </tr>
    `).join('');
  };

  const sections: string[] = [];

  if (summary.overdueTasks.length > 0) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #dc2626; font-size: 16px; font-weight: 600;">
          🚨 Overdue Tasks (${summary.overdueTasks.length})
        </h3>
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-radius: 8px; overflow: hidden;">
          ${formatTaskList(summary.overdueTasks, '#dc2626')}
        </table>
      </div>
    `);
  }

  if (summary.todayTasks.length > 0) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #f59e0b; font-size: 16px; font-weight: 600;">
          📅 Due Today (${summary.todayTasks.length})
        </h3>
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fffbeb; border-radius: 8px; overflow: hidden;">
          ${formatTaskList(summary.todayTasks, '#f59e0b')}
        </table>
      </div>
    `);
  }

  if (summary.tomorrowTasks.length > 0) {
    sections.push(`
      <div style="margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #3b82f6; font-size: 16px; font-weight: 600;">
          📆 Due Tomorrow (${summary.tomorrowTasks.length})
        </h3>
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #eff6ff; border-radius: 8px; overflow: hidden;">
          ${formatTaskList(summary.tomorrowTasks, '#3b82f6')}
        </table>
      </div>
    `);
  }

  if (summary.highPriorityTasks.length > 0) {
    const highPriorityNotInOther = summary.highPriorityTasks.filter(t => 
      !summary.overdueTasks.find(ot => ot.id === t.id) &&
      !summary.todayTasks.find(tt => tt.id === t.id) &&
      !summary.tomorrowTasks.find(tm => tm.id === t.id)
    );
    
    if (highPriorityNotInOther.length > 0) {
      sections.push(`
        <div style="margin-bottom: 24px;">
          <h3 style="margin: 0 0 12px; color: #7c3aed; font-size: 16px; font-weight: 600;">
            ⚡ High Priority (${highPriorityNotInOther.length})
          </h3>
          <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f3ff; border-radius: 8px; overflow: hidden;">
            ${formatTaskList(highPriorityNotInOther, '#7c3aed')}
          </table>
        </div>
      `);
    }
  }

  const totalTasks = summary.overdueTasks.length + summary.todayTasks.length + summary.tomorrowTasks.length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Task Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📋 Daily Task Reminder</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">${format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Good morning, <strong>${userName}</strong>! 👋
              </p>
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 15px; line-height: 1.6;">
                You have <strong>${totalTasks} task${totalTasks !== 1 ? 's' : ''}</strong> that need your attention.
              </p>
              
              ${sections.join('')}
              
              <div style="text-align: center; margin: 32px 0 16px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/tasks" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);">
                  View All Tasks →
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
              <p style="margin: 0; color: #718096; font-size: 13px; text-align: center;">
                This reminder was sent by <strong>${companyName}</strong>
              </p>
              <p style="margin: 8px 0 0; color: #a0aec0; font-size: 12px; text-align: center;">
                Manage your notification preferences in Settings
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}


export async function sendTaskReminderEmail(
  summary: UserTaskSummary,
  companyId: string
): Promise<TaskReminderResult> {
  try {
    const apiKeys = await getCompanyApiKeys(companyId);
    const companyName = await getCompanyName(companyId);
    
    const totalTasks = summary.overdueTasks.length + summary.todayTasks.length + summary.tomorrowTasks.length;
    const subject = `📋 Daily Task Reminder: ${totalTasks} task${totalTasks !== 1 ? 's' : ''} need attention`;
    const html = generateTaskReminderEmailHTML(summary.userName, summary, companyName);
    
    const textContent = `
Daily Task Reminder for ${summary.userName}

${summary.overdueTasks.length > 0 ? `OVERDUE (${summary.overdueTasks.length}):\n${summary.overdueTasks.map(t => `- ${t.title} (Due: ${format(new Date(t.dueDate), 'MMM d')})`).join('\n')}\n\n` : ''}
${summary.todayTasks.length > 0 ? `DUE TODAY (${summary.todayTasks.length}):\n${summary.todayTasks.map(t => `- ${t.title}`).join('\n')}\n\n` : ''}
${summary.tomorrowTasks.length > 0 ? `DUE TOMORROW (${summary.tomorrowTasks.length}):\n${summary.tomorrowTasks.map(t => `- ${t.title}`).join('\n')}\n\n` : ''}

View all tasks: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/tasks

- ${companyName}
    `.trim();

    if (apiKeys.brevo?.apiKey) {
      const senderEmail = apiKeys.brevo.senderEmail || 'noreply@omniflow.com';
      const senderName = apiKeys.brevo.senderName || companyName;

      console.log(`[TaskReminder] Sending email via Brevo to ${summary.userEmail}`);

      const result = await sendTransactionalEmail(
        apiKeys.brevo.apiKey,
        senderEmail,
        senderName,
        summary.userEmail,
        summary.userName,
        subject,
        html
      );

      if (result.success) {
        return { success: true, messageId: result.messageId };
      }
      console.warn('[TaskReminder] Brevo failed, trying SMTP...', result.error);
    }

    if (apiKeys.smtp?.host && apiKeys.smtp?.username && apiKeys.smtp?.password) {
      const smtpConfig: SMTPConfig = {
        host: apiKeys.smtp.host,
        port: apiKeys.smtp.port || '587',
        username: apiKeys.smtp.username,
        password: apiKeys.smtp.password,
        fromEmail: apiKeys.smtp.fromEmail || apiKeys.smtp.username,
        fromName: apiKeys.smtp.fromName || companyName,
      };

      console.log(`[TaskReminder] Sending email via SMTP to ${summary.userEmail}`);

      const result = await sendEmailSMTP(smtpConfig, {
        to: summary.userEmail,
        subject,
        html,
        text: textContent,
      });

      if (result.success) {
        return { success: true, messageId: result.messageId };
      }

      return { success: false, error: result.error };
    }

    return {
      success: false,
      error: 'No email provider configured. Please configure Brevo or SMTP in Settings.',
    };
  } catch (error) {
    console.error('[TaskReminder] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send task reminder email',
    };
  }
}

export async function processTaskRemindersForCompany(companyId: string): Promise<{
  usersProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const result = {
    usersProcessed: 0,
    emailsSent: 0,
    errors: [] as string[],
  };

  if (!adminDb) {
    result.errors.push('Database not initialized');
    return result;
  }

  try {
    // Get all tasks for the company from root tasks collection
    const tasksSnapshot = await adminDb
      .collection('tasks')
      .where('companyId', '==', companyId)
      .where('status', 'in', ['To Do', 'In Progress'])
      .get();

    if (tasksSnapshot.empty) {
      console.log(`[TaskReminder] No pending tasks for company ${companyId}`);
      return result;
    }

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    // Get all users for the company
    const usersSnapshot = await adminDb
      .collection('users')
      .where('companyId', '==', companyId)
      .get();

    // For each user, create a task summary
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Skip users without email
      if (!userData.email) continue;

      // Check if user has task reminders enabled (default to true)
      const notificationPrefs = userData.notificationPreferences || {};
      if (notificationPrefs.email_task_reminder === false) {
        console.log(`[TaskReminder] User ${userId} has task reminders disabled`);
        continue;
      }

      // All tasks are visible to all users in the company (no assignment filtering)
      const userTasks = tasks;

      if (userTasks.length === 0) continue;

      const summary: UserTaskSummary = {
        userId,
        userName: userData.name || userData.email.split('@')[0],
        userEmail: userData.email,
        overdueTasks: [],
        todayTasks: [],
        tomorrowTasks: [],
        highPriorityTasks: [],
      };

      for (const task of userTasks) {
        const dueDate = new Date(task.dueDate);
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          summary.overdueTasks.push(task);
        } else if (isToday(dueDate)) {
          summary.todayTasks.push(task);
        } else if (isTomorrow(dueDate)) {
          summary.tomorrowTasks.push(task);
        }
        
        if (task.priority === 'High') {
          summary.highPriorityTasks.push(task);
        }
      }

      // Only send if there are relevant tasks (overdue, today, or tomorrow)
      if (summary.overdueTasks.length > 0 || summary.todayTasks.length > 0 || summary.tomorrowTasks.length > 0) {
        result.usersProcessed++;
        
        try {
          const sendResult = await sendTaskReminderEmail(summary, companyId);
          
          if (sendResult.success) {
            result.emailsSent++;
            console.log(`[TaskReminder] Sent reminder to ${summary.userEmail}`);
          } else {
            result.errors.push(`User ${userId}: ${sendResult.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`User ${userId}: ${errorMsg}`);
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[TaskReminder] Error processing company:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

export async function processAllTaskReminders(): Promise<{
  companiesProcessed: number;
  totalUsersProcessed: number;
  totalEmailsSent: number;
  errors: string[];
}> {
  const result = {
    companiesProcessed: 0,
    totalUsersProcessed: 0,
    totalEmailsSent: 0,
    errors: [] as string[],
  };

  if (!adminDb) {
    result.errors.push('Database not initialized');
    return result;
  }

  try {
    console.log('[TaskReminder] Starting daily task reminder processing...');
    
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      try {
        const companyResult = await processTaskRemindersForCompany(companyId);
        result.totalUsersProcessed += companyResult.usersProcessed;
        result.totalEmailsSent += companyResult.emailsSent;
        result.errors.push(...companyResult.errors.map(e => `[${companyId}] ${e}`));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Company ${companyId}: ${errorMsg}`);
      }
    }

    console.log(`[TaskReminder] Processing complete: ${result.companiesProcessed} companies, ${result.totalEmailsSent} emails sent`);
    
    return result;
  } catch (error) {
    console.error('[TaskReminder] Error in processAllTaskReminders:', error);
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

// Manager summary - sends a summary of all team tasks to managers
export async function sendManagerTaskSummary(companyId: string): Promise<TaskReminderResult> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    // Get company managers (users with admin or manager role) from root users collection
    const usersSnapshot = await adminDb
      .collection('users')
      .where('companyId', '==', companyId)
      .where('role', 'in', ['admin', 'manager', 'owner'])
      .get();

    if (usersSnapshot.empty) {
      return { success: true }; // No managers to notify
    }

    // Get all pending tasks from root tasks collection
    const tasksSnapshot = await adminDb
      .collection('tasks')
      .where('companyId', '==', companyId)
      .where('status', 'in', ['To Do', 'In Progress'])
      .get();

    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    const overdueTasks = tasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    const todayTasks = tasks.filter(t => isToday(new Date(t.dueDate)));
    const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Done');

    const companyName = await getCompanyName(companyId);
    const apiKeys = await getCompanyApiKeys(companyId);

    let emailsSent = 0;
    const errors: string[] = [];

    for (const managerDoc of usersSnapshot.docs) {
      const manager = managerDoc.data();
      if (!manager.email) continue;

      // Check notification preferences
      const notificationPrefs = manager.notificationPreferences || {};
      if (notificationPrefs.email_task_reminder === false) continue;

      const subject = `📊 Team Task Summary: ${overdueTasks.length} overdue, ${todayTasks.length} due today`;
      
      // Generate manager-specific HTML
      const summary: UserTaskSummary = {
        userId: managerDoc.id,
        userName: manager.name || manager.email.split('@')[0],
        userEmail: manager.email,
        overdueTasks,
        todayTasks,
        tomorrowTasks: tasks.filter(t => isTomorrow(new Date(t.dueDate))),
        highPriorityTasks,
      };

      const html = generateTaskReminderEmailHTML(summary.userName, summary, companyName);

      try {
        if (apiKeys.brevo?.apiKey) {
          const result = await sendTransactionalEmail(
            apiKeys.brevo.apiKey,
            apiKeys.brevo.senderEmail || 'noreply@omniflow.com',
            apiKeys.brevo.senderName || companyName,
            manager.email,
            summary.userName,
            subject,
            html
          );
          if (result.success) emailsSent++;
          else errors.push(`Manager ${manager.email}: ${result.error}`);
        } else if (apiKeys.smtp?.host) {
          const smtpConfig: SMTPConfig = {
            host: apiKeys.smtp.host,
            port: apiKeys.smtp.port || '587',
            username: apiKeys.smtp.username!,
            password: apiKeys.smtp.password!,
            fromEmail: apiKeys.smtp.fromEmail || apiKeys.smtp.username!,
            fromName: apiKeys.smtp.fromName || companyName,
          };
          const result = await sendEmailSMTP(smtpConfig, {
            to: manager.email,
            subject,
            html,
          });
          if (result.success) emailsSent++;
          else errors.push(`Manager ${manager.email}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`Manager ${manager.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      success: emailsSent > 0 || errors.length === 0,
      error: errors.length > 0 ? errors.join('; ') : undefined,
    };
  } catch (error) {
    console.error('[TaskReminder] Error sending manager summary:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send manager summary',
    };
  }
}
