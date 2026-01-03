'use server';

import 'server-only';
import { adminDb } from '@/lib/firebase-admin';
import { format, isToday, isTomorrow, isPast, differenceInMinutes, parseISO } from 'date-fns';
import { decryptApiKeyServerSide, isEncrypted } from '@/lib/encryption-server';
import { sendTransactionalEmail } from '@/services/brevo';
import { sendEmailSMTP, type SMTPConfig } from '@/lib/smtp-client';
import type { Task } from '@/types/task';
import type { Appointment } from '@/types/appointments';
import type { StoredApiKeys } from '@/types/integrations';

// ============================================
// TYPES
// ============================================

type DigestType = 'morning' | 'endOfDay';

interface DailySummary {
  tasks: {
    overdue: Task[];
    today: Task[];
    completed: Task[];
    tomorrow: Task[];
  };
  appointments: {
    today: Appointment[];
    tomorrow: Appointment[];
    completed: Appointment[];
  };
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
// HELPERS
// ============================================

async function getCompanyApiKeys(companyId: string): Promise<CompanyApiKeys> {
  if (!adminDb) return {};
  try {
    const doc = await adminDb.collection('companies').doc(companyId).get();
    if (!doc.exists) return {};
    const storedKeys = (doc.data()?.apiKeys || {}) as StoredApiKeys;
    const decrypted: CompanyApiKeys = {};

    for (const [serviceId, serviceKeys] of Object.entries(storedKeys)) {
      if (!serviceKeys || typeof serviceKeys !== 'object') continue;
      if (serviceId !== 'brevo' && serviceId !== 'smtp') continue;
      const decryptedService: Record<string, string> = {};
      for (const [fieldId, value] of Object.entries(serviceKeys as Record<string, any>)) {
        if (value === null || value === undefined) { decryptedService[fieldId] = ''; continue; }
        try {
          decryptedService[fieldId] = isEncrypted(value) ? decryptApiKeyServerSide(value) : String(value);
        } catch { decryptedService[fieldId] = ''; }
      }
      (decrypted as any)[serviceId] = decryptedService;
    }
    return decrypted;
  } catch { return {}; }
}

async function getCompanyName(companyId: string): Promise<string> {
  if (!adminDb) return 'Our Business';
  try {
    const doc = await adminDb.collection('companies').doc(companyId).get();
    return doc.data()?.name || 'Our Business';
  } catch { return 'Our Business'; }
}

async function hasAlreadySent(type: DigestType, date: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const doc = await adminDb.collection('cronState').doc(`dailyDigest_${type}`).get();
    return doc.data()?.lastRunDate === date;
  } catch { return false; }
}

async function markAsSent(type: DigestType, date: string, count: number): Promise<void> {
  if (!adminDb) return;
  try {
    await adminDb.collection('cronState').doc(`dailyDigest_${type}`).set({
      lastRunDate: date,
      lastRunTime: new Date().toISOString(),
      emailsSent: count,
    });
  } catch (e) { console.error(`[DailyDigest] Failed to mark ${type} as sent:`, e); }
}

async function sendEmail(to: string, toName: string, subject: string, html: string, companyId: string): Promise<boolean> {
  try {
    const apiKeys = await getCompanyApiKeys(companyId);
    const companyName = await getCompanyName(companyId);
    
    if (apiKeys.brevo?.apiKey) {
      const result = await sendTransactionalEmail(
        apiKeys.brevo.apiKey,
        apiKeys.brevo.senderEmail || 'noreply@omniflow.com',
        apiKeys.brevo.senderName || companyName,
        to, toName, subject, html
      );
      if (result.success) return true;
    }
    
    if (apiKeys.smtp?.host && apiKeys.smtp?.username && apiKeys.smtp?.password) {
      const config: SMTPConfig = {
        host: apiKeys.smtp.host,
        port: apiKeys.smtp.port || '587',
        username: apiKeys.smtp.username,
        password: apiKeys.smtp.password,
        fromEmail: apiKeys.smtp.fromEmail || apiKeys.smtp.username,
        fromName: apiKeys.smtp.fromName || companyName,
      };
      const result = await sendEmailSMTP(config, { to, subject, html });
      return result.success;
    }
    return false;
  } catch { return false; }
}


