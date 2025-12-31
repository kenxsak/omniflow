
'use client';

/**
 * Company AI Usage Analytics Page
 * 
 * Allows company users (Admin, Manager, User) to view their AI usage,
 * costs, credits, and optimization recommendations.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageTitle from '@/components/ui/page-title';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Zap, TrendingUp, DollarSign, AlertTriangle, Key, RefreshCw, CheckCircle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import {
  getCompanyAIAnalyticsAction,
  getCompanyHistoricalUsageAction,
  type CompanyAIAnalytics,
} from '@/app/actions/company-ai-analytics-actions';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function AIUsagePage() {
  const { appUser, company, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<CompanyAIAnalytics | null>(null);
  const [historicalData, setHistoricalData] = useState<Array<{
    month: string;
    operations: number;
    creditsUsed: number;
    cost: number;
  }>>([]);

  const loadData = async () => {
    if (!company) return;
    
    setIsLoading(true);
    try {
      const [analyticsResult, historyResult] = await Promise.all([
        getCompanyAIAnalyticsAction(company.id),
        getCompanyHistoricalUsageAction(company.id, 6),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      } else {
        toast({
          title: 'Error',
          description: analyticsResult.error || 'Failed to load AI usage analytics',
          variant: 'destructive',
        });
      }

      if (historyResult.success && historyResult.data) {
        setHistoricalData(historyResult.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load AI usage data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (company) {
      loadData();
    }
  }, [company]);

  if (authLoading || !appUser || !company) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const creditsUsagePercent = analytics
    ? (analytics.currentMonth.creditsUsed / (analytics.currentMonth.creditsLimit || 1)) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageTitle title="AI Usage Analytics" />
          <p className="text-sm sm:text-base text-muted-foreground">Monitor your AI usage, costs, and credits</p>
        </div>
        <Button onClick={loadData} disabled={isLoading} variant="outline" size="sm" className="w-full sm:w-auto border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} style={{ color: '#8b5cf6' }} />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Recommendations / Alerts */}
          {analytics && analytics.recommendations.length > 0 && (
            <div className="space-y-3">
              {analytics.recommendations.map((rec, index) => (
                <Alert key={index} variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                  {rec.priority === 'high' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>{rec.title}</AlertTitle>
                  <AlertDescription>
                    {rec.description}
                    {rec.potentialSavings && (
                      <span className="font-semibold ml-1">
                        Save {formatCurrency(rec.potentialSavings)}/month!
                      </span>
                    )}
                    {rec.actionRequired && (
                      <div className="mt-2">
                        <Button size="sm" asChild>
                          <Link href="/settings?tab=integrations">
                            {rec.actionRequired}
                          </Link>
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Overview Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-4 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#8b5cf6' }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">AI Credits</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                  <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#8b5cf6' }} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold" style={{ color: '#8b5cf6' }}>
                  {formatNumber(analytics?.currentMonth.creditsRemaining || 0)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">
                  of {formatNumber(analytics?.currentMonth.creditsLimit || 0)} remaining
                </p>
                <Progress value={creditsUsagePercent} className="h-1.5 sm:h-2" />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {creditsUsagePercent.toFixed(1)}% used
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-4 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#10b981' }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Operations</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#10b981' }} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold" style={{ color: '#10b981' }}>
                  {formatNumber(analytics?.currentMonth.operations || 0)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-4 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#3b82f6' }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Est. Cost</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#3b82f6' }} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: '#3b82f6' }}>
                  {formatCurrency(analytics?.currentMonth.estimatedCost || 0)}
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {analytics?.apiKeyInfo.usingOwnKey ? 'Own API key' : 'Platform API'}
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-x-4 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#f59e0b' }} />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Plan</CardTitle>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                  <Key className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: '#f59e0b' }} />
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="text-lg sm:text-2xl font-bold truncate" style={{ color: '#f59e0b' }}>{analytics?.plan.name}</div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {formatNumber(analytics?.plan.monthlyCreditsLimit || 0)} credits/mo
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quota Status */}
          {analytics?.currentMonth.quotaExceeded && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Quota Exceeded</AlertTitle>
              <AlertDescription>
                You have exceeded your monthly AI quota. Please upgrade your plan or wait until{' '}
                {new Date(analytics.currentMonth.resetDate).toLocaleDateString()} when your quota resets.
              </AlertDescription>
            </Alert>
          )}

          {/* Usage Breakdown */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#14b8a6' }} />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:chart-2-bold" className="h-5 w-5" style={{ color: '#14b8a6' }} />
                Usage Breakdown
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">AI operations by type this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#8b5cf6' }}>Text Generation</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {formatNumber(analytics?.breakdown.textGeneration?.calls || 0)} calls •{' '}
                    {formatNumber(analytics?.breakdown.textGeneration?.tokens || 0)} tokens
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm sm:text-base" style={{ color: '#8b5cf6' }}>{formatCurrency(analytics?.breakdown.textGeneration?.cost || 0)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 sm:pb-3 border-b gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#ec4899' }}>Image Generation</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatNumber(analytics?.breakdown.imageGeneration?.images || 0)} images
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm sm:text-base" style={{ color: '#ec4899' }}>{formatCurrency(analytics?.breakdown.imageGeneration?.cost || 0)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base" style={{ color: '#10b981' }}>Text-to-Speech</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {formatNumber(analytics?.breakdown.textToSpeech?.calls || 0)} calls •{' '}
                    {formatNumber(analytics?.breakdown.textToSpeech?.characters || 0)} chars
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm sm:text-base" style={{ color: '#10b981' }}>{formatCurrency(analytics?.breakdown.textToSpeech?.cost || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Key Savings Info */}
          {!analytics?.apiKeyInfo.usingOwnKey && analytics?.apiKeyInfo.savingsIfOwnKey && analytics.apiKeyInfo.savingsIfOwnKey > 0 && (
            <Card className="relative overflow-hidden border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
              <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#f59e0b' }} />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" style={{ color: '#f59e0b' }} />
                  Save Money with Your Own API Key
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  You could save <span className="font-bold text-lg" style={{ color: '#10b981' }}>{formatCurrency(analytics.apiKeyInfo.savingsIfOwnKey)}</span> per month
                  by adding your own Gemini API key. You'll only pay Google's cost with no platform markup.
                </p>
                <Button asChild className="text-white" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                  <Link href="/settings?tab=integrations">
                    <Key className="mr-2 h-4 w-4" />
                    Add Your API Key
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Historical Usage */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ backgroundColor: '#6366f1' }} />
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:calendar-bold" className="h-5 w-5" style={{ color: '#6366f1' }} />
                Historical Usage
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Monthly AI operations and costs (last 6 months)</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 sm:pt-0">
              <div className="overflow-x-auto">
                <div className="min-w-[400px] sm:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Month</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Ops</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Credits</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historicalData.map((month) => (
                        <TableRow key={month.month}>
                          <TableCell className="font-medium text-xs sm:text-sm">{month.month}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm" style={{ color: '#10b981' }}>{formatNumber(month.operations)}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm" style={{ color: '#8b5cf6' }}>{formatNumber(month.creditsUsed)}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm" style={{ color: '#3b82f6' }}>{formatCurrency(month.cost)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
