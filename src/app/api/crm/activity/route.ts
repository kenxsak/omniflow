import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactId, companyId, type, description, metadata, timestamp } = body;

    if (!contactId || !companyId || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: contactId, companyId, type, description' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const db = adminDb;

    // Add activity to the activities collection
    const activityRef = await db
      .collection('companies')
      .doc(companyId)
      .collection('activities')
      .add({
        contactId,
        type,
        description,
        metadata: metadata || {},
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        createdAt: new Date(),
      });

    // Update contact's lastContacted timestamp
    await db
      .collection('companies')
      .doc(companyId)
      .collection('leads')
      .doc(contactId)
      .update({
        lastContacted: new Date(),
      });

    return NextResponse.json({ 
      success: true, 
      activityId: activityRef.id 
    });

  } catch (error: any) {
    console.error('Error logging activity:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    const companyId = searchParams.get('companyId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!contactId || !companyId) {
      return NextResponse.json(
        { error: 'Missing required params: contactId, companyId' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const db = adminDb;

    const activitiesSnapshot = await db
      .collection('companies')
      .doc(companyId)
      .collection('activities')
      .where('contactId', '==', contactId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const activities = activitiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    }));

    return NextResponse.json({ activities });

  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
