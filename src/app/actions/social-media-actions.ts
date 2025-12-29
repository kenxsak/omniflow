
'use server';

import type { SocialMediaPost } from '@/types/social-media';
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
  orderBy
} from 'firebase/firestore';
import { uploadImageToImgBB } from '@/lib/imgbb-upload';
import { getUserFromServerSession } from '@/lib/firebase-admin';
import type { Plan } from '@/types/saas';

interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  limitReached?: boolean;
  currentCount?: number;
  maxAllowed?: number | null;
}

async function verifyUserBelongsToCompany(
  userId: string, 
  companyId: string
): Promise<{ valid: boolean; error?: string }> {
  if (!serverDb) {
    return { valid: false, error: 'Database not initialized' };
  }

  if (!userId) {
    return { valid: false, error: 'User not authenticated' };
  }

  if (!companyId) {
    return { valid: false, error: 'Company ID is required' };
  }

  try {
    const userDoc = await getDoc(doc(serverDb, 'users', userId));
    
    if (!userDoc.exists()) {
      return { valid: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    if (userData.companyId !== companyId) {
      return { valid: false, error: 'Unauthorized: User does not belong to this company' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error verifying user company:', error);
    return { valid: false, error: 'Error verifying user permissions' };
  }
}

function convertTimestampToString(timestamp: any): string | null {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp).toISOString();
  return null;
}

function serializePost(post: any): SocialMediaPost {
  // Serialize analytics object if it exists
  let serializedAnalytics = post.analytics;
  if (post.analytics) {
    serializedAnalytics = {
      ...post.analytics,
      lastLeadAt: convertTimestampToString(post.analytics.lastLeadAt),
    };
  }
  
  return {
    ...post,
    createdAt: convertTimestampToString(post.createdAt),
    updatedAt: convertTimestampToString(post.updatedAt),
    scheduledAt: convertTimestampToString(post.scheduledAt),
    imageGeneratedAt: convertTimestampToString(post.imageGeneratedAt),
    analytics: serializedAnalytics,
  };
}


export async function getSocialPostByIdAction(
  postId: string
): Promise<ActionResult<SocialMediaPost>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (!postId) {
    return { success: false, error: 'Post ID is required' };
  }

  try {
    const postRef = doc(serverDb, 'socialPosts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return { success: false, error: 'Post not found' };
    }

    const postData = { id: postSnap.id, ...postSnap.data() } as any;
    
    // Security: Only allow public access to published blog posts and sales pages
    const allowedPlatforms = ['BlogPost', 'SalesLandingPage'];
    if (!allowedPlatforms.includes(postData.platform)) {
      return { success: false, error: 'Post not found' };
    }
    
    // Only show posts that are marked as Posted (not drafts)
    if (postData.status !== 'Posted') {
      return { success: false, error: 'Post not found' };
    }

    const serializedPost = serializePost(postData);

    return { success: true, data: serializedPost };
  } catch (error) {
    console.error("Error fetching social media post:", error);
    return { success: false, error: 'Failed to fetch social media post' };
  }
}

export async function getStoredSocialMediaPostsAction(
  userId: string,
  companyId: string
): Promise<ActionResult<SocialMediaPost[]>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const verification = await verifyUserBelongsToCompany(userId, companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    const postsCol = collection(serverDb, 'socialPosts');
    const q = query(postsCol, where('companyId', '==', companyId), orderBy('createdAt', 'desc'));
    const postSnapshot = await getDocs(q);
    
    if (postSnapshot.empty) {
      return { success: true, data: [] };
    }

    const posts = postSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    } as any));

    const serializedPosts = posts.map(serializePost);

    return { success: true, data: serializedPosts };
  } catch (error) {
    console.error("Error fetching social media posts:", error);
    return { success: false, error: 'Failed to fetch social media posts' };
  }
}

/**
 * Check if user can save more posts based on their plan limit
 * Super admins bypass all limits
 */
