# Implementation Plan: Send WhatsApp Webhook Action

## Overview
Webhook endpoint for sending WhatsApp messages from external automation platforms.

## Tasks

- [x] 1. Implement send-whatsapp webhook endpoint
  - [x] 1.1 Create POST handler at /api/webhooks/actions/send-whatsapp
    - Parse and validate request body
    - Authenticate via Authorization Bearer header
    - Extract companyId from API key format: `omni_{companyId}_live`

  - [x] 1.2 Implement WhatsApp sending logic
    - Get company's WhatsApp provider config
    - Use unified WhatsApp service with failover
    - Support multiple providers: Meta, Authkey, AiSensy, Gupshup

  - [x] 1.3 Implement phone number formatting
    - Auto-add India country code (91) for 10-digit numbers
    - Support multiple recipients

  - [x] 1.4 Implement error handling
    - Return appropriate HTTP status codes
    - Include descriptive error messages

  - [x] 1.5 Add request logging
    - Log to webhookLogs collection
    - Include timestamp, provider, success/fail counts

  - [x] 1.6 Add CORS support
    - OPTIONS handler for preflight requests
    - Allow external platform access

- [x] 2. Final checkpoint
  - Endpoint created at /api/webhooks/actions/send-whatsapp
  - Supports Meta, Authkey, AiSensy, Gupshup providers
  - Uses unified WhatsApp service with automatic failover

## Request Format
```json
{
  "to": "9876543210",           // Phone number(s)
  "templateName": "welcome",    // WhatsApp template name
  "parameters": ["John"],       // Template variables
  "languageCode": "en"          // Optional, default: en
}
```

## Response Format
```json
{
  "success": true,
  "provider": "authkey",
  "totalSent": 1,
  "totalFailed": 0,
  "results": [...],
  "timestamp": "2026-01-01T..."
}
```

## Notes
- Reuses existing unified WhatsApp service
- API key format: `omni_{companyId}_live`
- Follows same pattern as send-sms and send-email webhooks