// ============================================
// EMAIL TEMPLATES
// ============================================

function generateMorningDigestHTML(userName: string, summary: DailySummary, companyName: string): string {
  const taskCount = summary.tasks.overdue.length + summary.tasks.today.length;
  const apptCount = summary.appointments.today.length;
  
  const taskSection = taskCount > 0 ? `
    <div style="margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:15px;font-weight:600;">📋 Tasks (${taskCount})</h3>
      ${summary.tasks.overdue.length > 0 ? `
        <div style="background:#fef2f2;border-radius:8px;padding:12px;margin-bottom:8px;">
          <div style="color:#dc2626;font-size:12px;font-weight:600;margin-bottom:8px;">🚨 OVERDUE</div>
          ${summary.tasks.overdue.slice(0,5).map(t => `<div style="padding:6px 0;border-bottom:1px solid #fecaca;font-size:13px;">${t.title}${t.priority === 'High' ? ' 🔴' : ''}</div>`).join('')}
        </div>
      ` : ''}
      ${summary.tasks.today.length > 0 ? `
        <div style="background:#fffbeb;border-radius:8px;padding:12px;">
          <div style="color:#f59e0b;font-size:12px;font-weight:600;margin-bottom:8px;">TODAY</div>
          ${summary.tasks.today.slice(0,5).map(t => `<div style="padding:6px 0;border-bottom:1px solid #fde68a;font-size:13px;">${t.title}${t.dueTime ? ` ⏰ ${t.dueTime}` : ''}${t.priority === 'High' ? ' 🔴' : ''}</div>`).join('')}
        </div>
      ` : ''}
    </div>
  ` : '';

  const apptSection = apptCount > 0 ? `
    <div style="margin-bottom:20px;">
      <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:15px;font-weight:600;">📅 Appointments Today (${apptCount})</h3>
      <div style="background:#eff6ff;border-radius:8px;padding:12px;">
        ${summary.appointments.today.slice(0,5).map(a => `
          <div style="padding:8px 0;border-bottom:1px solid #bfdbfe;">
            <div style="font-size:14px;font-weight:500;">${a.title}</div>
            <div style="font-size:12px;color:#6b7280;">⏰ ${format(parseISO(a.startTime), 'h:mm a')} • ${a.clientName}${a.location ? ` • 📍 ${a.location}` : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:520px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">☀️ Good Morning, ${userName}!</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
</td></tr>
<tr><td style="padding:24px 28px;">
${taskCount === 0 && apptCount === 0 ? '<p style="text-align:center;color:#6b7280;font-size:14px;">🎉 Your day is clear! No tasks or appointments scheduled.</p>' : ''}
${taskSection}
${apptSection}
<div style="text-align:center;margin-top:20px;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/dashboard" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Open Dashboard →</a>
</div>
</td></tr>
<tr><td style="padding:16px 28px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}

function generateEndOfDayHTML(userName: string, summary: DailySummary, companyName: string): string {
  const tasksCompleted = summary.tasks.completed.length;
  const tasksPending = summary.tasks.overdue.length + summary.tasks.today.length;
  const tasksTomorrow = summary.tasks.tomorrow.length;
  const apptsCompleted = summary.appointments.completed.length;
  const apptsTomorrow = summary.appointments.tomorrow.length;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:520px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">🌙 End of Day Report</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px;">${format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 20px;color:#4a5568;font-size:15px;">Hi <strong>${userName}</strong>, here's your day summary:</p>

<div style="margin-bottom:20px;">
<h3 style="margin:0 0 12px;color:#1a1a1a;font-size:15px;font-weight:600;">📋 Tasks</h3>
<table style="width:100%;border-collapse:collapse;">
<tr>
<td style="background:#dcfce7;border-radius:8px;padding:16px;text-align:center;width:33%;">
<div style="font-size:24px;font-weight:700;color:#16a34a;">${tasksCompleted}</div>
<div style="font-size:11px;color:#166534;">Completed</div>
</td>
<td style="width:8px;"></td>
<td style="background:#fef3c7;border-radius:8px;padding:16px;text-align:center;width:33%;">
<div style="font-size:24px;font-weight:700;color:#d97706;">${tasksPending}</div>
<div style="font-size:11px;color:#92400e;">Pending</div>
</td>
<td style="width:8px;"></td>
<td style="background:#dbeafe;border-radius:8px;padding:16px;text-align:center;width:33%;">
<div style="font-size:24px;font-weight:700;color:#2563eb;">${tasksTomorrow}</div>
<div style="font-size:11px;color:#1e40af;">Tomorrow</div>
</td>
</tr>
</table>
</div>

<div style="margin-bottom:20px;">
<h3 style="margin:0 0 12px;color:#1a1a1a;font-size:15px;font-weight:600;">📅 Appointments</h3>
<table style="width:100%;border-collapse:collapse;">
<tr>
<td style="background:#dcfce7;border-radius:8px;padding:16px;text-align:center;width:50%;">
<div style="font-size:24px;font-weight:700;color:#16a34a;">${apptsCompleted}</div>
<div style="font-size:11px;color:#166534;">Completed Today</div>
</td>
<td style="width:8px;"></td>
<td style="background:#dbeafe;border-radius:8px;padding:16px;text-align:center;width:50%;">
<div style="font-size:24px;font-weight:700;color:#2563eb;">${apptsTomorrow}</div>
<div style="font-size:11px;color:#1e40af;">Tomorrow</div>
</td>
</tr>
</table>
</div>

${tasksPending > 0 ? `<p style="margin:0;color:#718096;font-size:13px;text-align:center;">You have ${tasksPending} task${tasksPending !== 1 ? 's' : ''} to carry forward.</p>` : `<p style="margin:0;color:#16a34a;font-size:13px;text-align:center;">🎉 Great job! All tasks completed!</p>`}

${apptsTomorrow > 0 ? `
<div style="margin-top:16px;background:#eff6ff;border-radius:8px;padding:12px;">
<div style="color:#2563eb;font-size:12px;font-weight:600;margin-bottom:8px;">TOMORROW'S APPOINTMENTS</div>
${summary.appointments.tomorrow.slice(0,3).map(a => `<div style="padding:6px 0;border-bottom:1px solid #bfdbfe;font-size:13px;">${a.title} • ${format(parseISO(a.startTime), 'h:mm a')} • ${a.clientName}</div>`).join('')}
</div>
` : ''}

<div style="text-align:center;margin-top:20px;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/dashboard" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Dashboard →</a>
</div>
</td></tr>
<tr><td style="padding:16px 28px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}

/**
 * Client reminder email - sent 1 hour before appointment
 * This goes to the CLIENT/CONTACT, not staff
 */
function generateClientReminderHTML(appointment: Appointment, companyName: string): string {
  const startTime = parseISO(appointment.startTime);
  const date = format(startTime, 'EEEE, MMMM d, yyyy');
  const time = format(startTime, 'h:mm a');

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:520px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">⏰ Appointment in 1 Hour</h1>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 16px;color:#4a5568;font-size:15px;">Hi <strong>${appointment.clientName}</strong>,</p>
<p style="margin:0 0 20px;color:#4a5568;font-size:14px;">This is a friendly reminder about your upcoming appointment:</p>

<div style="background:#fffbeb;border-radius:8px;padding:16px;margin-bottom:16px;">
<h3 style="margin:0 0 12px;color:#1a1a1a;font-size:16px;font-weight:600;">${appointment.title}</h3>
<p style="margin:0 0 6px;color:#4a5568;font-size:14px;">📆 <strong>${date}</strong></p>
<p style="margin:0 0 6px;color:#4a5568;font-size:14px;">⏰ <strong>${time}</strong></p>
${appointment.location ? `<p style="margin:0 0 6px;color:#4a5568;font-size:14px;">📍 ${appointment.location}</p>` : ''}
${appointment.duration ? `<p style="margin:0;color:#718096;font-size:13px;">Duration: ${appointment.duration} minutes</p>` : ''}
</div>

${appointment.meetingLink ? `
<div style="text-align:center;margin-bottom:16px;">
<a href="${appointment.meetingLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Join Meeting →</a>
</div>
` : ''}

${appointment.description ? `<p style="margin:0 0 16px;color:#718096;font-size:13px;"><strong>Notes:</strong> ${appointment.description}</p>` : ''}

<p style="margin:0;color:#718096;font-size:13px;text-align:center;">If you need to reschedule, please contact us as soon as possible.</p>
</td></tr>
<tr><td style="padding:16px 28px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}

/**
 * Staff reminder email - sent 1 hour before appointment/task
 */
function generateStaffHourReminderHTML(
  userName: string,
  item: { type: 'task' | 'appointment'; task?: Task; appointment?: Appointment },
  companyName: string
): string {
  if (item.type === 'task' && item.task) {
    const task = item.task;
    return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:520px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">⏰ Task Due in 1 Hour</h1>
</td></tr>
<tr><td style="padding:24px 28px;">
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
<tr><td style="padding:16px 28px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
  }

  if (item.type === 'appointment' && item.appointment) {
    const appt = item.appointment;
    const startTime = parseISO(appt.startTime);
    return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;">
<table style="width:100%"><tr><td align="center" style="padding:30px 15px;">
<table style="max-width:520px;width:100%;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
<tr><td style="padding:24px 28px 16px;text-align:center;background:linear-gradient(135deg,#f59e0b,#ef4444);border-radius:12px 12px 0 0;">
<h1 style="margin:0;color:#fff;font-size:20px;">⏰ Appointment in 1 Hour</h1>
</td></tr>
<tr><td style="padding:24px 28px;">
<p style="margin:0 0 16px;color:#4a5568;font-size:15px;">Hi <strong>${userName}</strong>,</p>
<div style="background:#fffbeb;border-radius:8px;padding:16px;margin-bottom:16px;">
<h3 style="margin:0 0 8px;color:#1a1a1a;font-size:16px;">${appt.title}</h3>
<p style="margin:0 0 6px;color:#4a5568;font-size:14px;">⏰ ${format(startTime, 'h:mm a')}</p>
<p style="margin:0 0 6px;color:#4a5568;font-size:14px;">👤 ${appt.clientName} (${appt.clientEmail})</p>
${appt.location ? `<p style="margin:0;color:#718096;font-size:13px;">📍 ${appt.location}</p>` : ''}
</div>
${appt.meetingLink ? `
<div style="text-align:center;">
<a href="${appt.meetingLink}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">Join Meeting →</a>
</div>
` : `
<div style="text-align:center;">
<a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.omniflow.com'}/appointments" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View Appointment →</a>
</div>
`}
</td></tr>
<tr><td style="padding:16px 28px;background:#f7fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;">
<p style="margin:0;color:#718096;font-size:12px;text-align:center;">${companyName}</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
  }

  return '';
}


// ============================================
// MAIN PROCESSING FUNCTIONS
// ============================================

/**
 * MORNING DIGEST - Runs once at 8 AM
 * Sends ONE combined email with tasks + appointments for the day
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
    console.log('[DailyDigest] Morning digest already sent today');
    return result;
  }

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      // Fetch tasks
      const tasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['To Do', 'In Progress'])
        .get();
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];

      // Fetch appointments for today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const appointmentsSnapshot = await adminDb
        .collection('appointments')
        .where('companyId', '==', companyId)
        .where('status', '==', 'scheduled')
        .get();
      
      const allAppointments = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: typeof data.startTime === 'string' ? data.startTime : data.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Appointment;
      });

      const todayAppointments = allAppointments.filter(a => {
        const apptDate = parseISO(a.startTime);
        return isToday(apptDate);
      });

      // Get users
      const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();
      const companyName = await getCompanyName(companyId);

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (!user.email) continue;
        if (user.notificationPreferences?.email_task_reminder === false) continue;

        const overdueTasks = tasks.filter(t => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
        const todayTasks = tasks.filter(t => isToday(new Date(t.dueDate)));

        // Skip if nothing to report
        if (overdueTasks.length === 0 && todayTasks.length === 0 && todayAppointments.length === 0) continue;

        const summary: DailySummary = {
          tasks: {
            overdue: overdueTasks,
            today: todayTasks,
            completed: [],
            tomorrow: [],
          },
          appointments: {
            today: todayAppointments,
            tomorrow: [],
            completed: [],
          },
        };

        const totalItems = overdueTasks.length + todayTasks.length + todayAppointments.length;
        const subject = `☀️ Morning: ${totalItems} item${totalItems !== 1 ? 's' : ''} for today`;
        const html = generateMorningDigestHTML(user.name || user.email.split('@')[0], summary, companyName);

        const sent = await sendEmail(user.email, user.name || '', subject, html, companyId);
        if (sent) result.emailsSent++;
        else result.errors.push(`Failed to send to ${user.email}`);
      }
    }

    await markAsSent('morning', today, result.emailsSent);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * END OF DAY DIGEST - Runs once at 6 PM
 * Sends ONE combined email with day summary + tomorrow preview
 */
export async function processEndOfDayDigest(): Promise<{
  companiesProcessed: number;
  emailsSent: number;
  errors: string[];
}> {
  const result = { companiesProcessed: 0, emailsSent: 0, errors: [] as string[] };
  if (!adminDb) return result;

  const today = new Date().toISOString().split('T')[0];
  if (await hasAlreadySent('endOfDay', today)) {
    console.log('[DailyDigest] End of day digest already sent today');
    return result;
  }

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      // Fetch all tasks
      const tasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .get();
      const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];

      // Fetch appointments
      const appointmentsSnapshot = await adminDb
        .collection('appointments')
        .where('companyId', '==', companyId)
        .get();
      
      const allAppointments = appointmentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: typeof data.startTime === 'string' ? data.startTime : data.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Appointment;
      });

      // Get users
      const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();
      const companyName = await getCompanyName(companyId);

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();
        if (!user.email) continue;
        if (user.notificationPreferences?.email_task_reminder === false) continue;

        // Categorize tasks
        const completedTasks = allTasks.filter(t => 
          t.status === 'Done' && t.completedAt && isToday(new Date(t.completedAt))
        );
        const overdueTasks = allTasks.filter(t => 
          t.status !== 'Done' && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))
        );
        const todayPendingTasks = allTasks.filter(t => 
          t.status !== 'Done' && isToday(new Date(t.dueDate))
        );
        const tomorrowTasks = allTasks.filter(t => 
          t.status !== 'Done' && isTomorrow(new Date(t.dueDate))
        );

        // Categorize appointments
        const completedAppointments = allAppointments.filter(a => 
          a.status === 'completed' && isToday(parseISO(a.startTime))
        );
        const tomorrowAppointments = allAppointments.filter(a => 
          a.status === 'scheduled' && isTomorrow(parseISO(a.startTime))
        );

        const summary: DailySummary = {
          tasks: {
            overdue: overdueTasks,
            today: todayPendingTasks,
            completed: completedTasks,
            tomorrow: tomorrowTasks,
          },
          appointments: {
            today: [],
            tomorrow: tomorrowAppointments,
            completed: completedAppointments,
          },
        };

        const subject = `🌙 Day Summary: ${completedTasks.length} done, ${overdueTasks.length + todayPendingTasks.length} pending`;
        const html = generateEndOfDayHTML(user.name || user.email.split('@')[0], summary, companyName);

        const sent = await sendEmail(user.email, user.name || '', subject, html, companyId);
        if (sent) result.emailsSent++;
        else result.errors.push(`Failed to send to ${user.email}`);
      }
    }

    await markAsSent('endOfDay', today, result.emailsSent);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}

