"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { createRecurringInvoiceAction } from '@/app/actions/invoice-actions';
import type { RecurringFrequency } from '@/types/invoice';

interface CreateRecurringInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string; description: string }[] = [
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'monthly', label: 'Monthly', description: 'Every month' },
  { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
  { value: 'yearly', label: 'Yearly', description: 'Every year' },
];

export function CreateRecurringInvoiceDialog({ open, onOpenChange, onSuccess }: CreateRecurringInvoiceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Client info
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  
  // Schedule
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [autoSend, setAutoSend] = useState(true);
  const [autoReminder, setAutoReminder] = useState(true);
  
  // Items
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [notes, setNotes] = useState('');
  
  const { appUser } = useAuth();
  const { toast } = useToast();

  const resetForm = () => {
    setStep(1);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setFrequency('monthly');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setAutoSend(true);
    setAutoReminder(true);
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setGstEnabled(false);
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice;
      const tax = gstEnabled ? base * 0.18 : 0;
      return sum + base + tax;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!appUser?.idToken) return;
    
    if (!clientName || !clientEmail) {
      toast({ title: 'Please fill client details', variant: 'destructive' });
      return;
    }
    
    const validItems = items.filter(i => i.description && i.unitPrice > 0);
    if (validItems.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await createRecurringInvoiceAction({
        idToken: appUser.idToken,
        recurring: {
          clientName,
          clientEmail,
          clientPhone: clientPhone || undefined,
          frequency,
          startDate,
          endDate: endDate || undefined,
          autoSend,
          autoReminder,
          items: validItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: gstEnabled ? 18 : 0,
          })),
          gstEnabled,
          notes: notes || undefined,
        },
      });
      
      if (result.success) {
        toast({ title: 'Recurring invoice created!' });
        handleClose();
        onSuccess();
      } else {
        toast({ title: result.error || 'Failed to create', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[520px] p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:refresh-circle-bold" className="w-5 h-5 text-blue-500" />
            New Recurring Invoice
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Auto-generate invoices on a schedule
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                step >= s ? 'bg-blue-500 text-white' : 'bg-stone-200 dark:bg-stone-700 text-muted-foreground'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-stone-200 dark:bg-stone-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Client */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Client Name *</Label>
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Doe"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Email *</Label>
              <Input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="john@example.com"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Phone (optional)</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">({opt.description})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">End Date (optional)</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 sm:h-10 text-sm"
                />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Auto-send invoice</p>
                  <p className="text-xs text-muted-foreground">Email invoice when generated</p>
                </div>
                <Switch checked={autoSend} onCheckedChange={setAutoSend} />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Payment reminders</p>
                  <p className="text-xs text-muted-foreground">Send reminders for unpaid invoices</p>
                </div>
                <Switch checked={autoReminder} onCheckedChange={setAutoReminder} />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Items */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Line Items</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">GST 18%</span>
                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
              </div>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {items.map((item, index) => (
                <div key={index} className="p-2.5 border rounded-lg space-y-2">
                  <Input
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="h-8 text-sm w-16"
                      min={1}
                    />
                    <Input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="h-8 text-sm flex-1"
                    />
                    {items.length > 1 && (
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeItem(index)}>
                        <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <Button variant="outline" size="sm" onClick={addItem} className="w-full h-8 text-xs">
              <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-1" />
              Add Item
            </Button>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Thank you for your business!"
                className="min-h-[60px] text-sm resize-none"
              />
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated Total</span>
                <span className="font-bold">₹{calculateTotal().toLocaleString('en-IN')}</span>
              </div>
              {gstEnabled && (
                <p className="text-[10px] text-muted-foreground mt-1">Including 18% GST</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full sm:flex-1 h-9 sm:h-10">
              <Icon icon="solar:arrow-left-linear" className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose} className="w-full sm:flex-1 h-9 sm:h-10">
              Cancel
            </Button>
          )}
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="w-full sm:flex-1 h-9 sm:h-10"
              disabled={step === 1 && (!clientName || !clientEmail)}
            >
              Next
              <Icon icon="solar:arrow-right-linear" className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:flex-1 h-9 sm:h-10"
            >
              {isSubmitting ? (
                <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 mr-1" />
              )}
              Create Recurring
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
