"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCounter } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type {
  AnalyticsPeriod,
  ConversionFunnel,
  CampaignROI,
  PredictiveAnalytics,
  RevenueAttribution,
  AdvancedMetrics,
} from '@/types/analytics';
import {
  getConversionFunnelData,
  calculateCampaignROI,
  getPredictiveInsights,
  getRevenueAttribution,
  getAdvancedMetrics,
  getHistoricalLeadCounts,
} from '@/app/actions/advanced-analytics-actions';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/analytics-service';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

// Dynamic imports for heavy components
const ConversionFunnelChart = dynamic(
  () => import('@/components/analytics/funnel-chart-v3'),
  { loading: () => <Skeleton className="h-[350px] rounded-xl" /> }
);

const ROICalculator = dynamic(
  () => import('@/components/analytics/roi-calculator'),
  { loading: () => <Skeleton className="h-[350px] rounded-xl" /> }
);

const PredictiveChart = dynamic(
  () => import('@/components/analytics/predictive-chart'),
  { loading: () => <Skeleton className="h-[400px] rounded-xl" /> }
);

const AttributionBreakdown = dynamic(
  () => import('@/components/analytics/attribution-breakdown'),
  { loading: () => <Skeleton className="h-[350px] rounded-xl" /> }
);

const CampaignsTable = dynamic(
  () => import('@/components/analytics/campaigns-table'),
  { loading: () => <Skeleton className="h-[400px] rounded-xl" /> }
);

// Navigation tabs with improved icons
const navTabs = [
  { id: 'overview', label: 'Overview', icon: 'solar:chart-square-bold-duotone' },
  { id: 'funnel', label: 'Funnel', icon: 'solar:filter-bold-duotone' },
  { id: 'campaigns', label: 'Campaigns', icon: 'solar:target-bold-duotone' },
  { id: 'predictions', label: 'Predictions', icon: 'solar:graph-up-bold-duotone' },
  { id: 'attribution', label: 'Attribution', icon: 'solar:pie-chart-2-bold-duotone' },
];

