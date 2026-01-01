# Requirements Document

## Introduction

This feature enables automatic synchronization of leads from Facebook Lead Ads directly into OmniFlow CRM. When a user fills out a lead form on Facebook/Instagram ads, the lead data is automatically captured and saved to the CRM without requiring third-party tools like Zapier or Pabbly.

## Glossary

- **Facebook_Lead_Ads**: Meta's advertising feature that allows businesses to collect lead information directly within Facebook/Instagram
- **Lead_Webhook**: An API endpoint that receives lead data from Facebook when a form is submitted
- **Page_Access_Token**: A long-lived token that authorizes OmniFlow to receive leads from a Facebook Page
- **WABA**: WhatsApp Business Account (related but separate from Lead Ads)
- **Lead_Form**: The form created in Facebook Ads Manager that collects user information
- **CRM_Lead**: A lead record stored in OmniFlow's CRM system

## Requirements

### Requirement 1: Webhook Endpoint for Facebook Leads

**User Story:** As a business owner, I want Facebook lead form submissions to automatically appear in my CRM, so that I can follow up with prospects immediately without manual data entry.

#### Acceptance Criteria

1. THE Lead_Webhook SHALL accept POST requests from Facebook's Graph API at `/api/webhooks/facebook-leads`
2. WHEN Facebook sends a lead notification, THE Lead_Webhook SHALL verify the request signature using the app secret
3. WHEN a valid lead payload is received, THE Lead_Webhook SHALL extract lead data (name, email, phone, custom fields)
4. WHEN lead data is extracted, THE CRM_Lead SHALL be created with source set to "facebook_lead_ad"
5. IF the webhook signature verification fails, THEN THE Lead_Webhook SHALL return 403 Forbidden and log the attempt
6. THE Lead_Webhook SHALL respond to Facebook's verification challenge (GET request) with the hub.challenge value

### Requirement 2: Facebook App Configuration

**User Story:** As an admin, I want to connect my Facebook Page to OmniFlow, so that leads from my ads are automatically synced.

#### Acceptance Criteria

1. THE Settings_Page SHALL provide fields for Facebook App ID, App Secret, and Page Access Token
2. WHEN credentials are saved, THE System SHALL encrypt and store them securely using AES-GCM
3. THE Settings_Page SHALL display a webhook URL that users can copy to Facebook Developer Console
4. THE Settings_Page SHALL provide step-by-step instructions for Facebook app setup
5. WHEN a Page Access Token is provided, THE System SHALL validate it by making a test API call
6. IF validation fails, THEN THE System SHALL display a clear error message explaining the issue

### Requirement 3: Lead Data Mapping

**User Story:** As a sales manager, I want Facebook lead fields to map correctly to my CRM fields, so that all captured information is properly organized.

#### Acceptance Criteria

1. THE System SHALL map standard Facebook fields (full_name, email, phone_number) to CRM lead fields
2. WHEN custom questions exist in the lead form, THE System SHALL store them in the lead's notes or custom fields
3. THE System SHALL preserve the original Facebook lead ID for deduplication
4. WHEN a lead with the same email already exists, THE System SHALL update the existing lead instead of creating a duplicate
5. THE System SHALL record the Facebook Page name and ad campaign name as lead source details

### Requirement 4: Real-time Notifications

**User Story:** As a sales rep, I want to be notified immediately when a new Facebook lead arrives, so that I can respond quickly.

#### Acceptance Criteria

1. WHEN a new lead is created from Facebook, THE System SHALL trigger the existing lead notification workflow
2. THE Activity_Log SHALL record the lead creation with source "Facebook Lead Ad"
3. IF email notifications are enabled, THEN THE System SHALL send an email to the assigned user or admin

### Requirement 5: Lead Retrieval Fallback

**User Story:** As an admin, I want to manually sync missed leads, so that no leads are lost if the webhook fails.

#### Acceptance Criteria

1. THE Settings_Page SHALL provide a "Sync Recent Leads" button
2. WHEN clicked, THE System SHALL fetch leads from the last 7 days using Facebook's Leads API
3. THE System SHALL skip leads that already exist in the CRM (by Facebook lead ID)
4. THE System SHALL display a summary of synced leads (new count, skipped count)

### Requirement 6: Error Handling and Logging

**User Story:** As an admin, I want to see if there are any issues with Facebook lead sync, so that I can troubleshoot problems.

#### Acceptance Criteria

1. IF a webhook request fails processing, THEN THE System SHALL log the error with full payload for debugging
2. THE System SHALL store the last 100 webhook events in a log viewable from settings
3. WHEN an error occurs, THE System SHALL not lose the lead data - it should be queued for retry
4. THE Settings_Page SHALL display the connection status (connected, error, not configured)
