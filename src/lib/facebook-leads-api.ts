/**
 * Facebook Lead Ads API Utilities
 * 
 * Handles webhook signature verification, lead data fetching,
 * and field mapping for Facebook Lead Ads integration.
 */

import crypto from 'crypto';
import {
  FacebookLeadData,
  FacebookLeadsConfig,
  FacebookTokenValidation,
  FacebookSyncResult,
  MappedFacebookLead,
  FacebookFieldData,
  FACEBOOK_FIELD_MAPPING,
  STANDARD_FACEBOOK_FIELDS,
} from '@/types/facebook-leads';

// ============================================
// Signature Verification
// ============================================

/**
 * Verify Facebook webhook signature using HMAC-SHA256
 * 
 * @param payload - Raw request body as string
 * @param signature - X-Hub-Signature-256 header value
 * @param appSecret - Facebook App Secret
 * @returns true if signature is valid
 */
export function verifyFacebookSignature(
  payload: string,
  signature: string,
  appSecret: string
): boolean {
  if (payload === null || payload === undefined || !signature || !appSecret) {
    return false;
  }

  // Signature format: sha256=<hash>
  const signatureParts = signature.split('=');
  if (signatureParts.length !== 2 || signatureParts[0] !== 'sha256') {
    return false;
  }

  const receivedHash = signatureParts[1];
  
  // Compute expected hash
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    // Ensure both are valid hex strings of same length
    if (receivedHash.length !== expectedHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'hex'),
      Buffer.from(expectedHash, 'hex')
    );
  } catch {
    // If buffers have different lengths or invalid hex, comparison fails
    return false;
  }
}

/**
 * Compute Facebook signature for a payload (for testing)
 * 
 * @param payload - Request body as string
 * @param appSecret - Facebook App Secret
 * @returns Signature in format sha256=<hash>
 */
