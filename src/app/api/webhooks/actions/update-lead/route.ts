import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Webhook Action: Update Lead
 * Used by Zapier, Pabbly, Make, n8n to update leads in OmniFlow
 * 
 * POST /api/webhooks/actions/update-lead
 * Headers: Authorization: Bearer {api_key}
 * Body: { leadId, status, notes, tags, customFields }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const apiKey = authHeader.replace('Bearer ', '');
    
    // Extract company ID from API key
    const keyParts = apiKey.split('_');
    if (keyParts.length < 3 || keyParts[0] !== 'omni') {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 401 });
    }
    
    const companyId = keyParts[1];
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Parse request body
    const body = await request.json();
    const { leadId, status, notes, tags, customFields, name, email, phone } = body;

    // Validate required fields
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Check if lead exists
    const leadRef = adminDb.collection('companies').doc(companyId).collection('leads').doc(leadId);
    const leadDoc = await leadRef.get();
    
    if (!leadDoc.exists) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
      lastUpdatedVia: 'webhook_api',
    };

    if (status) updateData.status = status;
    if (notes) updateData.notes = notes;
    if (tags) updateData.tags = tags;
    if (customFields) updateData.customFields = customFields;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    await leadRef.update(updateData);

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead updated successfully',
    });

  } catch (error) {
    console.error('Webhook update-lead error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
