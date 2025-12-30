/**
 * Stripe Payment Actions
 * Server actions for Stripe payment processing
 * Reference: blueprint:javascript_stripe
 */

'use server';

import Stripe from 'stripe';
import { adminDb, verifyAuthToken } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Plan } from '@/types/saas';
import type { BillingCycle, StripeCheckoutSession } from '@/types/payment';
import { getPriceForPlanWithBillingCycle, type SupportedCurrency } from '@/lib/geo-detection';
import { addMonths, addYears } from 'date-fns';

// Initialize Stripe
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
};

/**
 * Create Stripe checkout session for plan subscription
 */
export async function createStripeCheckoutSession(params: {
  idToken: string;
  planId: string;
  billingCycle: BillingCycle;
  currency?: SupportedCurrency;
}): Promise<{ success: boolean; session?: StripeCheckoutSession; error?: string }> {
  try {
    // Verify authentication
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Authentication required' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }

    const userId = verification.uid;
    
    // Get user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const user = userDoc.data()!;
    const stripe = getStripeInstance();

    // Get plan details
    const planDoc = await adminDb.collection('plans').doc(params.planId).get();
    
    if (!planDoc.exists) {
      return { success: false, error: 'Plan not found' };
    }

    const plan = planDoc.data() as Plan;
    
    // Determine currency - default to USD for Stripe
    const currency = params.currency || 'USD';
    
    // Calculate price based on currency
    const amount = getPriceForPlanWithBillingCycle(
      params.planId,
      currency,
      params.billingCycle,
      plan.yearlyDiscountPercentage || 0
    );
    
    if (amount === 0) {
      return { success: false, error: 'Free plan does not require payment' };
    }

    // Get or create Stripe customer
    const companyDoc = await adminDb.collection('companies').doc(user.companyId).get();
    
    if (!companyDoc.exists) {
      return { success: false, error: 'Company not found' };
    }

    const companyData = companyDoc.data()!;
    let customerId = companyData.stripeCustomerId;

    // Verify customer exists in Stripe, or create new one
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (err: any) {
        console.log('Stripe customer not found, creating new one:', customerId);
        customerId = null;
      }
    }

    // Create customer if doesn't exist or was invalid
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || '',
        name: companyData.name || user.name || '',
        metadata: {
          companyId: user.companyId,
          userId: userId,
        },
      });
      customerId = customer.id;
      
      // Save customer ID to company
      await adminDb.collection('companies').doc(user.companyId).update({
        stripeCustomerId: customerId,
      });
    }

    // Create checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      return { success: false, error: 'App URL not configured. Please set NEXT_PUBLIC_APP_URL environment variable.' };
    }
    
    const successUrl = `${appUrl}/settings?tab=billing&payment=success`;
    const cancelUrl = `${appUrl}/settings?tab=billing&payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: params.billingCycle === 'yearly' ? 'payment' : 'subscription',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `${plan.name} Plan - ${params.billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`,
              description: plan.description,
            },
            unit_amount: Math.round(amount * 100),
            ...(params.billingCycle === 'monthly' && {
              recurring: {
                interval: 'month',
              },
            }),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        companyId: user.companyId,
        planId: params.planId,
        billingCycle: params.billingCycle,
        currency: currency,
      },
    });

    return {
      success: true,
      session: {
        sessionId: session.id,
        url: session.url || '',
      },
    };
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    return {
      success: false,
      error: error.message || 'Failed to create checkout session',
    };
  }
}

/**
 * Handle successful Stripe payment
 * Called by webhook handler
 */
export async function handleStripePaymentSuccess(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }

    const stripe = getStripeInstance();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.companyId || !session.metadata?.planId) {
      return { success: false, error: 'Missing metadata in session' };
    }

    const { companyId, planId, billingCycle } = session.metadata;

    // Get plan details
    const planDoc = await adminDb.collection('plans').doc(planId).get();
    
    if (!planDoc.exists) {
      return { success: false, error: 'Plan not found' };
    }

    const plan = planDoc.data() as Plan;

    // Calculate new expiry date
    const now = new Date();
    const expiryDate = billingCycle === 'yearly' 
      ? addYears(now, 1)
      : addMonths(now, 1);

    // Update company subscription
    await adminDb.collection('companies').doc(companyId).update({
      planId: planId,
      billingCycle: billingCycle,
      planExpiresAt: expiryDate.toISOString(),
      status: 'active',
      stripeSubscriptionId: session.subscription || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Record transaction
    await adminDb.collection('paymentTransactions').doc(`stripe_${sessionId}`).set({
      companyId: companyId,
      gateway: 'stripe',
      gatewayTransactionId: session.id,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'USD',
      status: 'succeeded',
      description: `${plan.name} Plan - ${billingCycle}`,
      metadata: session.metadata,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error handling Stripe payment success:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Cancel Stripe subscription
 */
export async function cancelStripeSubscription(params: {
  idToken: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Authentication required' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }
    
    const userId = verification.uid;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const user = userDoc.data()!;

    const stripe = getStripeInstance();
    const companyDoc = await adminDb.collection('companies').doc(user.companyId).get();
    
    if (!companyDoc.exists) {
      return { success: false, error: 'Company not found' };
    }

    const companyData = companyDoc.data()!;
    const subscriptionId = companyData.stripeSubscriptionId;

    if (!subscriptionId) {
      return { success: false, error: 'No active subscription found' };
    }

    // Cancel at period end (don't cancel immediately)
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error canceling Stripe subscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Stripe customer portal URL for managing subscription
 */
export async function getStripePortalUrl(params: {
  idToken: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const verification = await verifyAuthToken(params.idToken);
    if (!verification.success) {
      return { success: false, error: 'Authentication required' };
    }

    if (!adminDb) {
      return { success: false, error: 'Database not initialized' };
    }
    
    const userId = verification.uid;
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const user = userDoc.data()!;

    const stripe = getStripeInstance();
    const companyDoc = await adminDb.collection('companies').doc(user.companyId).get();
    
    if (!companyDoc.exists) {
      return { success: false, error: 'Company not found' };
    }

    const companyData = companyDoc.data()!;
    const customerId = companyData.stripeCustomerId;

    if (!customerId) {
      return { success: false, error: 'No Stripe customer found' };
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=billing`;
    
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      return { success: false, error: 'App URL not configured' };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return { success: true, url: session.url };
  } catch (error: any) {
    console.error('Error creating Stripe portal session:', error);
    return { success: false, error: error.message };
  }
}
