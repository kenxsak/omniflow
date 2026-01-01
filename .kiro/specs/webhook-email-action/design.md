# Design: Send Email Webhook Action

## Architecture

### Endpoint
```
POST /api/webhooks/actions/send-email
```

### Authentication
- API Key in `X-API-Key` header
- API Key stored in company's integrations collection
- Each company has unique webhook API key

### Request Schema
```typescript
interface SendEmailWebhookRequest {
  // Required
  to: string | string[];           // Recipient email(s)
  subject: string;                 // Email subject
  
  // Body (one required)
  body?: string;                   // Plain text body
  htmlBody?: string;               // HTML body
  templateId?: string;             // Template ID to use
  
  // Optional
  from?: {
    email?: string;                // Override sender email
    name?: string;                 // Override sender name
  };
  replyTo?: string;                // Reply-to address
  variables?: Record<string, string>; // Template variables
  tags?: string[];                 // Tags for tracking
  metadata?: Record<string, any>;  // Custom metadata
}
```

### Response Schema
```typescript
interface SendEmailWebhookResponse {
  success: boolean;
  messageId?: string;              // Provider message ID
  provider?: string;               // Email provider used
  error?: string;                  // Error message if failed
  timestamp: string;               // ISO timestamp
}
```

## Data Flow

```
1. External Platform → POST /api/webhooks/actions/send-email
2. Validate API Key → Lookup company by API key
3. Validate Request → Check required fields
4. Get Email Config → Fetch company's email provider settings
5. Process Template → If templateId, merge variables
6. Send Email → Use configured provider (Brevo, SMTP, Sender)
7. Log Request → Store in webhookLogs collection
8. Return Response → Success/failure with details
```

## Email Provider Integration

Uses existing email infrastructure:
- `src/lib/email-service.ts` - Unified email sending
- Supports: Brevo, Custom SMTP, Sender.net
- Falls back to next provider if primary fails

## Security Considerations

1. **API Key Generation**: Cryptographically secure random key
2. **Key Storage**: Encrypted in Firestore
3. **Rate Limiting**: In-memory counter with sliding window
4. **Input Validation**: Sanitize all inputs
5. **Logging**: Never log full email content, only metadata

## File Structure

```
src/
├── app/api/webhooks/actions/send-email/
│   └── route.ts              # Webhook endpoint
├── lib/
│   └── webhook-email.ts      # Email webhook utilities
└── types/
    └── webhook-actions.ts    # Shared webhook types
```
