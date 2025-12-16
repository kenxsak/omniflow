'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Icon } from '@iconify/react';
import type { Deal } from '@/types/crm';
import { getDealsForContact, deleteDeal } from '@/app/actions/deal-actions';
import { DealCard } from './deal-card';
import { DealForm } from './deal-form';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';

interface ContactDealsProps {
  contactId: string;
  contactName: string;
  companyId: string;
}

export function ContactDeals({ contactId, contactName, companyId }: ContactDealsProps) {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();

  useEffect(() => {
    loadDeals();
  }, [contactId, companyId]);

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const data = await getDealsForContact(companyId, contactId);
      setDeals(data);
    } catch (error) {
      console.error('Error loading deals:', error);
    }
    setIsLoading(false);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setShowForm(true);
  };

  const handleDelete = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;

    try {
      const result = await deleteDeal(dealId);
      if (result.success) {
        toast({ title: 'Deal deleted successfully' });
        loadDeals();
      } else {
        toast({ title: result.error || 'Failed to delete deal', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete deal', variant: 'destructive' });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingDeal(undefined);
  };

  const totalValue = deals
    .filter(d => !['won', 'lost'].includes(d.status))
    .reduce((sum, d) => sum + d.amount, 0);

  if (isLoading) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Deals
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex justify-center py-8">
            <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Deals
            </span>
            {deals.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Pipeline value: {formatCurrency(totalValue)}
              </p>
            )}
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Deal
          </Button>
        </div>
        <div className="p-4 sm:p-5">
          {deals.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="solar:dollar-linear" className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No deals yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create a deal to track opportunities with this contact</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deals.map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <DealForm
        open={showForm}
        onOpenChange={handleFormClose}
        contactId={contactId}
        contactName={contactName}
        companyId={companyId}
        existingDeal={editingDeal}
        onSuccess={loadDeals}
      />
    </>
  );
}
