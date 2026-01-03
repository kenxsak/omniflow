/**
 * Task Reminders Cron Job - DEPRECATED
 * 
 * This endpoint is deprecated. Use /api/cron/run-all instead.
 * It now redirects to the unified daily digest system which:
 * - Sends ONE morning email (8 AM) with tasks + appointments
 * - Sends ONE end-of-day email (6 PM) with summary
 * - Sends 1-hour before reminders to staff AND clients
 * - Has duplicate prevention (won't spam)
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { processMorningDigest, processEndOfDayDigest, processHourBeforeReminders } from '@/lib/daily-digest';

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
    
    console.log('[CRON] Task reminders endpoint called - using unified daily digest');
    
    const currentHour = new Date().getHours();
    const results: any = {
      morning: { skipped: true },
      hourBefore: { skipped: true },
      endOfDay: { skipped: true },
    };
    
    // Morning Digest - 8 AM window (7-9 AM)
    // Has built-in duplicate prevention - won't send twice in same day
    if (currentHour >= 7 && currentHour <= 9) {
      const morningResult = await processMorningDigest();
      results.morning = {
        emailsSent: morningResult.emailsSent,
        companies: morningResult.companiesProcessed,
        errors: morningResult.errors.length,
      };
    }
    
    // 1-Hour Before Reminders - always runs
    // Has built-in duplicate prevention per task/appointment
    const hourBeforeResult = await processHourBeforeReminders();
    results.hourBefore = {
      staffEmailsSent: hourBeforeResult.staffEmailsSent,
      clientEmailsSent: hourBeforeResult.clientEmailsSent,
      errors: hourBeforeResult.errors.length,
    };
    
    // End of Day Report - 6 PM window (5-7 PM)
    // Has built-in duplicate prevention - won't send twice in same day
    if (currentHour >= 17 && currentHour <= 19) {
      const endOfDayResult = await processEndOfDayDigest();
      results.endOfDay = {
        emailsSent: endOfDayResult.emailsSent,
        companies: endOfDayResult.companiesProcessed,
        errors: endOfDayResult.errors.length,
      };
    }
    
    console.log('[CRON] Daily digest processing complete:', results);
    
    return NextResponse.json({
      success: true,
      message: 'Daily digest processed (this endpoint is deprecated, use /api/cron/run-all)',
      deprecated: true,
      stats: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error processing daily digest:', error);
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