export function computeFacebookSignature(
  payload: string,
  appSecret: string
): string {
  const hash = crypto
    .createHmac('sha256', appSecret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return `sha256=${hash}`;
}

// ============================================
// Lead Field Mapping
// ============================================

/**
 * Extract a single value from Facebook field data
 */
function getFieldValue(fieldData: FacebookFieldData[], fieldName: string): string | undefined {
  const field = fieldData.find(f => f.name === fieldName);
  return field?.values?.[0];
}

/**
 * Map Facebook lead data to CRM lead format
 * 
 * @param fbLead - Raw lead data from Facebook
 * @param pageName - Optional page name for source details
 * @returns Mapped lead ready for CRM
 */
export function mapFacebookLeadToCRM(
  fbLead: FacebookLeadData,
  pageName?: string
): MappedFacebookLead {
  const fieldData = fbLead.field_data || [];
  
  // Extract standard fields
  const name = getFieldValue(fieldData, 'full_name') || 'Unknown';
  const email = getFieldValue(fieldData, 'email') || '';
  const phone = getFieldValue(fieldData, 'phone_number');
  const company = getFieldValue(fieldData, 'company_name');
  const jobTitle = getFieldValue(fieldData, 'job_title');
  const city = getFieldValue(fieldData, 'city');
  const state = getFieldValue(fieldData, 'state');
  const country = getFieldValue(fieldData, 'country');
  
  // Build address for notes
  const streetAddress = getFieldValue(fieldData, 'street_address');
  const zipCode = getFieldValue(fieldData, 'zip_code');
  
  // Extract custom fields (non-standard)
  const customFields: Record<string, string> = {};
  const noteParts: string[] = [];
  
  for (const field of fieldData) {
    if (!STANDARD_FACEBOOK_FIELDS.includes(field.name)) {
      // Custom question from lead form
      const value = field.values?.[0];
      if (value) {
        customFields[field.name] = value;
        noteParts.push(`${field.name}: ${value}`);
      }
    }
  }
  
  // Add address to notes if present
  if (streetAddress) {
    noteParts.unshift(`Address: ${streetAddress}`);
  }
  if (zipCode) {
    noteParts.unshift(`Zip: ${zipCode}`);
  }
  
  const notes = noteParts.length > 0 
    ? `Facebook Lead Form Responses:\n${noteParts.join('\n')}`
    : undefined;

  return {
    name,
    email,
    phone,
    company,
    jobTitle,
    city,
    state,
    country,
    source: 'facebook_lead_ad',
    sourceDetails: {
      facebookLeadId: fbLead.id,
      formId: fbLead.form_id,
      pageId: fbLead.page_id,
      pageName,
      campaignId: fbLead.campaign_id,
      adId: fbLead.ad_id,
      adsetId: fbLead.adset_id,
    },
    notes,
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
  };
}

// ============================================
// Facebook Graph API Calls
// ============================================

const FACEBOOK_GRAPH_API_VERSION = 'v18.0';
const FACEBOOK_GRAPH_API_BASE = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

/**
 * Fetch full lead details from Facebook Graph API
 * 
 * @param leadId - Facebook lead ID
 * @param accessToken - Page Access Token
 * @returns Lead data or null if not found
 */
export async function fetchLeadDetails(
  leadId: string,
  accessToken: string
): Promise<FacebookLeadData | null> {
  try {
    const url = `${FACEBOOK_GRAPH_API_BASE}/${leadId}?access_token=${accessToken}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Facebook API error:', error);
      return null;
    }

    const data = await response.json();
    return data as FacebookLeadData;
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return null;
  }
}

/**
 * Fetch recent leads from a Facebook Page
 * 
 * @param pageId - Facebook Page ID
 * @param accessToken - Page Access Token
 * @param since - Fetch leads created after this date
 * @returns Array of lead data
 */
export async function fetchRecentLeads(
  pageId: string,
  accessToken: string,
  since: Date
): Promise<FacebookLeadData[]> {
  const leads: FacebookLeadData[] = [];
  const sinceTimestamp = Math.floor(since.getTime() / 1000);
  
  try {
    // First, get all lead forms for the page
    const formsUrl = `${FACEBOOK_GRAPH_API_BASE}/${pageId}/leadgen_forms?access_token=${accessToken}`;
    const formsResponse = await fetch(formsUrl);
    
    if (!formsResponse.ok) {
      console.error('Failed to fetch lead forms');
      return leads;
    }
    
    const formsData = await formsResponse.json();
    const forms = formsData.data || [];
    
    // For each form, fetch leads
    for (const form of forms) {
      const leadsUrl = `${FACEBOOK_GRAPH_API_BASE}/${form.id}/leads?filtering=[{"field":"time_created","operator":"GREATER_THAN","value":${sinceTimestamp}}]&access_token=${accessToken}`;
      
      const leadsResponse = await fetch(leadsUrl);
      if (leadsResponse.ok) {
        const leadsData = await leadsResponse.json();
        const formLeads = leadsData.data || [];
        
        for (const lead of formLeads) {
          leads.push({
            ...lead,
            form_id: form.id,
            page_id: pageId,
          });
        }
      }
    }
    
    return leads;
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    return leads;
  }
}

/**
 * Validate a Page Access Token
 * 
 * @param accessToken - Token to validate
 * @returns Validation result with page info
 */
export async function validateAccessToken(
  accessToken: string
): Promise<FacebookTokenValidation> {
  try {
    // Use the /me endpoint to validate token and get page info
    const url = `${FACEBOOK_GRAPH_API_BASE}/me?fields=id,name&access_token=${accessToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      return {
        valid: false,
        error: error.error?.message || 'Invalid access token',
      };
    }
    
    const data = await response.json();
    
    return {
      valid: true,
      pageId: data.id,
      pageName: data.name,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate token',
    };
  }
}

/**
 * Generate a random verify token for webhook setup
 */
export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
