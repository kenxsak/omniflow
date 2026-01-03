"use client";

/**
 * ROI Calculator Component
 * 
 * Interactive widget for calculating marketing ROI
 */

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useCurrency } from '@/contexts/currency-context';
import {
  calculateROI,
  calculateROAS,
  calculateCostPerLead,
  calculateCAC,
  formatPercentage,
} from '@/lib/analytics-service';

export default function ROICalculator() {
  const { formatCurrency, getCurrencyCode } = useCurrency();
  const currencySymbol = getCurrencyCode() === 'INR' ? '₹' : 
                         getCurrencyCode() === 'EUR' ? '€' : 
                         getCurrencyCode() === 'GBP' ? '£' : 
                         getCurrencyCode() === 'JPY' ? '¥' : '$';

  const [revenue, setRevenue] = useState<string>('1000');
  const [spend, setSpend] = useState<string>('500');
  const [leads, setLeads] = useState<string>('50');
  const [customers, setCustomers] = useState<string>('5');
  
  const revenueNum = parseFloat(revenue) || 0;
  const spendNum = parseFloat(spend) || 0;
  const leadsNum = parseInt(leads) || 0;
  const customersNum = parseInt(customers) || 0;
  
  const roi = calculateROI(revenueNum, spendNum);
  const roas = calculateROAS(revenueNum, spendNum);
  const cpl = calculateCostPerLead(spendNum, leadsNum);
  const cac = calculateCAC(spendNum, customersNum);
  
  const handleReset = () => {
    setRevenue('1000');
    setSpend('500');
    setLeads('50');
    setCustomers('5');
  };

  const metrics = [
    { label: 'ROI', value: roi === Infinity ? '∞' : formatPercentage(roi, 0), icon: 'solar:graph-up-linear', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)' },
    { label: 'ROAS', value: `${roas.toFixed(2)}x`, icon: 'solar:wallet-linear', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
    { label: 'CPL', value: formatCurrency(cpl), icon: 'solar:users-group-rounded-linear', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
    { label: 'CAC', value: formatCurrency(cac), icon: 'solar:target-linear', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' },
  ];
  
  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Icon icon="solar:calculator-linear" className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            ROI Calculator
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Calculate your marketing return on investment</p>
      </div>
      
      <div className="p-4 space-y-5">
        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="revenue" className="text-[11px] text-muted-foreground">Total Revenue ({currencySymbol})</Label>
            <Input
              id="revenue"
              type="number"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              placeholder="1000"
              min="0"
              step="0.01"
              className="h-9 text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="spend" className="text-[11px] text-muted-foreground">Marketing Spend ({currencySymbol})</Label>
            <Input
              id="spend"
              type="number"
              value={spend}
              onChange={(e) => setSpend(e.target.value)}
              placeholder="500"
              min="0"
              step="0.01"
              className="h-9 text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="leads" className="text-[11px] text-muted-foreground">Leads Generated</Label>
            <Input
              id="leads"
              type="number"
              value={leads}
              onChange={(e) => setLeads(e.target.value)}
              placeholder="50"
              min="0"
              className="h-9 text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customers" className="text-[11px] text-muted-foreground">Customers Acquired</Label>
            <Input
              id="customers"
              type="number"
              value={customers}
              onChange={(e) => setCustomers(e.target.value)}
              placeholder="5"
              min="0"
              className="h-9 text-sm bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800"
            />
          </div>
        </div>
        
        {/* Results Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {metrics.map((metric) => (
            <div 
              key={metric.label} 
              className="text-center p-3 rounded-lg border border-stone-100 dark:border-stone-800"
              style={{ backgroundColor: metric.bgColor }}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <Icon icon={metric.icon} className="h-3 w-3" style={{ color: metric.color }} />
                <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">{metric.label}</span>
              </div>
              <div className="text-base font-semibold tabular-nums" style={{ color: metric.color }}>
                {metric.value}
              </div>
            </div>
          ))}
        </div>
        
        {/* Explanation */}
        <div className="space-y-2 p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
          <div className="flex items-start gap-2">
            <span className="text-[11px] font-medium text-foreground min-w-[180px]">ROI (Return on Investment)</span>
            <span className="text-[11px] text-muted-foreground">
              Measures profitability. {roi >= 100 ? '✓ Profitable' : roi >= 0 ? '○ Break-even' : '✗ Losing money'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[11px] font-medium text-foreground min-w-[180px]">ROAS (Return on Ad Spend)</span>
            <span className="text-[11px] text-muted-foreground">For every {currencySymbol}1 spent, you earn {currencySymbol}{roas.toFixed(2)}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[11px] font-medium text-foreground min-w-[180px]">CPL (Cost Per Lead)</span>
            <span className="text-[11px] text-muted-foreground">You spend {formatCurrency(cpl)} to acquire each lead</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[11px] font-medium text-foreground min-w-[180px]">CAC (Customer Acquisition Cost)</span>
            <span className="text-[11px] text-muted-foreground">It costs {formatCurrency(cac)} to acquire each customer</span>
          </div>
        </div>
        
        <Button onClick={handleReset} variant="outline" className="w-full h-8 text-xs">
          Reset Calculator
        </Button>
      </div>
    </div>
  );
}
