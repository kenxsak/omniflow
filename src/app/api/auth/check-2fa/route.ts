import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ enabled: false });
    }

    if (!adminDb) {
      return NextResponse.json({ enabled: false });
    }

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ enabled: false });
    }

    const userData = userDoc.data();
    const enabled = userData?.twoFactor?.enabled || false;

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json({ enabled: false });
  }
}
