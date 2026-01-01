"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, IndianRupee, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createStripeCheckoutSession } from '@/app/actions/stripe-payment-actions';
import { createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions/razorpay-payment-actions';
import type { BillingCycle } from '@/types/payment';
import type { Plan } from '@/types/saas';
import { getPriceForPlanWithBillingCycle, getCurrencySymbol, type SupportedCurrency } from '@/lib/geo-detection';

interface PaymentButtonProps {
  plan: Plan;
  billingCycle: BillingCycle;
  country?: string;
  currency?: SupportedCurrency;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function PaymentButton({
  plan,
  billingCycle,
  country,
  currency,
  variant = 'default',
  size = 'default',
  className,
}: PaymentButtonProps) {
  const { appUser, company } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Determine active currency - use passed currency or detect from country
  const activeCurrency: SupportedCurrency = currency || (country?.toLowerCase() === 'india' || country?.toLowerCase() === 'in' ? 'INR' : 'USD');
  
  // Use Razorpay ONLY for INR currency, Stripe for everything else
  const preferredGateway = activeCurrency === 'INR' ? 'razorpay' : 'stripe';
  
  // For plans with custom prices (not in the fixed pricing map), use the plan's USD price
  // For standard plans, use the geo-localized fixed pricing
  const isCustomPricedPlan = !['plan_free', 'plan_starter', 'plan_pro', 'plan_enterprise', 'plan_demo'].includes(plan.id);
  
  const amount = isCustomPricedPlan 
    ? plan.priceMonthlyUSD // Use the plan's USD price directly for custom plans
    : getPriceForPlanWithBillingCycle(
        plan.id, 
        activeCurrency, 
        billingCycle, 
        plan.yearlyDiscountPercentage || 0
      );
  
  const displayAmount = `${getCurrencySymbol(activeCurrency)}${amount.toLocaleString()}`;

  const handleStripePayment = async () => {
    if (!appUser?.idToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const result = await createStripeCheckoutSession({
        idToken: appUser.idToken,
        planId: plan.id,
        billingCycle,
        currency: activeCurrency,
      });

      if (result.success && result.session?.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.session.url;
      } else {
        toast({
          title: 'Payment Failed',
          description: result.error || 'Failed to create checkout session',
          variant: 'destructive',
        });
        setLoading(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!appUser?.idToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Create Razorpay order
      const result = await createRazorpayOrder({
        idToken: appUser.idToken,
        planId: plan.id,
        billingCycle,
      });

      if (!result.success || !result.order) {
        toast({
          title: 'Payment Failed',
          description: result.error || 'Failed to create order',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { orderId, amount, currency, key } = result.order;

      // Open Razorpay checkout
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: plan.name,
        description: `${plan.name} Plan - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Verify payment on server
          const verifyResult = await verifyRazorpayPayment({
            idToken: appUser.idToken!,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });

          if (verifyResult.success) {
            toast({
              title: 'Payment Successful!',
              description: `You have been upgraded to ${plan.name} plan`,
            });
            
            // Redirect to dashboard
            window.location.href = '/settings?tab=billing&payment=success';
          } else {
            toast({
              title: 'Verification Failed',
              description: verifyResult.error || 'Payment verification failed',
              variant: 'destructive',
            });
          }
          
          setLoading(false);
        },
        prefill: {
          email: appUser.email,
          name: appUser.name || '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment',
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (preferredGateway === 'razorpay') {
      handleRazorpayPayment();
    } else {
      handleStripePayment();
    }
  };

  if (amount === 0) {
    return null; // Don't show payment button for free plan
  }

  // Get the correct icon based on currency
  const getCurrencyIcon = () => {
    if (activeCurrency === 'INR') {
      return <IndianRupee className="mr-2 h-4 w-4" />;
    }
    return <DollarSign className="mr-2 h-4 w-4" />;
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      variant={variant}
      size={size}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {getCurrencyIcon()}
          Pay {displayAmount}
          {billingCycle === 'yearly' && ` (Save ${plan.yearlyDiscountPercentage}%)`}
        </>
      )}
    </Button>
  );
}
