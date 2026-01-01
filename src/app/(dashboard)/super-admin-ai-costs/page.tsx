'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import {
  getPlatformAIStatisticsAction,
  getAllCompaniesAIUsageAction,
  getHistoricalAIStatisticsAction,
  type PlatformAIOverview,
  type CompanyAIUsageDetail,
} from '@/app/actions/super-admin-ai-stats-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function SuperAdminAICostsPage() {
  const { appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [platformStats, setPlatformStats] = useState<PlatformAIOverview | null>(null);
  const [companyDetails, setCompanyDetails] = useState<CompanyAIUsageDetail[]>([]);
  const [historicalData, setHistoricalData] = useState<Array<{
    month: string;
    totalOperations: number;
    totalRevenue: number;
    totalProfit: number;
    totalGoogleCost: number;
  }>>([]);

  useEffect(() => {
    if (!authLoading && (!appUser || appUser.role !== 'superadmin')) {
      toast({ title: 'Access Denied', description: 'Super Admin only.', variant: 'destructive' });
      router.push('/dashboard');
    }
  }, [appUser, authLoading, router, toast]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsResult, companiesResult, historyResult] = await Promise.all([
        getPlatformAIStatisticsAction(),
        getAllCompaniesAIUsageAction(),
        getHistoricalAIStatisticsAction(6),
      ]);

      if (statsResult.success && statsResult.data) setPlatformStats(statsResult.data);
      if (companiesResult.success && companiesResult.data) setCompanyDetails(companiesResult.data);
      if (historyResult.success && historyResult.data) setHistoricalData(historyResult.data);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appUser?.role === 'superadmin') loadData();
  }, [appUser]);

  if (authLoading || !appUser || appUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-48">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
  const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <div className="space-y-4 p-3 sm:p-4 lg:p-6">
      {/* Header - Mobile First */}
      <div className="space-y-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold">AI Cost Monitoring</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Platform-wide AI usage, costs, and profitability
          </p>
        </div>
        <Button 
          onClick={loadData} 
          disabled={isLoading} 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs w-full sm:w-auto"
        >
          <Icon icon={isLoading ? "solar:refresh-bold" : "solar:refresh-linear"} className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="solar:refresh-bold" className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats Cards - 2x2 Grid on Mobile */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Total Operations */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Operations</span>
                  <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <Icon icon="solar:chart-2-bold" className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold">{formatNumber(platformStats?.currentMonth.totalOperations || 0)}</div>
                <p className="text-[9px] text-muted-foreground">{platformStats?.currentMonth.activeCompaniesCount || 0} companies</p>
              </CardContent>
            </Card>

            {/* Platform Costs */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Costs</span>
                  <div className="w-6 h-6 rounded-md bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                    <Icon icon="solar:dollar-bold" className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-400">{formatCurrency(platformStats?.currentMonth.totalGoogleCost || 0)}</div>
                <p className="text-[9px] text-muted-foreground">Google APIs</p>
              </CardContent>
            </Card>

            {/* Revenue */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Revenue</span>
                  <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Icon icon="solar:graph-up-bold" className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(platformStats?.currentMonth.totalRevenue || 0)}</div>
                <p className="text-[9px] text-muted-foreground">From users</p>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Profit</span>
                  <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                    <Icon icon="solar:wallet-money-bold" className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
                <div className="text-base sm:text-lg font-bold text-violet-600 dark:text-violet-400">{formatCurrency(platformStats?.currentMonth.totalProfit || 0)}</div>
                <p className="text-[9px] text-muted-foreground">{platformStats?.currentMonth.profitMarginPercent.toFixed(1)}% margin</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs - Scrollable on Mobile */}
          <Tabs defaultValue="companies" className="w-full">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:w-full h-8 p-0.5">
                <TabsTrigger value="companies" className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 flex-1">Companies</TabsTrigger>
                <TabsTrigger value="top" className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 flex-1">Top 10</TabsTrigger>
                <TabsTrigger value="breakdown" className="text-[10px] sm:text-xs px-2 sm:px-3 h-7 flex-1">Breakdown</TabsTrigger>
              </TabsList>
            </div>

            {/* All Companies */}
            <TabsContent value="companies" className="mt-3">
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Company Usage</CardTitle>
                  <CardDescription className="text-[10px]">By revenue</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  {companyDetails.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Icon icon="solar:chart-2-linear" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No data</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {companyDetails.map((company) => (
                        <div key={company.companyId} className="p-2 rounded-lg border border-stone-200 dark:border-stone-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="font-medium text-xs truncate">{company.companyName}</span>
                              <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0">{company.planName}</Badge>
                            </div>
                            {company.usingOwnApiKey ? (
                              <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">Own</Badge>
                            ) : (
                              <Badge className="text-[8px] px-1 py-0 bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shrink-0">Platform</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            <div>
                              <p className="text-[8px] text-muted-foreground">Ops</p>
                              <p className="text-[10px] font-medium">{formatNumber(company.currentMonth.operations)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground">Cost</p>
                              <p className="text-[10px] font-medium text-rose-600">{formatCurrency(company.currentMonth.estimatedCost)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground">Rev</p>
                              <p className="text-[10px] font-medium text-emerald-600">{formatCurrency(company.currentMonth.platformRevenue)}</p>
                            </div>
                            <div>
                              <p className="text-[8px] text-muted-foreground">Profit</p>
                              <p className="text-[10px] font-medium text-violet-600">{formatCurrency(company.currentMonth.platformProfit)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Top Consumers */}
            <TabsContent value="top" className="mt-3">
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Top 10 Consumers</CardTitle>
                  <CardDescription className="text-[10px]">Highest usage this month</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1.5">
                    {platformStats?.topConsumers.map((company, index) => (
                      <div key={company.companyId} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                        <Badge variant={index < 3 ? 'default' : 'outline'} className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] p-0 shrink-0">
                          {index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs truncate">{company.companyName}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-medium">{formatNumber(company.operations)}</p>
                          <p className="text-[9px] text-emerald-600">{formatCurrency(company.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Operation Breakdown */}
            <TabsContent value="breakdown" className="mt-3">
              <div className="grid gap-3">
                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">By Type</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Text Generation</span>
                      <span className="font-medium">{formatNumber(platformStats?.operationBreakdown.textGeneration || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Image Generation</span>
                      <span className="font-medium">{formatNumber(platformStats?.operationBreakdown.imageGeneration || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Text-to-Speech</span>
                      <span className="font-medium">{formatNumber(platformStats?.operationBreakdown.textToSpeech || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs border-t pt-2">
                      <span className="font-bold">Total</span>
                      <span className="font-bold">{formatNumber(platformStats?.operationBreakdown.total || 0)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">API Keys</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Platform API</span>
                      <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 text-[9px]">
                        {platformStats?.apiKeyDistribution.usingPlatformAPI || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Own API Key</span>
                      <Badge variant="secondary" className="text-[9px]">
                        {platformStats?.apiKeyDistribution.usingOwnAPI || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Historical Trends */}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm">Last 6 Months</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="space-y-1.5">
                {historicalData.map((month) => (
                  <div key={month.month} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 dark:bg-stone-900/50">
                    <div className="w-12 shrink-0">
                      <p className="font-medium text-[10px]">{month.month}</p>
                    </div>
                    <div className="flex-1 grid grid-cols-4 gap-1 text-center">
                      <div>
                        <p className="text-[8px] text-muted-foreground">Ops</p>
                        <p className="text-[9px] font-medium">{formatNumber(month.totalOperations)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Cost</p>
                        <p className="text-[9px] font-medium text-rose-600">{formatCurrency(month.totalGoogleCost)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Rev</p>
                        <p className="text-[9px] font-medium text-emerald-600">{formatCurrency(month.totalRevenue)}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-muted-foreground">Profit</p>
                        <p className="text-[9px] font-medium text-violet-600">{formatCurrency(month.totalProfit)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
