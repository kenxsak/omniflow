import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Data Cleanup Cron Job
 * 
 * PURPOSE: Keep Firebase costs low by auto-deleting SYSTEM data only
 * 
 * COST-EFFICIENT STRATEGY (Industry Best Practices):
 * 
 * ✅ AUTO-DELETE (System/Temporary Data):
 * - Chat Sessions: Keep last 20 per user (not time-based)
 * - Notifications: 7 days (they've seen them)
 * - AI Usage Logs: 30 days (for billing disputes)
 * - Audit Logs: 90 days (compliance)
 * - Scheduled Posts: 30 days after posted/failed
 * - Workflow Run Logs: 14 days
 * 
 * ❌ NEVER AUTO-DELETE (User Content):
 * - Content Hub (socialPosts): Users paid AI credits for this!
 * - CRM Leads, Appointments, Transactions: Critical business data
 * - Landing Pages, Blog Posts: User-created content
 * 
 * Plan-based limits control user content quantity (already implemented)
 * 
 * RUN: Daily via cron at 2-4 AM
 * URL: /api/cron/cleanup-old-data
 */

// Retention periods for SYSTEM data only
const RETENTION_DAYS = {
  notifications: 7,
  aiUsageLogs: 30,
  auditLogs: 90,
  scheduledPosts: 30, // After posted/failed
  workflowRunLogs: 14,
};

// Max items per user for SYSTEM data
const MAX_ITEMS_PER_USER = {
  chatSessions: 20, // Keep last 20 conversations
  notifications: 100,
};

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const results: Record<string, number> = {};

    // NOTE: Content Hub (socialPosts) is NOT auto-deleted
    // Users paid AI credits for this content - plan limits control quantity
    // They can manually delete what they don't need

    // 1. Clean up old Chat Sessions - Keep last N per user (not time-based)
    // This preserves recent conversations while limiting storage
    let chatsDeleted = 0;
    const companiesSnapshot = await adminDb.collection('companies').limit(100).get();
    
    for (const companyDoc of companiesSnapshot.docs) {
      // Get all users with chat sessions
      const sessionsSnapshot = await companyDoc.ref
        .collection('chatSessions')
        .orderBy('updatedAt', 'desc')
        .get();
      
      // Group by userId and keep only last N
      const sessionsByUser: Record<string, any[]> = {};
      sessionsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId || 'unknown';
        if (!sessionsByUser[userId]) sessionsByUser[userId] = [];
        sessionsByUser[userId].push(doc);
      });
      
      // Delete sessions beyond the limit for each user
      for (const [, sessions] of Object.entries(sessionsByUser)) {
        if (sessions.length > MAX_ITEMS_PER_USER.chatSessions) {
          const toDelete = sessions.slice(MAX_ITEMS_PER_USER.chatSessions);
          for (const sessionDoc of toDelete) {
            // Delete messages subcollection first
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

    // 2. Clean up old Notifications (7 days)
    const notifCutoff = new Date();
    notifCutoff.setDate(notifCutoff.getDate() - RETENTION_DAYS.notifications);
    
    const oldNotifications = await adminDb
      .collectionGroup('notifications')
      .where('createdAt', '<', Timestamp.fromDate(notifCutoff))
      .limit(500)
      .get();
    
    let notifsDeleted = 0;
    const notifBatch = adminDb.batch();
    oldNotifications.docs.forEach(doc => {
      notifBatch.delete(doc.ref);
      notifsDeleted++;
    });
    if (notifsDeleted > 0) await notifBatch.commit();
    results.notifications = notifsDeleted;

    // 4. Clean up old AI Usage Logs (30 days)
    const aiLogsCutoff = new Date();
    aiLogsCutoff.setDate(aiLogsCutoff.getDate() - RETENTION_DAYS.aiUsageLogs);
    
    const oldAiLogs = await adminDb
      .collectionGroup('aiUsage')
      .where('timestamp', '<', Timestamp.fromDate(aiLogsCutoff))
      .limit(500)
      .get();
    
    let aiLogsDeleted = 0;
    const aiLogsBatch = adminDb.batch();
    oldAiLogs.docs.forEach(doc => {
      aiLogsBatch.delete(doc.ref);
      aiLogsDeleted++;
    });
    if (aiLogsDeleted > 0) await aiLogsBatch.commit();
    results.aiUsageLogs = aiLogsDeleted;

    // 5. Clean up old Audit Logs (90 days)
    const auditCutoff = new Date();
    auditCutoff.setDate(auditCutoff.getDate() - RETENTION_DAYS.auditLogs);
    
    const oldAuditLogs = await adminDb
      .collectionGroup('auditLogs')
      .where('timestamp', '<', Timestamp.fromDate(auditCutoff))
      .limit(500)
      .get();
    
    let auditDeleted = 0;
    const auditBatch = adminDb.batch();
    oldAuditLogs.docs.forEach(doc => {
      auditBatch.delete(doc.ref);
      auditDeleted++;
    });
    if (auditDeleted > 0) await auditBatch.commit();
    results.auditLogs = auditDeleted;

    // 6. Clean up old scheduled posts that are done (30 days after posted)
    const scheduledCutoff = new Date();
    scheduledCutoff.setDate(scheduledCutoff.getDate() - RETENTION_DAYS.scheduledPosts);
    
    const oldScheduledPosts = await adminDb
      .collectionGroup('scheduledPosts')
      .where('status', 'in', ['Posted', 'Failed'])
      .where('updatedAt', '<', Timestamp.fromDate(scheduledCutoff))
      .limit(500)
      .get();
    
    let scheduledDeleted = 0;
    const scheduledBatch = adminDb.batch();
    oldScheduledPosts.docs.forEach(doc => {
      scheduledBatch.delete(doc.ref);
      scheduledDeleted++;
    });
    if (scheduledDeleted > 0) await scheduledBatch.commit();
    results.scheduledPosts = scheduledDeleted;

    // 7. Clean up old Workflow Run Logs (14 days)
    const workflowLogsCutoff = new Date();
    workflowLogsCutoff.setDate(workflowLogsCutoff.getDate() - RETENTION_DAYS.workflowRunLogs);
    
    const oldWorkflowLogs = await adminDb
      .collectionGroup('workflowRunLogs')
      .where('executedAt', '<', Timestamp.fromDate(workflowLogsCutoff))
      .limit(500)
      .get();
    
    let workflowLogsDeleted = 0;
    const workflowLogsBatch = adminDb.batch();
    oldWorkflowLogs.docs.forEach(doc => {
      workflowLogsBatch.delete(doc.ref);
      workflowLogsDeleted++;
    });
    if (workflowLogsDeleted > 0) await workflowLogsBatch.commit();
    results.workflowRunLogs = workflowLogsDeleted;

    const totalDeleted = Object.values(results).reduce((a, b) => a + b, 0);

    console.log('[Data Cleanup] Completed:', results);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${totalDeleted} old records`,
      details: results,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Data Cleanup] Error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
