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

// Dynamic imports for heavy components
const ConversionFunnelChart = dynamic(
  () => import('@/components/analytics/conversion-funnel-chart'),
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

// Navigation tabs
const navTabs = [
  { id: 'overview', label: 'Overview', icon: 'solar:chart-square-linear' },
  { id: 'funnel', label: 'Funnel', icon: 'solar:filter-linear' },
  { id: 'campaigns', label: 'Campaigns', icon: 'solar:target-linear' },
  { id: 'predictions', label: 'Predictions', icon: 'solar:graph-up-linear' },
  { id: 'attribution', label: 'Attribution', icon: 'solar:pie-chart-2-linear' },
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
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Advanced Analytics</h1>
          <p className="text-xs text-muted-foreground">Business intelligence, conversion tracking, and ROI calculations</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing} className="h-8 text-xs">
            <Icon icon="solar:refresh-linear" className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
          
          <Button onClick={handleExport} size="sm" disabled={!metrics} className="h-8 text-xs">
            <Icon icon="solar:download-linear" className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </header>
      
      {/* Alerts */}
      {metrics && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.slice(0, 2).map((alert, idx) => (
            <div key={idx} className="border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 p-3">
              <div className="flex items-start gap-2">
                <Icon icon="solar:bell-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{alert.message}</p>
                  {alert.action && <p className="text-xs text-muted-foreground mt-0.5">→ {alert.action}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Navigation Tabs */}
      <nav className="border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-hide">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon icon={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute inset-x-3 bottom-0 h-0.5 bg-foreground rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="min-h-[50vh]">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              {metrics && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MetricCard
                    label="Total Leads"
                    value={metrics.kpis.totalLeads}
                    icon="solar:target-linear"
                    growth={metrics.periodComparison.leadsGrowth}
                  />
                  <MetricCard
                    label="Total Revenue"
                    value={formatCurrency(metrics.kpis.totalRevenue)}
                    icon="solar:wallet-linear"
                    growth={metrics.periodComparison.revenueGrowth}
                    isFormatted
                  />
                  <MetricCard
                    label="Overall ROI"
                    value={formatPercentage(metrics.kpis.overallROI, 0)}
                    icon="solar:chart-linear"
                    badge={metrics.kpis.overallROI >= 200 ? 'Excellent' : 'Good'}
                    isFormatted
                  />
                  <MetricCard
                    label="Marketing Spend"
                    value={formatCurrency(metrics.kpis.totalMarketingSpend)}
                    icon="solar:tag-price-linear"
                    subtitle={`CPL: ${formatCurrency(metrics.costs.costPerLead)}`}
                    isFormatted
                  />
                </div>
              )}
              
              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-4">
                {funnel ? <ConversionFunnelChart funnel={funnel} /> : <Skeleton className="h-[350px] rounded-xl" />}
                <ROICalculator />
              </div>
            </div>
          )}
          
          {/* Funnel Tab */}
          {activeTab === 'funnel' && (
            funnel ? <ConversionFunnelChart funnel={funnel} /> : <EmptyState message="No funnel data available" />
          )}
          
          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              {campaigns.length > 0 ? (
                <CampaignsTable campaigns={campaigns} />
              ) : (
                <EmptyState message="No campaign data. Connect Brevo or Twilio to track ROI." />
              )}
              <ROICalculator />
            </div>
          )}
          
          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            predictive ? (
              <PredictiveChart analytics={predictive} historicalLeads={historicalLeads} />
            ) : (
              <EmptyState message="Need at least 3 months of data for predictions" />
            )
          )}
          
          {/* Attribution Tab */}
          {activeTab === 'attribution' && (
            attribution ? <AttributionBreakdown attribution={attribution} /> : <EmptyState message="No attribution data available" />
          )}
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  label, 
  value, 
  icon, 
  growth, 
  badge, 
  subtitle,
  isFormatted 
}: { 
  label: string; 
  value: number | string; 
  icon: string; 
  growth?: number; 
  badge?: string;
  subtitle?: string;
  isFormatted?: boolean;
}) {
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
      <div className="p-3 sm:p-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            {label}
          </span>
          <Icon icon={icon} className="h-4 w-4 text-muted-foreground/60" />
        </div>
        <div className="text-lg sm:text-xl font-semibold tabular-nums text-foreground truncate">
          {isFormatted ? value : <AnimatedCounter value={value as number} />}
        </div>
        {growth !== undefined && growth !== 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Icon icon={growth > 0 ? "solar:arrow-up-linear" : "solar:arrow-down-linear"} className="h-3 w-3" />
            <span>{growth > 0 ? '+' : ''}{growth.toFixed(1)}%</span>
          </div>
        )}
        {badge && <Badge variant="secondary" className="text-[10px] mt-1">{badge}</Badge>}
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}
