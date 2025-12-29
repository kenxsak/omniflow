'use server';

import { serverDb } from '@/lib/firebase-server';
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp, 
  getDoc,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import type { SocialAccount, ScheduledPost, SocialPlatformType } from '@/types/social-accounts';
import { 
  publishToSocialMedia, 
  type SocialPlatform, 
  type PublishResult,
  type PublishOptions,
  type SocialCredentials 
} from '@/lib/social-media-publisher';

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Verify user belongs to company
async function verifyUserCompany(userId: string, companyId: string): Promise<{ valid: boolean; error?: string }> {
  if (!serverDb) return { valid: false, error: 'Database not initialized' };
  if (!userId) return { valid: false, error: 'User not authenticated' };
  if (!companyId) return { valid: false, error: 'Company ID required' };

  try {
    const userDoc = await getDoc(doc(serverDb, 'users', userId));
    if (!userDoc.exists()) return { valid: false, error: 'User not found' };
    if (userDoc.data().companyId !== companyId) return { valid: false, error: 'Unauthorized' };
    return { valid: true };
  } catch {
    return { valid: false, error: 'Verification failed' };
  }
}

function convertTimestamp(ts: any): string | null {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate().toISOString();
  if (!isNaN(new Date(ts).getTime())) return new Date(ts).toISOString();
  return null;
}

// Get all connected social accounts for a company
export async function getSocialAccountsAction(
  userId: string,
  companyId: string
): Promise<ActionResult<SocialAccount[]>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const accountsCol = collection(serverDb, 'socialAccounts');
    const q = query(accountsCol, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    
    const accounts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        connectedAt: convertTimestamp(data.connectedAt),
        lastUsedAt: convertTimestamp(data.lastUsedAt),
        tokenExpiresAt: convertTimestamp(data.tokenExpiresAt),
        // Don't expose tokens to client
        accessToken: data.accessToken ? '••••••••' : '',
        refreshToken: data.refreshToken ? '••••••••' : '',
      } as SocialAccount;
    });

    return { success: true, data: accounts };
  } catch (error) {
    console.error('Error fetching social accounts:', error);
    return { success: false, error: 'Failed to fetch social accounts' };
  }
}

// Connect a new social account (manual token entry for now)
export async function connectSocialAccountAction(
  userId: string,
  companyId: string,
  accountData: {
    platform: SocialPlatformType;
    accountName: string;
    accountId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
    profileImageUrl?: string;
  }
): Promise<ActionResult<{ id: string }>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    // Check if account already exists
    const accountsCol = collection(serverDb, 'socialAccounts');
    const existingQuery = query(
      accountsCol, 
      where('companyId', '==', companyId),
      where('platform', '==', accountData.platform),
      where('accountId', '==', accountData.accountId)
    );
    const existing = await getDocs(existingQuery);
    
    if (!existing.empty) {
      // Update existing account
      const existingDoc = existing.docs[0];
      await updateDoc(doc(serverDb, 'socialAccounts', existingDoc.id), {
        ...accountData,
        isConnected: true,
        connectedAt: serverTimestamp(),
      });
      return { success: true, data: { id: existingDoc.id } };
    }

    // Create new account
    const docRef = await addDoc(accountsCol, {
      companyId,
      ...accountData,
      isConnected: true,
      connectedAt: serverTimestamp(),
      permissions: [],
      metadata: {},
    });

    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Error connecting social account:', error);
    return { success: false, error: 'Failed to connect account' };
  }
}

// Disconnect a social account
export async function disconnectSocialAccountAction(
  userId: string,
  companyId: string,
  accountId: string
): Promise<ActionResult> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const accountRef = doc(serverDb, 'socialAccounts', accountId);
    const accountSnap = await getDoc(accountRef);
    
    if (!accountSnap.exists()) return { success: false, error: 'Account not found' };
    if (accountSnap.data().companyId !== companyId) return { success: false, error: 'Unauthorized' };

    await deleteDoc(accountRef);
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting account:', error);
    return { success: false, error: 'Failed to disconnect account' };
  }
}


