"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Users, Bot, Image, Zap, Loader2, Database, Clock, Sparkles } from 'lucide-react';
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
  getCurrencyName,
  getPriceForPlan as getFixedPrice 
} from '@/lib/geo-detection';
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
      const sortedPlans = storedPlans.sort((a, b) => a.priceMonthlyUSD - b.priceMonthlyUSD);
      setPlans(sortedPlans);
      setAllFeatures(storedFeatures);
      setIsLoading(false);
    };
    fetchPlansAndFeatures();
  }, []);

  const getPriceForPlan = (plan: Plan): string => {
    if (plan.priceMonthlyUSD === 0) return 'Free';
    
    const price = getFixedPrice(plan.id, currency);
    const symbol = getCurrencySymbol(currency);
    
    return `${symbol}${price.toLocaleString()}`;
  };

  const getFeatureName = (featureId: string) => {
    const feature = allFeatures.find(f => f.id === featureId);
    return feature ? feature.name : featureId.replace('feat_', '').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
  };

  const getRegionalMessage = () => {
    if (currency === 'INR') {
      return (
        <Badge variant="default" className="mt-3 text-sm px-4 py-1.5 bg-green-600 hover:bg-green-700">
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
    <section className={cn("py-12 sm:py-16 lg:py-24 px-4", className)}>
      <div className="max-w-7xl mx-auto">
        {showHeader && (
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <Badge variant="outline" className="mb-4 text-xs sm:text-sm px-3 py-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {headerTitle}
            </h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
              {headerDescription}
            </p>
            <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
              Pricing shown in: <strong className="text-foreground">{getCurrencyName(currency)} ({getCurrencySymbol(currency)})</strong>
            </div>
            {getRegionalMessage()}
            <Badge variant="secondary" className="mt-3 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-1.5">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 inline" />
              Use your own Google API key for unlimited AI
            </Badge>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-48 gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Loading plans...</p>
          </div>
        ) : (
          <div 
            ref={cardsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-stretch"
          >
            {plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={cn(
                  'pricing-card flex flex-col rounded-xl sm:rounded-2xl shadow-lg h-full transition-all duration-300 hover:shadow-xl',
                  plan.isFeatured 
                    ? 'border-2 border-primary ring-2 sm:ring-4 ring-primary/20 scale-[1.02] sm:scale-105' 
                    : 'hover:border-primary/50'
                )}
              >
                {plan.isFeatured && (
                  <div className="py-1.5 sm:py-2 px-3 sm:px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs sm:text-sm font-semibold rounded-t-xl text-center">
                    Most Popular
                  </div>
                )}
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold">{plan.name}</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground min-h-[2rem] sm:min-h-[3rem]">{plan.description}</p>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mt-3 sm:mt-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {getPriceForPlan(plan)}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{plan.priceMonthlyUSD > 0 ? '/ month' : 'Forever'}</p>
                  {plan.yearlyDiscountPercentage && plan.yearlyDiscountPercentage > 0 && (
                    <Badge variant="secondary" className="mt-2 w-fit text-xs">Save {plan.yearlyDiscountPercentage}% yearly</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0 flex-grow">
                  <ul className="space-y-2 sm:space-y-3">
                    <li className="flex items-center">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 flex-shrink-0">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">Up to <strong className="text-foreground">{plan.maxUsers}</strong> {plan.maxUsers === 1 ? 'user' : 'team members'}</span>
                    </li>
                    {plan.maxUsers > 1 && (
                      <li className="flex items-start">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          <strong className="text-foreground">Team Management</strong>
                        </span>
                      </li>
                    )}
                    <li className="flex items-center">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 flex-shrink-0">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        <strong className="text-foreground">{plan.aiCreditsPerMonth.toLocaleString()}</strong> AI Credits
                        {plan.priceMonthlyUSD === 0 && <span className="text-[10px] sm:text-xs ml-1">(one-time)</span>}
                      </span>
                    </li>
                    {plan.allowBYOK && (
                      <li className="flex items-start">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-yellow-500/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-yellow-600 dark:text-yellow-400">UNLIMITED AI with BYOK</span>
                      </li>
                    )}
                    {plan.maxImagesPerMonth !== undefined && (
                      <li className="flex items-center">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 flex-shrink-0">
                          <Image className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground"><strong className="text-foreground">{plan.maxImagesPerMonth.toLocaleString()}</strong> images/mo</span>
                      </li>
                    )}
                    <li className="flex items-center">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 flex-shrink-0">
                        <Database className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">{getCRMLimitDescription(plan)}</span>
                    </li>
                    {plan.featureIds.slice(0, 4).map((featureId, i) => (
                      <li key={i} className="flex items-start">
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-green-500/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">{getFeatureName(featureId)}</span>
                      </li>
                    ))}
                    {plan.featureIds.length > 4 && (
                      <li className="text-xs sm:text-sm text-muted-foreground pl-8 sm:pl-9">
                        +{plan.featureIds.length - 4} more features
                      </li>
                    )}
                    {plan.allowOverage && (
                      <li className="flex items-start pt-2 border-t">
                        <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
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
                        className={cn(
                          "w-full text-sm sm:text-base lg:text-lg py-4 sm:py-5 lg:py-6",
                          plan.isFeatured && "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                        )}
                      />
                    )
                  ) : (
                    <Button 
                      asChild 
                      className={cn(
                        "w-full text-sm sm:text-base lg:text-lg py-4 sm:py-5 lg:py-6",
                        plan.isFeatured && "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      )}
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
