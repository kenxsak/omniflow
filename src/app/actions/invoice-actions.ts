'use server';

import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Invoice, InvoiceSettings, CreateInvoiceInput, InvoiceItem, InvoiceTax, InvoicePayment, InvoiceStatus, InvoiceStats, PaymentMethod } from '@/types/invoice';
import Razorpay from 'razorpay';

// ============================================
// HELPERS
// ============================================

function generateInvoiceNumber(settings: InvoiceSettings): string {
  const year = new Date().getFullYear();
  const num = String(settings.nextNumber).padStart(4, '0');
  return settings.numberFormat
    .replace('{prefix}', settings.prefix)
    .replace('{year}', String(year))
    .replace('{number}', num);
}

function calculateItemAmount(item: Omit<InvoiceItem, 'id' | 'amount' | 'taxAmount' | 'discountAmount'>): InvoiceItem {
  const baseAmount = item.quantity * item.unitPrice;
  const discountAmount = item.discount ? baseAmount * (item.discount / 100) : 0;
  const afterDiscount = baseAmount - discountAmount;
  const taxAmount = item.taxRate ? afterDiscount * (item.taxRate / 100) : 0;
  
  return {
    ...item,
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    amount: afterDiscount,
    discountAmount,
    taxAmount,
  };
}

function calculateTaxes(items: InvoiceItem[], isInterState: boolean): InvoiceTax[] {
  const totalTaxAmount = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  
  if (totalTaxAmount === 0) return [];
  
  // For India GST
  if (isInterState) {
    // IGST for inter-state
    return [{ name: 'IGST', rate: 18, amount: totalTaxAmount }];
  } else {
    // CGST + SGST for intra-state (split 50-50)
    const halfTax = totalTaxAmount / 2;
    return [
      { name: 'CGST', rate: 9, amount: halfTax },
      { name: 'SGST', rate: 9, amount: halfTax },
    ];
  }
}

async function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// Get Razorpay instance using company-specific credentials
async function getCompanyRazorpayInstance(companyId: string) {
  if (!adminDb) return null;
  
  const settingsDoc = await adminDb.collection('invoiceSettings').doc(companyId).get();
  if (!settingsDoc.exists) return null;
  
  const settings = settingsDoc.data();
  const razorpay = settings?.paymentGateway?.razorpay;
  
  if (!razorpay?.enabled || !razorpay?.keyId || !razorpay?.keySecret) return null;
  
  return new Razorpay({ key_id: razorpay.keyId, key_secret: razorpay.keySecret });
}

import Stripe from 'stripe';

function getStripeInstance() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  return new Stripe(secretKey, { apiVersion: '2025-10-29.clover' });
}

// Get Stripe instance using company-specific credentials
async function getCompanyStripeInstance(companyId: string) {
  if (!adminDb) return null;
  
  const settingsDoc = await adminDb.collection('invoiceSettings').doc(companyId).get();
  if (!settingsDoc.exists) return null;
  
  const settings = settingsDoc.data();
  const stripe = settings?.paymentGateway?.stripe;
  
  if (!stripe?.enabled || !stripe?.secretKey) return null;
  
  return new Stripe(stripe.secretKey, { apiVersion: '2025-10-29.clover' });
}

// Get preferred gateway for a company
async function getPreferredGateway(companyId: string, currency: string): Promise<'razorpay' | 'stripe' | null> {
  if (!adminDb) return null;
  
  const settingsDoc = await adminDb.collection('invoiceSettings').doc(companyId).get();
  if (!settingsDoc.exists) return null;
  
  const settings = settingsDoc.data();
  const pg = settings?.paymentGateway;
  
  if (!pg) return null;
  
  const preferred = pg.preferredGateway || 'auto';
  
  if (preferred === 'razorpay' && pg.razorpay?.enabled) return 'razorpay';
  if (preferred === 'stripe' && pg.stripe?.enabled) return 'stripe';
  
  // Auto mode: INR -> Razorpay, others -> Stripe
  if (preferred === 'auto') {
    if (currency === 'INR' && pg.razorpay?.enabled) return 'razorpay';
    if (pg.stripe?.enabled) return 'stripe';
    if (pg.razorpay?.enabled) return 'razorpay'; // Fallback to Razorpay if Stripe not available
  }
  
  return null;
}

