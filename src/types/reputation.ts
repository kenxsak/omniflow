/**
 * Reputation Management Types
 * For managing reviews, review requests, and reputation tracking
 */

export type ReviewPlatform = 'google' | 'facebook' | 'trustpilot' | 'yelp' | 'custom';
export type ReviewRequestStatus = 'pending' | 'sent' | 'clicked' | 'reviewed' | 'expired';

export interface Review {
  id: string;
  companyId: string;
  
  // Source
  platform: ReviewPlatform;
  platformReviewId?: string;
  
  // Reviewer
  reviewerName: string;
  reviewerEmail?: string;
  reviewerPhone?: string;
  leadId?: string;              // Link to CRM lead
  
  // Review content
  rating: number;               // 1-5 stars
  title?: string;
  content: string;
  
  // Response
  responded: boolean;
  responseContent?: string;
  respondedAt?: string;
  respondedBy?: string;
  
  // Metadata
  reviewDate: string;
  importedAt: string;
  
  // Sentiment (AI-analyzed)
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords?: string[];
}

export interface ReviewRequest {
  id: string;
  companyId: string;
  
  // Recipient
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  leadId?: string;
  
  // Request details
  platform: ReviewPlatform;
  reviewLink: string;
  
  // Status tracking
  status: ReviewRequestStatus;
  sentAt?: string;
  clickedAt?: string;
  reviewedAt?: string;
  
  // Delivery
  channel: 'email' | 'sms' | 'whatsapp';
  messageTemplate?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
}

export interface ReviewLink {
  id: string;
  companyId: string;
  
  platform: ReviewPlatform;
  name: string;                 // e.g., "Google My Business - Main Location"
  url: string;                  // Direct review link
  shortUrl?: string;            // Shortened URL for tracking
  
  // Stats
  clickCount: number;
  reviewCount: number;
  
  isDefault: boolean;
  createdAt: string;
}

export interface ReputationSettings {
  companyId: string;
  
  // Review links
  googleReviewLink?: string;
  facebookReviewLink?: string;
  customReviewLink?: string;
  
  // Auto-request settings
  autoRequestEnabled: boolean;
  autoRequestDelay: number;     // Days after deal won
  autoRequestChannel: 'email' | 'sms' | 'whatsapp';
  
  // Templates
  emailSubject?: string;
  emailTemplate?: string;
  smsTemplate?: string;
  whatsappTemplate?: string;
  
  // Thresholds
  minRatingToRequest: number;   // Only request if predicted rating >= this
  
  updatedAt: string;
}

export interface ReputationStats {
  totalReviews: number;
  averageRating: number;
  
  // By rating
  fiveStarCount: number;
  fourStarCount: number;
  threeStarCount: number;
  twoStarCount: number;
  oneStarCount: number;
  
  // By platform
  byPlatform: {
    platform: ReviewPlatform;
    count: number;
    avgRating: number;
  }[];
  
  // Requests
  totalRequests: number;
  requestsThisMonth: number;
  conversionRate: number;       // % of requests that resulted in reviews
  
  // Trends
  thisMonthReviews: number;
  lastMonthReviews: number;
  ratingTrend: 'up' | 'down' | 'stable';
}

export interface ReviewRequestInput {
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  leadId?: string;
  platform: ReviewPlatform;
  channel: 'email' | 'sms' | 'whatsapp';
  customMessage?: string;
}
