'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import type { Deal } from '@/types/crm';
import { DEAL_STATUS_LABELS, DEAL_STATUS_COLORS } from '@/types/crm';

interface DealCardProps {
  deal: Deal;
  onEdit?: (deal: Deal) => void;
  onDelete?: (dealId: string) => void;
  compact?: boolean;
}

export function DealCard({ deal, onEdit, onDelete, compact = false }: DealCardProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-success-muted">
            <Icon icon="solar:dollar-linear" className="h-4 w-4 text-success-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">{deal.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(deal.amount, deal.currency)}
            </p>
          </div>
        </div>
        <Badge className={DEAL_STATUS_COLORS[deal.status]}>
          {DEAL_STATUS_LABELS[deal.status]}
        </Badge>
      </div>
    );
  }

  return (
    <div className="p-4 border border-stone-200 dark:border-stone-700 rounded-lg bg-white dark:bg-stone-900">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-sm">{deal.name}</h4>
          <p className="text-xl font-bold text-foreground tabular-nums">
            {formatCurrency(deal.amount, deal.currency)}
          </p>
        </div>
        <Badge className={DEAL_STATUS_COLORS[deal.status]}>
          {DEAL_STATUS_LABELS[deal.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs mb-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon icon="solar:graph-up-linear" className="h-3.5 w-3.5" />
          <span>{deal.probability}% probability</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon icon="solar:calendar-linear" className="h-3.5 w-3.5" />
          <span>Close: {formatDate(deal.expectedCloseDate)}</span>
        </div>
      </div>

      {deal.notes && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {deal.notes}
        </p>
      )}

      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-2 border-t border-stone-200 dark:border-stone-700">
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={() => onEdit(deal)} className="h-7 text-xs">
              <Icon icon="solar:pen-linear" className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete(deal.id)}
            >
              <Icon icon="solar:trash-bin-trash-linear" className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
