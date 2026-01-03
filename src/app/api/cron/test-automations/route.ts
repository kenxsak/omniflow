/**
 * Test Endpoint for Email Automations
 * 
 * This endpoint allows manual testing of the email automation system.
 * It provides detailed diagnostics about:
 * - Company API key configuration
 * - Email lists with automations
 * - Contacts enrolled in automations
 * - Pending automation states
 * 
 * Usage: GET /api/cron/test-automations?companyId=YOUR_COMPANY_ID
 * Authorization: Bearer YOUR_CRON_SECRET
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface DiagnosticResult {
  companyId: string;
  companyName: string;
  apiKeysConfigured: {
    brevo: boolean;
    sender: boolean;
    smtp: boolean;
  };
  emailLists: Array<{
    id: string;
    name: string;
    type: string;
    contactCount: number;
    automationId: string | null;
  }>;
  automations: Array<{
    id: string;
    name: string;
    status: string;
    stepsCount: number;
    deliveryProvider: string;
  }>;
  contacts: Array<{
    id: string;
    email: string;
    listId: string;
    status: string;
  }>;
  automationStates: Array<{
    id: string;
    contactEmail: string;
    automationId: string;
    status: string;
    currentStepIndex: number;
    nextStepTime: string;
  }>;
  issues: string[];
  recommendations: string[];
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('companyId');

  try {
    if (companyId) {
      // Diagnose specific company
      const result = await diagnoseCompany(companyId);
      return NextResponse.json(result);
    } else {
      // List all companies with their automation status
      const companiesSnapshot = await adminDb.collection('companies').get();
      const companies = [];

      for (const companyDoc of companiesSnapshot.docs) {
        const companyData = companyDoc.data();
        const apiKeysDoc = await adminDb
          .collection('companies')
          .doc(companyDoc.id)
          .collection('settings')
          .doc('apiKeys')
          .get();
        
        const apiKeys = apiKeysDoc.data() || {};
        
        const automationsSnapshot = await adminDb
          .collection('companies')
          .doc(companyDoc.id)
          .collection('emailAutomationSequences')
          .where('status', '==', 'active')
          .get();

        const statesSnapshot = await adminDb
          .collection('companies')
          .doc(companyDoc.id)
          .collection('contactAutomationStates')
          .where('status', '==', 'active')
          .get();

        companies.push({
          id: companyDoc.id,
          name: companyData.name || 'Unknown',
          hasBrevo: !!apiKeys.brevo?.apiKey,
          hasSender: !!apiKeys.sender?.apiKey,
          hasSmtp: !!apiKeys.smtp?.host,
          activeAutomations: automationsSnapshot.size,
          pendingStates: statesSnapshot.size,
        });
      }

      return NextResponse.json({
        success: true,
        companies,
        message: 'Add ?companyId=YOUR_ID to get detailed diagnostics for a specific company',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error('Test automations error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

async function diagnoseCompany(companyId: string): Promise<DiagnosticResult> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Get company info
  const companyDoc = await adminDb.collection('companies').doc(companyId).get();
  if (!companyDoc.exists) {
    throw new Error(`Company ${companyId} not found`);
  }
  const companyData = companyDoc.data()!;

  // Get API keys
  const apiKeysDoc = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('settings')
    .doc('apiKeys')
    .get();
  
  const apiKeys = apiKeysDoc.data() || {};
  
  const apiKeysConfigured = {
    brevo: !!apiKeys.brevo?.apiKey,
    sender: !!apiKeys.sender?.apiKey,
    smtp: !!(apiKeys.smtp?.host && (apiKeys.smtp?.username || apiKeys.smtp?.user) && apiKeys.smtp?.password),
  };

  if (!apiKeysConfigured.brevo && !apiKeysConfigured.sender && !apiKeysConfigured.smtp) {
    issues.push('No email provider configured');
    recommendations.push('Configure at least one email provider (Brevo, Sender.net, or SMTP) in Settings → Email/SMS Setup');
  }

  // Get email lists
  const listsSnapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('emailLists')
    .get();

  const emailLists = listsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Unnamed',
      type: data.type || 'general',
      contactCount: data.contactCount || 0,
      automationId: data.automationId || null,
    };
  });

  const listsWithAutomations = emailLists.filter(l => l.automationId);
  if (listsWithAutomations.length === 0) {
    issues.push('No email lists are linked to automations');
    recommendations.push('Link an email list to an automation in Campaigns → Email Automations');
  }

  // Get automations
  const automationsSnapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('emailAutomationSequences')
    .get();

  const automations = automationsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || 'Unnamed',
      status: data.status || 'inactive',
      stepsCount: data.steps?.length || 0,
      deliveryProvider: data.deliveryConfig?.provider || 'not set',
    };
  });

  const activeAutomations = automations.filter(a => a.status === 'active');
  if (activeAutomations.length === 0) {
    issues.push('No active automations');
    recommendations.push('Activate at least one automation by setting its status to "active"');
  }

  // Get contacts
  const contactsSnapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('emailContacts')
    .limit(50)
    .get();

  const contacts = contactsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email || 'unknown',
      listId: data.listId || 'none',
      status: data.status || 'unknown',
    };
  });

  const activeContacts = contacts.filter(c => c.status === 'active');
  if (activeContacts.length === 0) {
    issues.push('No active contacts in email lists');
    recommendations.push('Add contacts to your email lists with status "active"');
  }

  // Get automation states
  const statesSnapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('contactAutomationStates')
    .limit(50)
    .get();

  const automationStates = statesSnapshot.docs.map(doc => {
    const data = doc.data();
    const nextStepTime = data.nextStepTime as Timestamp;
    return {
      id: doc.id,
      contactEmail: data.contactEmail || 'unknown',
      automationId: data.automationId || 'none',
      status: data.status || 'unknown',
      currentStepIndex: data.currentStepIndex || 0,
      nextStepTime: nextStepTime ? nextStepTime.toDate().toISOString() : 'not set',
    };
  });

  const pendingStates = automationStates.filter(s => s.status === 'active');
  if (pendingStates.length === 0 && activeContacts.length > 0 && listsWithAutomations.length > 0) {
    issues.push('Contacts exist but no automation states created');
    recommendations.push('The cron job should automatically enroll contacts. Run /api/cron/process-email-automations to trigger enrollment.');
  }

  // Check for states ready to process
  const now = new Date();
  const readyStates = automationStates.filter(s => {
    if (s.status !== 'active') return false;
    const nextTime = new Date(s.nextStepTime);
    return nextTime <= now;
  });

  if (readyStates.length > 0) {
    recommendations.push(`${readyStates.length} automation state(s) are ready to process. Run /api/cron/process-email-automations to send emails.`);
  }

  return {
    companyId,
    companyName: companyData.name || 'Unknown',
    apiKeysConfigured,
    emailLists,
    automations,
    contacts,
    automationStates,
    issues,
    recommendations,
  };
}

export async function POST(request: NextRequest) {
  return GET(request);
}
