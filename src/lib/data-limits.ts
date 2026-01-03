/**
 * Data Limits & Cleanup Utilities
 * 
 * COST-EFFICIENT STRATEGY (Industry Best Practices):
 * 
 * 1. NEVER auto-delete user-generated content they paid for
 *    - Content Hub posts: Keep forever (plan limits control quantity)
 *    - Let users manually delete what they don't need
 * 
 * 2. Auto-delete SYSTEM-generated temporary data:
 *    - Chat sessions: Keep last N per user (not time-based)
 *    - Notifications: 7 days (they've seen them)
 *    - AI logs: 30 days (for billing disputes)
 *    - Audit logs: 90 days (compliance)
 * 
 * 3. External storage for heavy data:
 *    - Images: ImgBB (already doing ✅)
 *    - Videos: YouTube/external links
 *    - Files: User's own cloud storage
 * 
 * 4. Plan-based limits (already have ✅):
 *    - Free: 50 saved posts
 *    - Pro: 500 saved posts
 *    - Enterprise: Unlimited
 * 
 * HOW COMPETITORS DO IT:
 * - Canva: Keeps designs forever, limits by plan
 * - Buffer: Keeps posts forever, limits queue size
 * - HubSpot: Keeps all CRM data, charges by contacts
 * - Mailchimp: Keeps campaigns, charges by subscribers
 */

import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc,
  getCountFromServer
} from 'firebase/firestore';

// Per-user limits for SYSTEM data (not user content)
export const USER_DATA_LIMITS = {
  // Chat Sessions - keep last N, delete oldest
  chatSessions: {
    maxItems: 20, // Keep last 20 conversations
    deleteOldest: true, // Delete oldest when exceeded
    description: 'AI chat conversation history'
  },
  
  // Notifications - time-based cleanup
  notifications: {
    maxItems: 100,
    retentionDays: 7,
    description: 'System notifications'
  },
};

// USER CONTENT - controlled by PLAN LIMITS, not auto-delete
// These are managed by plan.maxSavedPosts in social-media-actions.ts
export const USER_CONTENT_COLLECTIONS = [
  'socialPosts',      // Content Hub - plan limits apply
  'landingPages',     // Landing pages - plan limits apply
  'blogPosts',        // Blog posts - plan limits apply
];

// CRITICAL DATA - NEVER delete
export const CRITICAL_DATA = [
  'leads',           // CRM leads - business critical
  'appointments',    // Scheduled meetings
  'transactions',    // Payment records
  'companies',       // Company profiles
  'users',           // User accounts
  'subscriptions',   // Billing data
  'socialPosts',     // User-generated content (plan-limited)
];

// SYSTEM DATA - safe to auto-cleanup
export const SYSTEM_DATA_RETENTION = {
  chatSessions: { days: null, maxPerUser: 20 }, // Keep last 20
  chatMessages: { days: null, maxPerUser: 20 }, // Tied to sessions
  notifications: { days: 7, maxPerUser: 100 },
  aiUsageLogs: { days: 30, maxPerUser: null }, // For billing
  auditLogs: { days: 90, maxPerUser: null }, // Compliance
  workflowRunLogs: { days: 14, maxPerUser: null }, // Debug logs
};

/**
 * Check if user has exceeded limit and delete oldest items if needed
 * Call this BEFORE adding new items to enforce limits
 */
export async function enforceUserLimit(
  companyId: string,
  userId: string,
  collectionName: keyof typeof USER_DATA_LIMITS,
  subcollectionPath?: string
): Promise<{ enforced: boolean; deleted: number }> {
  const limits = USER_DATA_LIMITS[collectionName];
  if (!limits || !db) return { enforced: false, deleted: 0 };

  try {
    // Build collection reference
    let collectionRef;
    if (subcollectionPath) {
      collectionRef = collection(db, subcollectionPath);
    } else {
      collectionRef = collection(db, 'companies', companyId, collectionName);
    }

    // Count current items
    const countQuery = query(collectionRef, where('userId', '==', userId));
    const countSnapshot = await getCountFromServer(countQuery);
    const currentCount = countSnapshot.data().count;

    // If under limit, no action needed
    if (currentCount < limits.maxItems) {
      return { enforced: false, deleted: 0 };
    }

    // Calculate how many to delete (delete 10% extra to avoid frequent cleanups)
    const toDelete = Math.ceil(limits.maxItems * 0.1) + (currentCount - limits.maxItems);

    // Get oldest items to delete
    const oldestQuery = query(
      collectionRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'asc'),
      limit(toDelete)
    );
    
    const oldestDocs = await getDocs(oldestQuery);
    
    // Delete oldest items
    let deleted = 0;
    for (const docSnapshot of oldestDocs.docs) {
      await deleteDoc(docSnapshot.ref);
      deleted++;
    }

    console.log(`[Data Limits] Enforced limit for ${collectionName}: deleted ${deleted} old items`);
    
    return { enforced: true, deleted };
  } catch (error) {
    console.error(`[Data Limits] Error enforcing limit for ${collectionName}:`, error);
    return { enforced: false, deleted: 0 };
  }
}

/**
 * Get user's current usage stats
 */
export async function getUserDataUsage(
  companyId: string,
  userId: string
): Promise<Record<string, { count: number; limit: number; percentage: number }>> {
  const usage: Record<string, { count: number; limit: number; percentage: number }> = {};

  if (!db) return usage;

  for (const [name, limits] of Object.entries(USER_DATA_LIMITS)) {
    try {
      const collectionRef = collection(db, 'companies', companyId, name);
      const countQuery = query(collectionRef, where('userId', '==', userId));
      const countSnapshot = await getCountFromServer(countQuery);
      const count = countSnapshot.data().count;
      
      usage[name] = {
        count,
        limit: limits.maxItems,
        percentage: Math.round((count / limits.maxItems) * 100)
      };
    } catch (error) {
      usage[name] = { count: 0, limit: limits.maxItems, percentage: 0 };
    }
  }

  return usage;
}

/**
 * Manual cleanup for a specific user
 * Useful for "Clear old data" button in settings
 */
export async function cleanupUserData(
  companyId: string,
  userId: string,
  collectionName: keyof typeof USER_DATA_LIMITS,
  olderThanDays: number
): Promise<number> {
  if (!db) return 0;
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  try {
    const collectionRef = collection(db, 'companies', companyId, collectionName);
    const oldQuery = query(
      collectionRef,
      where('userId', '==', userId),
      where('createdAt', '<', cutoffDate),
      limit(100) // Process in batches
    );
    
    const oldDocs = await getDocs(oldQuery);
    
    let deleted = 0;
    for (const docSnapshot of oldDocs.docs) {
      await deleteDoc(docSnapshot.ref);
      deleted++;
    }

    return deleted;
  } catch (error) {
    console.error(`[Data Cleanup] Error cleaning ${collectionName}:`, error);
    return 0;
  }
}

/**
 * Estimate storage size for a document (rough estimate)
 */
export function estimateDocumentSize(data: any): number {
  const jsonString = JSON.stringify(data);
  // Firestore charges ~1 byte per character + overhead
  return jsonString.length + 100; // 100 bytes overhead estimate
}

/**
 * Check if data should be stored or is too large
 */
export function shouldStoreData(data: any, maxSizeKB: number = 100): boolean {
  const sizeBytes = estimateDocumentSize(data);
  const sizeKB = sizeBytes / 1024;
  return sizeKB <= maxSizeKB;
}
