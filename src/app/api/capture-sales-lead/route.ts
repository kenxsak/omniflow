import { NextRequest, NextResponse } from 'next/server';
import { submitSalesPageLead } from '@/app/actions/sales-page-lead-actions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { postId, name, email, phone, message, honeypot } = body;
    
    if (!postId) {
      return NextResponse.json(
        { success: false, message: 'Missing page identifier' },
        { status: 400 }
      );
    }
    
    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Call the server action
    const result = await submitSalesPageLead(postId, {
      name,
      email,
      phone: phone || '',
      message: message || '',
      honeypot: honeypot || '',
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Error in capture-sales-lead API:', error);
    return NextResponse.json(
      { success: false, message: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
