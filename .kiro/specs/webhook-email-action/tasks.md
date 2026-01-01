# Implementation Plan: Send Email Webhook Action

## Overview
Implement webhook endpoint for sending emails from external automation platforms.

## Tasks

- [x] 1. Create shared webhook types
  - [x] 1.1 Create webhook action types file
    - Define SendEmailWebhookRequest interface
    - Define SendEmailWebhookResponse interface
    - Define WebhookApiKeyConfig interface
    - _Requirements: 1.1, 1.5_

- [x] 2. Implement webhook API key management
  - [x] 2.1 Create generateWebhookApiKey utility
    - Uses existing format: `omni_{companyId}_live`
    - _Requirements: 1.3_

  - [x] 2.2 Create server action for API key management
    - Uses existing company API key system
    - _Requirements: 1.3_

- [x] 3. Implement send-email webhook endpoint
  - [x] 3.1 Create POST handler
    - Parse and validate request body
    - Authenticate via Authorization Bearer header
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 3.2 Implement email sending logic
    - Get company's email provider config
    - Use existing email service (SMTP, Brevo, Sender)
    - Support HTML and plain text
    - _Requirements: 1.4, 1.6_

  - [x] 3.3 Add template support
    - Variables can be passed and merged into content
    - Uses {{variable}} syntax
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Implement error handling
    - Return appropriate HTTP status codes
    - Include descriptive error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.5 Add request logging
    - Log to webhookLogs collection
    - Include timestamp, status, metadata
    - _Requirements: Non-functional_

- [ ] 4. Add rate limiting (Future enhancement)
  - Rate limiting can be added later if needed
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Final checkpoint
  - Endpoint created at /api/webhooks/actions/send-email
  - Supports SMTP, Brevo, Sender.net providers
  - CORS enabled for external access

## Notes
- Reuses existing email service infrastructure
- API key format: `omni_{companyId}_live`
- Follows same pattern as send-sms webhook
