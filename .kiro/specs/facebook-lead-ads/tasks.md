# Implementation Plan: Facebook Lead Ads Integration

## Overview

This plan implements automatic lead synchronization from Facebook Lead Ads to OmniFlow CRM. Implementation follows a bottom-up approach: core utilities first, then API endpoints, then UI.

## Tasks

- [x] 1. Create Facebook API utilities and types
  - [x] 1.1 Create TypeScript types for Facebook Lead Ads
    - Define FacebookLeadData, FacebookLeadsConfig, WebhookPayload interfaces
    - Define MappedLead interface with source details
    - _Requirements: 3.1, 3.3, 3.5_

  - [x] 1.2 Implement signature verification utility
    - Create verifyFacebookSignature function using HMAC-SHA256
    - Handle X-Hub-Signature-256 header parsing
    - _Requirements: 1.2, 1.5_

  - [x] 1.3 Write property test for signature verification
    - **Property 1: Webhook Signature Verification**
    - **Validates: Requirements 1.2, 1.5**

  - [x] 1.4 Implement lead field mapping utility
    - Create mapFacebookLeadToCRM function
    - Map standard fields (full_name, email, phone_number)
    - Handle custom fields → notes conversion
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

  - [x] 1.5 Write property test for field mapping
    - **Property 3: Field Mapping Completeness**
    - **Validates: Requirements 3.1, 3.2**

- [x] 2. Implement Facebook API service
  - [x] 2.1 Create Facebook Leads API client
    - Implement fetchLeadDetails function
    - Implement fetchRecentLeads function for manual sync
    - Implement validateAccessToken function
    - _Requirements: 2.5, 5.2_

  - [x] 2.2 Add error handling and retry logic
    - Handle rate limiting (429 responses)
    - Handle token expiration errors
    - _Requirements: 6.1, 6.3_

- [x] 3. Create webhook endpoint
  - [x] 3.1 Implement GET handler for verification challenge
    - Parse hub.mode, hub.verify_token, hub.challenge
    - Return challenge if token matches
    - _Requirements: 1.6_

  - [x] 3.2 Write property test for verification challenge
    - **Property 4: Verification Challenge Response**
    - **Validates: Requirements 1.6**

  - [x] 3.3 Implement POST handler for lead notifications
    - Verify signature using app secret
    - Parse webhook payload
    - Fetch full lead data from Facebook API
    - Map and save lead to CRM
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.4 Add webhook logging
    - Log all webhook events to Firestore
    - Store last 100 events per company
    - _Requirements: 6.1, 6.2_

- [-] 4. Implement server actions
  - [x] 4.1 Create saveFacebookLeadsConfig action
    - Encrypt sensitive fields (appSecret, pageAccessToken)
    - Generate verifyToken if not exists
    - Store in Firestore
    - _Requirements: 2.2_

  - [x] 4.2 Write property test for config encryption round-trip
    - **Property 5: Configuration Encryption**
    - **Validates: Requirements 2.2**

  - [x] 4.3 Create getFacebookLeadsConfig action
    - Decrypt sensitive fields
    - Return config or null
    - _Requirements: 2.2_

  - [x] 4.4 Create testFacebookConnection action
    - Validate access token with Facebook API
    - Return page name on success
    - _Requirements: 2.5, 2.6_

  - [x] 4.5 Create syncRecentFacebookLeads action
    - Fetch leads from last 7 days
    - Skip existing leads (by Facebook lead ID)
    - Return sync summary
    - _Requirements: 5.2, 5.3_

  - [x] 4.6 Write property test for lead idempotency
    - **Property 2: Lead Creation Idempotency**
    - **Validates: Requirements 3.4, 5.3**

  - [x] 4.7 Create getFacebookWebhookLogs action
    - Fetch recent webhook logs
    - Support pagination
    - _Requirements: 6.2_

- [x] 5. Checkpoint - Core functionality complete
  - All tests pass (16 passed, 2 skipped for browser-only encryption)

- [x] 6. Create Settings UI component
  - [x] 6.1 Create FacebookLeadsSettings component
    - App ID, App Secret, Page Access Token fields
    - Webhook URL display with copy button
    - Verify Token display
    - Connection status indicator
    - _Requirements: 2.1, 2.3, 6.4_

  - [x] 6.2 Add setup instructions accordion
    - Step-by-step Facebook app setup guide
    - Screenshots/links to Facebook Developer Console
    - _Requirements: 2.4_

  - [x] 6.3 Add Test Connection button
    - Call testFacebookConnection action
    - Display success/error message
    - _Requirements: 2.5, 2.6_

  - [x] 6.4 Add Sync Recent Leads button
    - Call syncRecentFacebookLeads action
    - Display sync summary (new, skipped, errors)
    - _Requirements: 5.1, 5.4_

  - [x] 6.5 Add webhook logs table
    - Display recent webhook events
    - Show status, timestamp, lead ID
    - _Requirements: 6.2_

- [x] 7. Integrate with existing systems
  - [x] 7.1 Add Facebook Leads to integrations page
    - Add card/section in settings/integrations
    - Link to FacebookLeadsSettings component
    - _Requirements: 2.1_

  - [x] 7.2 Update lead creation to trigger notifications
    - Ensure Facebook leads trigger existing notification workflow
    - Add activity log entry with source
    - _Requirements: 4.1, 4.2_

  - [x] 7.3 Update Firestore security rules
    - Add rules for facebookWebhookLogs collection
    - Add rules for integrations subcollection
    - _Requirements: 2.2_

- [x] 8. Final checkpoint
  - All tests pass, implementation complete

## Notes

- All property-based tests are required for comprehensive coverage
- All UI components must follow mobile-first design guidelines
- Webhook endpoint must handle high traffic from Facebook
- Never log access tokens or app secrets in plaintext
