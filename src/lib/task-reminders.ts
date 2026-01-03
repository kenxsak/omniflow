'use server';

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { format, isToday, isTomorrow, isPast, differenceInMinutes, parseISO } from 'date-fns';
import { decryptApiKeyServerSide, isEncrypted } from '@/lib/encryption-server';
import { sendTransactionalEmail } from '@/services/brevo';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import type { Task } from '@/types/task';
import type { StoredApiKeys } from '@/types/integrations';

// ============================================
// TYPES
// ============================================

type ReminderType = 'morning' | 'hourBefore' | 'endOfDay';

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
  completedToday: Task[];
  upcomingTask?: Task; // For 1-hour reminder
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


// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCompanyApiKeys(companyId: string): Promise<CompanyApiKeys> {
  if (!adminDb) return {};

  try {
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) return {};

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
        } catch {
          decryptedServiceKeys[fieldId] = '';
        }
      }
      (decryptedKeys as any)[serviceId] = decryptedServiceKeys;
    }
    return decryptedKeys;
  } catch {
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

async function hasAlreadySent(type: ReminderType, date: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection('cronState').doc(`taskReminder_${type}`).get();
    return doc.data()?.lastRunDate === date;
  } catch {
    return false;
  }
}

async function markAsSent(type: ReminderType, date: string, count: number): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection('cronState').doc(`taskReminder_${type}`).set({
      lastRunDate: date,
      lastRunTime: new Date().toISOString(),
      emailsSent: count,
    });
  } catch (e) {
    console.error(`[TaskReminder] Failed to mark ${type} as sent:`, e);
  }
}


// ============================================
// EMAIL TEMPLATES
// ============================================

