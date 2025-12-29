/**
 * Social Media Publisher - Actual API posting to social platforms
 * 
 * Supports:
 * - Facebook Pages (Graph API)
 * - Instagram Business (via Facebook Graph API)
 * - LinkedIn (Marketing API)
 * - Twitter/X (API v2)
 */

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter';

export interface PublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  platform: SocialPlatform;
}

export interface PublishOptions {
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  link?: string;
  hashtags?: string[];
}

export interface SocialCredentials {
  accessToken: string;
  refreshToken?: string;
  pageId?: string; // For Facebook/Instagram
  userId?: string; // For LinkedIn
}

// ============================================
// FACEBOOK PAGES API
// ============================================
export async function publishToFacebook(
  credentials: SocialCredentials,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken, pageId } = credentials;
  
  if (!pageId) {
    return { success: false, error: 'Facebook Page ID required', platform: 'facebook' };
  }

  try {
    const message = formatContent(options);
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;
    let body: Record<string, string> = {
      message,
      access_token: accessToken,
    };

    // If posting with image
    if (options.imageUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;
      body = {
        url: options.imageUrl,
        caption: message,
        access_token: accessToken,
      };
    }

    // If posting with link
    if (options.link && !options.imageUrl) {
      body.link = options.link;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    const data = await response.json();

    if (data.error) {
      return { 
        success: false, 
        error: data.error.message || 'Facebook API error', 
        platform: 'facebook' 
      };
    }

    const postId = data.id || data.post_id;
    return {
      success: true,
      postId,
      postUrl: `https://www.facebook.com/${postId}`,
      platform: 'facebook',
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to post to Facebook', 
      platform: 'facebook' 
    };
  }
}

// ============================================
// INSTAGRAM BUSINESS API (via Facebook Graph API)
// ============================================
export async function publishToInstagram(
  credentials: SocialCredentials,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken, pageId } = credentials; // pageId is Instagram Business Account ID
  
  if (!pageId) {
    return { success: false, error: 'Instagram Business Account ID required', platform: 'instagram' };
  }

  if (!options.imageUrl) {
    return { success: false, error: 'Instagram requires an image', platform: 'instagram' };
  }

  try {
    const caption = formatContent(options);

    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          image_url: options.imageUrl,
          caption,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      return { 
        success: false, 
        error: containerData.error.message || 'Instagram container creation failed', 
        platform: 'instagram' 
      };
    }

    const containerId = containerData.id;

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      return { 
        success: false, 
        error: publishData.error.message || 'Instagram publish failed', 
        platform: 'instagram' 
      };
    }

    return {
      success: true,
      postId: publishData.id,
      postUrl: `https://www.instagram.com/p/${publishData.id}/`,
      platform: 'instagram',
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to post to Instagram', 
      platform: 'instagram' 
    };
  }
}

// ============================================
// LINKEDIN API
// ============================================
export async function publishToLinkedIn(
  credentials: SocialCredentials,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken, userId } = credentials;
  
  if (!userId) {
    return { success: false, error: 'LinkedIn User/Organization ID required', platform: 'linkedin' };
  }

  try {
    const text = formatContent(options, 3000); // LinkedIn limit

    // Build the share content
    const shareContent: any = {
      author: `urn:li:person:${userId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: options.imageUrl ? 'IMAGE' : (options.link ? 'ARTICLE' : 'NONE'),
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // Add media if present
    if (options.imageUrl) {
      // For images, we need to first upload the image to LinkedIn
      // This is a simplified version - full implementation needs image upload flow
      shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: options.imageUrl,
      }];
    } else if (options.link) {
      shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [{
        status: 'READY',
        originalUrl: options.link,
      }];
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(shareContent),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || `LinkedIn API error: ${response.status}`, 
        platform: 'linkedin' 
      };
    }

    const data = await response.json();
    const postId = data.id;

    return {
      success: true,
      postId,
      postUrl: `https://www.linkedin.com/feed/update/${postId}`,
      platform: 'linkedin',
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to post to LinkedIn', 
      platform: 'linkedin' 
    };
  }
}

// ============================================
// TWITTER/X API v2
// ============================================
export async function publishToTwitter(
  credentials: SocialCredentials,
  options: PublishOptions
): Promise<PublishResult> {
  const { accessToken } = credentials;

  try {
    const text = formatContent(options, 280); // Twitter limit

    let body: any = { text };

    // If there's an image, we need to upload it first via media endpoint
    // This is simplified - full implementation needs media upload
    if (options.imageUrl && !options.imageUrl.startsWith('data:')) {
      // Twitter requires media to be uploaded separately
      // For now, we'll just post text
      console.log('Twitter image upload requires separate media endpoint');
    }

    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.detail || errorData.title || `Twitter API error: ${response.status}`, 
        platform: 'twitter' 
      };
    }

    const data = await response.json();
    const tweetId = data.data?.id;

    return {
      success: true,
      postId: tweetId,
      postUrl: `https://twitter.com/i/web/status/${tweetId}`,
      platform: 'twitter',
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to post to Twitter', 
      platform: 'twitter' 
    };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatContent(options: PublishOptions, maxLength?: number): string {
  let content = options.content;
  
  // Add hashtags if provided
  if (options.hashtags && options.hashtags.length > 0) {
    const hashtagString = options.hashtags
      .map(tag => tag.startsWith('#') ? tag : `#${tag}`)
      .join(' ');
    content = `${content}\n\n${hashtagString}`;
  }

  // Truncate if needed
  if (maxLength && content.length > maxLength) {
    content = content.substring(0, maxLength - 3) + '...';
  }

  return content;
}

// ============================================
// UNIFIED PUBLISH FUNCTION
// ============================================
export async function publishToSocialMedia(
  platform: SocialPlatform,
  credentials: SocialCredentials,
  options: PublishOptions
): Promise<PublishResult> {
  switch (platform) {
    case 'facebook':
      return publishToFacebook(credentials, options);
    case 'instagram':
      return publishToInstagram(credentials, options);
    case 'linkedin':
      return publishToLinkedIn(credentials, options);
    case 'twitter':
      return publishToTwitter(credentials, options);
    default:
      return { 
        success: false, 
        error: `Unsupported platform: ${platform}`, 
        platform 
      };
  }
}

// ============================================
// OAUTH URL GENERATORS
// ============================================
export function getFacebookOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = [
    'pages_show_list',
    'pages_read_engagement', 
    'pages_manage_posts',
    'instagram_basic',
    'instagram_content_publish',
  ].join(',');
  
  return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code`;
}

export function getLinkedInOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = ['r_liteprofile', 'w_member_social'].join(' ');
  
  return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
}

export function getTwitterOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const scopes = ['tweet.read', 'tweet.write', 'users.read'].join(' ');
  
  return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}&code_challenge=challenge&code_challenge_method=plain`;
}
