"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/hooks/use-auth';
import { getLeadQuotesAction, convertQuoteToInvoiceAction } from '@/app/actions/quote-actions';
import { format } from 'date-fns';
import type { QuoteDocument } from '@/types/saas';
import Link from 'next/link';

interface LeadQuotesListProps {
  leadId: string;
  leadName: string;
}

const statusColors: Record<QuoteDocument['status'], string> = {
  draft: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function LeadQuotesList({ leadId, leadName }: LeadQuotesListProps) {
  const [quotes, setQuotes] = useState<QuoteDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const { appUser } = useAuth();

  useEffect(() => {
    async function loadQuotes() {
      if (!appUser?.idToken) return;
      
      setIsLoading(true);
      try {
        const result = await getLeadQuotesAction({ 
          idToken: appUser.idToken, 
          leadId 
        });
        if (result.success && result.quotes) {
          setQuotes(result.quotes);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadQuotes();
  }, [appUser?.idToken, leadId]);

  const handleConvertToInvoice = async (quoteId: string) => {
    if (!appUser?.idToken) {
      toast({ title: 'Please log in', variant: 'destructive' });
      return;
    }

    setConvertingId(quoteId);
    try {
      const result = await convertQuoteToInvoiceAction({
        idToken: appUser.idToken,
        quoteId,
      });

      if (result.success) {
        toast({ 
          title: 'Invoice created!', 
          description: `Invoice ${result.invoiceNumber} has been created from this quote.` 
        });
        // Update the quote status locally
        setQuotes(prev => prev.map(q => 
          q.id === quoteId 
            ? { ...q, status: 'accepted' as const, convertedToInvoiceId: result.invoiceId } 
            : q
        ));
      } else {
        toast({ title: 'Failed to convert', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error converting quote:', error);
      toast({ title: 'Error converting quote', variant: 'destructive' });
    } finally {
      setConvertingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-6">
        <Icon icon="solar:document-text-linear" className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">No quotes for this lead yet.</p>
        <p className="text-xs text-muted-foreground mt-1">Create a quote using the Quick Actions panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quotes.map((quote) => (
        <div 
          key={quote.id} 
          className="p-3 sm:p-4 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/50 dark:bg-stone-900/50"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{quote.quoteNumber}</span>
                <Badge className={`${statusColors[quote.status]} text-[10px] px-1.5 py-0`}>
                  {quote.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format(new Date(quote.createdAt), 'PP')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(quote.total)}
              </p>
              {quote.discountPercent && quote.discountPercent > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {quote.discountPercent}% off
                </p>
              )}
            </div>
          </div>

          {/* Items preview */}
          <div className="text-xs text-muted-foreground mb-3">
            {quote.items.slice(0, 2).map((item, i) => (
              <span key={i}>
                {item.description}
                {i < Math.min(quote.items.length, 2) - 1 && ', '}
              </span>
            ))}
            {quote.items.length > 2 && ` +${quote.items.length - 2} more`}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            {quote.status === 'sent' || quote.status === 'viewed' ? (
              <Button
                size="sm"
                onClick={() => handleConvertToInvoice(quote.id)}
                disabled={convertingId === quote.id}
                className="w-full sm:w-auto h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                {convertingId === quote.id ? (
                  <Icon icon="solar:refresh-linear" className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <Icon icon="solar:document-add-linear" className="w-3 h-3 mr-1.5" />
                )}
                Convert to Invoice
              </Button>
            ) : quote.status === 'accepted' && quote.convertedToInvoiceId ? (
              <Button
                size="sm"
                variant="outline"
                asChild
                className="w-full sm:w-auto h-8 text-xs"
              >
                <Link href={`/invoices?id=${quote.convertedToInvoiceId}`}>
                  <Icon icon="solar:document-text-linear" className="w-3 h-3 mr-1.5" />
                  View Invoice
                </Link>
              </Button>
            ) : quote.status === 'draft' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleConvertToInvoice(quote.id)}
                disabled={convertingId === quote.id}
                className="w-full sm:w-auto h-8 text-xs"
              >
                {convertingId === quote.id ? (
                  <Icon icon="solar:refresh-linear" className="w-3 h-3 mr-1.5 animate-spin" />
                ) : (
                  <Icon icon="solar:document-add-linear" className="w-3 h-3 mr-1.5" />
                )}
                Convert to Invoice
              </Button>
            ) : null}
          </div>

          {/* Validity info */}
          {quote.validUntil && (
            <p className="text-[10px] text-muted-foreground mt-2">
              {new Date(quote.validUntil) < new Date() 
                ? `Expired on ${format(new Date(quote.validUntil), 'PP')}`
                : `Valid until ${format(new Date(quote.validUntil), 'PP')}`
              }
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