export async function checkSavedPostsLimitAction(
  companyId: string
): Promise<{ 
  canSave: boolean; 
  currentCount: number; 
  maxAllowed: number | null; 
  planName: string;
  isSuperAdmin: boolean;
}> {
  if (!serverDb) {
    return { canSave: false, currentCount: 0, maxAllowed: 0, planName: 'Unknown', isSuperAdmin: false };
  }

  try {
    // Check if user is super admin
    const authResult = await getUserFromServerSession();
    const isSuperAdmin = authResult.success && authResult.user?.role === 'superadmin';

    if (isSuperAdmin) {
      return { canSave: true, currentCount: 0, maxAllowed: null, planName: 'Super Admin', isSuperAdmin: true };
    }

    // Get company's plan
    const companyRef = doc(serverDb, 'companies', companyId);
    const companyDoc = await getDoc(companyRef);
    
    if (!companyDoc.exists()) {
      return { canSave: false, currentCount: 0, maxAllowed: 0, planName: 'Unknown', isSuperAdmin: false };
    }

    const companyData = companyDoc.data();
    const planRef = doc(serverDb, 'plans', companyData.planId || 'plan_free');
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      return { canSave: false, currentCount: 0, maxAllowed: 0, planName: 'Unknown', isSuperAdmin: false };
    }

    const plan = planDoc.data() as Plan;
    const maxSavedPosts = plan.maxSavedPosts;

    // Count current posts
    const postsQuery = query(
      collection(serverDb, 'socialPosts'),
      where('companyId', '==', companyId)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const currentCount = postsSnapshot.size;

    // If no limit (null), user can save unlimited
    if (maxSavedPosts === null || maxSavedPosts === undefined) {
      return { canSave: true, currentCount, maxAllowed: null, planName: plan.name, isSuperAdmin: false };
    }

    return { 
      canSave: currentCount < maxSavedPosts, 
      currentCount, 
      maxAllowed: maxSavedPosts, 
      planName: plan.name,
      isSuperAdmin: false
    };
  } catch (error) {
    console.error("Error checking saved posts limit:", error);
    return { canSave: false, currentCount: 0, maxAllowed: 0, planName: 'Unknown', isSuperAdmin: false };
  }
}

