'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import type { 
  Review, 
  ReviewRequest, 
  ReviewLink, 
  ReputationSettings, 
  ReputationStats,
  ReviewRequestInput 
} from '@/types/reputation';

/**
 * Get reputation settings for a company
 */
export async function getReputationSettingsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; settings?: ReputationSettings; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const settingsDoc = await adminDb.collection('reputationSettings').doc(companyId).get();

    if (!settingsDoc.exists) {
      // Return default settings
      return {
        success: true,
        settings: {
          companyId,
          autoRequestEnabled: false,
          autoRequestDelay: 3,
          autoRequestChannel: 'email',
          minRatingToRequest: 4,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    return { success: true, settings: settingsDoc.data() as ReputationSettings };
  } catch (error) {
    console.error('Error fetching reputation settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

/**
 * Save reputation settings
 */
export async function saveReputationSettingsAction(params: {
  idToken: string;
  settings: Partial<ReputationSettings>;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    await adminDb.collection('reputationSettings').doc(companyId).set({
      companyId,
      ...params.settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving reputation settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Get reputation statistics
 */
export async function getReputationStatsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; stats?: ReputationStats; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    // Get all reviews
    const reviewsSnapshot = await adminDb.collection('reviews')
      .where('companyId', '==', companyId)
      .get();

    const reviews = reviewsSnapshot.docs.map(doc => doc.data() as Review);

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const platformStats: Record<string, { count: number; total: number }> = {};

    reviews.forEach(review => {
      // Count by rating
      if (review.rating >= 1 && review.rating <= 5) {
        ratingCounts[review.rating as keyof typeof ratingCounts]++;
      }

      // Count by platform
      if (!platformStats[review.platform]) {
        platformStats[review.platform] = { count: 0, total: 0 };
      }
      platformStats[review.platform].count++;
      platformStats[review.platform].total += review.rating;
    });

    // Get review requests
    const requestsSnapshot = await adminDb.collection('reviewRequests')
      .where('companyId', '==', companyId)
      .get();

    const requests = requestsSnapshot.docs.map(doc => doc.data() as ReviewRequest);
    const reviewedRequests = requests.filter(r => r.status === 'reviewed').length;

    // This month stats
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const thisMonthReviews = reviews.filter(r => 
      new Date(r.reviewDate) >= startOfMonth
    ).length;

    const lastMonthReviews = reviews.filter(r => {
      const date = new Date(r.reviewDate);
      return date >= startOfLastMonth && date < startOfMonth;
    }).length;

    const requestsThisMonth = requests.filter(r =>
      new Date(r.createdAt) >= startOfMonth
    ).length;

    return {
      success: true,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        fiveStarCount: ratingCounts[5],
        fourStarCount: ratingCounts[4],
        threeStarCount: ratingCounts[3],
        twoStarCount: ratingCounts[2],
        oneStarCount: ratingCounts[1],
        byPlatform: Object.entries(platformStats).map(([platform, data]) => ({
          platform: platform as any,
          count: data.count,
          avgRating: Math.round((data.total / data.count) * 10) / 10,
        })),
        totalRequests: requests.length,
        requestsThisMonth,
        conversionRate: requests.length > 0 
          ? Math.round((reviewedRequests / requests.length) * 100) 
          : 0,
        thisMonthReviews,
        lastMonthReviews,
        ratingTrend: thisMonthReviews > lastMonthReviews ? 'up' : 
                     thisMonthReviews < lastMonthReviews ? 'down' : 'stable',
      },
    };
  } catch (error) {
    console.error('Error fetching reputation stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

/**
 * Send a review request
 */
export async function sendReviewRequestAction(params: {
  idToken: string;
  request: ReviewRequestInput;
}): Promise<{ success: boolean; requestId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    // Get settings for review link
    const settingsDoc = await adminDb.collection('reputationSettings').doc(companyId).get();
    const settings = settingsDoc.exists ? settingsDoc.data() as ReputationSettings : null;

    // Determine review link
    let reviewLink = '';
    if (params.request.platform === 'google' && settings?.googleReviewLink) {
      reviewLink = settings.googleReviewLink;
    } else if (params.request.platform === 'facebook' && settings?.facebookReviewLink) {
      reviewLink = settings.facebookReviewLink;
    } else if (settings?.customReviewLink) {
      reviewLink = settings.customReviewLink;
    }

    if (!reviewLink) {
      return { success: false, error: 'No review link configured for this platform' };
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const reviewRequest: ReviewRequest = {
      id: requestId,
      companyId,
      recipientName: params.request.recipientName,
      recipientEmail: params.request.recipientEmail,
      recipientPhone: params.request.recipientPhone,
      leadId: params.request.leadId,
      platform: params.request.platform,
      reviewLink,
      status: 'pending',
      channel: params.request.channel,
      messageTemplate: params.request.customMessage,
      createdBy: verification.uid,
      createdAt: now,
    };

    await adminDb.collection('reviewRequests').doc(requestId).set(reviewRequest);

    // Queue the message to be sent
    await adminDb.collection('messageQueue').add({
      companyId,
      type: 'review_request',
      requestId,
      channel: params.request.channel,
      recipient: params.request.channel === 'email' 
        ? params.request.recipientEmail 
        : params.request.recipientPhone,
      recipientName: params.request.recipientName,
      reviewLink,
      platform: params.request.platform,
      customMessage: params.request.customMessage,
      createdAt: now,
    });

    // Update request status to sent
    await adminDb.collection('reviewRequests').doc(requestId).update({
      status: 'sent',
      sentAt: now,
    });

    return { success: true, requestId };
  } catch (error) {
    console.error('Error sending review request:', error);
    return { success: false, error: 'Failed to send review request' };
  }
}

/**
 * Get recent review requests
 */
export async function getReviewRequestsAction(params: {
  idToken: string;
  limit?: number;
}): Promise<{ success: boolean; requests?: ReviewRequest[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const snapshot = await adminDb.collection('reviewRequests')
      .where('companyId', '==', companyId)
      .orderBy('createdAt', 'desc')
      .limit(params.limit || 50)
      .get();

    const requests = snapshot.docs.map(doc => doc.data() as ReviewRequest);

    return { success: true, requests };
  } catch (error) {
    console.error('Error fetching review requests:', error);
    return { success: false, error: 'Failed to fetch requests' };
  }
}

/**
 * Get reviews
 */
export async function getReviewsAction(params: {
  idToken: string;
  platform?: string;
  limit?: number;
}): Promise<{ success: boolean; reviews?: Review[]; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    let query = adminDb.collection('reviews')
      .where('companyId', '==', companyId)
      .orderBy('reviewDate', 'desc')
      .limit(params.limit || 100);

    const snapshot = await query.get();
    let reviews = snapshot.docs.map(doc => doc.data() as Review);

    if (params.platform) {
      reviews = reviews.filter(r => r.platform === params.platform);
    }

    return { success: true, reviews };
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return { success: false, error: 'Failed to fetch reviews' };
  }
}

/**
 * Generate Google Review Link
 */
export async function generateGoogleReviewLinkAction(params: {
  idToken: string;
  placeId: string;
}): Promise<{ success: boolean; reviewLink?: string; error?: string }> {
  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    // Google review link format
    const reviewLink = `https://search.google.com/local/writereview?placeid=${params.placeId}`;

    return { success: true, reviewLink };
  } catch (error) {
    console.error('Error generating review link:', error);
    return { success: false, error: 'Failed to generate link' };
  }
}

/**
 * Add a manual review (for tracking reviews from various sources)
 */
export async function addManualReviewAction(params: {
  idToken: string;
  review: {
    platform: string;
    reviewerName: string;
    rating: number;
    content: string;
    reviewDate: string;
  };
}): Promise<{ success: boolean; reviewId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Unauthorized' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }

    const userData = userDoc.data();
    const companyId = userData?.companyId;

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date().toISOString();

    const review: Review = {
      id: reviewId,
      companyId,
      platform: params.review.platform as any,
      reviewerName: params.review.reviewerName,
      rating: params.review.rating,
      content: params.review.content,
      reviewDate: params.review.reviewDate,
      responded: false,
      importedAt: now,
    };

    await adminDb.collection('reviews').doc(reviewId).set(review);

    return { success: true, reviewId };
  } catch (error) {
    console.error('Error adding review:', error);
    return { success: false, error: 'Failed to add review' };
  }
}
