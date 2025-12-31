"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Plan } from '@/types/saas';
import { getStoredPlans, getStoredFeatures } from '@/lib/saas-data';
import type { Feature } from '@/types/saas';
import { PaymentButton } from '@/components/payments/payment-button';
import { useAuth } from '@/hooks/use-auth';
import { getCRMLimitDescription } from '@/lib/plan-helpers';
import { 
  SupportedCurrency, 
  detectUserLocation, 
  getCurrencySymbol,
  getPriceForPlan as getFixedPrice 
} from '@/lib/geo-detection';
import { CurrencySelector } from "@/components/ui/currency-selector";
import { PlanFeaturesModal } from '@/components/pricing/plan-features-modal';
import gsap from 'gsap';

interface PricingSectionProps {
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
  className?: string;
  currency?: SupportedCurrency;
  onCurrencyChange?: (currency: SupportedCurrency) => void;
}

export function PricingSection({ 
  showHeader = true,
  headerTitle = "Up to 70% Cheaper Than GoHighLevel with Unlimited AI",
  headerDescription = "All paid plans include BYOK (Bring Your Own Key) for unlimited AI generations at zero cost.",
  className = "",
  currency: externalCurrency,
  onCurrencyChange
}: PricingSectionProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState<SupportedCurrency>(externalCurrency || 'USD');
  const { appUser, company } = useAuth();

  useEffect(() => {
    if (externalCurrency) {
      setCurrency(externalCurrency);
      return;
    }

    const storedCurrency = localStorage.getItem('preferred_currency') as SupportedCurrency;
    if (storedCurrency) {
      setCurrency(storedCurrency);
      onCurrencyChange?.(storedCurrency);
    } else {
      detectUserLocation().then((location) => {
        setCurrency(location.currency);
        onCurrencyChange?.(location.currency);
      });
    }
  }, [externalCurrency]);

  useEffect(() => {
    const fetchPlansAndFeatures = async () => {
      setIsLoading(true);
      const [storedPlans, storedFeatures] = await Promise.all([
        getStoredPlans(),
        getStoredFeatures()
      ]);
      // Filter out hidden plans (disabled by super admin) and sort by price
      const visiblePlans = storedPlans.filter(plan => !plan.isHidden);
      const sortedPlans = visiblePlans.sort((a, b) => a.priceMonthlyUSD - b.priceMonthlyUSD);
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

  const getRegionalMessage = () => {
    if (currency === 'INR') {
      return (
        <Badge variant="default" className="mt-3 text-sm px-4 py-1.5 bg-success hover:bg-success/90 text-success-foreground">
          <span className="mr-1">🇮🇳</span>
          Special India Pricing - Up to 70% cheaper than global rates!
        </Badge>
      );
    }
    return null;
  };

  const cardsRef = useRef<HTMLDivElement>(null);

  // GSAP animation for pricing cards - ALL cards load at same time, no stagger
  useEffect(() => {
    if (cardsRef.current && !isLoading && plans.length > 0) {
      const cards = cardsRef.current.querySelectorAll('.pricing-card');
      // Instant animation - all cards appear together
      gsap.fromTo(
        cards,
        { opacity: 0, y: 15 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.25, // Fast
          stagger: 0, // No stagger - all at once
          ease: 'power2.out' 
        }
      );
    }
  }, [isLoading, plans]);

  return (
    <section className={cn("py-12 sm:py-16 px-4", className)}>
      <div className="max-w-6xl mx-auto">
        {showHeader && (
          <div className="text-center mb-8 sm:mb-10">
            <Badge variant="outline" className="mb-3 text-xs sm:text-sm px-3 py-1">
              <Icon icon="solar:star-bold" className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight text-foreground">
              {headerTitle}
            </h2>
            <p className="text-md text-muted-foreground max-w-[600px] font-medium sm:text-xl mt-4 mx-auto">
              {headerDescription}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {getRegionalMessage()}
              <Badge variant="secondary" className="text-xs sm:text-sm px-3 py-1">
                <Icon icon="solar:bolt-bold" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
                Use your own API key for unlimited AI
              </Badge>
            </div>
          </div>
        )}

        {/* Currency Selector */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="text-sm text-muted-foreground">Currency:</span>
          <CurrencySelector
            value={currency}
            onValueChange={(value) => {
              setCurrency(value);
              localStorage.setItem('preferred_currency', value);
              onCurrencyChange?.(value);
            }}
            className="w-[200px]"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-48 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon icon="solar:refresh-bold" className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading plans...</p>
          </div>
        ) : (
          <div 
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 items-stretch"
          >
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={cn(
                  'pricing-card flex flex-col rounded-2xl shadow-xl h-full transition-all duration-300 overflow-hidden relative',
                  plan.isFeatured 
                    ? 'glass-4 after:content-[""] after:absolute after:-top-[128px] after:left-1/2 after:h-[128px] after:w-[100%] after:max-w-[960px] after:-translate-x-1/2 after:rounded-[50%] after:bg-brand-foreground/70 after:blur-[72px]' 
                    : 'glass-1 hover:border-primary/50'
                )}
              >
                {/* Top gradient line */}
                <hr className={cn(
                  "absolute top-0 left-[10%] h-[1px] w-[80%] border-0 bg-gradient-to-r from-transparent via-foreground/60 to-transparent",
                  plan.isFeatured && "via-brand"
                )} />
                {plan.isFeatured && (
                  <div className="py-1.5 sm:py-2 px-3 sm:px-4 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold text-center">
                    ⭐ Most Popular
                  </div>
                )}
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground min-h-[2rem] sm:min-h-[3rem]">{plan.description}</p>
                  <div className="flex items-baseline gap-1 mt-3 sm:mt-4">
                    <span className="text-muted-foreground text-2xl font-bold">
                      {plan.priceMonthlyUSD > 0 ? getCurrencySymbol(currency) : ''}
                    </span>
                    <span className="text-5xl sm:text-6xl font-bold">{plan.priceMonthlyUSD === 0 ? 'Free' : getFixedPrice(plan.id, currency).toLocaleString()}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{plan.priceMonthlyUSD > 0 ? '/ month' : 'Forever'}</p>
                  {plan.yearlyDiscountPercentage && plan.yearlyDiscountPercentage > 0 && (
                    <Badge variant="secondary" className="mt-2 w-fit text-xs">Save {plan.yearlyDiscountPercentage}% yearly</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center">
                      <Icon icon="solar:users-group-rounded-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Up to <strong className="text-foreground">{plan.maxUsers}</strong> {plan.maxUsers === 1 ? 'user' : 'team members'}</span>
                    </li>
                    {plan.maxUsers > 1 && (
                      <li className="flex items-start">
                        <Icon icon="solar:clock-circle-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          <strong className="text-foreground">Team Management</strong>
                        </span>
                      </li>
                    )}
                    <li className="flex items-center">
                      <Icon icon="solar:cpu-bolt-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        <strong className="text-foreground">{plan.aiCreditsPerMonth.toLocaleString()}</strong> AI Credits
                        {plan.priceMonthlyUSD === 0 && <span className="text-[10px] sm:text-xs ml-1">(one-time)</span>}
                      </span>
                    </li>
                    {plan.allowBYOK && (
                      <li className="flex items-start">
                        <Icon icon="solar:bolt-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-semibold text-brand dark:text-brand">UNLIMITED AI with BYOK</span>
                      </li>
                    )}
                    {plan.maxImagesPerMonth !== undefined && (
                      <li className="flex items-center">
                        <Icon icon="solar:gallery-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground"><strong className="text-foreground">{plan.maxImagesPerMonth.toLocaleString()}</strong> images/mo</span>
                      </li>
                    )}
                    <li className="flex items-center">
                      <Icon icon="solar:database-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{getCRMLimitDescription(plan)}</span>
                    </li>
                    {plan.featureIds.slice(0, 4).map((featureId, i) => (
                      <li key={i} className="flex items-start">
                        <Icon icon="solar:check-circle-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">{getFeatureName(featureId)}</span>
                      </li>
                    ))}
                    {plan.featureIds.length > 4 && (
                      <li className="text-xs sm:text-sm text-primary pl-6 sm:pl-7">
                        <PlanFeaturesModal 
                          plan={plan} 
                          allPlans={plans}
                          trigger={
                            <button className="hover:underline cursor-pointer flex items-center gap-1">
                              <Icon icon="solar:alt-arrow-right-linear" className="h-3 w-3" />
                              +{plan.featureIds.length - 4} more features
                            </button>
                          }
                        />
                      </li>
                    )}
                    {plan.allowOverage && (
                      <li className="flex items-start pt-2 border-t">
                        <Icon icon="solar:bolt-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-brand mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Overage credits available</span>
                      </li>
                    )}
                  </ul>
                </CardContent>
                <CardFooter className="p-4 sm:p-6 pt-0">
                  {appUser ? (
                    plan.priceMonthlyUSD === 0 ? (
                      <Button asChild className="w-full text-sm sm:text-base lg:text-lg py-4 sm:py-5 lg:py-6" variant="outline">
                        <Link href="/dashboard">Go to Dashboard</Link>
                      </Button>
                    ) : (
                      <PaymentButton
                        plan={plan}
                        billingCycle="monthly"
                        country={company?.country}
                        currency={currency}
                        variant={plan.isFeatured ? 'default' : 'outline'}
                        size="lg"
                        className="w-full text-sm sm:text-base lg:text-lg py-4 sm:py-5 lg:py-6"
                      />
                    )
                  ) : (
                    <Button 
                      asChild 
                      className="w-full text-sm sm:text-base lg:text-lg py-4 sm:py-5 lg:py-6"
                      variant={plan.isFeatured ? 'default' : 'outline'}
                    >
                      <Link href="/signup">Get Started</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
