/**
 * Facebook Lead Ads Integration Types
 * 
 * Types for handling Facebook Lead Ads webhook payloads,
 * lead data mapping, and configuration storage.
 */

// ============================================
// Facebook Webhook Payload Types
// ============================================

/**
 * Individual field data from a Facebook lead form
 */
export interface FacebookFieldData {
  name: string;
  values: string[];
}

/**
 * Lead data returned from Facebook Graph API
 */
export interface FacebookLeadData {
  id: string;
  created_time: string;
  field_data: FacebookFieldData[];
  form_id?: string;
  page_id?: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
}

/**
 * Leadgen value in webhook payload
 */
export interface FacebookLeadgenValue {
  leadgen_id: string;
  page_id: string;
  form_id: string;
  adgroup_id?: string;
  ad_id?: string;
  created_time: number;
}

/**
 * Change entry in webhook payload
 */
export interface FacebookWebhookChange {
  field: string;
  value: FacebookLeadgenValue;
}

/**
 * Entry in webhook payload
 */
export interface FacebookWebhookEntry {
  id: string;
  time: number;
  changes: FacebookWebhookChange[];
}

/**
 * Full webhook payload from Facebook
 */
export interface FacebookWebhookPayload {
  object: string;
  entry: FacebookWebhookEntry[];
}

// ============================================
// Configuration Types
// ============================================

/**
 * Facebook Lead Ads configuration stored per company
 */
export interface FacebookLeadsConfig {
  appId: string;
  appSecret: string;
  pageAccessToken: string;
  verifyToken: string;
  pageId?: string;
  pageName?: string;
  isConnected: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Encrypted configuration as stored in Firestore
 */
export interface FacebookLeadsConfigEncrypted {
  appId: string;
  appSecret: string; // Encrypted
  pageAccessToken: string; // Encrypted
  verifyToken: string;
  pageId?: string;
  pageName?: string;
  isConnected: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Mapped Lead Types
// ============================================

/**
 * Source details for leads from Facebook
 */
export interface FacebookLeadSourceDetails {
  facebookLeadId: string;
  formId?: string;
  pageId?: string;
  pageName?: string;
  campaignId?: string;
  adId?: string;
  adsetId?: string;
}

/**
 * Lead data mapped from Facebook to CRM format
 */
export interface MappedFacebookLead {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  country?: string;
  source: 'facebook_lead_ad';
  sourceDetails: FacebookLeadSourceDetails;
  notes?: string;
  customFields?: Record<string, string>;
}

// ============================================
// Webhook Log Types
// ============================================

/**
 * Types of webhook events
 */
export type FacebookWebhookEventType = 
  | 'verification'
  | 'lead_received'
  | 'lead_processed'
  | 'error';

/**
 * Webhook log entry stored in Firestore
 */
export interface FacebookWebhookLog {
  id: string;
  companyId: string;
  timestamp: string;
  eventType: FacebookWebhookEventType;
  leadId?: string;
  facebookLeadId?: string;
  payload?: Record<string, unknown>;
  error?: string;
  processed: boolean;
  crmLeadId?: string;
}

// ============================================
// API Response Types
// ============================================

/**
 * Response from Facebook token validation
 */
export interface FacebookTokenValidation {
  valid: boolean;
  pageName?: string;
  pageId?: string;
  error?: string;
}

/**
 * Result of manual lead sync operation
 */
export interface FacebookSyncResult {
  success: boolean;
  synced: number;
  skipped: number;
  errors: number;
  errorMessages?: string[];
}

/**
 * Result of connection test
 */
export interface FacebookConnectionTestResult {
  success: boolean;
  pageName?: string;
  pageId?: string;
  error?: string;
}

// ============================================
// Field Mapping Constants
// ============================================

/**
 * Standard Facebook field names mapped to CRM field names
 */
export const FACEBOOK_FIELD_MAPPING: Record<string, keyof MappedFacebookLead> = {
  'full_name': 'name',
  'email': 'email',
  'phone_number': 'phone',
  'company_name': 'company',
  'job_title': 'jobTitle',
  'city': 'city',
  'state': 'state',
  'country': 'country',
  'street_address': 'notes', // Will be appended to notes
  'zip_code': 'notes', // Will be appended to notes
};

/**
 * Fields that should be treated as standard (not custom)
 */
export const STANDARD_FACEBOOK_FIELDS = [
  'full_name',
  'email',
  'phone_number',
  'company_name',
  'job_title',
  'city',
  'state',
  'country',
  'street_address',
  'zip_code',
];
