import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook Action: Create Lead
 * Used by Zapier, Pabbly, Make, n8n to create leads in OmniFlow
 * 
 * POST /api/webhooks/actions/create-lead
 * Headers: Authorization: Bearer {api_key}
 * Body: { name, email, phone, source, notes, customFields }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Extract company ID from API key (format: omni_{companyId}_live)
    const keyParts = apiKey.split('_');
    if (keyParts.length < 3 || keyParts[0] !== 'omni') {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }
    
    const companyId = keyParts[1];
    
    // Verify company exists
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }
    
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: 'Invalid API key - company not found' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, source, notes, customFields, status, tags } = body;

    // Validate required fields
    if (!name && !email && !phone) {
      return NextResponse.json({ 
        error: 'At least one of name, email, or phone is required' 
      }, { status: 400 });
    }

    // Create lead document
    const leadData = {
      name: name || 'Unknown',
      email: email || '',
      phone: phone || '',
      source: source || 'api_webhook',
      notes: notes || '',
      status: status || 'new',
      tags: tags || [],
      customFields: customFields || {},
      companyId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdVia: 'webhook_api',
      webhookSource: request.headers.get('x-webhook-source') || 'unknown',
    };

    const leadRef = await adminDb.collection('companies').doc(companyId).collection('leads').add(leadData);

    return NextResponse.json({
      success: true,
      leadId: leadRef.id,
      message: 'Lead created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Webhook create-lead error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Webhook-Source',
    },
  });
}