/**
 * 1-HOUR BEFORE REMINDERS - Runs every 5 minutes
 * Sends reminders to:
 * 1. STAFF - for tasks and appointments due in ~1 hour
 * 2. CLIENTS - for appointments in ~1 hour (like Calendly, HubSpot)
 */
export async function processHourBeforeReminders(): Promise<{
  staffEmailsSent: number;
  clientEmailsSent: number;
  errors: string[];
}> {
  const result = { staffEmailsSent: 0, clientEmailsSent: 0, errors: [] as string[] };
  if (!adminDb) return result;

  const now = new Date();

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      const companyName = await getCompanyName(companyId);

      // ========== TASK REMINDERS (Staff only) ==========
      const tasksSnapshot = await adminDb
        .collection('tasks')
        .where('companyId', '==', companyId)
        .where('status', 'in', ['To Do', 'In Progress'])
        .get();
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];

      for (const task of tasks) {
        if (!task.dueTime || !task.dueDate) continue;
        if (!isToday(new Date(task.dueDate))) continue;
        if (task.hourReminderSent) continue;

        // Parse due time
        const timeParts = task.dueTime.match(/(\d+):(\d+)/);
        if (!timeParts) continue;
        let hours = parseInt(timeParts[1], 10);
        const minutes = parseInt(timeParts[2], 10);
        
        // Handle AM/PM if present
        if (task.dueTime.toLowerCase().includes('pm') && hours < 12) hours += 12;
        if (task.dueTime.toLowerCase().includes('am') && hours === 12) hours = 0;

        const dueDateTime = new Date(task.dueDate);
        dueDateTime.setHours(hours, minutes, 0, 0);

        const minutesUntilDue = differenceInMinutes(dueDateTime, now);

        // Send if due in 55-65 minutes
        if (minutesUntilDue >= 55 && minutesUntilDue <= 65) {
          const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();

          for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            if (!user.email) continue;
            if (user.notificationPreferences?.email_task_reminder === false) continue;
            if (task.assignedTo && task.assignedTo !== userDoc.id) continue;

            const subject = `⏰ Task due in 1 hour: ${task.title}`;
            const html = generateStaffHourReminderHTML(user.name || user.email.split('@')[0], { type: 'task', task }, companyName);

            const sent = await sendEmail(user.email, user.name || '', subject, html, companyId);
            if (sent) result.staffEmailsSent++;
            else result.errors.push(`Task reminder failed: ${user.email}`);
          }

          // Mark task as reminded
          await adminDb.collection('tasks').doc(task.id).update({ hourReminderSent: true });
        }
      }

      // ========== APPOINTMENT REMINDERS (Staff + Clients) ==========
      const appointmentsSnapshot = await adminDb
        .collection('appointments')
        .where('companyId', '==', companyId)
        .where('status', '==', 'scheduled')
        .get();

      for (const apptDoc of appointmentsSnapshot.docs) {
        const data = apptDoc.data();
        const appointment: Appointment = {
          id: apptDoc.id,
          ...data,
          startTime: typeof data.startTime === 'string' ? data.startTime : data.startTime?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as Appointment;

        if (!isToday(parseISO(appointment.startTime))) continue;

        // Check if already sent 1-hour reminder
        const reminderKey = `hourReminder_${appointment.id}`;
        const reminderDoc = await adminDb.collection('cronState').doc(reminderKey).get();
        if (reminderDoc.exists) continue;

        const apptTime = parseISO(appointment.startTime);
        const minutesUntilAppt = differenceInMinutes(apptTime, now);

        // Send if appointment in 55-65 minutes
        if (minutesUntilAppt >= 55 && minutesUntilAppt <= 65) {
          // 1. Send to STAFF
          const usersSnapshot = await adminDb.collection('users').where('companyId', '==', companyId).get();
          
          for (const userDoc of usersSnapshot.docs) {
            const user = userDoc.data();
            if (!user.email) continue;
            if (user.notificationPreferences?.email_task_reminder === false) continue;
            if (appointment.assignedTo && appointment.assignedTo !== userDoc.id) continue;

            const subject = `⏰ Appointment in 1 hour: ${appointment.title}`;
            const html = generateStaffHourReminderHTML(user.name || user.email.split('@')[0], { type: 'appointment', appointment }, companyName);

            const sent = await sendEmail(user.email, user.name || '', subject, html, companyId);
            if (sent) result.staffEmailsSent++;
            else result.errors.push(`Staff appt reminder failed: ${user.email}`);
          }

          // 2. Send to CLIENT (like Calendly, HubSpot do)
          if (appointment.clientEmail) {
            const subject = `⏰ Reminder: ${appointment.title} in 1 hour`;
            const html = generateClientReminderHTML(appointment, companyName);

            const sent = await sendEmail(appointment.clientEmail, appointment.clientName, subject, html, companyId);
            if (sent) result.clientEmailsSent++;
            else result.errors.push(`Client reminder failed: ${appointment.clientEmail}`);
          }

          // Mark as reminded
          await adminDb.collection('cronState').doc(reminderKey).set({
            sentAt: new Date().toISOString(),
            appointmentId: appointment.id,
          });
        }
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
  }

  return result;
}
