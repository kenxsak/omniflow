"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import type { Lead } from '@/lib/mock-data';

interface QuickQuoteGeneratorProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName?: string;
}

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

// Pre-built quote templates
const QUOTE_TEMPLATES = [
  { id: 'basic', name: 'Basic Package', items: [{ description: 'Basic Service Package', quantity: 1, unitPrice: 999 }] },
  { id: 'pro', name: 'Pro Package', items: [{ description: 'Pro Service Package', quantity: 1, unitPrice: 2499 }] },
  { id: 'enterprise', name: 'Enterprise Package', items: [{ description: 'Enterprise Service Package', quantity: 1, unitPrice: 4999 }] },
  { id: 'custom', name: 'Custom Quote', items: [] },
];

export function QuickQuoteGenerator({ lead, open, onOpenChange, companyName = 'Your Company' }: QuickQuoteGeneratorProps) {
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validDays, setValidDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const { formatCurrency, currency } = useCurrency();

  const addItem = () => {
    setItems([...items, { id: `item-${Date.now()}`, description: '', quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const applyTemplate = (templateId: string) => {
    const template = QUOTE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setItems(template.items.map((item, i) => ({ ...item, id: `item-${Date.now()}-${i}` })));
    }
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal - discountAmount;

  const generateQuoteHTML = () => {
    const today = new Date();
    const validUntil = new Date(today.getTime() + parseInt(validDays) * 24 * 60 * 60 * 1000);
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .quote-title { font-size: 28px; font-weight: bold; color: #1f2937; }
    .quote-number { color: #6b7280; }
    .client-info { margin-bottom: 30px; }
    .client-name { font-size: 18px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #f3f4f6; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
    .totals { text-align: right; margin-top: 20px; }
    .total-row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; }
    .grand-total { font-size: 20px; font-weight: bold; color: #059669; }
    .notes { margin-top: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="quote-title">QUOTE</div>
      <div class="quote-number">#Q-${Date.now().toString().slice(-6)}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 600;">${companyName}</div>
      <div style="color: #6b7280;">Date: ${today.toLocaleDateString()}</div>
      <div style="color: #6b7280;">Valid Until: ${validUntil.toLocaleDateString()}</div>
    </div>
  </div>
  
  <div class="client-info">
    <div style="color: #6b7280; font-size: 12px; text-transform: uppercase;">Quote For</div>
    <div class="client-name">${lead.name}</div>
    <div style="color: #6b7280;">${lead.email}</div>
    ${lead.attributes?.COMPANY_NAME ? `<div style="color: #6b7280;">${lead.attributes.COMPANY_NAME}</div>` : ''}
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Unit Price</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right;">${formatCurrency(item.quantity * item.unitPrice)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="totals">
    <div class="total-row">
      <span>Subtotal:</span>
      <span>${formatCurrency(subtotal)}</span>
    </div>
    ${discount > 0 ? `
    <div class="total-row" style="color: #059669;">
      <span>Discount (${discount}%):</span>
      <span>-${formatCurrency(discountAmount)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>Total:</span>
      <span>${formatCurrency(total)}</span>
    </div>
  </div>
  
  ${notes ? `
  <div class="notes">
    <div style="font-weight: 600; margin-bottom: 8px;">Notes</div>
    <div style="white-space: pre-wrap;">${notes}</div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This quote is valid for ${validDays} days from the date of issue.</p>
  </div>
</body>
</html>`;
  };

  const handleSendQuote = async () => {
    if (items.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }

    setIsSending(true);
    try {
      // Generate quote HTML
      const quoteHTML = generateQuoteHTML();
      
      // Open in new window for printing/saving
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(quoteHTML);
        printWindow.document.close();
        toast({ title: 'Quote generated!', description: 'Print or save as PDF' });
      }

      // Also open email with quote summary
      const emailBody = `Hi ${lead.name},\n\nPlease find attached your quote for ${formatCurrency(total)}.\n\nThis quote is valid for ${validDays} days.\n\nPlease let me know if you have any questions.\n\nBest regards`;
      window.location.href = `mailto:${lead.email}?subject=Your Quote from ${companyName}&body=${encodeURIComponent(emailBody)}`;
      
      onOpenChange(false);
    } catch (error) {
      toast({ title: 'Error generating quote', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[520px] sm:max-w-[600px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:document-text-bold" className="w-5 h-5 text-emerald-500" />
            Quick Quote for {lead.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create and send a professional quote in seconds
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Quick Templates */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Quick Start</Label>
            <div className="flex flex-wrap gap-1.5">
              {QUOTE_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(template.id)}
                  className="h-7 text-xs px-2"
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Line Items</Label>
              <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                <Icon icon="solar:add-circle-linear" className="w-3 h-3 mr-1" />
                Add Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg">
                <Icon icon="solar:document-add-linear" className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">No items yet. Add items or use a template.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-start gap-2 p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Item description"
                        className="h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <div className="w-20">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            placeholder="Qty"
                            className="h-8 text-xs"
                            min={1}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="Price"
                            className="h-8 text-xs"
                            min={0}
                          />
                        </div>
                        <div className="w-24 text-right">
                          <span className="text-xs font-medium">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discount & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Discount (%)</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="h-9 text-sm"
                min={0}
                max={100}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Valid For (days)</Label>
              <Select value={validDays} onValueChange={setValidDays}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment terms, special conditions..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* Totals */}
          {items.length > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount ({discount}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-emerald-200 dark:border-emerald-800">
                <span>Total</span>
                <span className="text-emerald-600">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendQuote}
              disabled={isSending || items.length === 0}
              className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700"
            >
              {isSending ? (
                <>
                  <Icon icon="solar:refresh-linear" className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:document-text-bold" className="w-4 h-4 mr-1.5" />
                  Generate & Send Quote
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
