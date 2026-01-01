"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getAllAdminsAndCompanies } from '@/lib/saas-data';
import type { AppUser, Company, Plan } from '@/types/saas';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AdminManager from '@/components/settings/admin-manager';
import { getStoredPlans } from '@/lib/saas-data';
import { endOfMonth, isWithinInterval } from 'date-fns';
import { convertCurrency } from '@/lib/currency-converter';
import { Icon } from '@iconify/react';

interface AdminData {
  admin: AppUser;
  company: Company;
}

const formatAsUSD = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const formatAsINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function SuperAdminDashboard() {
  const [data, setData] = useState<AdminData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mrrINR, setMrrINR] = useState<number>(0);
  const { isSuperAdmin } = useAuth();
  
  const loadData = useCallback(() => {
    if (isSuperAdmin) {
      getAllAdminsAndCompanies().then(adminData => setData(adminData));
      getStoredPlans().then(storedPlans => setPlans(storedPlans));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'omniFlowSaasUsers' || event.key === 'omniFlowSaasCompanies' || event.key === 'omniFlowSaasPlans') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData]);
  
  const now = new Date();
  const endOfThisMonth = endOfMonth(now);
  const expiringThisMonth = data.filter(({ company }) => 
    company.planExpiresAt && company.status === 'active' && isWithinInterval(new Date(company.planExpiresAt), { start: now, end: endOfThisMonth })
  ).length;
  const inactiveAdmins = data.filter(d => d.company.status === 'paused').length;
  const totalAdmins = data.length;

  const mrrUSD = useMemo(() => {
    let usdTotal = 0;
    data.forEach(({ company }) => {
      if (company.status === 'active') {
        const plan = plans.find(p => p.id === company.planId);
        if (plan) usdTotal += plan.priceMonthlyUSD;
      }
    });
    return usdTotal;
  }, [data, plans]);

  useEffect(() => {
    convertCurrency(mrrUSD, 'INR').then(converted => setMrrINR(converted));
  }, [mrrUSD]);

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Super Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitor and manage all companies on the platform.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-[10px] sm:text-xs px-2 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
          <Icon icon="solar:shield-star-bold" className="w-3 h-3 mr-1" />
          SUPER ADMIN
        </Badge>
      </div>

      {/* Stats Grid - Mobile First */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Total Companies */}
        <Card className="hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Total Admins / Companies</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <Icon icon="solar:users-group-rounded-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-violet-600 dark:text-violet-400">
              {totalAdmins}
            </div>
          </CardContent>
        </Card>

        {/* MRR USD */}
        <Card className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">MRR (USD)</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Icon icon="solar:dollar-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">
              {formatAsUSD(mrrUSD)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              ↗ All Active Plans
            </p>
          </CardContent>
        </Card>

        {/* MRR INR */}
        <Card className="hover:border-teal-300 dark:hover:border-teal-700 transition-colors">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">MRR (INR)</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center">
                <Icon icon="solar:wallet-money-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 truncate">
              {formatAsINR(mrrINR)}
            </div>
            <p className="text-[9px] sm:text-[10px] text-teal-600/70 dark:text-teal-400/70 mt-0.5">
              ↗ All Active Plans
            </p>
          </CardContent>
        </Card>

        {/* Expiring This Month */}
        <Card className={`hover:border-amber-300 dark:hover:border-amber-700 transition-colors ${expiringThisMonth > 0 ? 'border-amber-200 dark:border-amber-800' : ''}`}>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Plans Expiring This Month</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Icon icon="solar:clock-circle-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${expiringThisMonth > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-600 dark:text-stone-400'}`}>
              {expiringThisMonth}
            </div>
          </CardContent>
        </Card>

        {/* Paused Accounts */}
        <Card className="hover:border-rose-300 dark:hover:border-rose-700 transition-colors col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">Paused Accounts</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                <Icon icon="solar:user-block-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            <div className={`text-xl sm:text-2xl font-bold ${inactiveAdmins > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-600 dark:text-stone-400'}`}>
              {inactiveAdmins}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Manager */}
      <AdminManager />
    </div>
  );
}
