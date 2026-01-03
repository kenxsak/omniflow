import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';

/**
 * Webhook handler for appointment payment callbacks
 * Supports both Razorpay and Stripe
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const appointmentId = searchParams.get('appointmentId');
  const gateway = searchParams.get('gateway');
  const sessionId = searchParams.get('session_id'); // Stripe
  const razorpayPaymentId = searchParams.get('razorpay_payment_id'); // Razorpay
  const razorpayPaymentLinkId = searchParams.get('razorpay_payment_link_id'); // Razorpay
  const razorpayPaymentLinkStatus = searchParams.get('razorpay_payment_link_status'); // Razorpay

  if (!appointmentId) {
    return NextResponse.redirect(new URL('/appointments?error=missing_appointment_id', request.url));
  }

  if (!adminDb) {
    console.error('Database not initialized');
    return NextResponse.redirect(new URL('/appointments?error=server_error', request.url));
  }

  try {
    // Get the appointment
    const appointmentDoc = await adminDb.collection('appointments').doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      return NextResponse.redirect(new URL('/appointments?error=appointment_not_found', request.url));
    }

    const appointment = appointmentDoc.data();
    const companyId = appointment?.companyId;

    if (gateway === 'razorpay') {
      // Razorpay callback
      if (razorpayPaymentLinkStatus === 'paid' && razorpayPaymentId) {
        await adminDb.collection('appointments').doc(appointmentId).update({
          paymentStatus: 'paid',
          paymentId: razorpayPaymentId,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Log the payment
        await adminDb.collection('appointmentPayments').add({
          appointmentId,
          companyId,
          gateway: 'razorpay',
          paymentId: razorpayPaymentId,
          paymentLinkId: razorpayPaymentLinkId,
          amount: appointment?.price || 0,
          currency: appointment?.currency || 'INR',
          status: 'paid',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        return NextResponse.redirect(
          new URL(`/appointments?payment=success&appointmentId=${appointmentId}`, request.url)
        );
      }
    } else if (gateway === 'stripe' && sessionId) {
      // Stripe callback - verify the session
      const settingsDoc = await adminDb.collection('invoiceSettings').doc(companyId).get();
      const settings = settingsDoc.exists ? settingsDoc.data() : null;
      const stripeSecretKey = settings?.paymentGateway?.stripe?.secretKey;

      if (!stripeSecretKey) {
        console.error('Stripe not configured for company:', companyId);
        return NextResponse.redirect(new URL('/appointments?error=payment_config_error', request.url));
      }

      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-10-29.clover' });
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === 'paid') {
        await adminDb.collection('appointments').doc(appointmentId).update({
          paymentStatus: 'paid',
          paymentId: session.payment_intent as string,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Log the payment
        await adminDb.collection('appointmentPayments').add({
          appointmentId,
          companyId,
          gateway: 'stripe',
          paymentId: session.payment_intent,
          sessionId,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency?.toUpperCase() || 'USD',
          status: 'paid',
          paidAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        });

        return NextResponse.redirect(
          new URL(`/appointments?payment=success&appointmentId=${appointmentId}`, request.url)
        );
      }
    }

    // Payment not completed or unknown gateway
    return NextResponse.redirect(
      new URL(`/appointments?payment=pending&appointmentId=${appointmentId}`, request.url)
    );
  } catch (error) {
    console.error('Error processing appointment payment webhook:', error);
    return NextResponse.redirect(new URL('/appointments?error=payment_processing_error', request.url));
  }
}

// POST handler for Stripe webhooks (if using webhook events)
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    // For now, just acknowledge the webhook
    // Full implementation would verify signature and process events
    console.log('Received appointment payment webhook POST');

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing appointment payment webhook POST:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