function generateMorningDigestHTML(userName: string, summary: UserTaskSummary, companyName: string): string {
  const formatTaskList = (tasks: Task[], color: string) => {
    if (tasks.length === 0) return '';
    return tasks.map(task => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: 500; color: #1a1a1a; font-size: 14px;">${task.title}</div>
          <div style="font-size: 12px; color: #718096; margin-top: 2px;">
            ${task.dueTime ? `⏰ ${task.dueTime}` : ''} ${task.priority === 'High' ? '🔴 High Priority' : ''}
          </div>
        </td>
      </tr>
    `).join('');
  };

  const sections: string[] = [];
  
  if (summary.overdueTasks.length > 0) {
    sections.push(`
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px; color: #dc2626; font-size: 15px;">🚨 Overdue (${summary.overdueTasks.length})</h3>
        <table style="width: 100%; background: #fef2f2; border-radius: 8px;">${formatTaskList(summary.overdueTasks, '#dc2626')}</table>
      </div>
    `);
  }
  
  if (summary.todayTasks.length > 0) {
    sections.push(`
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px; color: #f59e0b; font-size: 15px;">📅 Today (${summary.todayTasks.length})</h3>
        <table style="width: 100%; background: #fffbeb; border-radius: 8px;">${formatTaskList(summary.todayTasks, '#f59e0b')}</table>
      </div>
    `);
  }

  const total = summary.overdueTasks.length + summary.todayTasks.length;

  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:500px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 30px 16px;text-align:center;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">☀️ Good Morning!</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${format(new Date(), 'EEEE, MMMM d')}</p>
</td></tr>
<tr><td style="padding:24px 30px;">
<p style="margin:0 0 16px;color:#4a5568;font-size:15px;">Hi <strong>${userName}</strong>, you have <strong>${total} task${total !== 1 ? 's' : ''}</strong> to focus on today.</p>
${sections.join('')}
<div style="text-align:center;margin-top:24px;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/tasks" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Tasks →</a>
</div>
</td></tr>
<tr><td style="padding:16px 30px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}


function generateHourBeforeHTML(userName: string, task: Task, companyName: string): string {
  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:500px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 30px 16px;text-align:center;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">⏰ Task Due in 1 Hour</h1>
</td></tr>
<tr><td style="padding:24px 30px;">
<p style="margin:0 0 16px;color:#4a5568;font-size:15px;">Hi <strong>${userName}</strong>,</p>
<div style="background:#fffbeb;border-radius:8px;padding:16px;margin-bottom:16px;">
<h3 style="margin:0 0 8px;color:#1a1a1a;font-size:16px;">${task.title}</h3>
<p style="margin:0;color:#718096;font-size:13px;">
Due: <strong>${task.dueTime || 'Today'}</strong>
${task.priority === 'High' ? ' • 🔴 High Priority' : ''}
${task.leadName ? ` • Lead: ${task.leadName}` : ''}
</p>
${task.description ? `<p style="margin:10px 0 0;color:#4a5568;font-size:13px;">${task.description}</p>` : ''}
</div>
<div style="text-align:center;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/tasks" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Task →</a>
</div>
</td></tr>
<tr><td style="padding:16px 30px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}

function generateEndOfDayHTML(userName: string, summary: UserTaskSummary, companyName: string): string {
  const completed = summary.completedToday.length;
  const pending = summary.todayTasks.length + summary.overdueTasks.length;
  const tomorrow = summary.tomorrowTasks.length;

  return `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:500px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 30px 16px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">🌙 End of Day Report</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${format(new Date(), 'EEEE, MMMM d')}</p>
</td></tr>
<tr><td style="padding:24px 30px;">
<p style="margin:0 0 20px;color:#4a5568;font-size:15px;">Hi <strong>${userName}</strong>, here's your day summary:</p>
<div style="display:flex;gap:12px;margin-bottom:20px;">
<div style="flex:1;background:#dcfce7;border-radius:8px;padding:16px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#16a34a;">${completed}</div>
<div style="font-size:12px;color:#166534;">Completed</div>
</div>
<div style="flex:1;background:#fef3c7;border-radius:8px;padding:16px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#d97706;">${pending}</div>
<div style="font-size:12px;color:#92400e;">Pending</div>
</div>
<div style="flex:1;background:#dbeafe;border-radius:8px;padding:16px;text-align:center;">
<div style="font-size:28px;font-weight:700;color:#2563eb;">${tomorrow}</div>
<div style="font-size:12px;color:#1e40af;">Tomorrow</div>
</div>
</div>
${pending > 0 ? `<p style="margin:0;color:#718096;font-size:13px;text-align:center;">You have ${pending} task${pending !== 1 ? 's' : ''} to carry forward.</p>` : `<p style="margin:0;color:#16a34a;font-size:13px;text-align:center;">🎉 Great job! All tasks completed!</p>`}
<div style="text-align:center;margin-top:20px;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/tasks" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Tasks →</a>
</div>
</td></tr>
<tr><td style="padding:16px 30px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}


// ============================================
// EMAIL SENDING
// ============================================

async function sendReminderEmail(
  to: string,
  toName: string,
  subject: string,
  html: string,
  companyId: string
): Promise<TaskReminderResult> {
  try {
    const apiKeys = await getCompanyApiKeys(companyId);
    const companyName = await getCompanyName(companyId);

    if (apiKeys.brevo?.apiKey) {
      const result = await sendTransactionalEmail(
        apiKeys.brevo.apiKey,
        apiKeys.brevo.senderEmail || 'noreply@omniflow.com',
        apiKeys.brevo.senderName || companyName,
        to,
        toName,
        subject,
        html
      );
      if (result.success) return { success: true, messageId: result.messageId };
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
      const result = await sendEmailSMTP(smtpConfig, { to, subject, html });
      if (result.success) return { success: true, messageId: result.messageId };
      return { success: false, error: result.error };
    }

    return { success: false, error: 'No email provider configured' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


// ============================================
// MAIN PROCESSING FUNCTIONS
// ============================================

/**
 * MORNING DIGEST - Runs once at 8 AM
 * Sends overview of today's tasks + overdue
 */
export async function processMorningDigest(): Promise<{
  companiesProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const result = { companiesProcessed: 0, emailsSent: 0, errors: [] as string[] };
  if (!adminDb) return result;

  const today = new Date().toISOString().split('T')[0];
  if (await hasAlreadySent('morning', today)) {
    console.log('[TaskReminder] Morning digest already sent today');
    return result;
  }

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      const tasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['To Do', 'In Progress'])
        .get();

      if (tasksSnapshot.empty) continue;

      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();
      const companyName = await getCompanyName(companyId);

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (!user.email) continue;
        if (user.notificationPreferences?.email_task_reminder === false) continue;

        const overdue = tasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
        const todayTasks = tasks.filter(t => isToday(new Date(t.dueDate)));

        if (overdue.length === 0 && todayTasks.length === 0) continue;

        const summary: UserTaskSummary = {
          userId: userDoc.id,
          userName: user.name || user.email.split('@')[0],
          userEmail: user.email,
          overdueTasks: overdue,
          todayTasks,
          tomorrowTasks: [],
          completedToday: [],
        };

        const total = overdue.length + todayTasks.length;
        const subject = `☀️ Morning: ${total} task${total !== 1 ? 's' : ''} for today`;
        const html = generateMorningDigestHTML(summary.userName, summary, companyName);

        const sendResult = await sendReminderEmail(user.email, summary.userName, subject, html, companyId);
        if (sendResult.success) result.emailsSent++;
        else result.errors.push(`${user.email}: ${sendResult.error}`);
      }
    }

    await markAsSent('morning', today, result.emailsSent);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}


/**
 * 1-HOUR BEFORE REMINDER - Runs every 5 minutes
 * Sends reminder for tasks due in ~1 hour (with specific time set)
 */
export async function processHourBeforeReminders(): Promise<{
  emailsSent: number;
  errors: string[];
}> {
  const result = { emailsSent: 0, errors: [] as string[] };
  if (!adminDb) return result;

  try {
    const now = new Date();
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;

      // Get tasks due today with a specific time
      const tasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['To Do', 'In Progress'])
        .get();

      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      const companyName = await getCompanyName(companyId);

      for (const task of tasks) {
        // Skip tasks without specific time
        if (!task.dueTime || !task.dueDate) continue;
        if (!isToday(new Date(task.dueDate))) continue;

        // Check if already reminded
        if (task.hourReminderSent) continue;

        // Parse due time (format: "HH:mm" or "HH:mm AM/PM")
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        const dueDateTime = new Date(task.dueDate);
        dueDateTime.setHours(hours, minutes, 0, 0);

        const minutesUntilDue = differenceInMinutes(dueDateTime, now);

        // Send if due in 55-65 minutes (to account for cron timing)
        if (minutesUntilDue >= 55 && minutesUntilDue <= 65) {
          // Get task assignee or all users
          const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();

          for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            if (!user.email) continue;
            if (user.notificationPreferences?.email_task_reminder === false) continue;

            // If task is assigned, only notify assignee
            if (task.assignedTo && task.assignedTo !== userDoc.id) continue;

            const subject = `⏰ Task due in 1 hour: ${task.title}`;
            const html = generateHourBeforeHTML(user.name || user.email.split('@')[0], task, companyName);

            const sendResult = await sendReminderEmail(user.email, user.name || '', subject, html, companyId);
            if (sendResult.success) result.emailsSent++;
            else result.errors.push(`${user.email}: ${sendResult.error}`);
          }

          // Mark task as reminded
          await adminDb.collection('tasks').doc(task.id).update({ hourReminderSent: true });
        }
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}


/**
 * END OF DAY REPORT - Runs once at 6 PM
 * Sends summary of completed vs pending tasks
 */
export async function processEndOfDayReport(): Promise<{
  companiesProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const result = { companiesProcessed: 0, emailsSent: 0, errors: [] as string[] };
  if (!adminDb) return result;

  const today = new Date().toISOString().split('T')[0];
  if (await hasAlreadySent('endOfDay', today)) {
    console.log('[TaskReminder] End of day report already sent today');
    return result;
  }

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      // Get all tasks (including completed today)
      const allTasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .get();

      const allTasks = allTasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
      const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();
      const companyName = await getCompanyName(companyId);

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (!user.email) continue;
        if (user.notificationPreferences?.email_task_reminder === false) continue;

        const completedToday = allTasks.filter(t => 
          t.status === 'Done' && 
          t.completedAt && 
          isToday(new Date(t.completedAt))
        );
        const overdue = allTasks.filter(t => 
          t.status !== 'Done' && 
          isPast(new Date(t.dueDate)) && 
          !isToday(new Date(t.dueDate))
        );
        const todayPending = allTasks.filter(t => 
          t.status !== 'Done' && 
          isToday(new Date(t.dueDate))
        );
        const tomorrow = allTasks.filter(t => 
          t.status !== 'Done' && 
          isTomorrow(new Date(t.dueDate))
        );

        const summary: UserTaskSummary = {
          userId: userDoc.id,
          userName: user.name || user.email.split('@')[0],
          userEmail: user.email,
          overdueTasks: overdue,
          todayTasks: todayPending,
          tomorrowTasks: tomorrow,
          completedToday,
        };

        const subject = `🌙 Day Summary: ${completedToday.length} done, ${overdue.length + todayPending.length} pending`;
        const html = generateEndOfDayHTML(summary.userName, summary, companyName);

        const sendResult = await sendReminderEmail(user.email, summary.userName, subject, html, companyId);
        if (sendResult.success) result.emailsSent++;
        else result.errors.push(`${user.email}: ${sendResult.error}`);
      }
    }

    await markAsSent('endOfDay', today, result.emailsSent);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * LEGACY: Process all task reminders (for backward compatibility)
 * Now just calls morning digest
 */
export async function processAllTaskReminders() {
  return processMorningDigest();
}

// Export for manager summary (keep existing)
export async function sendManagerTaskSummary(companyId: string): Promise<TaskReminderResult> {
  // Simplified - just return success, managers get same emails as users
  return { success: true };
}
