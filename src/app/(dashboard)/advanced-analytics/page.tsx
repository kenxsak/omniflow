"use client";

/**
 * Advanced Analytics Dashboard Page
 * 
 * Comprehensive business intelligence, conversion tracking, and ROI calculations
 * for marketing efforts.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { Animated, AnimatedCounter } from '@/components/ui/animated';
import { cn } from '@/lib/utils';
import gsap from 'gsap';
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
import ConversionFunnelChart from '@/components/analytics/conversion-funnel-chart';
import ROICalculator from '@/components/analytics/roi-calculator';
import PredictiveChart from '@/components/analytics/predictive-chart';
import AttributionBreakdown from '@/components/analytics/attribution-breakdown';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatPercentage } from '@/lib/analytics-service';
import { format } from 'date-fns';

// Navigation tabs configuration
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
  
  const loadAnalytics = useCallback(async () => {
    if (!appUser?.companyId || !company) {
      setIsLoading(false);
      return;
    }
    
    try {
      const apiKeys = company.apiKeys || {};
      const brevoKey = apiKeys.brevo?.apiKey;
      const twilioSid = apiKeys.twilio?.accountSid;
      const twilioToken = apiKeys.twilio?.authToken;
      
      const [
        funnelResult,
        campaignsResult,
        predictiveResult,
        attributionResult,
        metricsResult,
      ] = await Promise.all([
        getConversionFunnelData(appUser.companyId, period),
        calculateCampaignROI(appUser.companyId, period, brevoKey, twilioSid, twilioToken),
        getPredictiveInsights(appUser.companyId),
        getRevenueAttribution(appUser.companyId, period),
        getAdvancedMetrics(appUser.companyId, period, brevoKey, twilioSid, twilioToken),
      ]);
      
      if (funnelResult.success && funnelResult.data) {
        setFunnel(funnelResult.data);
      }
      
      if (campaignsResult.success && campaignsResult.data) {
        setCampaigns(campaignsResult.data);
      }
      
      if (predictiveResult.success && predictiveResult.data) {
        setPredictive(predictiveResult.data);
      }
      
      if (attributionResult.success && attributionResult.data) {
        setAttribution(attributionResult.data);
      }
      
      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      }
      
      const historicalResult = await getHistoricalLeadCounts(appUser.companyId);
      if (historicalResult.success && historicalResult.data) {
        setHistoricalLeads(historicalResult.data);
      }
      
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [appUser, company, period, toast]);
  
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnalytics();
    toast({
      title: 'Refreshed',
      description: 'Analytics data has been updated',
    });
  };
  
  const handlePeriodChange = (newPeriod: string) => {
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
        [],
        ['Conversion Rates'],
        ['View to Lead', formatPercentage(metrics.conversions.viewToLead)],
        ['Lead to Customer', formatPercentage(metrics.conversions.leadToCustomer)],
        ['Overall Conversion', formatPercentage(metrics.conversions.overallConversion)],
        [],
        ['Channel Performance'],
        ['Channel', 'Leads', 'Revenue', 'ROI'],
        ...metrics.channelPerformance.map(ch => [
          ch.channel,
          ch.leads,
          formatCurrency(ch.revenue),
          formatPercentage(ch.roi),
        ]),
      ];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
      
      const filename = `analytics-${period}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast({
        title: 'Exported',
        description: `Analytics data exported to ${filename}`,
      });
    } catch (error: any) {
      console.error('Error exporting:', error);
      toast({
        title: 'Error',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
    }
  };
  
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (statsRef.current && metrics) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, stagger: 0, ease: 'power2.out' }
      );
    }
  }, [metrics]);

  if (!appUser || !company) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
          <AlertDescription>Please log in to view analytics</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Advanced Analytics</h1>
            <p className="text-xs text-muted-foreground">Business intelligence, conversion tracking, and ROI calculations</p>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Icon icon="solar:calendar-linear" className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
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
              <Icon icon={isRefreshing ? "solar:refresh-linear" : "solar:refresh-linear"} className={cn("h-3.5 w-3.5 mr-1.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            
            <Button onClick={handleExport} size="sm" disabled={!metrics} className="h-8 text-xs">
              <Icon icon="solar:download-linear" className="h-3.5 w-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Mobile Actions */}
        <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[130px] h-8 text-xs flex-shrink-0">
              <Icon icon="solar:calendar-linear" className="mr-1 h-3 w-3 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing} className="flex-shrink-0 h-8">
            <Icon icon="solar:refresh-linear" className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          </Button>
          
          <Button onClick={handleExport} size="sm" disabled={!metrics} className="flex-shrink-0 h-8">
            <Icon icon="solar:download-linear" className="h-3.5 w-3.5 mr-1" />
            Export
          </Button>
        </div>
      </header>
      
      {/* Alerts */}
      {metrics && metrics.alerts.length > 0 && (
        <div className="space-y-2">
          {metrics.alerts.map((alert, idx) => (
            <div key={idx} className="relative border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 p-3">
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
      
      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Tabs - Clerk Style */}
          <nav className="relative border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1 overflow-x-auto pb-px scrollbar-hide">
              {navTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                    activeTab === tab.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
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

          {/* Tab Content */}
          <div className="min-h-[50vh]">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics Cards */}
                {metrics && (
                  <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="stat-card relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                      <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
                      <div className="p-3 sm:p-4 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Total Leads
                          </span>
                          <Icon icon="solar:target-linear" className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
                          <AnimatedCounter value={metrics.kpis.totalLeads} />
                        </div>
                        {metrics.periodComparison.leadsGrowth !== 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Icon 
                              icon={metrics.periodComparison.leadsGrowth > 0 ? "solar:arrow-up-linear" : "solar:arrow-down-linear"} 
                              className="h-3 w-3" 
                            />
                            <span>
                              {metrics.periodComparison.leadsGrowth > 0 ? '+' : ''}{metrics.periodComparison.leadsGrowth.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="stat-card relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                      <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
                      <div className="p-3 sm:p-4 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Total Revenue
                          </span>
                          <Icon icon="solar:wallet-linear" className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="text-lg sm:text-xl font-semibold tabular-nums text-foreground truncate">
                          {formatCurrency(metrics.kpis.totalRevenue)}
                        </div>
                        {metrics.periodComparison.revenueGrowth !== 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Icon 
                              icon={metrics.periodComparison.revenueGrowth > 0 ? "solar:arrow-up-linear" : "solar:arrow-down-linear"} 
                              className="h-3 w-3" 
                            />
                            <span>
                              {metrics.periodComparison.revenueGrowth > 0 ? '+' : ''}{metrics.periodComparison.revenueGrowth.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="stat-card relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                      <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
                      <div className="p-3 sm:p-4 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Overall ROI
                          </span>
                          <Icon icon="solar:chart-linear" className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="text-lg sm:text-2xl font-semibold tabular-nums text-foreground">
                          {formatPercentage(metrics.kpis.overallROI, 0)}
                        </div>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {metrics.kpis.overallROI >= 200 ? 'Excellent' : 'Good'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="stat-card relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                      <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
                      <div className="p-3 sm:p-4 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Marketing Spend
                          </span>
                          <Icon icon="solar:tag-price-linear" className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <div className="text-lg sm:text-xl font-semibold tabular-nums text-foreground truncate">
                          {formatCurrency(metrics.kpis.totalMarketingSpend)}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          CPL: {formatCurrency(metrics.costs.costPerLead)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Funnel + ROI Calculator */}
                <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
                  {funnel && <ConversionFunnelChart funnel={funnel} />}
                  <ROICalculator />
                </div>
              </div>
            )}
            
            {/* Funnel Tab */}
            {activeTab === 'funnel' && (
              <div className="space-y-6">
                {funnel ? (
                  <ConversionFunnelChart funnel={funnel} />
                ) : (
                  <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
                      <span className="text-sm">No funnel data available for this period</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-500" />
                  <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <Icon icon="solar:target-linear" className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Campaign Performance & ROI
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Detailed ROI analysis for your marketing campaigns</p>
                  </div>
                  <div className="p-4">
                    {campaigns.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-stone-50 dark:bg-stone-900">
                              <TableHead className="text-[10px] uppercase tracking-wider">Campaign</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">Leads</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">Customers</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">Revenue</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">Spend</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">ROI</TableHead>
                              <TableHead className="text-[10px] uppercase tracking-wider text-right">Rating</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {campaigns.map((campaign) => (
                              <TableRow key={campaign.campaignId}>
                                <TableCell className="font-medium text-sm">
                                  {campaign.campaignName}
                                  <div className="text-[10px] text-muted-foreground capitalize">
                                    {campaign.campaignType}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{campaign.leadsGenerated}</TableCell>
                                <TableCell className="text-right text-sm tabular-nums">{campaign.customersAcquired}</TableCell>
                                <TableCell className="text-right text-sm font-medium tabular-nums">
                                  {formatCurrency(campaign.revenue)}
                                </TableCell>
                                <TableCell className="text-right text-sm tabular-nums">
                                  {formatCurrency(campaign.marketingSpend + campaign.aiCostsUsed)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="secondary" className="text-[10px]">
                                    {formatPercentage(campaign.roi, 0)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="outline" className="text-[10px] capitalize">
                                    {campaign.performanceRating}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Icon icon="solar:chart-2-linear" className="h-10 w-10 text-muted-foreground/30 mb-3" />
                        <p className="text-sm font-medium text-foreground">No Campaign Data Available</p>
                        <p className="text-xs text-muted-foreground mt-1">Connect Brevo or Twilio to track campaign ROI</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <ROICalculator />
              </div>
            )}
            
            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <div className="space-y-6">
                {predictive ? (
                  <PredictiveChart analytics={predictive} historicalLeads={historicalLeads} />
                ) : (
                  <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
                      <span className="text-sm">Insufficient data for predictions. Need at least 3 months of historical data.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Attribution Tab */}
            {activeTab === 'attribution' && (
              <div className="space-y-6">
                {attribution ? (
                  <AttributionBreakdown attribution={attribution} />
                ) : (
                  <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
                      <span className="text-sm">No attribution data available for this period</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
