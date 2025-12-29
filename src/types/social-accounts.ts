// Social Media Account Connection Types

export type SocialPlatformType = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads' | 'pinterest' | 'tiktok' | 'youtube';

export interface SocialAccount {
  id: string;
  companyId: string;
  platform: SocialPlatformType;
  accountName: string;
  accountId: string; // Platform-specific account/page ID
  accessToken: string; // Encrypted
  refreshToken?: string; // For platforms that use refresh tokens
  tokenExpiresAt?: string;
  profileImageUrl?: string;
  isConnected: boolean;
  connectedAt: string;
  lastUsedAt?: string;
  permissions?: string[]; // Granted permissions
  metadata?: Record<string, any>; // Platform-specific metadata
}

export interface ScheduledPost {
  id: string;
  companyId: string;
  postId: string; // Reference to socialPosts collection
  platforms: SocialPlatformType[];
  scheduledAt: string;
  status: 'pending' | 'publishing' | 'published' | 'failed' | 'cancelled';
  publishedAt?: string;
  errorMessage?: string;
  retryCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  platforms: SocialPlatformType[];
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  postId?: string;
  color?: string;
}

export const PLATFORM_CONFIG: Record<SocialPlatformType, {
  name: string;
  icon: string;
  color: string;
  supportsDirectPublish: boolean;
  supportsScheduling: boolean;
  characterLimit?: number;
  supportsImages: boolean;
  supportsVideo: boolean;
  authUrl?: string;
}> = {
  facebook: {
    name: 'Facebook',
    icon: 'logos:facebook',
    color: '#1877F2',
    supportsDirectPublish: true,
    supportsScheduling: true,
    supportsImages: true,
    supportsVideo: true,
  },
  instagram: {
    name: 'Instagram',
    icon: 'skill-icons:instagram',
    color: '#E4405F',
    supportsDirectPublish: true,
    supportsScheduling: true,
    supportsImages: true,
    supportsVideo: true,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'logos:linkedin-icon',
    color: '#0A66C2',
    supportsDirectPublish: true,
    supportsScheduling: true,
    characterLimit: 3000,
    supportsImages: true,
    supportsVideo: true,
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'ri:twitter-x-fill',
    color: '#000000',
    supportsDirectPublish: true,
    supportsScheduling: true,
    characterLimit: 280,
    supportsImages: true,
    supportsVideo: true,
  },
  threads: {
    name: 'Threads',
    icon: 'ri:threads-fill',
    color: '#000000',
    supportsDirectPublish: false,
    supportsScheduling: false,
    characterLimit: 500,
    supportsImages: true,
    supportsVideo: false,
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'logos:pinterest',
    color: '#E60023',
    supportsDirectPublish: true,
    supportsScheduling: true,
    supportsImages: true,
    supportsVideo: true,
  },
  tiktok: {
    name: 'TikTok',
    icon: 'logos:tiktok-icon',
    color: '#000000',
    supportsDirectPublish: false,
    supportsScheduling: false,
    supportsImages: false,
    supportsVideo: true,
  },
  youtube: {
    name: 'YouTube',
    icon: 'logos:youtube-icon',
    color: '#FF0000',
    supportsDirectPublish: false,
    supportsScheduling: false,
    supportsImages: false,
    supportsVideo: true,
  },
};