export default function AdvancedAnalyticsPage() {
  const { appUser, company } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState<AnalyticsPeriod>('30days');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [funnel, setFunnel] = useState<ConversionFunnel | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignROI[]>([]);
  const [predictive, setPredictive] = useState<PredictiveAnalytics | null>(null);
  const [attribution, setAttribution] = useState<RevenueAttribution | null>(null);
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [historicalLeads, setHistoricalLeads] = useState<number[]>([]);
  
  // Load metrics first (fastest), then other data progressively
  const loadAnalytics = useCallback(async () => {
    if (!appUser?.companyId || !company) {
      setIsLoading(false);
      return;
    }
    
    const apiKeys = company.apiKeys || {};
    const brevoKey = apiKeys.brevo?.apiKey;
    const twilioSid = apiKeys.twilio?.accountSid;
    const twilioToken = apiKeys.twilio?.authToken;
    
    try {
      // Load metrics first for quick display
      const metricsResult = await getAdvancedMetrics(appUser.companyId, period, brevoKey, twilioSid, twilioToken);
      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      }
      setIsLoading(false);
      
      // Load remaining data in background
      const [funnelResult, attributionResult] = await Promise.all([
        getConversionFunnelData(appUser.companyId, period),
        getRevenueAttribution(appUser.companyId, period),
      ]);
      
      if (funnelResult.success && funnelResult.data) setFunnel(funnelResult.data);
      if (attributionResult.success && attributionResult.data) setAttribution(attributionResult.data);
      
      // Load heavier data last
      const [campaignsResult, predictiveResult, historicalResult] = await Promise.all([
        calculateCampaignROI(appUser.companyId, period, brevoKey, twilioSid, twilioToken),
        getPredictiveInsights(appUser.companyId),
        getHistoricalLeadCounts(appUser.companyId),
      ]);
      
      if (campaignsResult.success && campaignsResult.data) setCampaigns(campaignsResult.data);
      if (predictiveResult.success && predictiveResult.data) setPredictive(predictiveResult.data);
      if (historicalResult.success && historicalResult.data) setHistoricalLeads(historicalResult.data);
      
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  }, [appUser, company, period]);
  
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
  };
  
  const handlePeriodChange = (newPeriod: string) => {
    setIsLoading(true);
    setPeriod(newPeriod as AnalyticsPeriod);
  };
  
  const handleExport = async () => {
    if (!metrics) return;
    try {
      const XLSX = await import('xlsx');
      const exportData = [
        ['Advanced Analytics Report'],
        ['Period', period],
        ['Generated', new Date().toLocaleString()],
        [],
        ['Key Metrics'],
        ['Total Leads', metrics.kpis.totalLeads],
        ['Total Revenue', formatCurrency(metrics.kpis.totalRevenue)],
        ['Marketing Spend', formatCurrency(metrics.kpis.totalMarketingSpend)],
        ['Overall ROI', formatPercentage(metrics.kpis.overallROI)],
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
      XLSX.writeFile(wb, `analytics-${period}.xlsx`);
      toast({ title: 'Exported successfully' });
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  if (!appUser || !company) {
    return (
      <div className="py-8">
        <Alert>
          <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
          <AlertDescription>Please log in to view analytics</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 pb-8">
      {/* Header - Enhanced with gradient background */}
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 border border-indigo-200/50 dark:border-indigo-800/50 p-5 sm:p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <Icon icon="solar:chart-2-bold-duotone" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Advanced Analytics</h1>
              <p className="text-sm text-muted-foreground">Business intelligence, conversion tracking & ROI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800">
                <Icon icon="solar:calendar-bold-duotone" className="h-4 w-4 mr-2 text-indigo-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
                <SelectItem value="12months">Last 12 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing} className="h-9 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950">
              <Icon icon="solar:refresh-bold-duotone" className={cn("h-4 w-4 mr-1.5 text-indigo-500", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            
            <Button onClick={handleExport} size="sm" disabled={!metrics} className="h-9 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md shadow-indigo-500/25">
              <Icon icon="solar:download-bold-duotone" className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </header>
      
      {/* Alerts - Enhanced styling */}
      {metrics && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.slice(0, 2).map((alert, idx) => (
            <div key={idx} className={cn(
              "rounded-xl p-4 flex items-start gap-3 border",
              alert.type === 'warning' 
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" 
                : alert.type === 'critical'
                  ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
                  : alert.type === 'success'
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800"
            )}>
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                alert.type === 'warning' 
                  ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400" 
                  : alert.type === 'critical'
                    ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                    : alert.type === 'success'
                      ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                      : "bg-sky-100 dark:bg-sky-900/50 text-sky-600 dark:text-sky-400"
              )}>
                <Icon icon={alert.type === 'warning' ? "solar:danger-triangle-bold" : alert.type === 'critical' ? "solar:close-circle-bold" : alert.type === 'success' ? "solar:check-circle-bold" : "solar:info-circle-bold"} className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium",
                  alert.type === 'warning' 
                    ? "text-amber-800 dark:text-amber-200" 
                    : alert.type === 'critical'
                      ? "text-rose-800 dark:text-rose-200"
                      : alert.type === 'success'
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-sky-800 dark:text-sky-200"
                )}>{alert.message}</p>
                {alert.action && (
                  <p className={cn(
                    "text-xs mt-1 flex items-center gap-1",
                    alert.type === 'warning' 
                      ? "text-amber-600 dark:text-amber-400" 
                      : alert.type === 'critical'
                        ? "text-rose-600 dark:text-rose-400"
                        : alert.type === 'success'
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-sky-600 dark:text-sky-400"
                  )}>
                    <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                    {alert.action}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation Tabs - Enhanced with pill style */}
      <nav className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-stone-900 rounded-xl overflow-x-auto scrollbar-hide">
        {navTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-lg",
              activeTab === tab.id 
                ? "bg-white dark:bg-stone-800 text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-stone-800/50"
            )}
          >
            <Icon icon={tab.icon} className={cn("h-4 w-4", activeTab === tab.id && "text-indigo-500")} />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-[350px] rounded-2xl" />
            <Skeleton className="h-[350px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics - Enhanced cards */}
              {metrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    label="Total Leads"
                    value={metrics.kpis.totalLeads}
                    icon="solar:users-group-rounded-bold-duotone"
                    growth={metrics.periodComparison.leadsGrowth}
                    color="blue"
                  />
                  <MetricCard
                    label="Total Revenue"
                    value={formatCurrency(metrics.kpis.totalRevenue)}
                    icon="solar:wallet-money-bold-duotone"
                    growth={metrics.periodComparison.revenueGrowth}
                    isFormatted
                    color="emerald"
                  />
                  <MetricCard
                    label="Overall ROI"
                    value={formatPercentage(metrics.kpis.overallROI, 0)}
                    icon="solar:graph-up-bold-duotone"
                    badge={metrics.kpis.overallROI >= 200 ? 'Excellent' : metrics.kpis.overallROI >= 100 ? 'Good' : 'Needs Work'}
                    badgeColor={metrics.kpis.overallROI >= 200 ? 'emerald' : metrics.kpis.overallROI >= 100 ? 'amber' : 'rose'}
                    isFormatted
                    color="amber"
                  />
                  <MetricCard
                    label="Marketing Spend"
                    value={formatCurrency(metrics.kpis.totalMarketingSpend)}
                    icon="solar:tag-price-bold-duotone"
                    subtitle={`CPL: ${formatCurrency(metrics.costs.costPerLead)}`}
                    isFormatted
                    color="violet"
                  />
                </div>
              )}
              
              {/* Quick Stats Row */}
              {metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <QuickStat label="Conversion Rate" value={formatPercentage(funnel?.overallConversionRate || 0)} icon="solar:chart-bold" color="indigo" />
                  <QuickStat label="Avg Deal Size" value={formatCurrency(metrics.kpis.totalRevenue / Math.max(metrics.kpis.totalLeads, 1))} icon="solar:hand-money-bold" color="teal" />
                  <QuickStat label="Active Campaigns" value={campaigns.length.toString()} icon="solar:target-bold" color="orange" />
                  <QuickStat label="Data Points" value={(metrics.kpis.totalLeads * 5).toLocaleString()} icon="solar:database-bold" color="pink" />
                </div>
              )}
              
              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                        <Icon icon="solar:filter-bold-duotone" className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Conversion Funnel</h3>
                        <p className="text-xs text-muted-foreground">Track your lead journey</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    {funnel ? <ConversionFunnelChart funnel={funnel} /> : <EmptyState message="No funnel data available" icon="solar:filter-bold-duotone" />}
                  </div>
                </div>
                
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                        <Icon icon="solar:calculator-bold-duotone" className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">ROI Calculator</h3>
                        <p className="text-xs text-muted-foreground">Calculate your returns</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <ROICalculator />
                  </div>
                </div>
              </div>
              
              {/* Drop-off Analysis */}
              {funnel && funnel.dropOffPoints && funnel.dropOffPoints.length > 0 && (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                        <Icon icon="solar:danger-triangle-bold-duotone" className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Drop-off Points & Recommendations</h3>
                        <p className="text-xs text-muted-foreground">Areas that need attention</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {funnel.dropOffPoints.map((point, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/20 dark:to-orange-950/20 border border-rose-200 dark:border-rose-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-rose-700 dark:text-rose-300">{point.stage}</span>
                            <Badge variant="outline" className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 text-xs">
                              {point.dropOffRate.toFixed(1)}% drop
                            </Badge>
                          </div>
                          <ul className="space-y-1.5">
                            {point.recommendations.slice(0, 2).map((rec, ri) => (
                              <li key={ri} className="text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2">
                                <Icon icon="solar:lightbulb-bolt-bold" className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Funnel Tab */}
          {activeTab === 'funnel' && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6">
              {funnel ? <ConversionFunnelChart funnel={funnel} /> : <EmptyState message="No funnel data available" icon="solar:filter-bold-duotone" />}
            </div>
          )}
          
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              {campaigns.length > 0 ? (
                <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400">
                        <Icon icon="solar:target-bold-duotone" className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Campaign Performance</h3>
                        <p className="text-xs text-muted-foreground">{campaigns.length} campaigns tracked</p>
                      </div>
                    </div>
                  </div>
                  <CampaignsTable campaigns={campaigns} />
                </div>
              ) : (
                <EmptyState message="No campaign data. Connect Brevo or Twilio to track ROI." icon="solar:target-bold-duotone" />
              )}
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-6">
                <ROICalculator />
              </div>
            </div>
          )}
          
          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-950/30 dark:to-sky-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400">
                    <Icon icon="solar:graph-up-bold-duotone" className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Predictive Analytics</h3>
                    <p className="text-xs text-muted-foreground">AI-powered forecasts</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {predictive ? (
                  <PredictiveChart analytics={predictive} historicalLeads={historicalLeads} />
                ) : (
                  <EmptyState message="Need at least 3 months of data for predictions" icon="solar:graph-up-bold-duotone" />
                )}
              </div>
            </div>
          )}
          
          {/* Attribution Tab */}
          {activeTab === 'attribution' && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-pink-100 dark:bg-pink-900/50 text-pink-600 dark:text-pink-400">
                    <Icon icon="solar:pie-chart-2-bold-duotone" className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Revenue Attribution</h3>
                    <p className="text-xs text-muted-foreground">Understand your revenue sources</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {attribution ? <AttributionBreakdown attribution={attribution} /> : <EmptyState message="No attribution data available" icon="solar:pie-chart-2-bold-duotone" />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="advanced-analytics" />
    </div>
  );
}

// Color configurations for metric cards
const colorConfig = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    icon: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400',
    gradient: 'from-blue-500 to-indigo-500',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-500 to-teal-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/50',
    icon: 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800/50',
    icon: 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400',
    text: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-500 to-purple-500',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    icon: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
    text: 'text-rose-600 dark:text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
  },
};

// Metric Card Component - Enhanced
function MetricCard({ 
  label, 
  value, 
  icon, 
  growth, 
  badge, 
  badgeColor = 'emerald',
  subtitle,
  isFormatted,
  color = 'blue'
}: { 
  label: string; 
  value: number | string; 
  icon: string; 
  growth?: number; 
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'rose';
  subtitle?: string;
  isFormatted?: boolean;
  color?: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
}) {
  const colors = colorConfig[color];
  const badgeColors = {
    emerald: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    rose: 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  };
  
  return (
    <div className={cn(
      "relative rounded-2xl border overflow-hidden transition-all hover:shadow-lg",
      colors.bg,
      colors.border
    )}>
      {/* Top gradient bar */}
      <div className={cn("absolute top-0 inset-x-0 h-1 bg-gradient-to-r", colors.gradient)} />
      
      <div className="p-4 sm:p-5 pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl", colors.icon)}>
            <Icon icon={icon} className="h-5 w-5" />
          </div>
          {growth !== undefined && growth !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              growth > 0 
                ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300" 
                : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300"
            )}>
              <Icon icon={growth > 0 ? "solar:arrow-up-bold" : "solar:arrow-down-bold"} className="h-3 w-3" />
              <span>{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
            </div>
          )}
        </div>
        
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        
        <div className={cn("text-2xl sm:text-3xl font-bold tabular-nums", colors.text)}>
          {isFormatted ? value : <AnimatedCounter value={value as number} />}
        </div>
        
        {badge && (
          <Badge variant="outline" className={cn("text-[10px] mt-2 border", badgeColors[badgeColor])}>
            {badge}
          </Badge>
        )}
        {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </div>
  );
}

// Quick Stat Component - New
function QuickStat({ 
  label, 
  value, 
  icon, 
  color = 'indigo' 
}: { 
  label: string; 
  value: string; 
  icon: string; 
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50',
    teal: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/50',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50',
    pink: 'text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/50',
  };
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800">
      <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg", colorClasses[color])}>
        <Icon icon={icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

// Empty State Component - Enhanced
function EmptyState({ message, icon = "solar:info-circle-bold-duotone" }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 mb-4">
        <Icon icon={icon} className="h-8 w-8 text-stone-400 dark:text-stone-500" />
      </div>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      <Button variant="outline" size="sm" className="mt-4">
        <Icon icon="solar:settings-bold-duotone" className="h-4 w-4 mr-2" />
        Configure Integrations
      </Button>
    </div>
  );
}
