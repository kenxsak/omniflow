/**
 * Buffer API Integration
 * 
 * Buffer handles all social media complexity - we just need to:
 * 1. OAuth to connect user's Buffer account
 * 2. Use Buffer API to publish/schedule posts
 * 
 * Free tier: 3 channels (e.g., Facebook + Instagram + LinkedIn)
 * Users can upgrade their Buffer plan for more channels
 */

export interface BufferProfile {
  id: string;
  service: string; // 'facebook', 'instagram', 'linkedin', 'twitter', 'pinterest'
  formatted_service: string;
  formatted_username: string;
  avatar: string;
  default: boolean;
  schedules: any[];
}

export interface BufferUser {
  id: string;
  name: string;
  email: string;
  plan: string;
  profiles: BufferProfile[];
}

export interface BufferPublishResult {
  success: boolean;
  updates?: any[];
  error?: string;
  message?: string;
}

export interface BufferPostOptions {
  text: string;
  media?: {
    link?: string;
    photo?: string;
    thumbnail?: string;
  };
  scheduled_at?: string; // ISO date string for scheduling
  now?: boolean; // Publish immediately
}

const BUFFER_API_BASE = 'https://api.bufferapp.com/1';

/**
 * Get Buffer OAuth URL for user authorization
 */
export function getBufferOAuthUrl(clientId: string, redirectUri: string, state: string): string {
  return `https://bufferapp.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeBufferCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ access_token: string } | { error: string }> {
  try {
    const response = await fetch(`${BUFFER_API_BASE}/oauth2/token.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      return { error: data.error_description || data.error };
    }

    return { access_token: data.access_token };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to exchange code' };
  }
}

/**
 * Get user info and connected profiles
 */
export async function getBufferUser(accessToken: string): Promise<BufferUser | { error: string }> {
  try {
    // Get user info
    const userResponse = await fetch(`${BUFFER_API_BASE}/user.json?access_token=${accessToken}`);
    const userData = await userResponse.json();

    if (userData.error) {
      return { error: userData.error };
    }

    // Get profiles (connected social accounts)
    const profilesResponse = await fetch(`${BUFFER_API_BASE}/profiles.json?access_token=${accessToken}`);
    const profilesData = await profilesResponse.json();

    if (profilesData.error) {
      return { error: profilesData.error };
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email || '',
      plan: userData.plan || 'free',
      profiles: profilesData,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get user info' };
  }
}

/**
 * Get all connected profiles (social accounts)
 */
export async function getBufferProfiles(accessToken: string): Promise<BufferProfile[] | { error: string }> {
  try {
    const response = await fetch(`${BUFFER_API_BASE}/profiles.json?access_token=${accessToken}`);
    const data = await response.json();

    if (data.error) {
      return { error: data.error };
    }

    return data;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get profiles' };
  }
}

/**
 * Publish or schedule a post to specific profiles
 */
export async function publishToBuffer(
  accessToken: string,
  profileIds: string[],
  options: BufferPostOptions
): Promise<BufferPublishResult> {
  try {
    const body: Record<string, any> = {
      text: options.text,
      profile_ids: profileIds,
      access_token: accessToken,
    };

    // Add media if provided
    if (options.media?.photo) {
      body['media[photo]'] = options.media.photo;
    }
    if (options.media?.link) {
      body['media[link]'] = options.media.link;
    }
    if (options.media?.thumbnail) {
      body['media[thumbnail]'] = options.media.thumbnail;
    }

    // Schedule or publish now
    if (options.scheduled_at) {
      body.scheduled_at = options.scheduled_at;
    } else if (options.now) {
      body.now = true;
    } else {
      // Add to queue (Buffer's default behavior)
      body.top = false;
    }

    const response = await fetch(`${BUFFER_API_BASE}/updates/create.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error };
    }

    return {
      success: true,
      updates: data.updates || [data],
      message: data.message || 'Post created successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish',
    };
  }
}

/**
 * Get pending updates (scheduled posts) for a profile
 */
export async function getBufferPendingUpdates(
  accessToken: string,
  profileId: string
): Promise<any[] | { error: string }> {
  try {
    const response = await fetch(
      `${BUFFER_API_BASE}/profiles/${profileId}/updates/pending.json?access_token=${accessToken}`
    );
    const data = await response.json();

    if (data.error) {
      return { error: data.error };
    }

    return data.updates || [];
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to get pending updates' };
  }
}

/**
 * Delete a scheduled update
 */
export async function deleteBufferUpdate(
  accessToken: string,
  updateId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${BUFFER_API_BASE}/updates/${updateId}/destroy.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ access_token: accessToken }),
    });

    const data = await response.json();

    if (data.error) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete update' };
  }
}

/**
 * Map Buffer service names to our platform types
 */
export function mapBufferServiceToPlatform(service: string): string {
  const mapping: Record<string, string> = {
    facebook: 'facebook',
    instagram: 'instagram',
    linkedin: 'linkedin',
    twitter: 'twitter',
    pinterest: 'pinterest',
    googlebusiness: 'google',
    tiktok: 'tiktok',
    youtube: 'youtube',
    mastodon: 'mastodon',
    threads: 'threads',
  };
  return mapping[service.toLowerCase()] || service.toLowerCase();
}

/**
 * Get platform icon for Buffer service
 */
export function getBufferServiceIcon(service: string): string {
  const icons: Record<string, string> = {
    facebook: 'logos:facebook',
    instagram: 'skill-icons:instagram',
    linkedin: 'logos:linkedin-icon',
    twitter: 'ri:twitter-x-fill',
    pinterest: 'logos:pinterest',
    googlebusiness: 'logos:google-icon',
    tiktok: 'logos:tiktok-icon',
    youtube: 'logos:youtube-icon',
    mastodon: 'logos:mastodon-icon',
    threads: 'ri:threads-fill',
  };
  return icons[service.toLowerCase()] || 'solar:share-circle-linear';
}
