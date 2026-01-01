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
  const { appUser, company, isSuperAdmin } = useAuth();
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
      // Filter out hidden plans for regular users - Super Admin can see all
      const filteredPlans = storedPlans.filter(plan => {
        // If plan is marked as hidden, only show to super admin
        if (plan.isHidden) {
          return isSuperAdmin;
        }
        return true;
      });
      const sortedPlans = filteredPlans.sort((a, b) => a.priceMonthlyUSD - b.priceMonthlyUSD);
      setPlans(sortedPlans);
      setAllFeatures(storedFeatures);
      setIsLoading(false);
    };
    fetchPlansAndFeatures();
  }, [isSuperAdmin]);

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
            const isEnterprise = plan.id === 'plan_enterprise' || plan.name.toLowerCase().includes('enterprise');
            
            // Determine card styling based on state
            const getCardStyles = () => {
              if (isCurrentPlan) {
                // Current plan - Green theme
                return 'border-2 border-emerald-500 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10';
              }
              if (plan.isFeatured && !isEnterprise) {
                // Most Popular (Pro) - Indigo theme
                return 'border-2 border-indigo-500 dark:border-indigo-500 bg-white dark:bg-stone-950 shadow-lg shadow-indigo-500/10';
              }
              if (isEnterprise) {
                // Enterprise - Gold/Amber theme
                return 'border border-amber-300 dark:border-amber-700 bg-gradient-to-b from-amber-50/50 to-white dark:from-amber-950/20 dark:to-stone-950';
              }
              // Default
              return 'border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950';
            };
            
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-xl p-5 transition-all',
                  getCardStyles()
                )}
              >
                {/* Current Plan Badge - Green */}
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-lg">
                      <Icon icon="solar:check-circle-bold" className="h-3 w-3" />
                      Your Plan
                    </span>
                  </div>
                )}
                
                {/* Most Popular Badge - Indigo (only if not current plan) */}
                {plan.isFeatured && !isCurrentPlan && !isEnterprise && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-indigo-600 text-white flex items-center gap-1 shadow-lg">
                      <Icon icon="solar:star-bold" className="h-3 w-3" />
                      Most Popular
                    </span>
                  </div>
                )}
                
                {/* Enterprise Badge - Gold */}
                {isEnterprise && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-lg">
                      <Icon icon="solar:crown-bold" className="h-3 w-3" />
                      Premium
                    </span>
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold",
                      isCurrentPlan && "text-emerald-700 dark:text-emerald-400",
                      isEnterprise && !isCurrentPlan && "text-amber-700 dark:text-amber-400"
                    )}>{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    {plan.priceMonthlyUSD === 0 ? (
                      <span className="text-3xl font-bold">Free</span>
                    ) : (
                      <>
                        <span className={cn(
                          "text-xl font-bold",
                          isCurrentPlan ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        )}>{getCurrencySymbol(currency)}</span>
                        <span className={cn(
                          "text-3xl font-bold",
                          isCurrentPlan && "text-emerald-700 dark:text-emerald-300",
                          isEnterprise && !isCurrentPlan && "text-amber-700 dark:text-amber-300"
                        )}>{price.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>

                  {plan.yearlyDiscountPercentage && plan.yearlyDiscountPercentage > 0 && (
                    <Badge variant="secondary" className={cn(
                      "text-xs",
                      isCurrentPlan && "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
                      isEnterprise && !isCurrentPlan && "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                    )}>
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
                        <Icon icon="solar:check-circle-bold" className={cn(
                          "h-4 w-4 shrink-0",
                          isCurrentPlan ? "text-emerald-500" : "text-emerald-500"
                        )} />
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
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" disabled>
                      <Icon icon="solar:check-circle-bold" className="h-4 w-4 mr-1.5" />
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
                      className={cn(
                        "w-full",
                        isEnterprise && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
                      )}
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
