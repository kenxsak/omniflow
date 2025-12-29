'use server';

import { serverDb } from '@/lib/firebase-server';
import { doc, getDoc, deleteDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { 
  getBufferProfiles, 
  publishToBuffer, 
  getBufferPendingUpdates,
  deleteBufferUpdate,
  type BufferProfile,
  type BufferPostOptions,
  type BufferPublishResult,
} from '@/lib/buffer-api';

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

// Get Buffer connection status and profiles
export async function getBufferConnectionAction(
  userId: string,
  companyId: string
): Promise<ActionResult<{
  connected: boolean;
  bufferName?: string;
  bufferPlan?: string;
  profiles?: BufferProfile[];
  profileCount?: number;
}>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const connectionRef = doc(serverDb, 'bufferConnections', companyId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return { success: true, data: { connected: false } };
    }

    const data = connectionSnap.data();
    
    // Fetch fresh profiles from Buffer
    const profiles = await getBufferProfiles(data.accessToken);
    
    if ('error' in profiles) {
      // Token might be expired
      return { 
        success: true, 
        data: { 
          connected: true, 
          bufferName: data.bufferName,
          bufferPlan: data.bufferPlan,
          profiles: data.profiles || [],
          profileCount: data.profileCount || 0,
        } 
      };
    }

    // Update stored profiles
    await updateDoc(connectionRef, {
      profiles: profiles.map(p => ({
        id: p.id,
        service: p.service,
        formattedService: p.formatted_service,
        username: p.formatted_username,
        avatar: p.avatar,
      })),
      profileCount: profiles.length,
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      data: {
        connected: true,
        bufferName: data.bufferName,
        bufferPlan: data.bufferPlan,
        profiles,
        profileCount: profiles.length,
      },
    };
  } catch (error) {
    console.error('Error getting Buffer connection:', error);
    return { success: false, error: 'Failed to get Buffer connection' };
  }
}

// Disconnect Buffer
export async function disconnectBufferAction(
  userId: string,
  companyId: string
): Promise<ActionResult> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const connectionRef = doc(serverDb, 'bufferConnections', companyId);
    await deleteDoc(connectionRef);
    return { success: true };
  } catch (error) {
    console.error('Error disconnecting Buffer:', error);
    return { success: false, error: 'Failed to disconnect Buffer' };
  }
}

// Publish to Buffer
export async function publishToBufferAction(
  userId: string,
  companyId: string,
  profileIds: string[],
  options: {
    text: string;
    imageUrl?: string;
    link?: string;
    scheduledAt?: string;
    publishNow?: boolean;
  }
): Promise<ActionResult<BufferPublishResult>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    // Get Buffer access token
    const connectionRef = doc(serverDb, 'bufferConnections', companyId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return { success: false, error: 'Buffer not connected. Please connect your Buffer account first.' };
    }

    const { accessToken } = connectionSnap.data();

    // Prepare post options
    const postOptions: BufferPostOptions = {
      text: options.text,
      now: options.publishNow,
      scheduled_at: options.scheduledAt,
    };

    if (options.imageUrl) {
      postOptions.media = { photo: options.imageUrl };
    }
    if (options.link) {
      postOptions.media = { ...postOptions.media, link: options.link };
    }

    // Publish via Buffer
    const result = await publishToBuffer(accessToken, profileIds, postOptions);

    return { success: result.success, data: result, error: result.error };
  } catch (error) {
    console.error('Error publishing to Buffer:', error);
    return { success: false, error: 'Failed to publish to Buffer' };
  }
}

// Get scheduled posts from Buffer
export async function getBufferScheduledPostsAction(
  userId: string,
  companyId: string,
  profileId: string
): Promise<ActionResult<any[]>> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const connectionRef = doc(serverDb, 'bufferConnections', companyId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return { success: false, error: 'Buffer not connected' };
    }

    const { accessToken } = connectionSnap.data();
    const updates = await getBufferPendingUpdates(accessToken, profileId);

    if ('error' in updates) {
      return { success: false, error: updates.error };
    }

    return { success: true, data: updates };
  } catch (error) {
    console.error('Error getting Buffer scheduled posts:', error);
    return { success: false, error: 'Failed to get scheduled posts' };
  }
}

// Delete a scheduled post from Buffer
export async function deleteBufferScheduledPostAction(
  userId: string,
  companyId: string,
  updateId: string
): Promise<ActionResult> {
  if (!serverDb) return { success: false, error: 'Database not initialized' };

  const verification = await verifyUserCompany(userId, companyId);
  if (!verification.valid) return { success: false, error: verification.error };

  try {
    const connectionRef = doc(serverDb, 'bufferConnections', companyId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return { success: false, error: 'Buffer not connected' };
    }

    const { accessToken } = connectionSnap.data();
    const result = await deleteBufferUpdate(accessToken, updateId);

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error deleting Buffer scheduled post:', error);
    return { success: false, error: 'Failed to delete scheduled post' };
  }
}