// ============================================
// INVOICE SETTINGS
// ============================================

export async function getInvoiceSettingsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; settings?: InvoiceSettings; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    const settingsDoc = await adminDb.collection('invoiceSettings').doc(companyId).get();
    
    if (!settingsDoc.exists) {
      // Return defaults
      return {
        success: true,
        settings: {
          companyId,
          prefix: 'INV',
          nextNumber: 1,
          numberFormat: '{prefix}-{year}-{number}',
          gstEnabled: false,
          defaultTaxRate: 18,
          defaultDueDays: 30,
          updatedAt: new Date().toISOString(),
        },
      };
    }
    
    return { success: true, settings: settingsDoc.data() as InvoiceSettings };
  } catch (error) {
    console.error('Error fetching invoice settings:', error);
    return { success: false, error: 'Failed to fetch settings' };
  }
}

export async function updateInvoiceSettingsAction(params: {
  idToken: string;
  settings: Partial<InvoiceSettings>;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    await adminDb.collection('invoiceSettings').doc(companyId).set({
      companyId,
      ...params.settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}


// ============================================
// INVOICE CRUD
// ============================================

export async function createInvoiceAction(params: {
  idToken: string;
  invoice: CreateInvoiceInput;
}): Promise<{ success: boolean; invoiceId?: string; invoiceNumber?: string; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      console.error('Invoice creation failed: Auth verification failed');
      return { success: false, error: 'Unauthorized - please log in again' };
    }

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) {
      console.error('Invoice creation failed: User document not found');
      return { success: false, error: 'User profile not found' };
    }
    
    const companyId = userDoc.data()?.companyId;
    if (!companyId) {
      console.error('Invoice creation failed: No companyId for user');
      return { success: false, error: 'Company not configured' };
    }
    
    // Get settings
    const settingsResult = await getInvoiceSettingsAction({ idToken: params.idToken });
    if (!settingsResult.success || !settingsResult.settings) {
      return { success: false, error: 'Failed to get invoice settings' };
    }
    const settings = settingsResult.settings;
    
    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(settings);
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Calculate items
    const items = params.invoice.items.map(item => calculateItemAmount({
      ...item,
      taxRate: params.invoice.gstEnabled ? (item.taxRate || settings.defaultTaxRate) : 0,
    }));
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = params.invoice.discountPercent ? subtotal * (params.invoice.discountPercent / 100) : 0;
    const afterDiscount = subtotal - discountAmount;
    
    // Calculate taxes
    const isInterState = params.invoice.placeOfSupply !== settings.gstState;
    const taxes = params.invoice.gstEnabled ? calculateTaxes(items, isInterState) : [];
    const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
    
    const total = afterDiscount + taxTotal;
    
    // Get company GSTIN
    const companyDoc = await adminDb.collection('companies').doc(companyId).get();
    const companyGstin = companyDoc.exists ? companyDoc.data()?.gstin : undefined;
    
    const now = new Date().toISOString();
    const issueDate = params.invoice.issueDate || now.split('T')[0];
    const dueDate = params.invoice.dueDate || new Date(Date.now() + settings.defaultDueDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // Build invoice object, filtering out undefined values
    const invoice: Record<string, any> = {
      id: invoiceId,
      companyId,
      invoiceNumber,
      status: 'draft',
      clientName: params.invoice.clientName,
      clientEmail: params.invoice.clientEmail,
      issueDate,
      dueDate,
      items,
      subtotal,
      discountAmount,
      taxes,
      taxTotal,
      total,
      amountPaid: 0,
      amountDue: total,
      currency: 'INR',
      gstEnabled: params.invoice.gstEnabled || false,
      isInterState,
      payments: [],
      createdBy: verification.uid,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add optional fields only if they have values
    if (params.invoice.clientId) invoice.clientId = params.invoice.clientId;
    if (params.invoice.clientPhone) invoice.clientPhone = params.invoice.clientPhone;
    if (params.invoice.clientAddress) invoice.clientAddress = params.invoice.clientAddress;
    if (params.invoice.clientGstin) invoice.clientGstin = params.invoice.clientGstin;
    if (params.invoice.discountPercent) invoice.discountPercent = params.invoice.discountPercent;
    if (companyGstin) invoice.companyGstin = companyGstin;
    if (params.invoice.placeOfSupply) invoice.placeOfSupply = params.invoice.placeOfSupply;
    if (params.invoice.notes || settings.defaultNotes) invoice.notes = params.invoice.notes || settings.defaultNotes;
    if (params.invoice.terms || settings.defaultTerms) invoice.terms = params.invoice.terms || settings.defaultTerms;
    if (params.invoice.quoteId) invoice.quoteId = params.invoice.quoteId;
    
    await adminDb.collection('invoices').doc(invoiceId).set(invoice);
    
    // Increment invoice number
    await adminDb.collection('invoiceSettings').doc(companyId).set({
      nextNumber: settings.nextNumber + 1,
      updatedAt: now,
    }, { merge: true });
    
    return { success: true, invoiceId, invoiceNumber };
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    return { success: false, error: error?.message || 'Failed to create invoice' };
  }
}

export async function getInvoicesAction(params: {
  idToken: string;
  status?: InvoiceStatus | InvoiceStatus[];
  clientId?: string;
  limit?: number;
}): Promise<{ success: boolean; invoices?: Invoice[]; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    // Simple query without orderBy to avoid index requirement initially
    const snapshot = await adminDb.collection('invoices')
      .where('companyId', '==', companyId)
      .limit(params.limit || 100)
      .get();
    
    let invoices = snapshot.docs.map(doc => doc.data() as Invoice);
    
    // Sort in memory
    invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Filter by status if provided
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      invoices = invoices.filter(inv => statuses.includes(inv.status));
    }
    
    // Filter by client if provided
    if (params.clientId) {
      invoices = invoices.filter(inv => inv.clientId === params.clientId);
    }
    
    return { success: true, invoices };
  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    return { success: false, error: error?.message || 'Failed to fetch invoices' };
  }
}

