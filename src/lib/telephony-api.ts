/**
 * Telephony API Library
 * Unified interface for voice calling providers (Plivo, Exotel, Twilio)
 * and AI Voice providers (Vapi.ai, Bland.ai)
 * 
 * Uses company-level API keys from Firestore (BYOK model)
 */

export type TelephonyProvider = 'plivo' | 'exotel' | 'twilio';
export type AIVoiceProvider = 'vapi' | 'bland';

export interface TelephonyConfig {
  plivo?: {
    authId: string;
    authToken: string;
    phoneNumber: string;
  };
  exotel?: {
    sid: string;
    apiKey: string;
    apiToken: string;
    subdomain: string;
    callerId: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  vapi?: {
    apiKey: string;
    assistantId?: string;
  };
  bland?: {
    apiKey: string;
  };
}

export interface CallOptions {
  to: string;
  from?: string;
  callbackUrl?: string;
  recordCall?: boolean;
  maxDuration?: number; // in seconds
  metadata?: Record<string, string>;
}

export interface CallResult {
  success: boolean;
  callId?: string;
  provider: TelephonyProvider;
  error?: string;
  status?: 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'failed';
}

export interface AICallOptions {
  to: string;
  assistantId?: string;
  script?: string;
  voice?: string;
  firstMessage?: string;
  maxDuration?: number;
  metadata?: Record<string, string>;
}

export interface AICallResult {
  success: boolean;
  callId?: string;
  provider: AIVoiceProvider;
  error?: string;
}

// Check which telephony provider is configured for a company
export function getConfiguredTelephonyProvider(config: TelephonyConfig): TelephonyProvider | null {
  if (config.plivo?.authId && config.plivo?.authToken) return 'plivo';
  if (config.exotel?.sid && config.exotel?.apiKey) return 'exotel';
  if (config.twilio?.accountSid && config.twilio?.authToken) return 'twilio';
  return null;
}

// Check which AI voice provider is configured for a company
export function getConfiguredAIVoiceProvider(config: TelephonyConfig): AIVoiceProvider | null {
  if (config.vapi?.apiKey) return 'vapi';
  if (config.bland?.apiKey) return 'bland';
  return null;
}

// Plivo API
async function makeCallWithPlivo(config: TelephonyConfig, options: CallOptions): Promise<CallResult> {
  const plivoConfig = config.plivo;
  if (!plivoConfig?.authId || !plivoConfig?.authToken || !plivoConfig?.phoneNumber) {
    return { success: false, provider: 'plivo', error: 'Plivo credentials not configured' };
  }

  const fromNumber = options.from || plivoConfig.phoneNumber;

  try {
    const response = await fetch(`https://api.plivo.com/v1/Account/${plivoConfig.authId}/Call/`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${plivoConfig.authId}:${plivoConfig.authToken}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromNumber,
        to: options.to,
        answer_url: options.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plivo/answer`,
        hangup_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plivo/hangup`,
        record: options.recordCall ?? false,
        time_limit: options.maxDuration || 3600,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        callId: data.request_uuid,
        provider: 'plivo',
        status: 'initiated',
      };
    }

    return { success: false, provider: 'plivo', error: data.error || 'Failed to initiate call' };
  } catch (error) {
    return { success: false, provider: 'plivo', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Exotel API
async function makeCallWithExotel(config: TelephonyConfig, options: CallOptions): Promise<CallResult> {
  const exotelConfig = config.exotel;
  if (!exotelConfig?.sid || !exotelConfig?.apiKey || !exotelConfig?.apiToken || !exotelConfig?.callerId) {
    return { success: false, provider: 'exotel', error: 'Exotel credentials not configured' };
  }

  const subdomain = exotelConfig.subdomain || 'api';
  const callerId = options.from || exotelConfig.callerId;

  try {
    const formData = new URLSearchParams();
    formData.append('From', callerId);
    formData.append('To', options.to);
    formData.append('CallerId', callerId);
    if (options.callbackUrl) {
      formData.append('StatusCallback', options.callbackUrl);
    }
    if (options.recordCall) {
      formData.append('Record', 'true');
    }
    if (options.maxDuration) {
      formData.append('TimeLimit', options.maxDuration.toString());
    }

    const response = await fetch(`https://${subdomain}.exotel.com/v1/Accounts/${exotelConfig.sid}/Calls/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${exotelConfig.apiKey}:${exotelConfig.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (response.ok && data.Call) {
      return {
        success: true,
        callId: data.Call.Sid,
        provider: 'exotel',
        status: 'initiated',
      };
    }

    return { success: false, provider: 'exotel', error: data.RestException?.Message || 'Failed to initiate call' };
  } catch (error) {
    return { success: false, provider: 'exotel', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Twilio API
async function makeCallWithTwilio(config: TelephonyConfig, options: CallOptions): Promise<CallResult> {
  const twilioConfig = config.twilio;
  if (!twilioConfig?.accountSid || !twilioConfig?.authToken || !twilioConfig?.phoneNumber) {
    return { success: false, provider: 'twilio', error: 'Twilio credentials not configured' };
  }

  const fromNumber = options.from || twilioConfig.phoneNumber;

  try {
    const formData = new URLSearchParams();
    formData.append('From', fromNumber);
    formData.append('To', options.to);
    formData.append('Url', options.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/voice`);
    if (options.recordCall) {
      formData.append('Record', 'true');
    }
    if (options.maxDuration) {
      formData.append('TimeLimit', options.maxDuration.toString());
    }

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioConfig.accountSid}/Calls.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${twilioConfig.accountSid}:${twilioConfig.authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        callId: data.sid,
        provider: 'twilio',
        status: 'initiated',
      };
    }

    return { success: false, provider: 'twilio', error: data.message || 'Failed to initiate call' };
  } catch (error) {
    return { success: false, provider: 'twilio', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Vapi.ai API
async function makeAICallWithVapi(config: TelephonyConfig, options: AICallOptions): Promise<AICallResult> {
  const vapiConfig = config.vapi;
  if (!vapiConfig?.apiKey) {
    return { success: false, provider: 'vapi', error: 'Vapi API key not configured' };
  }

  // Validate API key format
  if (vapiConfig.apiKey.length < 10) {
    console.error('[Vapi] API key appears invalid, length:', vapiConfig.apiKey.length);
    return { success: false, provider: 'vapi', error: 'Vapi API key appears invalid' };
  }

  const assistantId = options.assistantId || vapiConfig.assistantId;
  
  // For outbound calls, we need either an assistantId or to create a transient assistant
  if (!assistantId) {
    console.log('[Vapi] No assistantId provided, will use transient assistant');
  }

  console.log('[Vapi] Making call to:', options.to);
  console.log('[Vapi] API key length:', vapiConfig.apiKey.length);
  console.log('[Vapi] Assistant ID:', assistantId || 'none (transient)');

  try {
    // Build request body based on Vapi API docs
    const requestBody: Record<string, any> = {
      customer: {
        number: options.to,
      },
    };

    // Add assistant configuration
    if (assistantId) {
      requestBody.assistantId = assistantId;
    } else {
      // Create a transient assistant for this call
      requestBody.assistant = {
        firstMessage: options.firstMessage || 'Hello! How can I help you today?',
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo',
        },
        voice: {
          provider: '11labs',
          voiceId: 'rachel',
        },
      };
    }

    if (options.metadata) {
      requestBody.metadata = options.metadata;
    }

    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('[Vapi] Response status:', response.status);
    console.log('[Vapi] Response:', JSON.stringify(data).substring(0, 500));

    if (response.ok) {
      return {
        success: true,
        callId: data.id,
        provider: 'vapi',
      };
    }

    return { success: false, provider: 'vapi', error: data.message || data.error || 'Failed to initiate AI call' };
  } catch (error) {
    console.error('[Vapi] Error:', error);
    return { success: false, provider: 'vapi', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Bland.ai API
async function makeAICallWithBland(config: TelephonyConfig, options: AICallOptions): Promise<AICallResult> {
  const blandConfig = config.bland;
  if (!blandConfig?.apiKey) {
    return { success: false, provider: 'bland', error: 'Bland API key not configured' };
  }

  console.log('[Bland] Making call to:', options.to);
  console.log('[Bland] Script length:', options.script?.length || 0);
  console.log('[Bland] Voice:', options.voice || 'maya');
  console.log('[Bland] Max duration:', options.maxDuration || 300);

  try {
    // Build the request body with all Bland.ai options
    const requestBody: Record<string, any> = {
      phone_number: options.to,
      task: options.script || options.firstMessage || 'Have a friendly conversation. Be helpful and professional.',
      voice: options.voice || 'maya',
      reduce_latency: true,
      record: true, // Always record for transcript
      wait_for_greeting: true,
      max_duration: options.maxDuration || 300, // Use configured duration or 5 minutes default
    };

    // Add webhook URL for call completion
    if (process.env.NEXT_PUBLIC_APP_URL) {
      requestBody.webhook = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/bland`;
    }

    // Add metadata for tracking
    if (options.metadata) {
      requestBody.metadata = options.metadata;
    }

    // Add first message if provided
    if (options.firstMessage) {
      requestBody.first_sentence = options.firstMessage;
    }

    const response = await fetch('https://api.bland.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': blandConfig.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('[Bland] Response:', JSON.stringify(data).substring(0, 300));

    if (response.ok && data.call_id) {
      return {
        success: true,
        callId: data.call_id,
        provider: 'bland',
      };
    }

    return { success: false, provider: 'bland', error: data.message || 'Failed to initiate AI call' };
  } catch (error) {
    return { success: false, provider: 'bland', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Main function to make a call using configured provider
export async function makeCall(config: TelephonyConfig, options: CallOptions, preferredProvider?: TelephonyProvider): Promise<CallResult> {
  const provider = preferredProvider || getConfiguredTelephonyProvider(config);

  if (!provider) {
    return { success: false, provider: 'plivo', error: 'No telephony provider configured. Go to Settings > Integrations to set up Plivo, Exotel, or Twilio.' };
  }

  switch (provider) {
    case 'plivo':
      return makeCallWithPlivo(config, options);
    case 'exotel':
      return makeCallWithExotel(config, options);
    case 'twilio':
      return makeCallWithTwilio(config, options);
    default:
      return { success: false, provider, error: `Unknown provider: ${provider}` };
  }
}

// Main function to make an AI call using configured provider
export async function makeAICall(config: TelephonyConfig, options: AICallOptions, preferredProvider?: AIVoiceProvider): Promise<AICallResult> {
  const provider = preferredProvider || getConfiguredAIVoiceProvider(config);

  if (!provider) {
    return { success: false, provider: 'vapi', error: 'No AI voice provider configured. Go to Settings > Integrations to set up Vapi.ai or Bland.ai.' };
  }

  switch (provider) {
    case 'vapi':
      return makeAICallWithVapi(config, options);
    case 'bland':
      return makeAICallWithBland(config, options);
    default:
      return { success: false, provider, error: `Unknown provider: ${provider}` };
  }
}

// Utility to format phone number for international calling
export function formatPhoneForCall(phone: string, countryCode: string = '+91'): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code, return as-is with +
  if (digits.length > 10) {
    return `+${digits}`;
  }
  
  // Add country code
  return `${countryCode}${digits}`;
}

// Check TRAI compliance for Indian numbers
export function checkTRAICompliance(): { compliant: boolean; issues: string[] } {
  const issues: string[] = [];
  const now = new Date();
  const hour = now.getHours();

  // TRAI calling hours: 9 AM - 9 PM
  if (hour < 9 || hour >= 21) {
    issues.push('Outside TRAI permitted calling hours (9 AM - 9 PM)');
  }

  // Check if DND check is configured (would need actual DND API integration)
  if (!process.env.DND_CHECK_API_KEY) {
    issues.push('DND registry check not configured');
  }

  return {
    compliant: issues.length === 0,
    issues,
  };
}
