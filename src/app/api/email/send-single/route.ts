import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, toName, subject, htmlContent, contactId, companyId } = body;

    if (!to || !subject || !htmlContent || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, htmlContent, companyId' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Get company's email settings
    const db = adminDb;
    const companyDoc = await db.collection('companies').doc(companyId).get();
    
    if (!companyDoc.exists) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const companyData = companyDoc.data();
    const brevoApiKey = companyData?.brevoApiKey;

    if (!brevoApiKey) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add your Brevo API key in Settings.' },
        { status: 400 }
      );
    }

    // Send email via Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: companyData?.businessName || 'OmniFlow',
          email: companyData?.senderEmail || 'noreply@omniflow.app',
        },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Brevo API error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Log the email activity
    if (contactId) {
      await db.collection('companies').doc(companyId).collection('activities').add({
        contactId,
        type: 'email_sent',
        description: `Email sent: "${subject}"`,
        metadata: {
          to,
          subject,
          messageId: result.messageId,
        },
        timestamp: new Date(),
        createdAt: new Date(),
      });

      // Update contact's lastContacted
      await db.collection('companies').doc(companyId).collection('leads').doc(contactId).update({
        lastContacted: new Date(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      messageId: result.messageId 
    });

  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