export async function getInvoiceAction(params: {
  idToken: string;
  invoiceId: string;
}): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    
    // Verify access
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}


// ============================================
// INVOICE STATUS & PAYMENTS
// ============================================

export async function updateInvoiceStatusAction(params: {
  idToken: string;
  invoiceId: string;
  status: InvoiceStatus;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const updateData: Record<string, any> = { 
      status: params.status,
      updatedAt: new Date().toISOString(),
    };
    
    if (params.status === 'sent' && !invoice.sentAt) {
      updateData.sentAt = new Date().toISOString();
    } else if (params.status === 'paid' && !invoice.paidAt) {
      updateData.paidAt = new Date().toISOString();
    }
    
    await adminDb.collection('invoices').doc(params.invoiceId).update(updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return { success: false, error: 'Failed to update status' };
  }
}

export async function recordPaymentAction(params: {
  idToken: string;
  invoiceId: string;
  payment: {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
    date?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    const now = new Date().toISOString();
    const newPayment: InvoicePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      date: params.payment.date || now.split('T')[0],
      amount: params.payment.amount,
      method: params.payment.method,
      reference: params.payment.reference,
      notes: params.payment.notes,
      recordedBy: verification.uid,
      recordedAt: now,
    };
    
    const newAmountPaid = invoice.amountPaid + params.payment.amount;
    const newAmountDue = invoice.total - newAmountPaid;
    
    let newStatus: InvoiceStatus = invoice.status;
    if (newAmountDue <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }
    
    await adminDb.collection('invoices').doc(params.invoiceId).update({
      payments: [...invoice.payments, newPayment],
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      paidAt: newStatus === 'paid' ? now : invoice.paidAt,
      updatedAt: now,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: 'Failed to record payment' };
  }
}

// ============================================
// PAYMENT LINK (Razorpay & Stripe)
// ============================================

export async function createPaymentLinkAction(params: {
  idToken: string;
  invoiceId: string;
  gateway?: 'razorpay' | 'stripe'; // Auto-detect based on currency if not specified
}): Promise<{ success: boolean; paymentLink?: string; gateway?: string; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // If already has payment link, return it
    if (invoice.paymentLink) {
      return { success: true, paymentLink: invoice.paymentLink, gateway: invoice.paymentLinkId?.startsWith('plink_') ? 'razorpay' : 'stripe' };
    }
    
    // Get preferred gateway from company settings
    const gateway = params.gateway || await getPreferredGateway(invoice.companyId, invoice.currency);
    
    if (!gateway) {
      return { success: false, error: 'No payment gateway configured. Go to Settings → Invoices to add Razorpay or Stripe credentials.' };
    }
    
    // Get company name
    const companyDoc = await adminDb.collection('companies').doc(invoice.companyId).get();
    const companyName = companyDoc.exists ? companyDoc.data()?.name : 'Business';
    
    let paymentLink: string;
    let paymentLinkId: string;
    
    if (gateway === 'razorpay') {
      const razorpay = await getCompanyRazorpayInstance(invoice.companyId);
      if (!razorpay) {
        return { success: false, error: 'Razorpay not configured. Go to Settings → Invoices to add your Razorpay API keys.' };
      }
      
      // Create Razorpay payment link
      const link = await razorpay.paymentLink.create({
        amount: Math.round(invoice.amountDue * 100), // Convert to paise
        currency: 'INR',
        accept_partial: true,
        first_min_partial_amount: Math.round(invoice.amountDue * 10), // 10% minimum
        description: `Invoice ${invoice.invoiceNumber} from ${companyName}`,
        customer: {
          name: invoice.clientName,
          email: invoice.clientEmail,
          contact: invoice.clientPhone || undefined,
        },
        notify: {
          sms: !!invoice.clientPhone,
          email: true,
        },
        reminder_enable: true,
        notes: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          companyId: invoice.companyId,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/invoice-payment?invoiceId=${invoice.id}&gateway=razorpay`,
        callback_method: 'get',
      });
      
      paymentLink = link.short_url;
      paymentLinkId = link.id;
    } else {
      // Stripe
      const stripe = await getCompanyStripeInstance(invoice.companyId);
      if (!stripe) {
        return { success: false, error: 'Stripe not configured. Go to Settings → Invoices to add your Stripe API keys.' };
      }
      
      // Create Stripe payment link via checkout session
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoiceNumber}`,
              description: `Payment to ${companyName}`,
            },
            unit_amount: Math.round(invoice.amountDue * 100), // Convert to cents
          },
          quantity: 1,
        }],
        customer_email: invoice.clientEmail,
        metadata: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          companyId: invoice.companyId,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/invoice-payment?invoiceId=${invoice.id}&gateway=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}?payment=cancelled`,
      });
      
      paymentLink = session.url || '';
      paymentLinkId = session.id;
    }
    
    // Save payment link to invoice
    await adminDb.collection('invoices').doc(params.invoiceId).update({
      paymentLink,
      paymentLinkId,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true, paymentLink, gateway };
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return { success: false, error: error?.message || 'Failed to create payment link' };
  }
}

// Create payment link for both gateways (for settings page testing)
export async function testPaymentGatewayAction(params: {
  idToken: string;
  gateway: 'razorpay' | 'stripe';
}): Promise<{ success: boolean; configured: boolean; error?: string }> {
  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, configured: false, error: 'Unauthorized' };
    
    if (!adminDb) return { success: false, configured: false, error: 'Database not initialized' };
    
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, configured: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    if (params.gateway === 'razorpay') {
      const razorpay = await getCompanyRazorpayInstance(companyId);
      return { success: true, configured: !!razorpay };
    } else {
      const stripe = await getCompanyStripeInstance(companyId);
      return { success: true, configured: !!stripe };
    }
  } catch (error: any) {
    return { success: false, configured: false, error: error?.message };
  }
}


// ============================================
// SEND INVOICE
// ============================================

export async function sendInvoiceAction(params: {
  idToken: string;
  invoiceId: string;
  method: 'email' | 'whatsapp';
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Create payment link if not exists
    if (!invoice.paymentLink) {
      const linkResult = await createPaymentLinkAction({ idToken: params.idToken, invoiceId: params.invoiceId });
      if (!linkResult.success) {
        console.warn('Could not create payment link:', linkResult.error);
      }
    }
    
    // Update status to sent
    await adminDb.collection('invoices').doc(params.invoiceId).update({
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
      sentAt: invoice.sentAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending invoice:', error);
    return { success: false, error: 'Failed to send invoice' };
  }
}

// ============================================
// INVOICE STATS
// ============================================

export async function getInvoiceStatsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; stats?: InvoiceStats; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    const snapshot = await adminDb.collection('invoices')
      .where('companyId', '==', companyId)
      .get();
    
    const invoices = snapshot.docs.map(doc => doc.data() as Invoice);
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const stats: InvoiceStats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue' || (i.status === 'sent' && new Date(i.dueDate) < now)).length,
      totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
      totalOutstanding: invoices.filter(i => ['sent', 'partial', 'overdue'].includes(i.status)).reduce((sum, i) => sum + i.amountDue, 0),
      thisMonth: invoices.filter(i => i.status === 'paid' && new Date(i.paidAt || i.createdAt) >= thisMonthStart).reduce((sum, i) => sum + i.total, 0),
      lastMonth: invoices.filter(i => i.status === 'paid' && new Date(i.paidAt || i.createdAt) >= lastMonthStart && new Date(i.paidAt || i.createdAt) <= lastMonthEnd).reduce((sum, i) => sum + i.total, 0),
    };
    
    return { success: true, stats };
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}

// ============================================
// DELETE INVOICE
// ============================================

export async function deleteInvoiceAction(params: {
  idToken: string;
  invoiceId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== invoice.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    // Only allow deleting draft invoices
    if (invoice.status !== 'draft') {
      return { success: false, error: 'Can only delete draft invoices. Cancel the invoice instead.' };
    }
    
    await adminDb.collection('invoices').doc(params.invoiceId).delete();
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return { success: false, error: 'Failed to delete invoice' };
  }
}

// ============================================
// PUBLIC INVOICE VIEW (No auth required)
// ============================================

export async function getPublicInvoiceAction(params: {
  invoiceId: string;
}): Promise<{ success: boolean; invoice?: Invoice; companyBranding?: any; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const invoiceDoc = await adminDb.collection('invoices').doc(params.invoiceId).get();
    if (!invoiceDoc.exists) return { success: false, error: 'Invoice not found' };
    
    const invoice = invoiceDoc.data() as Invoice;
    
    // Mark as viewed if first time
    if (!invoice.viewedAt && invoice.status === 'sent') {
      await adminDb.collection('invoices').doc(params.invoiceId).update({
        viewedAt: new Date().toISOString(),
        status: 'viewed',
      });
      invoice.viewedAt = new Date().toISOString();
      invoice.status = 'viewed';
    }
    
    // Get company branding
    const companyDoc = await adminDb.collection('companies').doc(invoice.companyId).get();
    const companyData = companyDoc.exists ? companyDoc.data() : {};
    const branding = companyData?.companyBranding || {};
    
    return { 
      success: true, 
      invoice,
      companyBranding: {
        name: companyData?.name || 'Business',
        logoUrl: branding.logoUrl,
        primaryColor: branding.primaryColor || '#10b981',
        phone: companyData?.phone,
        email: companyData?.registeredEmail,
        address: companyData?.address,
        website: companyData?.website,
      },
    };
  } catch (error) {
    console.error('Error fetching public invoice:', error);
    return { success: false, error: 'Failed to fetch invoice' };
  }
}


// ============================================
// RECURRING INVOICES
// ============================================

export async function createRecurringInvoiceAction(params: {
  idToken: string;
  recurring: import('@/types/invoice').CreateRecurringInvoiceInput;
}): Promise<{ success: boolean; recurringId?: string; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    const now = new Date().toISOString();
    const recurringId = `rec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Calculate next invoice date based on frequency and start date
    const startDate = new Date(params.recurring.startDate);
    let nextInvoiceDate = startDate;
    
    // If start date is in the past, calculate next occurrence
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (nextInvoiceDate < today) {
      switch (params.recurring.frequency) {
        case 'weekly':
          nextInvoiceDate.setDate(nextInvoiceDate.getDate() + 7);
          break;
        case 'monthly':
          nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 3);
          break;
        case 'yearly':
          nextInvoiceDate.setFullYear(nextInvoiceDate.getFullYear() + 1);
          break;
      }
    }
    
    const recurring: Record<string, any> = {
      id: recurringId,
      companyId,
      clientName: params.recurring.clientName,
      clientEmail: params.recurring.clientEmail,
      items: params.recurring.items,
      frequency: params.recurring.frequency,
      startDate: params.recurring.startDate,
      nextInvoiceDate: nextInvoiceDate.toISOString().split('T')[0],
      isActive: true,
      totalGenerated: 0,
      autoSend: params.recurring.autoSend ?? true,
      autoReminder: params.recurring.autoReminder ?? true,
      createdBy: verification.uid,
      createdAt: now,
      updatedAt: now,
    };
    
    // Add optional fields
    if (params.recurring.clientId) recurring.clientId = params.recurring.clientId;
    if (params.recurring.clientPhone) recurring.clientPhone = params.recurring.clientPhone;
    if (params.recurring.clientAddress) recurring.clientAddress = params.recurring.clientAddress;
    if (params.recurring.clientGstin) recurring.clientGstin = params.recurring.clientGstin;
    if (params.recurring.discountPercent) recurring.discountPercent = params.recurring.discountPercent;
    if (params.recurring.gstEnabled !== undefined) recurring.gstEnabled = params.recurring.gstEnabled;
    if (params.recurring.placeOfSupply) recurring.placeOfSupply = params.recurring.placeOfSupply;
    if (params.recurring.notes) recurring.notes = params.recurring.notes;
    if (params.recurring.terms) recurring.terms = params.recurring.terms;
    if (params.recurring.endDate) recurring.endDate = params.recurring.endDate;
    if (params.recurring.dayOfMonth) recurring.dayOfMonth = params.recurring.dayOfMonth;
    
    await adminDb.collection('recurringInvoices').doc(recurringId).set(recurring);
    
    return { success: true, recurringId };
  } catch (error: any) {
    console.error('Error creating recurring invoice:', error);
    return { success: false, error: error?.message || 'Failed to create recurring invoice' };
  }
}