// Schedule a post for publishing
export async function schedulePostAction(
  userId: string,
  companyId: string,
  postId: string,
  platforms: SocialPlatformType[],
  scheduledAt: string
): Promise<ActionResult<{ id: string }>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    // Verify post exists and belongs to company
    const postRef = doc(serverDb, 'socialPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return { success: false, error: 'Post not found' };
    if (postSnap.data().companyId !== companyId) return { success: false, error: 'Unauthorized' };

    // Create scheduled post entry
    const scheduledCol = collection(serverDb, 'scheduledPosts');
    const docRef = await addDoc(scheduledCol, {
      companyId,
      postId,
      platforms,
      scheduledAt: Timestamp.fromDate(new Date(scheduledAt)),
      status: 'pending',
      retryCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update the original post status
    await updateDoc(postRef, {
      status: 'Scheduled',
      scheduledAt: scheduledAt,
      updatedAt: serverTimestamp(),
    });

    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Error scheduling post:', error);
    return { success: false, error: 'Failed to schedule post' };
  }
}

// Get scheduled posts for calendar view
export async function getScheduledPostsAction(
  userId: string,
  companyId: string,
  startDate?: string,
  endDate?: string
): Promise<ActionResult<ScheduledPost[]>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const scheduledCol = collection(serverDb, 'scheduledPosts');
    let q = query(
      scheduledCol, 
      where('companyId', '==', companyId),
      orderBy('scheduledAt', 'asc')
    );

    const snapshot = await getDocs(q);
    
    let posts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledAt: convertTimestamp(data.scheduledAt),
        publishedAt: convertTimestamp(data.publishedAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      } as ScheduledPost;
    });

    // Filter by date range if provided
    if (startDate) {
      const start = new Date(startDate);
      posts = posts.filter(p => p.scheduledAt && new Date(p.scheduledAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      posts = posts.filter(p => p.scheduledAt && new Date(p.scheduledAt) <= end);
    }

    return { success: true, data: posts };
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return { success: false, error: 'Failed to fetch scheduled posts' };
  }
}

// Cancel a scheduled post
export async function cancelScheduledPostAction(
  userId: string,
  companyId: string,
  scheduledPostId: string
): Promise<ActionResult> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const scheduledRef = doc(serverDb, 'scheduledPosts', scheduledPostId);
    const scheduledSnap = await getDoc(scheduledRef);
    
    if (!scheduledSnap.exists()) return { success: false, error: 'Scheduled post not found' };
    if (scheduledSnap.data().companyId !== companyId) return { success: false, error: 'Unauthorized' };

    // Update status to cancelled
    await updateDoc(scheduledRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });

    // Update original post back to draft
    const postId = scheduledSnap.data().postId;
    if (postId) {
      const postRef = doc(serverDb, 'socialPosts', postId);
      await updateDoc(postRef, {
        status: 'Draft',
        scheduledAt: null,
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return { success: false, error: 'Failed to cancel scheduled post' };
  }
}

// Get calendar events (combines posts and scheduled items)
export async function getCalendarEventsAction(
  userId: string,
  companyId: string,
  month: number,
  year: number
): Promise<ActionResult<any[]>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    // Get start and end of month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    // Get all posts for this company
    const postsCol = collection(serverDb, 'socialPosts');
    const postsQuery = query(postsCol, where('companyId', '==', companyId));
    const postsSnapshot = await getDocs(postsQuery);

    const events: any[] = [];

    postsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      let eventDate: Date | null = null;
      
      // Use scheduledAt if available, otherwise createdAt
      if (data.scheduledAt) {
        eventDate = data.scheduledAt.toDate ? data.scheduledAt.toDate() : new Date(data.scheduledAt);
      } else if (data.createdAt) {
        eventDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      }

      if (eventDate && eventDate >= startDate && eventDate <= endDate) {
        events.push({
          id: doc.id,
          title: data.textContent?.substring(0, 50) + '...' || 'Untitled Post',
          date: eventDate.toISOString(),
          platform: data.platform,
          status: data.status?.toLowerCase() || 'draft',
          postId: doc.id,
        });
      }
    });

    return { success: true, data: events };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return { success: false, error: 'Failed to fetch calendar events' };
  }
}


