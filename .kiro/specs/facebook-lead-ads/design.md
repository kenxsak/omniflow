# Design Document: Facebook Lead Ads Integration

## Overview

This design implements automatic lead synchronization from Facebook Lead Ads to OmniFlow CRM. The system uses Facebook's Webhooks API to receive real-time lead notifications and the Leads API for manual sync operations.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Facebook Ads   │────▶│  OmniFlow API    │────▶│  Firestore DB   │
│  (Lead Forms)   │     │  /api/webhooks/  │     │  (leads, logs)  │
└─────────────────┘     │  facebook-leads  │     └─────────────────┘
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Notification    │
                        │  System          │
                        └──────────────────┘
```

## Components and Interfaces

### 1. Webhook Endpoint

**File:** `src/app/api/webhooks/facebook-leads/route.ts`

```typescript
// GET - Webhook verification
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  
  // Verify token matches our configured verify token
  // Return challenge if valid
}

// POST - Receive lead data
export async function POST(request: Request) {
  // 1. Verify signature using X-Hub-Signature-256 header
  // 2. Parse lead notification payload
  // 3. Fetch full lead data from Facebook API
  // 4. Create/update lead in CRM
  // 5. Trigger notifications
  // 6. Return 200 OK
}
```

### 2. Facebook API Service

**File:** `src/lib/facebook-leads-api.ts`

```typescript
interface FacebookLeadData {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
  form_id: string;
  page_id: string;
  ad_id?: string;
  adset_id?: string;
  campaign_id?: string;
}

interface FacebookLeadsConfig {
  appId: string;
  appSecret: string;
  pageAccessToken: string;
  verifyToken: string;
}

// Verify webhook signature
function verifySignature(payload: string, signature: string, appSecret: string): boolean

// Fetch lead details from Facebook
async function fetchLeadDetails(leadId: string, accessToken: string): Promise<FacebookLeadData>

// Fetch recent leads for manual sync
async function fetchRecentLeads(pageId: string, accessToken: string, since: Date): Promise<FacebookLeadData[]>

// Validate page access token
async function validateAccessToken(accessToken: string): Promise<{valid: boolean, pageName?: string}>
```

### 3. Lead Mapping Service

**File:** `src/lib/facebook-lead-mapper.ts`

```typescript
interface MappedLead {
  name: string;
  email: string;
  phone?: string;
  source: 'facebook_lead_ad';
  sourceDetails: {
    facebookLeadId: string;
    formId: string;
    pageId: string;
    pageName?: string;
    campaignId?: string;
    adId?: string;
  };
  notes?: string;
  customFields?: Record<string, string>;
}

// Map Facebook field names to CRM fields
const FIELD_MAPPING = {
  'full_name': 'name',
  'email': 'email',
  'phone_number': 'phone',
  'company_name': 'company',
  'job_title': 'jobTitle',
  'city': 'city',
  'state': 'state',
  'country': 'country',
};

function mapFacebookLeadToCRM(fbLead: FacebookLeadData): MappedLead
```

### 4. Server Actions

**File:** `src/app/actions/facebook-leads-actions.ts`

```typescript
// Save Facebook configuration
async function saveFacebookLeadsConfig(companyId: string, config: FacebookLeadsConfig): Promise<ActionResult>

// Get Facebook configuration
async function getFacebookLeadsConfig(companyId: string): Promise<FacebookLeadsConfig | null>

// Manual sync recent leads
async function syncRecentFacebookLeads(companyId: string): Promise<{synced: number, skipped: number, errors: number}>

// Get webhook logs
async function getFacebookWebhookLogs(companyId: string, limit?: number): Promise<WebhookLog[]>