export async function getRecurringInvoicesAction(params: {
  idToken: string;
}): Promise<{ success: boolean; recurring?: import('@/types/invoice').RecurringInvoice[]; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    const snapshot = await adminDb.collection('recurringInvoices')
      .where('companyId', '==', companyId)
      .get();
    
    const recurring = snapshot.docs.map(doc => doc.data() as import('@/types/invoice').RecurringInvoice);
    recurring.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return { success: true, recurring };
  } catch (error: any) {
    console.error('Error fetching recurring invoices:', error);
    return { success: false, error: error?.message || 'Failed to fetch recurring invoices' };
  }
}

export async function updateRecurringInvoiceAction(params: {
  idToken: string;
  recurringId: string;
  updates: Partial<import('@/types/invoice').RecurringInvoice>;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const recurringDoc = await adminDb.collection('recurringInvoices').doc(params.recurringId).get();
    if (!recurringDoc.exists) return { success: false, error: 'Recurring invoice not found' };
    
    const recurring = recurringDoc.data();
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== recurring?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    await adminDb.collection('recurringInvoices').doc(params.recurringId).update({
      ...params.updates,
      updatedAt: new Date().toISOString(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating recurring invoice:', error);
    return { success: false, error: error?.message || 'Failed to update recurring invoice' };
  }
}

export async function deleteRecurringInvoiceAction(params: {
  idToken: string;
  recurringId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const recurringDoc = await adminDb.collection('recurringInvoices').doc(params.recurringId).get();
    if (!recurringDoc.exists) return { success: false, error: 'Recurring invoice not found' };
    
    const recurring = recurringDoc.data();
    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists || userDoc.data()?.companyId !== recurring?.companyId) {
      return { success: false, error: 'Unauthorized' };
    }
    
    await adminDb.collection('recurringInvoices').doc(params.recurringId).delete();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting recurring invoice:', error);
    return { success: false, error: error?.message || 'Failed to delete recurring invoice' };
  }
}

// Generate invoices from recurring templates (called by cron)
export async function generateRecurringInvoicesAction(): Promise<{ 
  success: boolean; 
  generated: number; 
  errors: string[];
}> {
  if (!adminDb) return { success: false, generated: 0, errors: ['Database not initialized'] };

  const result = { success: true, generated: 0, errors: [] as string[] };
  const today = new Date().toISOString().split('T')[0];

  try {
    // Get all active recurring invoices due today or earlier
    const snapshot = await adminDb.collection('recurringInvoices')
      .where('isActive', '==', true)
      .where('nextInvoiceDate', '<=', today)
      .get();

    for (const doc of snapshot.docs) {
      const recurring = doc.data() as import('@/types/invoice').RecurringInvoice;
      
      try {
        // Check if end date passed
        if (recurring.endDate && recurring.endDate < today) {
          await doc.ref.update({ isActive: false, updatedAt: new Date().toISOString() });
          continue;
        }
        
        // Get invoice settings for this company
        const settingsDoc = await adminDb.collection('invoiceSettings').doc(recurring.companyId).get();
        const settings = settingsDoc.exists ? settingsDoc.data() as InvoiceSettings : {
          prefix: 'INV',
          nextNumber: 1,
          numberFormat: '{prefix}-{year}-{number}',
          defaultTaxRate: 18,
          defaultDueDays: 30,
        };
        
        // Generate invoice number
        const invoiceNumber = generateInvoiceNumber(settings as InvoiceSettings);
        const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        
        // Calculate items
        const items = recurring.items.map(item => calculateItemAmount({
          ...item,
          taxRate: recurring.gstEnabled ? (item.taxRate || settings.defaultTaxRate || 18) : 0,
        }));
        
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const discountAmount = recurring.discountPercent ? subtotal * (recurring.discountPercent / 100) : 0;
        const afterDiscount = subtotal - discountAmount;
        
        const isInterState = recurring.placeOfSupply !== (settings as InvoiceSettings).gstState;
        const taxes = recurring.gstEnabled ? calculateTaxes(items, isInterState) : [];
        const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);
        const total = afterDiscount + taxTotal;
        
        const now = new Date().toISOString();
        const issueDate = today;
        const dueDate = new Date(Date.now() + ((settings as InvoiceSettings).defaultDueDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        // Create invoice
        const invoice: Record<string, any> = {
          id: invoiceId,
          companyId: recurring.companyId,
          invoiceNumber,
          status: recurring.autoSend ? 'sent' : 'draft',
          clientName: recurring.clientName,
          clientEmail: recurring.clientEmail,
          issueDate,
          dueDate,
          items,
          subtotal,
          discountAmount,
          taxes,
          taxTotal,
          total,
          amountPaid: 0,
          amountDue: total,
          currency: 'INR',
          gstEnabled: recurring.gstEnabled || false,
          isInterState,
          payments: [],
          createdBy: recurring.createdBy,
          createdAt: now,
          updatedAt: now,
          recurringInvoiceId: recurring.id,
        };
        
        if (recurring.clientId) invoice.clientId = recurring.clientId;
        if (recurring.clientPhone) invoice.clientPhone = recurring.clientPhone;
        if (recurring.clientAddress) invoice.clientAddress = recurring.clientAddress;
        if (recurring.clientGstin) invoice.clientGstin = recurring.clientGstin;
        if (recurring.discountPercent) invoice.discountPercent = recurring.discountPercent;
        if (recurring.placeOfSupply) invoice.placeOfSupply = recurring.placeOfSupply;
        if (recurring.notes) invoice.notes = recurring.notes;
        if (recurring.terms) invoice.terms = recurring.terms;
        if (recurring.autoSend) invoice.sentAt = now;
        
        await adminDb.collection('invoices').doc(invoiceId).set(invoice);
        
        // Update invoice settings next number
        await adminDb.collection('invoiceSettings').doc(recurring.companyId).set({
          nextNumber: (settings.nextNumber || 1) + 1,
          updatedAt: now,
        }, { merge: true });
        
        // Calculate next invoice date
        const nextDate = new Date(recurring.nextInvoiceDate);
        switch (recurring.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        
        // Update recurring invoice
        await doc.ref.update({
          nextInvoiceDate: nextDate.toISOString().split('T')[0],
          lastGeneratedAt: now,
          lastInvoiceId: invoiceId,
          totalGenerated: (recurring.totalGenerated || 0) + 1,
          updatedAt: now,
        });
        
        result.generated++;
      } catch (err: any) {
        result.errors.push(`Recurring ${recurring.id}: ${err.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Global error: ${error.message}`);
    result.success = false;
  }

  return result;
}

// ============================================
// PAYMENT REMINDERS
// ============================================

export async function getPaymentReminderSettingsAction(params: {
  idToken: string;
}): Promise<{ success: boolean; settings?: import('@/types/invoice').PaymentReminderSettings; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    const settingsDoc = await adminDb.collection('paymentReminderSettings').doc(companyId).get();
    
    if (!settingsDoc.exists) {
      // Return defaults
      return {
        success: true,
        settings: {
          companyId,
          reminderDays: [-3, 0, 3, 7], // 3 days before, on due date, 3 & 7 days after
          sendEmail: true,
          sendWhatsApp: false,
          sendSms: false,
          maxReminders: 4,
          stopOnPayment: true,
          updatedAt: new Date().toISOString(),
        },
      };
    }
    
    return { success: true, settings: settingsDoc.data() as import('@/types/invoice').PaymentReminderSettings };
  } catch (error: any) {
    console.error('Error fetching payment reminder settings:', error);
    return { success: false, error: error?.message || 'Failed to fetch settings' };
  }
}

export async function updatePaymentReminderSettingsAction(params: {
  idToken: string;
  settings: Partial<import('@/types/invoice').PaymentReminderSettings>;
}): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) return { success: false, error: 'Database not initialized' };

  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) return { success: false, error: 'Unauthorized' };

    const userDoc = await adminDb.collection('users').doc(verification.uid).get();
    if (!userDoc.exists) return { success: false, error: 'User not found' };
    
    const companyId = userDoc.data()?.companyId;
    
    await adminDb.collection('paymentReminderSettings').doc(companyId).set({
      companyId,
      ...params.settings,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating payment reminder settings:', error);
    return { success: false, error: error?.message || 'Failed to update settings' };
  }
}

// Process payment reminders (called by cron)
export async function processPaymentRemindersAction(): Promise<{
  success: boolean;
  remindersSent: number;
  errors: string[];
}> {
  if (!adminDb) return { success: false, remindersSent: 0, errors: ['Database not initialized'] };

  const result = { success: true, remindersSent: 0, errors: [] as string[] };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get all companies with reminder settings
    const settingsSnapshot = await adminDb.collection('paymentReminderSettings').get();
    
    for (const settingsDoc of settingsSnapshot.docs) {
      const settings = settingsDoc.data() as import('@/types/invoice').PaymentReminderSettings;
      const companyId = settings.companyId;
      
      if (!settings.sendEmail && !settings.sendWhatsApp && !settings.sendSms) continue;
      
      try {
        // Get unpaid invoices for this company
        const invoicesSnapshot = await adminDb.collection('invoices')
          .where('companyId', '==', companyId)
          .where('status', 'in', ['sent', 'viewed', 'partial', 'overdue'])
          .get();
        
        for (const invoiceDoc of invoicesSnapshot.docs) {
          const invoice = invoiceDoc.data() as Invoice;
          const dueDate = new Date(invoice.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          
          // Calculate days from due date (negative = before, positive = after)
          const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
          
          // Check if today matches any reminder day
          if (!settings.reminderDays.includes(daysDiff)) continue;
          
          // Check how many reminders already sent
          const remindersSnapshot = await adminDb.collection('invoiceReminders')
            .where('invoiceId', '==', invoice.id)
            .where('status', '==', 'sent')
            .get();
          
          if (remindersSnapshot.size >= settings.maxReminders) continue;
          
          // Check if reminder already sent today
          const todayStr = today.toISOString().split('T')[0];
          const todayReminder = remindersSnapshot.docs.find(d => 
            d.data().sentAt?.startsWith(todayStr)
          );
          if (todayReminder) continue;
          
          // Send reminder (email for now)
          if (settings.sendEmail) {
            const reminderId = `rem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            
            // Record the reminder
            await adminDb.collection('invoiceReminders').doc(reminderId).set({
              id: reminderId,
              invoiceId: invoice.id,
              companyId,
              scheduledFor: todayStr,
              sentAt: new Date().toISOString(),
              channel: 'email',
              status: 'sent',
              createdAt: new Date().toISOString(),
            });
            
            result.remindersSent++;
            
            // Update invoice status to overdue if past due
            if (daysDiff > 0 && invoice.status !== 'overdue') {
              await invoiceDoc.ref.update({ status: 'overdue', updatedAt: new Date().toISOString() });
            }
          }
        }
      } catch (err: any) {
        result.errors.push(`Company ${companyId}: ${err.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Global error: ${error.message}`);
    result.success = false;
  }

  return result;
}
