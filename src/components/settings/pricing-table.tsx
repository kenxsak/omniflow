'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { getStoredPlans, getStoredFeatures } from '@/lib/saas-data';
import type { Plan, Feature } from '@/types/saas';
import { PaymentButton } from '@/components/payments/payment-button';
import { getCRMLimitDescription } from '@/lib/plan-helpers';
import { 
  SupportedCurrency, 
  detectUserLocation, 
  getCurrencySymbol,
  getPriceForPlan as getFixedPrice 
} from '@/lib/geo-detection';
import { CurrencySelector } from "@/components/ui/currency-selector";
import { PlanFeaturesModal } from '@/components/pricing/plan-features-modal';

export function PricingTable() {
  const { appUser, company } = useAuth();
  const currentPlan = (company as any)?.planId || 'plan_free';
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');

  useEffect(() => {
    const storedCurrency = localStorage.getItem('preferred_currency') as SupportedCurrency;
    if (storedCurrency) {
      setCurrency(storedCurrency);
    } else {
      detectUserLocation().then((location) => {
        setCurrency(location.currency);
      });
    }
  }, []);

  useEffect(() => {
    const fetchPlansAndFeatures = async () => {
      setIsLoading(true);
      const [storedPlans, storedFeatures] = await Promise.all([
        getStoredPlans(),
        getStoredFeatures()
      ]);
      const sortedPlans = storedPlans.sort((a, b) => a.priceMonthlyUSD - b.priceMonthlyUSD);
      setPlans(sortedPlans);
      setAllFeatures(storedFeatures);
      setIsLoading(false);
    };
    fetchPlansAndFeatures();
  }, []);

  const getFeatureName = (featureId: string) => {
    const feature = allFeatures.find(f => f.id === featureId);
    return feature ? feature.name : featureId.replace('feat_', '').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Banner */}
      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <Icon icon="solar:card-bold" className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-xs text-muted-foreground capitalize">
                {plans.find(p => p.id === currentPlan)?.name || 'Free'} Plan
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Manage Billing
          </Button>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Currency:</span>
        <CurrencySelector
          value={currency}
          onValueChange={(value) => {
            setCurrency(value);
            localStorage.setItem('preferred_currency', value);
          }}
          className="w-[180px]"
        />
      </div>

      {/* Pricing Cards */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-48 gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading plans...</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const price = plan.priceMonthlyUSD === 0 ? 0 : getFixedPrice(plan.id, currency);
            
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl border p-5 transition-all',
                  plan.isFeatured
                    ? 'border-indigo-500 dark:border-indigo-500 bg-white dark:bg-stone-950 shadow-lg'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950',
                  isCurrentPlan && 'ring-2 ring-indigo-500'
                )}
              >
                {plan.isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-indigo-600 text-white">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    {plan.priceMonthlyUSD === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className="text-xl font-bold text-muted-foreground">{getCurrencySymbol(currency)}</span>
                        <span className="text-3xl font-bold">{price.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>

                  {plan.yearlyDiscountPercentage && plan.yearlyDiscountPercentage > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      Save {plan.yearlyDiscountPercentage}% yearly
                    </Badge>
                  )}

                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <Icon icon="solar:users-group-rounded-bold" className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        Up to <strong className="text-foreground">{plan.maxUsers}</strong> {plan.maxUsers === 1 ? 'user' : 'users'}
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Icon icon="solar:cpu-bolt-bold" className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        <strong className="text-foreground">{plan.aiCreditsPerMonth.toLocaleString()}</strong> AI Credits
                        {plan.priceMonthlyUSD === 0 && <span className="text-[10px] ml-1">(one-time)</span>}
                      </span>
                    </li>
                    {plan.allowBYOK && (
                      <li className="flex items-center gap-2 text-sm">
                        <Icon icon="solar:bolt-bold" className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">Unlimited AI with BYOK</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm">
                      <Icon icon="solar:database-bold" className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{getCRMLimitDescription(plan)}</span>
                    </li>
                    {plan.featureIds.slice(0, 3).map((featureId, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-muted-foreground">{getFeatureName(featureId)}</span>
                      </li>
                    ))}
                    {plan.featureIds.length > 3 && (
                      <li className="text-xs text-primary pl-6">
                        <PlanFeaturesModal 
                          plan={plan} 
                          allPlans={plans}
                          trigger={
                            <button className="hover:underline cursor-pointer flex items-center gap-1">
                              <Icon icon="solar:alt-arrow-right-linear" className="h-3 w-3" />
                              +{plan.featureIds.length - 3} more features
                            </button>
                          }
                        />
                      </li>
                    )}
                  </ul>

                  {isCurrentPlan ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : plan.priceMonthlyUSD === 0 ? (
                    <Button className="w-full" variant="outline" disabled>
                      Free Forever
                    </Button>
                  ) : (
                    <PaymentButton
                      plan={plan}
                      billingCycle="monthly"
                      country={company?.country}
                      currency={currency}
                      variant={plan.isFeatured ? 'default' : 'outline'}
                      size="default"
                      className="w-full"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Help Section */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Need help choosing a plan?{' '}
          <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  );
}
