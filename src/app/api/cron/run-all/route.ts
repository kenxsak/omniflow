import { NextRequest, NextResponse } from 'next/server';
import { runAllAutomations } from '@/lib/automation-runner';
import { runAllCampaignJobs } from '@/lib/campaign-job-processor';
import { processScheduledPostsAction } from '@/app/actions/social-accounts-actions';
import { processScheduledReminders } from '@/lib/appointment-reminders';
import { processMorningDigest, processEndOfDayDigest, processHourBeforeReminders } from '@/lib/daily-digest';
import { generateRecurringInvoicesAction, processPaymentRemindersAction } from '@/app/actions/invoice-actions';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { executeWorkflowNode } from '@/lib/workflow-executor';
import type { Workflow, WorkflowExecutionState, DelayNode } from '@/types/workflows';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

// Data retention periods in days - SYSTEM data only
// NOTE: Content Hub (socialPosts) is NOT auto-deleted - users paid AI credits for it
const RETENTION_DAYS = {
  notifications: 7,
  aiUsageLogs: 30,
  auditLogs: 90,
  scheduledPosts: 30, // After posted/failed
  workflowRunLogs: 14,
};

// Max items per user for SYSTEM data
const MAX_CHAT_SESSIONS_PER_USER = 20;

/**
 * UNIFIED CRON ENDPOINT
 * 
 * Runs ALL automation tasks in a single API call:
 * 1. Email Automations (drip sequences)
 * 2. Campaign Jobs (bulk Email/SMS/WhatsApp)
 * 3. Workflow Builder automations
 * 4. Scheduled Social Media Posts
 * 5. Appointment Reminders (Email/SMS/WhatsApp)
 * 6. Task Reminders (Daily digest emails)
 * 
 * This reduces the need for multiple cron jobs to just ONE.
 * Set up a single cron job to call this endpoint every 2-5 minutes.
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: 0,
    automations: { success: false, error: null as string | null, details: null as any },
    campaigns: { success: false, error: null as string | null, details: null as any },
    workflows: { success: false, error: null as string | null, details: null as any },
    socialPosts: { success: false, error: null as string | null, details: null as any },
    appointmentReminders: { success: false, error: null as string | null, details: null as any },
    taskReminders: { success: false, error: null as string | null, details: null as any },
    recurringInvoices: { success: false, error: null as string | null, details: null as any },
    paymentReminders: { success: false, error: null as string | null, details: null as any },
    dataCleanup: { success: false, error: null as string | null, details: null as any },
  };

  // 1. Run Email Automations
  try {
    const automationResult = await runAllAutomations();
    results.automations = {
      success: automationResult.success,
      error: null,
      details: automationResult,
    };
  } catch (error: any) {
    console.error('[Cron] Email automations error:', error);
    results.automations = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 2. Run Campaign Jobs (Bulk Email/SMS/WhatsApp)
  try {
    const campaignResult = await runAllCampaignJobs();
    results.campaigns = {
      success: campaignResult.success,
      error: null,
      details: campaignResult,
    };
  } catch (error: any) {
    console.error('[Cron] Campaign jobs error:', error);
    results.campaigns = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 3. Run Workflow Builder Automations
  try {
    const workflowResult = await processAllWorkflows();
    results.workflows = {
      success: true,
      error: null,
      details: workflowResult,
    };
  } catch (error: any) {
    console.error('[Cron] Workflow processing error:', error);
    results.workflows = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 4. Process Scheduled Social Media Posts
  try {
    const socialResult = await processScheduledPostsAction();
    results.socialPosts = {
      success: socialResult.success,
      error: socialResult.error || null,
      details: socialResult.data,
    };
  } catch (error: any) {
    console.error('[Cron] Social posts processing error:', error);
    results.socialPosts = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 5. Process Appointment Reminders (Email/SMS/WhatsApp)
  try {
    const appointmentResult = await processScheduledReminders();
    results.appointmentReminders = {
      success: appointmentResult.successful > 0 || appointmentResult.processed === 0,
      error: appointmentResult.errors.length > 0 ? appointmentResult.errors.join('; ') : null,
      details: {
        processed: appointmentResult.processed,
        successful: appointmentResult.successful,
        failed: appointmentResult.failed,
      },
    };
  } catch (error: any) {
    console.error('[Cron] Appointment reminders error:', error);
    results.appointmentReminders = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 6. Process Daily Digest (Tasks + Appointments combined) - 3 types:
  //    - Morning Digest: 8 AM (once daily) - Tasks + Appointments in ONE email
  //    - 1-Hour Before: Every run - Staff AND Clients get reminders
  //    - End of Day Report: 6 PM (once daily) - Summary + Tomorrow preview
  const currentHour = new Date().getHours();
  
  const taskReminderDetails: any = {
    morning: { skipped: true },
    hourBefore: { skipped: true },
    endOfDay: { skipped: true },
  };
  
  try {
    // Morning Digest - 8 AM window (7-9 AM to be safe)
    // Sends ONE combined email with tasks + appointments
    if (currentHour >= 7 && currentHour <= 9) {
      const morningResult = await processMorningDigest();
      taskReminderDetails.morning = {
        emailsSent: morningResult.emailsSent,
        companies: morningResult.companiesProcessed,
        errors: morningResult.errors.length,
      };
    }
    
    // 1-Hour Before Reminders - runs every time
    // Sends to STAFF (tasks + appointments) AND CLIENTS (appointments only)
    const hourBeforeResult = await processHourBeforeReminders();
    taskReminderDetails.hourBefore = {
      staffEmailsSent: hourBeforeResult.staffEmailsSent,
      clientEmailsSent: hourBeforeResult.clientEmailsSent,
      errors: hourBeforeResult.errors.length,
    };
    
    // End of Day Report - 6 PM window (5-7 PM to be safe)
    // Sends ONE combined summary email
    if (currentHour >= 17 && currentHour <= 19) {
      const endOfDayResult = await processEndOfDayDigest();
      taskReminderDetails.endOfDay = {
        emailsSent: endOfDayResult.emailsSent,
        companies: endOfDayResult.companiesProcessed,
        errors: endOfDayResult.errors.length,
      };
    }
    
    const totalEmails = 
      (taskReminderDetails.morning.emailsSent || 0) +
      (taskReminderDetails.hourBefore.staffEmailsSent || 0) +
      (taskReminderDetails.hourBefore.clientEmailsSent || 0) +
      (taskReminderDetails.endOfDay.emailsSent || 0);
    
    results.taskReminders = {
      success: true,
      error: null,
      details: taskReminderDetails,
    };
  } catch (error: any) {
    console.error('[Cron] Daily digest error:', error);
    results.taskReminders = {
      success: false,
      error: error.message,
      details: taskReminderDetails,
    };
  }

  // 7. Process Recurring Invoices (generate invoices from templates)
  // Run once daily at 6 AM
  if (currentHour >= 5 && currentHour <= 7) {
    const todayRecurring = new Date().toISOString().split('T')[0];
    let alreadyProcessedRecurring = false;
    
    if (adminDb) {
      try {
        const recurringStateDoc = await adminDb.collection('cronState').doc('recurringInvoices').get();
        if (recurringStateDoc.data()?.lastRunDate === todayRecurring) {
          alreadyProcessedRecurring = true;
        }
      } catch (e) {
        console.warn('[Cron] Could not check recurring invoices state:', e);
      }
    }
    
    if (alreadyProcessedRecurring) {
      results.recurringInvoices = {
        success: true,
        error: null,
        details: { skipped: true, reason: 'Already processed today' },
      };
    } else {
      try {
        const recurringResult = await generateRecurringInvoicesAction();
        
        if (adminDb) {
          await adminDb.collection('cronState').doc('recurringInvoices').set({
            lastRunDate: todayRecurring,
            lastRunTime: new Date().toISOString(),
            generated: recurringResult.generated,
          });
        }
        
        results.recurringInvoices = {
          success: recurringResult.success,
          error: recurringResult.errors.length > 0 ? recurringResult.errors.join('; ') : null,
          details: { generated: recurringResult.generated },
        };
      } catch (error: any) {
        console.error('[Cron] Recurring invoices error:', error);
        results.recurringInvoices = {
          success: false,
          error: error.message,
          details: null,
        };
      }
    }
  } else {
    results.recurringInvoices = {
      success: true,
      error: null,
      details: { skipped: true, reason: 'Outside processing window (5-7 AM)' },
    };
  }

  // 8. Process Payment Reminders (send reminders for unpaid invoices)
  // Run once daily at 10 AM
  if (currentHour >= 9 && currentHour <= 11) {
    const todayReminders = new Date().toISOString().split('T')[0];
    let alreadyProcessedReminders = false;
    
    if (adminDb) {
      try {
        const reminderStateDoc = await adminDb.collection('cronState').doc('paymentReminders').get();
        if (reminderStateDoc.data()?.lastRunDate === todayReminders) {
          alreadyProcessedReminders = true;
        }
      } catch (e) {
        console.warn('[Cron] Could not check payment reminders state:', e);
      }
    }
    
    if (alreadyProcessedReminders) {
      results.paymentReminders = {
        success: true,
        error: null,
        details: { skipped: true, reason: 'Already processed today' },
      };
    } else {
      try {
        const reminderResult = await processPaymentRemindersAction();
        
        if (adminDb) {
          await adminDb.collection('cronState').doc('paymentReminders').set({
            lastRunDate: todayReminders,
            lastRunTime: new Date().toISOString(),
            remindersSent: reminderResult.remindersSent,
          });
        }
        
        results.paymentReminders = {
          success: reminderResult.success,
          error: reminderResult.errors.length > 0 ? reminderResult.errors.join('; ') : null,
          details: { remindersSent: reminderResult.remindersSent },
        };
      } catch (error: any) {
        console.error('[Cron] Payment reminders error:', error);
        results.paymentReminders = {
          success: false,
          error: error.message,
          details: null,
        };
      }
    }
  } else {
    results.paymentReminders = {
      success: true,
      error: null,
      details: { skipped: true, reason: 'Outside processing window (9-11 AM)' },
    };
  }

  // 9. Data Cleanup (run once daily at night - 2-4 AM)
  // Cleans up old temporary data to keep Firebase costs low
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  if (currentHour >= 2 && currentHour <= 4) {
    // Check if we already ran cleanup today
    let alreadyCleanedToday = false;
    
    if (adminDb) {
      try {
        const lastCleanupDoc = await adminDb.collection('cronState').doc('dataCleanup').get();
        const lastCleanupData = lastCleanupDoc.data();
        if (lastCleanupData?.lastRunDate === today) {
          alreadyCleanedToday = true;
        }
      } catch (e) {
        console.warn('[Cron] Could not check cleanup state:', e);
      }
    }
    
    if (alreadyCleanedToday) {
      results.dataCleanup = {
        success: true,
        error: null,
        details: { skipped: true, reason: 'Already ran cleanup today' },
      };
    } else {
      try {
        const cleanupResult = await runDataCleanup();
        
        // Mark as done for today
        if (adminDb) {
          await adminDb.collection('cronState').doc('dataCleanup').set({
            lastRunDate: today,
            lastRunTime: new Date().toISOString(),
            totalDeleted: cleanupResult.totalDeleted || 0,
          });
        }
        
        results.dataCleanup = {
          success: true,
          error: null,
          details: cleanupResult,
        };
      } catch (error: any) {
        console.error('[Cron] Data cleanup error:', error);
        results.dataCleanup = {
          success: false,
          error: error.message,
          details: null,
        };
      }
    }
  } else {
    results.dataCleanup = {
      success: true,
      error: null,
      details: { skipped: true, reason: 'Outside cleanup window (2-4 AM)' },
    };
  }

  results.duration = Date.now() - startTime;
  results.success = results.automations.success || results.campaigns.success || results.workflows.success || results.socialPosts.success || results.appointmentReminders.success;

  console.log(`[Cron] Unified job completed in ${results.duration}ms`);

  return NextResponse.json(results);
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Process all workflow automations across all companies
 */