// Test connection
async function testFacebookConnection(companyId: string): Promise<{success: boolean, pageName?: string, error?: string}>
```

### 5. Settings UI Component

**File:** `src/components/settings/facebook-leads-settings.tsx`

Features:
- App ID, App Secret, Page Access Token input fields
- Auto-generated Verify Token display
- Webhook URL display with copy button
- Connection status indicator
- "Test Connection" button
- "Sync Recent Leads" button
- Recent webhook logs table
- Step-by-step setup instructions

## Data Models

### Facebook Leads Configuration (Firestore)

```typescript
// Collection: companies/{companyId}/integrations/facebook_leads
interface FacebookLeadsIntegration {
  appId: string;           // Encrypted
  appSecret: string;       // Encrypted
  pageAccessToken: string; // Encrypted
  verifyToken: string;     // Auto-generated UUID
  pageId?: string;
  pageName?: string;
  isConnected: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Webhook Log Entry

```typescript
// Collection: companies/{companyId}/facebookWebhookLogs
interface FacebookWebhookLog {
  id: string;
  timestamp: string;
  eventType: 'lead_received' | 'verification' | 'error';
  leadId?: string;
  payload?: object;
  error?: string;
  processed: boolean;
  crmLeadId?: string;
}
```

### Lead Source Details

```typescript
// Added to existing Lead type
interface LeadSourceDetails {
  facebookLeadId?: string;
  formId?: string;
  pageId?: string;
  pageName?: string;
  campaignId?: string;
  adId?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Webhook Signature Verification

*For any* incoming webhook request, if the X-Hub-Signature-256 header does not match the computed HMAC-SHA256 of the payload using the app secret, the request SHALL be rejected with 403 status.

**Validates: Requirements 1.2, 1.5**

### Property 2: Lead Creation Idempotency

*For any* Facebook lead ID, processing the same lead multiple times SHALL result in exactly one CRM lead record (create on first, update on subsequent).

**Validates: Requirements 3.4**

### Property 3: Field Mapping Completeness

*For any* Facebook lead with standard fields (full_name, email, phone_number), the mapped CRM lead SHALL contain corresponding non-empty values for name, email, and phone.

**Validates: Requirements 3.1, 3.2**

### Property 4: Verification Challenge Response

*For any* GET request with valid hub.mode='subscribe' and matching hub.verify_token, the response SHALL be exactly the hub.challenge value with 200 status.

**Validates: Requirements 1.6**

### Property 5: Configuration Encryption

*For any* saved Facebook configuration, the appSecret and pageAccessToken SHALL be stored encrypted and never logged in plaintext.

**Validates: Requirements 2.2**

## Error Handling

### Webhook Errors

| Error | Response | Action |
|-------|----------|--------|
| Invalid signature | 403 Forbidden | Log attempt, don't process |
| Missing lead data | 200 OK | Log error, acknowledge to FB |
| Facebook API error | 200 OK | Queue for retry, log error |
| CRM save error | 200 OK | Queue for retry, log error |

**Note:** Always return 200 to Facebook to prevent retry storms. Handle errors internally.

### Configuration Errors

| Error | User Message |
|-------|--------------|
| Invalid access token | "The Page Access Token is invalid or expired. Please generate a new one." |
| Missing permissions | "The token doesn't have 'leads_retrieval' permission. Please update app permissions." |
| Page not found | "Could not find the Facebook Page. Please verify the Page Access Token." |

## Testing Strategy

### Unit Tests

1. Signature verification with valid/invalid signatures
2. Field mapping for various Facebook field combinations
3. Duplicate detection logic
4. Configuration encryption/decryption

### Property-Based Tests

1. **Signature Verification Property**: Generate random payloads and secrets, verify signature computation
2. **Idempotency Property**: Process same lead multiple times, verify single CRM record
3. **Field Mapping Property**: Generate random Facebook lead data, verify all standard fields mapped

### Integration Tests

1. End-to-end webhook flow with mock Facebook payload
2. Manual sync with mock Facebook API responses
3. Settings save/load cycle

## Security Considerations

1. **Signature Verification**: All webhook requests MUST be verified using HMAC-SHA256
2. **Token Storage**: All tokens encrypted with AES-GCM before storage
3. **Rate Limiting**: Webhook endpoint should handle burst traffic from Facebook
4. **Logging**: Never log access tokens or app secrets in plaintext
5. **HTTPS Only**: Webhook URL must be HTTPS (Facebook requirement)

## Implementation Notes

### Facebook App Setup (User Instructions)

1. Go to developers.facebook.com and create an app
2. Add "Webhooks" and "Facebook Login" products
3. Configure webhook URL: `https://your-domain.com/api/webhooks/facebook-leads`
4. Subscribe to "leadgen" webhook for your Page
5. Generate Page Access Token with `leads_retrieval` permission
6. Copy App ID, App Secret, and Page Access Token to OmniFlow settings

### Webhook Payload Structure

```json
{
  "object": "page",
  "entry": [{
    "id": "PAGE_ID",
    "time": 1234567890,
    "changes": [{
      "field": "leadgen",
      "value": {
        "leadgen_id": "LEAD_ID",
        "page_id": "PAGE_ID",
        "form_id": "FORM_ID",
        "adgroup_id": "AD_ID",
        "ad_id": "AD_ID",
        "created_time": 1234567890
      }
    }]
  }]
}
```

### Lead Data Retrieval

After receiving webhook, fetch full lead data:
```
GET https://graph.facebook.com/v18.0/{lead_id}?access_token={token}
```
