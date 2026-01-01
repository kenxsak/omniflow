/**
 * Task Reminders Cron Job
 * 
 * This API endpoint processes daily task reminders for all users.
 * It should be called by a cron job once daily (e.g., 8:00 AM).
 * 
 * Features:
 * - Sends email reminders for overdue tasks
 * - Sends reminders for tasks due today and tomorrow
 * - Highlights high-priority tasks
 * - Respects user notification preferences
 * - Sends manager summaries for team oversight
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { processAllTaskReminders } from '@/lib/task-reminders';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('[CRON] Starting daily task reminder processing...');
    
    const result = await processAllTaskReminders();
    
    console.log('[CRON] Task reminder processing complete:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Task reminders processed',
      stats: {
        companiesProcessed: result.companiesProcessed,
        usersNotified: result.totalUsersProcessed,
        emailsSent: result.totalEmailsSent,
        errors: result.errors.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error processing task reminders:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