export async function addStoredSocialMediaPostAction(
  userId: string,
  postData: Omit<SocialMediaPost, 'id' | 'createdAt'>
): Promise<ActionResult<SocialMediaPost>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (!postData.companyId) {
    return { success: false, error: 'Company ID is required' };
  }

  const verification = await verifyUserBelongsToCompany(userId, postData.companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    // Check if user is super admin (bypasses all limits)
    const authResult = await getUserFromServerSession();
    const isSuperAdmin = authResult.success && authResult.user?.role === 'superadmin';

    // Check saved posts limit for non-super admins
    if (!isSuperAdmin) {
      // Get company's plan
      const companyRef = doc(serverDb, 'companies', postData.companyId);
      const companyDoc = await getDoc(companyRef);
      
      if (companyDoc.exists()) {
        const companyData = companyDoc.data();
        const planRef = doc(serverDb, 'plans', companyData.planId || 'plan_free');
        const planDoc = await getDoc(planRef);
        
        if (planDoc.exists()) {
          const plan = planDoc.data() as Plan;
          const maxSavedPosts = plan.maxSavedPosts;
          
          // If there's a limit (not null/undefined), check it
          if (maxSavedPosts !== null && maxSavedPosts !== undefined) {
            // Count current posts
            const postsQuery = query(
              collection(serverDb, 'socialPosts'),
              where('companyId', '==', postData.companyId)
            );
            const postsSnapshot = await getDocs(postsQuery);
            const currentCount = postsSnapshot.size;
            
            if (currentCount >= maxSavedPosts) {
              return { 
                success: false, 
                error: `Saved posts limit reached. Your ${plan.name} plan allows ${maxSavedPosts} saved posts. Upgrade to save unlimited content.`,
                limitReached: true,
                currentCount,
                maxAllowed: maxSavedPosts
              };
            }
          }
        }
      }
    }

    let cleanedData = { ...postData };
    const base64ImageUri = cleanedData.imageUrl;
    let finalImageUrl = cleanedData.imageUrl;
    
    // Only upload if it's a new AI-generated image (in base64 format)
    // NOTE: Credit deduction is handled by the `generateTrackedImageAction`, not here.
    if (cleanedData.isAiGeneratedImage && base64ImageUri && base64ImageUri.startsWith('data:image')) {
      console.log('Uploading base64 image to ImgBB...');
      try {
        const publicUrl = await uploadImageToImgBB(base64ImageUri);
        finalImageUrl = publicUrl;
        
        // Replace placeholder in HTML content
        if (cleanedData.textContent) {
          const placeholderOrBase64Regex = /(https?:\/\/placehold\.co\/[\w/.]+)|(data:image\/[a-zA-Z]+;base64,[^"')\s]+)/g;
          cleanedData.textContent = cleanedData.textContent.replace(placeholderOrBase64Regex, publicUrl);
        }
        
        cleanedData.imageGeneratedAt = new Date().toISOString();

      } catch (uploadError: any) {
        console.error('Failed to upload image to ImgBB:', uploadError);
        return { success: false, error: `Failed to upload image: ${uploadError.message}` };
      }
    }
    
    const postPayload: any = {
      ...cleanedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Only include imageUrl if it exists (Firestore doesn't accept undefined)
    if (finalImageUrl) {
      postPayload.imageUrl = finalImageUrl;
    }
    
    const docRef = await addDoc(collection(serverDb, 'socialPosts'), postPayload);
    const docSnap = await getDoc(docRef);
    
    const newPost = serializePost({ id: docSnap.id, ...docSnap.data() });

    return { success: true, data: newPost };
  } catch (error) {
    console.error("Error adding social media post:", error);
    return { success: false, error: 'Failed to add social media post' };
  }
}

export async function updateStoredSocialMediaPostAction(
  userId: string,
  updatedData: Partial<SocialMediaPost> & { id: string }
): Promise<ActionResult> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const { id, ...dataToUpdate } = updatedData;

  if (!id) {
    return { success: false, error: 'Post ID is required' };
  }

  try {
    const postRef = doc(serverDb, 'socialPosts', id);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return { success: false, error: 'Post not found' };
    }

    const postData = postSnap.data() as SocialMediaPost;
    
    const verification = await verifyUserBelongsToCompany(userId, postData.companyId);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    let finalDataToUpdate = { ...dataToUpdate };
    const base64ImageUri = finalDataToUpdate.imageUrl;
    
    // Only upload if it's a *new* base64 image being provided for an update
    if (finalDataToUpdate.isAiGeneratedImage && base64ImageUri && base64ImageUri.startsWith('data:image')) {
      console.log('Uploading new base64 image to ImgBB for update...');
      try {
        const publicUrl = await uploadImageToImgBB(base64ImageUri);
        finalDataToUpdate.imageUrl = publicUrl;
        
        if (finalDataToUpdate.textContent) {
          const placeholderOrOldUrlRegex = /(https?:\/\/placehold\.co\/[\w/.]+)|(data:image\/[a-zA-Z]+;base64,[^"')\s]+)|(https?:\/\/i\.ibb\.co\/[\w/.]+)/g;
          finalDataToUpdate.textContent = finalDataToUpdate.textContent.replace(placeholderOrOldUrlRegex, publicUrl);
        }
        
        finalDataToUpdate.imageGeneratedAt = new Date().toISOString();

      } catch (uploadError: any) {
        console.error('Failed to upload image to ImgBB during update:', uploadError);
        return { success: false, error: `Failed to upload image: ${uploadError.message}` };
      }
    }
    
    const updatePayload = {
      ...finalDataToUpdate,
      updatedAt: serverTimestamp()
    };

    await updateDoc(postRef, updatePayload);
    return { success: true };
  } catch (error) {
    console.error("Error updating social media post:", error);
    return { success: false, error: 'Failed to update social media post' };
  }
}


export async function deleteStoredSocialMediaPostAction(
  userId: string,
  postId: string
): Promise<ActionResult> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (!postId) {
    return { success: false, error: 'Post ID is required' };
  }

  try {
    const postRef = doc(serverDb, 'socialPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return { success: false, error: 'Post not found' };
    }

    const postData = postSnap.data() as SocialMediaPost;
    
    const verification = await verifyUserBelongsToCompany(userId, postData.companyId);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    await deleteDoc(postRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting social media post:", error);
    return { success: false, error: 'Failed to delete social media post' };
  }
}

export async function togglePostStatusAction(
  userId: string,
  postId: string,
  newStatus: 'Draft' | 'Posted'
): Promise<ActionResult> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (!postId) {
    return { success: false, error: 'Post ID is required' };
  }

  try {
    const postRef = doc(serverDb, 'socialPosts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return { success: false, error: 'Post not found' };
    }

    const postData = postSnap.data() as SocialMediaPost;
    
    const verification = await verifyUserBelongsToCompany(userId, postData.companyId);
    if (!verification.valid) {
      return { success: false, error: verification.error };
    }

    await updateDoc(postRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error("Error toggling post status:", error);
    return { success: false, error: 'Failed to update post status' };
  }
}

export async function migrateBlogPostsToPostedStatus(
  userId: string,
  companyId: string
): Promise<ActionResult<{ updated: number }>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const verification = await verifyUserBelongsToCompany(userId, companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    const postsCol = collection(serverDb, 'socialPosts');
    const q = query(
      postsCol, 
      where('companyId', '==', companyId),
      where('status', '==', 'Draft')
    );
    const querySnapshot = await getDocs(q);
    
    let updatedCount = 0;
    const updatePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only update BlogPost and SalesLandingPage
      if (data.platform === 'BlogPost' || data.platform === 'SalesLandingPage') {
        const postRef = doc(serverDb!, 'socialPosts', docSnap.id);
        const updatePromise = updateDoc(postRef, {
          status: 'Posted',
          updatedAt: serverTimestamp()
        });
        updatePromises.push(updatePromise);
        updatedCount++;
      }
    });

    await Promise.all(updatePromises);

    return { 
      success: true, 
      data: { updated: updatedCount }
    };
  } catch (error) {
    console.error("Error migrating blog posts:", error);
    return { success: false, error: 'Failed to migrate blog posts' };
  }
}

