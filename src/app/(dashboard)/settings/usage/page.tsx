'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { getCompany, getStoredPlans, getStoredFeatures } from '@/lib/saas-data';
import { useCurrency } from '@/contexts/currency-context';
import { getStripePortalUrl } from '@/app/actions/stripe-payment-actions';
import type { Plan, Company, Feature } from '@/types/saas';
import { cn } from '@/lib/utils';
import { SettingsTabs } from '@/components/settings/settings-tabs';

// Reusable Settings Card
function SettingsCard({
    title,
    description,
    icon,
    children,
    headerAction,
    status,
}: {
    title: string;
    description: string;
    icon: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    status?: 'active' | 'warning' | 'inactive';
}) {
    return (
        <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            'h-9 w-9 rounded-xl flex items-center justify-center',
                            status === 'active'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                                : status === 'warning'
                                    ? 'bg-amber-100 dark:bg-amber-900/30'
                                    : 'bg-stone-100 dark:bg-stone-800'
                        )}
                    >
                        <Icon
                            icon={icon}
                            className={cn(
                                'h-4.5 w-4.5',
                                status === 'active'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : status === 'warning'
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-stone-500 dark:text-stone-400'
                            )}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {title}
                        </h3>
                        <p className="text-xs text-stone-500 dark:text-stone-500">{description}</p>
                    </div>
                </div>
                {headerAction}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function UsagePage() {
    const { appUser } = useAuth();
    const { toast } = useToast();
    const { formatCurrency, convertFromUSD } = useCurrency();
    const [isLoading, setIsLoading] = useState(true);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [company, setCompany] = useState<Company | null>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
    const [convertedPrice, setConvertedPrice] = useState(0);

    const loadData = useCallback(async () => {
        if (!appUser?.companyId) return;
        setIsLoading(true);
        try {
            const [companyData, plans, features] = await Promise.all([
                getCompany(appUser.companyId),
                getStoredPlans(),
                getStoredFeatures(),
            ]);
            setAllFeatures(features);
            if (companyData) {
                setCompany(companyData);
                const plan = plans.find((p) => p.id === companyData.planId);
                if (plan) {
                    setCurrentPlan(plan);
                    if (plan.priceMonthlyUSD > 0) {
                        const localPrice = await convertFromUSD(plan.priceMonthlyUSD);
                        setConvertedPrice(localPrice);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setIsLoading(false);
        }
    }, [appUser?.companyId, convertFromUSD]);

    useEffect(() => {
        if (appUser) {
            loadData();
        }
    }, [appUser, loadData]);

    const openBillingPortal = async () => {
        if (!appUser?.idToken) return;
        setLoadingPortal(true);
        try {
            const result = await getStripePortalUrl({ idToken: appUser.idToken });
            if (result.success && result.url) {
                window.open(result.url, '_blank');
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to open billing portal',
                    variant: 'destructive',
                });
            }
        } catch {
            toast({ title: 'Error', description: 'An error occurred', variant: 'destructive' });
        } finally {
            setLoadingPortal(false);
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    const getDaysRemaining = (expiresAt: string) => {
        try {
            const now = new Date();
            const expires = new Date(expiresAt);
            const diff = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return diff;
        } catch {
            return 0;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="space-y-4">
                    <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />
                    <div className="h-32 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!currentPlan || !company) {
        return (
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-900/50 text-center">
                    <Icon
                        icon="solar:warning-triangle-linear"
                        className="h-8 w-8 text-amber-600 dark:text-amber-400 mx-auto mb-3"
                    />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        Could not load usage details. Please try again later.
                    </p>
                </div>
            </div>
        );
    }
    const daysRemaining = getDaysRemaining(company.planExpiresAt);
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
    const isExpired = daysRemaining <= 0;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">

            {/* Expiration Warning */}
            {(isExpiringSoon || isExpired) && (
                <div
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl border',
                        isExpired
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50'
                    )}
                >
                    <Icon
                        icon={isExpired ? 'solar:danger-triangle-linear' : 'solar:clock-circle-linear'}
                        className={cn(
                            'h-5 w-5',
                            isExpired
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                        )}
                    />
                    <p
                        className={cn(
                            'text-sm',
                            isExpired
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-amber-700 dark:text-amber-300'
                        )}
                    >
                        {isExpired
                            ? 'Your subscription has expired. Please renew to continue using premium features.'
                            : `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to avoid interruption.`}
                    </p>
                </div>
            )}

            {/* Current Plan */}
            <SettingsCard
                title="Current Plan Overview"
                description={`${company.name}'s active subscription`}
                icon="solar:crown-linear"
                status={isExpired ? 'warning' : 'active'}
            >
                <div className="space-y-5">
                    <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800/60">
                        <div className="flex items-center gap-3">
                            <div
                                className={cn(
                                    'h-12 w-12 rounded-xl flex items-center justify-center',
                                    currentPlan.isFeatured
                                        ? 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50'
                                        : 'bg-stone-100 dark:bg-stone-800'
                                )}
                            >
                                <Icon
                                    icon={
                                        currentPlan.isFeatured
                                            ? 'solar:star-bold'
                                            : 'solar:box-minimalistic-linear'
                                    }
                                    className={cn(
                                        'h-6 w-6',
                                        currentPlan.isFeatured
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-stone-500'
                                    )}
                                />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                    {currentPlan.name} Plan
                                </h4>
                                <p className="text-xs text-stone-500">{currentPlan.description}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {currentPlan.priceMonthlyUSD === 0
                                    ? 'Free'
                                    : formatCurrency(convertedPrice || currentPlan.priceMonthlyUSD)}
                            </p>
                            {currentPlan.priceMonthlyUSD > 0 && (
                                <p className="text-xs text-stone-500">per month</p>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
                            <Icon
                                icon="solar:users-group-two-rounded-linear"
                                className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-2"
                            />
                            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                {currentPlan.maxUsers}
                            </p>
                            <p className="text-[10px] text-stone-500 uppercase">Max Users</p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
                            <Icon
                                icon="solar:cpu-bolt-linear"
                                className="h-5 w-5 text-purple-600 dark:text-purple-400 mb-2"
                            />
                            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                {(currentPlan.aiCreditsPerMonth || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-stone-500 uppercase">AI Credits/mo</p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
                            <Icon
                                icon="solar:gallery-circle-linear"
                                className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-2"
                            />
                            <p className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                {(currentPlan.maxImagesPerMonth || 0).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-stone-500 uppercase">Images/mo</p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-3 border border-stone-200 dark:border-stone-800">
                            <Icon
                                icon="solar:calendar-linear"
                                className="h-5 w-5 text-amber-600 dark:text-amber-400 mb-2"
                            />
                            <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                {formatDate(company.planExpiresAt).split(',')[0]}
                            </p>
                            <p className="text-[10px] text-stone-500 uppercase">Expires</p>
                        </div>
                    </div>
                </div>
            </SettingsCard>

            {/* Usage */}
            {company.aiUsageThisMonth && (
                <SettingsCard
                    title="Usage This Month"
                    description="AI credits and operations consumed"
                    icon="solar:chart-linear"
                >
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800 text-center">
                            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {company.aiUsageThisMonth.operations.toLocaleString()}
                            </p>
                            <p className="text-xs text-stone-500">Operations</p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800 text-center">
                            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {company.aiUsageThisMonth.creditsUsed.toLocaleString()}
                            </p>
                            <p className="text-xs text-stone-500">Credits Used</p>
                        </div>
                        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800 text-center">
                            <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                {formatCurrency(company.aiUsageThisMonth.estimatedCost)}
                            </p>
                            <p className="text-xs text-stone-500">Est. Cost</p>
                        </div>
                    </div>
                </SettingsCard>
            )}

            {/* Billing */}
            <SettingsCard
                title="Billing Settings"
                description="Manage payment methods and invoices"
                icon="solar:card-linear"
            >
                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800/60">
                        <div>
                            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                Billing Cycle
                            </p>
                            <p className="text-xs text-stone-500">Current billing period</p>
                        </div>
                        <span className="px-3 py-1 text-sm font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 rounded-lg capitalize">
                            {company.billingCycle}
                        </span>
                    </div>

                    {company.stripeCustomerId && (
                        <div className="flex items-center justify-between py-3 border-b border-stone-100 dark:border-stone-800/60">
                            <div>
                                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                    Manage Payment Methods
                                </p>
                                <p className="text-xs text-stone-500">
                                    Update cards, view invoices, and more
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                onClick={openBillingPortal}
                                disabled={loadingPortal}
                            >
                                {loadingPortal ? (
                                    <>
                                        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="solar:card-linear" className="h-4 w-4" />
                                        Billing Portal
                                        <Icon icon="solar:arrow-right-up-linear" className="h-3 w-3" />
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
}
