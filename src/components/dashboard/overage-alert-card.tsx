'use client';

/**
 * Overage Alert Card
 * Shows users when they've exceeded their monthly credit limit and incurred overage charges
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { getCompanyOverageAction } from '@/app/actions/overage-billing-actions';
import type { AIOverageCharge } from '@/types/ai-usage';
import { useAuth } from '@/hooks/use-auth';

export default function OverageAlertCard() {
  const { appUser } = useAuth();
  const [overage, setOverage] = useState<AIOverageCharge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appUser?.companyId) return;

    const fetchOverage = async () => {
      setLoading(true);
      const result = await getCompanyOverageAction(appUser.companyId);
      if (result.success && result.overage) {
        setOverage(result.overage);
      }
      setLoading(false);
    };

    fetchOverage();
  }, [appUser]);

  if (loading || !overage || overage.creditsOverLimit <= 0) {
    return null; // Don't show card if no overage
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);

  const getBillingStatusBadge = () => {
    switch (overage.billingStatus) {
      case 'pending':
        return <Badge variant="secondary">Pending Invoice</Badge>;
      case 'invoiced':
        return <Badge variant="default">Invoiced</Badge>;
      case 'paid':
        return <Badge variant="outline">Paid</Badge>;
      case 'failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      case 'waived':
        return <Badge variant="outline">Waived</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center">
              <AppIcon name="warning" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-lg">AI Credits Overage</CardTitle>
          </div>
          {getBillingStatusBadge()}
        </div>
        <CardDescription>
          You've exceeded your monthly credit limit this month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AppIcon name="dollar" size={16} />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-foreground">
                Overage Charge: {formatCurrency(overage.overageChargeUSD)}
              </p>
              <p className="text-sm">
                You've used <strong>{overage.creditsOverLimit.toLocaleString()} extra credits</strong> beyond
                your plan's {overage.planCreditLimit.toLocaleString()} credit limit.
              </p>
              <p className="text-sm">
                Overage rate: {formatCurrency(overage.planOveragePrice)} per credit
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {overage.billingStatus === 'pending' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              💡 This overage charge will be included in your next monthly invoice.
            </p>
          </div>
        )}

        {overage.billingStatus === 'invoiced' && overage.stripeInvoiceId && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              📧 An invoice has been sent to your billing email.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://dashboard.stripe.com/invoices/${overage.stripeInvoiceId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Invoice
              </a>
            </Button>
          </div>
        )}

        {overage.billingStatus === 'failed' && (
          <Alert variant="destructive">
            <AppIcon name="warning" size={16} />
            <AlertDescription>
              <p className="font-semibold">Payment Failed</p>
              <p className="text-sm mt-1">{overage.failureReason || 'Please update your payment method.'}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground mb-2">Overage breakdown:</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Text</p>
              <p className="font-semibold">{overage.textGenerationOverage.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Images</p>
              <p className="font-semibold">{overage.imageGenerationOverage.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">TTS</p>
              <p className="font-semibold">{overage.ttsOverage.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="default" size="sm" className="w-full" asChild>
            <a href="/settings">
              <AppIcon name="trending-up" size={16} className="mr-2" />
              Upgrade Plan to Avoid Future Overages
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