// Bulk delete multiple posts
export async function bulkDeleteSocialPostsAction(
  userId: string,
  companyId: string,
  postIds: string[]
): Promise<ActionResult<{ deleted: number }>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (!postIds || postIds.length === 0) {
    return { success: false, error: 'No posts selected for deletion' };
  }

  const verification = await verifyUserBelongsToCompany(userId, companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    for (const postId of postIds) {
      const postRef = doc(serverDb, 'socialPosts', postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const postData = postSnap.data();
        // Only delete if post belongs to user's company
        if (postData.companyId === companyId) {
          deletePromises.push(deleteDoc(postRef));
          deletedCount++;
        }
      }
    }

    await Promise.all(deletePromises);

    return { 
      success: true, 
      data: { deleted: deletedCount }
    };
  } catch (error) {
    console.error("Error bulk deleting posts:", error);
    return { success: false, error: 'Failed to delete posts' };
  }
}

// Delete all drafts
export async function deleteAllDraftsAction(
  userId: string,
  companyId: string
): Promise<ActionResult<{ deleted: number }>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  const verification = await verifyUserBelongsToCompany(userId, companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    const postsCol = collection(serverDb, 'socialPosts');
    const q = query(
      postsCol, 
      where('companyId', '==', companyId),
      where('status', '==', 'Draft')
    );
    const querySnapshot = await getDocs(q);
    
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnap) => {
      const postRef = doc(serverDb!, 'socialPosts', docSnap.id);
      deletePromises.push(deleteDoc(postRef));
      deletedCount++;
    });

    await Promise.all(deletePromises);

    return { 
      success: true, 
      data: { deleted: deletedCount }
    };
  } catch (error) {
    console.error("Error deleting drafts:", error);
    return { success: false, error: 'Failed to delete drafts' };
  }
}

// Delete posts older than X days
export async function deleteOldPostsAction(
  userId: string,
  companyId: string,
  daysOld: number
): Promise<ActionResult<{ deleted: number }>> {
  if (!serverDb) {
    return { success: false, error: 'Database not initialized' };
  }

  if (daysOld < 1) {
    return { success: false, error: 'Days must be at least 1' };
  }

  const verification = await verifyUserBelongsToCompany(userId, companyId);
  if (!verification.valid) {
    return { success: false, error: verification.error };
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const postsCol = collection(serverDb, 'socialPosts');
    const q = query(
      postsCol, 
      where('companyId', '==', companyId)
    );
    const querySnapshot = await getDocs(q);
    
    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate?.() || new Date(data.createdAt);
      
      // Only delete if older than cutoff and is a Draft (don't delete published content)
      if (createdAt < cutoffDate && data.status === 'Draft') {
        const postRef = doc(serverDb!, 'socialPosts', docSnap.id);
        deletePromises.push(deleteDoc(postRef));
        deletedCount++;
      }
    });

    await Promise.all(deletePromises);

    return { 
      success: true, 
      data: { deleted: deletedCount }
    };
  } catch (error) {
    console.error("Error deleting old posts:", error);
    return { success: false, error: 'Failed to delete old posts' };
  }
}