// ============================================
// ACTUAL SOCIAL MEDIA PUBLISHING
// ============================================

// Get decrypted credentials for a social account (internal use only)
async function getAccountCredentials(
  companyId: string,
  accountId: string
): Promise<{ credentials: SocialCredentials; platform: SocialPlatformType } | null> {
  if (!serverDb) return null;

  try {
    const accountRef = doc(serverDb, 'socialAccounts', accountId);
    const accountSnap = await getDoc(accountRef);
    
    if (!accountSnap.exists()) return null;
    
    const data = accountSnap.data();
    if (data.companyId !== companyId) return null;

    return {
      credentials: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        pageId: data.accountId, // Platform-specific ID
        userId: data.accountId,
      },
      platform: data.platform as SocialPlatformType,
    };
  } catch {
    return null;
  }
}

// Publish content to a connected social account
export async function publishToAccountAction(
  userId: string,
  companyId: string,
  accountId: string,
  options: {
    content: string;
    imageUrl?: string;
    link?: string;
    hashtags?: string[];
  }
): Promise<ActionResult<PublishResult>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    // Get account credentials
    const accountData = await getAccountCredentials(companyId, accountId);
    if (!accountData) {
      return { success: false, error: 'Social account not found or unauthorized' };
    }

    const { credentials, platform } = accountData;

    // Only support platforms with direct publish capability
    const supportedPlatforms: SocialPlatformType[] = ['facebook', 'instagram', 'linkedin', 'twitter'];
    if (!supportedPlatforms.includes(platform)) {
      return { 
        success: false, 
        error: `Direct publishing not supported for ${platform}. Use Quick Publish instead.` 
      };
    }

    // Publish to the platform
    const result = await publishToSocialMedia(
      platform as SocialPlatform,
      credentials,
      options as PublishOptions
    );

    // Update last used timestamp
    const accountRef = doc(serverDb, 'socialAccounts', accountId);
    await updateDoc(accountRef, {
      lastUsedAt: serverTimestamp(),
    });

    // Log the publish attempt
    await addDoc(collection(serverDb, 'socialPublishLogs'), {
      companyId,
      accountId,
      platform,
      success: result.success,
      postId: result.postId || null,
      postUrl: result.postUrl || null,
      error: result.error || null,
      publishedAt: serverTimestamp(),
    });

    if (!result.success) {
      return { success: false, error: result.error, data: result };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error publishing to social account:', error);
    return { success: false, error: 'Failed to publish content' };
  }
}

// Publish to multiple platforms at once
export async function publishToMultiplePlatformsAction(
  userId: string,
  companyId: string,
  accountIds: string[],
  options: {
    content: string;
    imageUrl?: string;
    link?: string;
    hashtags?: string[];
  }
): Promise<ActionResult<{ results: PublishResult[] }>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  const results: PublishResult[] = [];

  for (const accountId of accountIds) {
    const result = await publishToAccountAction(userId, companyId, accountId, options);
    if (result.data) {
      results.push(result.data);
    } else {
      results.push({
        success: false,
        error: result.error || 'Unknown error',
        platform: 'facebook', // Will be overwritten
      });
    }
  }

  const allSuccessful = results.every(r => r.success);
  const someSuccessful = results.some(r => r.success);

  return {
    success: someSuccessful,
    error: allSuccessful ? undefined : 'Some platforms failed to publish',
    data: { results },
  };
}

