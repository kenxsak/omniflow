# Requirements: Send Email Webhook Action

## Overview
Add a webhook action endpoint that allows external automation platforms (Zapier, Make, n8n, Pabbly) to trigger email sending through OmniFlow's configured email providers.

## Actors
- **External Automation Platform**: Zapier, Make, n8n, Pabbly Connect, or custom integrations
- **OmniFlow User**: Business owner who configures the webhook
- **Email Recipient**: Person receiving the email

## User Stories

### 1. Webhook Email Sending
**As an** automation platform user  
**I want to** send emails via webhook  
**So that** I can trigger emails from any external workflow

**Acceptance Criteria:**
- 1.1 POST endpoint accepts email parameters (to, subject, body, from)
- 1.2 Endpoint validates required fields
- 1.3 Endpoint authenticates via API key in header
- 1.4 Email is sent using company's configured email provider
- 1.5 Response includes success/failure status and message ID
- 1.6 Supports HTML and plain text email bodies

### 2. Template Support
**As a** business owner  
**I want to** use email templates in webhook calls  
**So that** I can maintain consistent branding

**Acceptance Criteria:**
- 2.1 Webhook accepts optional templateId parameter
- 2.2 Template variables can be passed as JSON object
- 2.3 System merges variables into template before sending
- 2.4 Falls back to raw body if template not found

### 3. Error Handling
**As an** automation platform  
**I want** clear error responses  
**So that** I can handle failures appropriately

**Acceptance Criteria:**
- 3.1 Returns 400 for missing required fields
- 3.2 Returns 401 for invalid/missing API key
- 3.3 Returns 404 for invalid company or template
- 3.4 Returns 500 for email provider failures
- 3.5 Error responses include descriptive message

### 4. Rate Limiting
**As a** system administrator  
**I want** rate limiting on the webhook  
**So that** the system is protected from abuse

**Acceptance Criteria:**
- 4.1 Rate limit of 100 requests per minute per company
- 4.2 Returns 429 when rate limit exceeded
- 4.3 Response includes retry-after header

## Non-Functional Requirements
- Response time < 2 seconds for email queuing
- Support for attachments up to 10MB (future enhancement)
- Logging of all webhook calls for debugging
