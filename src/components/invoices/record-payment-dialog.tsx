"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import { useAuth } from '@/hooks/use-auth';
import { recordPaymentAction } from '@/app/actions/invoice-actions';
import type { Invoice, PaymentMethod } from '@/types/invoice';

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice;
  onSuccess: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'razorpay', label: 'Razorpay', icon: 'simple-icons:razorpay' },
  { value: 'upi', label: 'UPI', icon: 'simple-icons:googlepay' },
  { value: 'bank', label: 'Bank Transfer', icon: 'solar:bank-bold' },
  { value: 'cash', label: 'Cash', icon: 'solar:wallet-money-bold' },
  { value: 'cheque', label: 'Cheque', icon: 'solar:document-text-bold' },
  { value: 'stripe', label: 'Stripe', icon: 'logos:stripe' },
  { value: 'other', label: 'Other', icon: 'solar:card-bold' },
];

export function RecordPaymentDialog({ open, onOpenChange, invoice, onSuccess }: RecordPaymentDialogProps) {
  const [amount, setAmount] = useState(invoice.amountDue);
  const [method, setMethod] = useState<PaymentMethod>('bank');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const handleSubmit = async () => {
    if (!appUser?.idToken) return;
    
    if (amount <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    
    if (amount > invoice.amountDue) {
      toast({ title: 'Amount exceeds balance due', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await recordPaymentAction({
        idToken: appUser.idToken,
        invoiceId: invoice.id,
        payment: {
          amount,
          method,
          reference: reference || undefined,
          notes: notes || undefined,
          date,
        },
      });
      
      if (result.success) {
        toast({ title: 'Payment recorded!' });
        onSuccess();
      } else {
        toast({ title: result.error || 'Failed to record payment', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({ title: 'Failed to record payment', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:wallet-money-bold" className="w-5 h-5 text-emerald-500" />
            Record Payment
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Invoice {invoice.invoiceNumber} • Due: {formatCurrency(invoice.amountDue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Amount Received *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="h-9 sm:h-10 text-sm pl-7"
                min={0}
                max={invoice.amountDue}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(invoice.amountDue)}
                className="h-7 text-xs"
              >
                Full Amount
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(invoice.amountDue / 2)}
                className="h-7 text-xs"
              >
                50%
              </Button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Payment Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger className="h-9 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(pm => (
                  <SelectItem key={pm.value} value={pm.value}>
                    <div className="flex items-center gap-2">
                      <Icon icon={pm.icon} className="w-4 h-4" />
                      {pm.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Payment Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Reference / Transaction ID</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., UTR number, cheque number"
              className="h-9 sm:h-10 text-sm"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* Summary */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Invoice Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Already Paid</span>
              <span>{formatCurrency(invoice.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600">
              <span>This Payment</span>
              <span>+{formatCurrency(amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
              <span>Remaining</span>
              <span className={invoice.amountDue - amount <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                {formatCurrency(Math.max(0, invoice.amountDue - amount))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-9 sm:h-10 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || amount <= 0}
            className="w-full sm:flex-1 h-9 sm:h-10 text-sm"
          >
            {isSaving ? (
              <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-1.5" />
            )}
            Record Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