async function processAllWorkflows() {
  if (!adminDb) {
    return { error: 'Database not initialized', companiesProcessed: 0 };
  }

  const result = {
    companiesProcessed: 0,
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [] as string[],
  };

  try {
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      try {
        const companyResult = await processWorkflowsForCompany(companyId);
        result.statesProcessed += companyResult.statesProcessed;
        result.nodesExecuted += companyResult.nodesExecuted;
        result.workflowsCompleted += companyResult.workflowsCompleted;
        result.errors.push(...companyResult.errors);
      } catch (error: any) {
        result.errors.push(`Company ${companyId}: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Global error: ${error.message}`);
  }

  return result;
}

async function processWorkflowsForCompany(companyId: string) {
  const result = {
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [] as string[],
  };

  if (!adminDb) return result;

  try {
    const now = Timestamp.now();
    
    const statesSnapshot = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('status', 'in', ['active', 'waiting'])
      .where('nextExecutionTime', '<=', now)
      .limit(50)
      .get();

    for (const stateDoc of statesSnapshot.docs) {
      const state = { id: stateDoc.id, ...stateDoc.data() } as WorkflowExecutionState;
      result.statesProcessed++;

      try {
        const workflowDoc = await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('workflows')
          .doc(state.workflowId)
          .get();

        if (!workflowDoc.exists) {
          await stateDoc.ref.update({ status: 'failed', lastError: 'Workflow not found' });
          continue;
        }

        const workflow = { id: workflowDoc.id, ...workflowDoc.data() } as Workflow;

        if (!workflow.isActive) {
          await stateDoc.ref.update({ status: 'paused' });
          continue;
        }

        const execResult = await executeWorkflowNode(workflow, state, companyId);
        result.nodesExecuted++;

        // Log execution
        await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('workflowRunLogs')
          .add({
            workflowId: workflow.id,
            executionStateId: state.id,
            companyId,
            nodeId: state.currentNodeId,
            nodeName: workflow.nodes.find(n => n.id === state.currentNodeId)?.name || 'Unknown',
            nodeType: workflow.nodes.find(n => n.id === state.currentNodeId)?.type || 'unknown',
            status: execResult.success ? 'success' : 'failed',
            message: execResult.message,
            error: execResult.error,
            executedAt: FieldValue.serverTimestamp(),
          });

        if (!execResult.success) {
          await stateDoc.ref.update({ status: 'failed', lastError: execResult.error });
          result.errors.push(`Workflow ${workflow.id}: ${execResult.error}`);
          continue;
        }

        if (!execResult.nextNodeId) {
          // Workflow complete
          await stateDoc.ref.update({
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
            nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
          });
          result.workflowsCompleted++;
          
          await workflowDoc.ref.update({
            'stats.totalRuns': FieldValue.increment(1),
            'stats.successfulRuns': FieldValue.increment(1),
            'stats.lastRunAt': new Date().toISOString(),
          });
          continue;
        }

        // Calculate next execution time
        let nextExecutionTime = Timestamp.now();
        const nextNode = workflow.nodes.find(n => n.id === execResult.nextNodeId);
        
        if (nextNode?.type === 'delay') {
          const delayNode = nextNode as DelayNode;
          const delayMs = 
            ((delayNode.config.delayMinutes || 0) * 60 * 1000) +
            ((delayNode.config.delayHours || 0) * 60 * 60 * 1000) +
            ((delayNode.config.delayDays || 0) * 24 * 60 * 60 * 1000);
          nextExecutionTime = Timestamp.fromMillis(Date.now() + delayMs);
        } else {
          nextExecutionTime = Timestamp.fromMillis(Date.now() + 1000);
        }

        await stateDoc.ref.update({
          currentNodeId: execResult.nextNodeId,
          status: nextNode?.type === 'delay' ? 'waiting' : 'active',
          nextExecutionTime,
          nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
        });

      } catch (stateError: any) {
        result.errors.push(`State ${state.id}: ${stateError.message}`);
        await stateDoc.ref.update({ status: 'failed', lastError: stateError.message });
      }
    }
  } catch (error: any) {
    result.errors.push(`Company ${companyId}: ${error.message}`);
  }

  return result;
}


/**
 * Data Cleanup - Keeps Firebase costs low
 * 
 * ONLY deletes SYSTEM/temporary data:
 * - Chat sessions: Keep last 20 per user (not time-based)
 * - Notifications: 7 days (they've seen them)
 * - Scheduled posts: 30 days after posted/failed
 * - Workflow run logs: 14 days
 * 
 * NEVER deletes USER CONTENT:
 * - Content Hub (socialPosts): Users paid AI credits for this!
 * - CRM leads, appointments, transactions: Critical business data
 * - Landing pages, blog posts: User-created content
 * 
 * Plan-based limits control user content quantity (already implemented)
 */
async function runDataCleanup() {
  if (!adminDb) {
    return { error: 'Database not initialized', totalDeleted: 0 };
  }

  const results: Record<string, number> = {};
  const now = Date.now();

  try {
    const companiesSnapshot = await adminDb.collection('companies').limit(100).get();

    // 1. Clean old chat sessions - Keep last N per user (not time-based)
    let chatsDeleted = 0;
    for (const companyDoc of companiesSnapshot.docs) {
      const sessionsSnapshot = await companyDoc.ref
        .collection('chatSessions')
        .orderBy('updatedAt', 'desc')
        .get();
      
      // Group by userId and keep only last N
      const sessionsByUser: Record<string, any[]> = {};
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const odUserId = data.userId || 'unknown';
        if (!sessionsByUser[odUserId]) sessionsByUser[odUserId] = [];
        sessionsByUser[odUserId].push(doc);
      });
      
      // Delete sessions beyond the limit for each user
      for (const [, sessions] of Object.entries(sessionsByUser)) {
        if (sessions.length > MAX_CHAT_SESSIONS_PER_USER) {
          const toDelete = sessions.slice(MAX_CHAT_SESSIONS_PER_USER);
          for (const sessionDoc of toDelete) {
            // Delete messages first
            const messages = await sessionDoc.ref.collection('messages').limit(100).get();
            const msgBatch = adminDb.batch();
            messages.docs.forEach((msg: any) => msgBatch.delete(msg.ref));
            if (messages.size > 0) await msgBatch.commit();
            
            await sessionDoc.ref.delete();
            chatsDeleted++;
          }
        }
      }
    }
    results.chatSessions = chatsDeleted;

    // 2. Clean old notifications - 7 days
    const notifCutoff = Timestamp.fromMillis(now - RETENTION_DAYS.notifications * 24 * 60 * 60 * 1000);
    let notifsDeleted = 0;
    
    for (const companyDoc of companiesSnapshot.docs) {
      const oldNotifs = await companyDoc.ref
        .collection('notifications')
        .where('createdAt', '<', notifCutoff)
        .limit(100)
        .get();
      
      const notifBatch = adminDb.batch();
      oldNotifs.docs.forEach(doc => {
        notifBatch.delete(doc.ref);
        notifsDeleted++;
      });
      if (oldNotifs.size > 0) await notifBatch.commit();
    }
    results.notifications = notifsDeleted;

    // 3. Clean old scheduled posts that are done - 30 days after posted
    const scheduledCutoff = Timestamp.fromMillis(now - RETENTION_DAYS.scheduledPosts * 24 * 60 * 60 * 1000);
    let scheduledDeleted = 0;
    
    for (const companyDoc of companiesSnapshot.docs) {
      const oldScheduled = await companyDoc.ref
        .collection('scheduledPosts')
        .where('status', 'in', ['Posted', 'Failed'])
        .where('updatedAt', '<', scheduledCutoff)
        .limit(50)
        .get();
      
      const scheduledBatch = adminDb.batch();
      oldScheduled.docs.forEach(doc => {
        scheduledBatch.delete(doc.ref);
        scheduledDeleted++;
      });
      if (oldScheduled.size > 0) await scheduledBatch.commit();
    }
    results.scheduledPosts = scheduledDeleted;

    // 4. Clean old workflow run logs - 14 days
    const workflowLogsCutoff = Timestamp.fromMillis(now - RETENTION_DAYS.workflowRunLogs * 24 * 60 * 60 * 1000);
    let workflowLogsDeleted = 0;
    
    for (const companyDoc of companiesSnapshot.docs) {
      const oldLogs = await companyDoc.ref
        .collection('workflowRunLogs')
        .where('executedAt', '<', workflowLogsCutoff)
        .limit(100)
        .get();
      
      const logsBatch = adminDb.batch();
      oldLogs.docs.forEach(doc => {
        logsBatch.delete(doc.ref);
        workflowLogsDeleted++;
      });
      if (oldLogs.size > 0) await logsBatch.commit();
    }
    results.workflowRunLogs = workflowLogsDeleted;

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);
    
    console.log(`[Data Cleanup] Deleted ${totalDeleted} old records:`, results);

    return {
      success: true,
      totalDeleted,
      details: results,
    };

  } catch (error: any) {
    console.error('[Data Cleanup] Error:', error);
    return {
      success: false,
      error: error.message,
      totalDeleted: 0,
    };
  }
}