// Process scheduled posts (called by cron job)
export async function processScheduledPostsAction(): Promise<ActionResult<{ processed: number; published: number; failed: number }>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  try {
    const now = new Date();
    const scheduledCol = collection(serverDb, 'scheduledPosts');
    
    // Get pending posts that are due
    const q = query(
      scheduledCol,
      where('status', '==', 'pending'),
      where('scheduledAt', '<=', Timestamp.fromDate(now))
    );
    
    const snapshot = await getDocs(q);
    
    let processed = 0;
    let published = 0;
    let failed = 0;

    for (const scheduledDoc of snapshot.docs) {
      processed++;
      const data = scheduledDoc.data();
      const { companyId, postId, platforms } = data;

      try {
        // Update status to publishing
        await updateDoc(doc(serverDb, 'scheduledPosts', scheduledDoc.id), {
          status: 'publishing',
          updatedAt: serverTimestamp(),
        });

        // Get the post content
        const postRef = doc(serverDb, 'socialPosts', postId);
        const postSnap = await getDoc(postRef);
        
        if (!postSnap.exists()) {
          await updateDoc(doc(serverDb, 'scheduledPosts', scheduledDoc.id), {
            status: 'failed',
            errorMessage: 'Post not found',
            updatedAt: serverTimestamp(),
          });
          failed++;
          continue;
        }

        const postData = postSnap.data();
        const publishOptions: PublishOptions = {
          content: postData.textContent || '',
          imageUrl: postData.imageUrl,
          hashtags: postData.hashtags || [],
        };

        // Get connected accounts for each platform
        const accountsCol = collection(serverDb, 'socialAccounts');
        const accountsQuery = query(
          accountsCol,
          where('companyId', '==', companyId),
          where('isConnected', '==', true)
        );
        const accountsSnap = await getDocs(accountsQuery);

        const platformAccounts = accountsSnap.docs.filter(d => 
          platforms.includes(d.data().platform)
        );

        if (platformAccounts.length === 0) {
          await updateDoc(doc(serverDb, 'scheduledPosts', scheduledDoc.id), {
            status: 'failed',
            errorMessage: 'No connected accounts for selected platforms',
            updatedAt: serverTimestamp(),
          });
          failed++;
          continue;
        }

        // Publish to each platform
        let allSuccess = true;
        const errors: string[] = [];

        for (const accountDoc of platformAccounts) {
          const accountData = accountDoc.data();
          const credentials: SocialCredentials = {
            accessToken: accountData.accessToken,
            refreshToken: accountData.refreshToken,
            pageId: accountData.accountId,
            userId: accountData.accountId,
          };

          const result = await publishToSocialMedia(
            accountData.platform as SocialPlatform,
            credentials,
            publishOptions
          );

          if (!result.success) {
            allSuccess = false;
            errors.push(`${accountData.platform}: ${result.error}`);
          }

          // Log the publish
          await addDoc(collection(serverDb, 'socialPublishLogs'), {
            companyId,
            accountId: accountDoc.id,
            scheduledPostId: scheduledDoc.id,
            platform: accountData.platform,
            success: result.success,
            postId: result.postId || null,
            postUrl: result.postUrl || null,
            error: result.error || null,
            publishedAt: serverTimestamp(),
          });
        }

        // Update scheduled post status
        await updateDoc(doc(serverDb, 'scheduledPosts', scheduledDoc.id), {
          status: allSuccess ? 'published' : 'failed',
          publishedAt: allSuccess ? serverTimestamp() : null,
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
          updatedAt: serverTimestamp(),
        });

        // Update original post status
        await updateDoc(postRef, {
          status: allSuccess ? 'Published' : 'Failed',
          publishedAt: allSuccess ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
        });

        if (allSuccess) {
          published++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Error processing scheduled post:', error);
        await updateDoc(doc(serverDb, 'scheduledPosts', scheduledDoc.id), {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          retryCount: (data.retryCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });
        failed++;
      }
    }

    return { 
      success: true, 
      data: { processed, published, failed } 
    };
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    return { success: false, error: 'Failed to process scheduled posts' };
  }
}

// Get publish history/logs
export async function getPublishLogsAction(
  userId: string,
  companyId: string,
  limit: number = 50
): Promise<ActionResult<any[]>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const logsCol = collection(serverDb, 'socialPublishLogs');
    const q = query(
      logsCol,
      where('companyId', '==', companyId),
      orderBy('publishedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        publishedAt: convertTimestamp(data.publishedAt),
      };
    });

    return { success: true, data: logs };
  } catch (error) {
    console.error('Error fetching publish logs:', error);
    return { success: false, error: 'Failed to fetch publish logs' };
  }
}
