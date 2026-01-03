/**
 * Invoice Payment Webhook Handler
 * Handles payment callbacks from Razorpay and Stripe for invoice payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { Invoice, InvoicePayment } from '@/types/invoice';
import Stripe from 'stripe';

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const invoiceId = searchParams.get('invoiceId');
  const gateway = searchParams.get('gateway') || 'razorpay';
  const sessionId = searchParams.get('session_id'); // Stripe
  const razorpayPaymentId = searchParams.get('razorpay_payment_id');
  const razorpayPaymentLinkId = searchParams.get('razorpay_payment_link_id');
  const razorpayPaymentLinkStatus = searchParams.get('razorpay_payment_link_status');

  if (!invoiceId) {
    return NextResponse.redirect(new URL('/?error=missing_invoice', request.url));
  }

  if (!adminDb) {
    return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=error&reason=db`, request.url));
  }

  try {
    const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return NextResponse.redirect(new URL('/?error=invoice_not_found', request.url));
    }

    const invoice = invoiceDoc.data() as Invoice;
    let paymentAmount = 0;
    let paymentReference = '';
    let paymentMethod: 'razorpay' | 'stripe' = gateway as any;

    if (gateway === 'stripe' && sessionId) {
      // Verify Stripe payment using company-specific credentials
      const stripe = await getCompanyStripeInstance(invoice.companyId);
      if (!stripe) {
        return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=error&reason=stripe_not_configured`, request.url));
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=pending`, request.url));
      }

      paymentAmount = (session.amount_total || 0) / 100;
      paymentReference = session.payment_intent as string || sessionId;
      paymentMethod = 'stripe';

    } else if (gateway === 'razorpay' && razorpayPaymentId) {
      // Razorpay payment callback
      if (razorpayPaymentLinkStatus !== 'paid') {
        return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=pending`, request.url));
      }

      paymentAmount = invoice.amountDue; // Razorpay doesn't send amount in callback
      paymentReference = razorpayPaymentId;
      paymentMethod = 'razorpay';
    } else {
      return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=error&reason=invalid_callback`, request.url));
    }

    // Check if payment already recorded
    const existingPayment = invoice.payments.find(p => p.gatewayId === paymentReference);
    if (existingPayment) {
      return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=success&already_recorded=true`, request.url));
    }

    // Record the payment
    const now = new Date().toISOString();
    const newPayment: InvoicePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      date: now.split('T')[0],
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference,
      gatewayId: paymentReference,
      notes: `Online payment via ${paymentMethod === 'stripe' ? 'Stripe' : 'Razorpay'}`,
      recordedBy: 'system',
      recordedAt: now,
    };

    const newAmountPaid = invoice.amountPaid + paymentAmount;
    const newAmountDue = invoice.total - newAmountPaid;

    let newStatus = invoice.status;
    if (newAmountDue <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    await adminDb.collection('invoices').doc(invoiceId).update({
      payments: [...invoice.payments, newPayment],
      amountPaid: newAmountPaid,
      amountDue: Math.max(0, newAmountDue),
      status: newStatus,
      paidAt: newStatus === 'paid' ? now : invoice.paidAt,
      updatedAt: now,
    });

    // Redirect to invoice with success message
    return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=success`, request.url));

  } catch (error: any) {
    console.error('Invoice payment webhook error:', error);
    return NextResponse.redirect(new URL(`/invoice/${invoiceId}?payment=error&reason=${encodeURIComponent(error.message)}`, request.url));
  }
}

// POST handler for Razorpay webhooks (server-to-server)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Handle Razorpay payment.captured event
    if (event === 'payment.captured' || event === 'payment_link.paid') {
      const payload = body.payload;
      const payment = payload.payment?.entity || payload.payment_link?.entity;
      
      if (!payment) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
      }

      const invoiceId = payment.notes?.invoiceId;
      if (!invoiceId) {
        return NextResponse.json({ received: true, message: 'No invoice ID in notes' });
      }

      const invoiceDoc = await adminDb.collection('invoices').doc(invoiceId).get();
      if (!invoiceDoc.exists) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoice = invoiceDoc.data() as Invoice;
      const paymentId = payment.id;
      const amount = (payment.amount || 0) / 100; // Convert from paise

      // Check if already recorded
      const existingPayment = invoice.payments.find(p => p.gatewayId === paymentId);
      if (existingPayment) {
        return NextResponse.json({ received: true, message: 'Payment already recorded' });
      }

      // Record payment
      const now = new Date().toISOString();
      const newPayment: InvoicePayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        date: now.split('T')[0],
        amount,
        method: 'razorpay',
        reference: paymentId,
        gatewayId: paymentId,
        notes: 'Online payment via Razorpay (webhook)',
        recordedBy: 'system',
        recordedAt: now,
      };

      const newAmountPaid = invoice.amountPaid + amount;
      const newAmountDue = invoice.total - newAmountPaid;

      await adminDb.collection('invoices').doc(invoiceId).update({
        payments: [...invoice.payments, newPayment],
        amountPaid: newAmountPaid,
        amountDue: Math.max(0, newAmountDue),
        status: newAmountDue <= 0 ? 'paid' : 'partial',
        paidAt: newAmountDue <= 0 ? now : invoice.paidAt,
        updatedAt: now,
      });

      return NextResponse.json({ received: true, message: 'Payment recorded' });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Invoice payment webhook POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
