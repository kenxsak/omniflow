"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { createInvoiceAction, getInvoiceSettingsAction } from '@/app/actions/invoice-actions';
import type { InvoiceSettings } from '@/types/invoice';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefillClient?: {
    id?: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '19', name: 'West Bengal' },
  { code: '21', name: 'Odisha' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

export function CreateInvoiceDialog({ open, onOpenChange, onSuccess, prefillClient }: CreateInvoiceDialogProps) {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Client info
  const [clientName, setClientName] = useState(prefillClient?.name || '');
  const [clientEmail, setClientEmail] = useState(prefillClient?.email || '');
  const [clientPhone, setClientPhone] = useState(prefillClient?.phone || '');
  const [clientGstin, setClientGstin] = useState('');
  
  // Invoice details
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // GST
  const [gstEnabled, setGstEnabled] = useState(false);
  const [placeOfSupply, setPlaceOfSupply] = useState('');
  
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (open && appUser?.idToken) {
      loadSettings();
    }
  }, [open, appUser?.idToken]);

  useEffect(() => {
    if (prefillClient) {
      setClientName(prefillClient.name);
      setClientEmail(prefillClient.email);
      setClientPhone(prefillClient.phone || '');
    }
  }, [prefillClient]);

  const loadSettings = async () => {
    if (!appUser?.idToken) return;
    setIsLoading(true);
    try {
      const result = await getInvoiceSettingsAction({ idToken: appUser.idToken });
      if (result.success && result.settings) {
        setSettings(result.settings);
        setGstEnabled(result.settings.gstEnabled);
        setNotes(result.settings.defaultNotes || '');
        
        // Set default due date
        const due = new Date();
        due.setDate(due.getDate() + (result.settings.defaultDueDays || 30));
        setDueDate(due.toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, {
      id: `item_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: settings?.defaultTaxRate || 18,
    }]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = gstEnabled ? items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPrice;
    return sum + (itemTotal * (item.taxRate / 100));
  }, 0) : 0;
  const total = afterDiscount + taxAmount;

  const handleSubmit = async () => {
    if (!appUser?.idToken) return;
    
    if (!clientName || !clientEmail) {
      toast({ title: 'Client name and email required', variant: 'destructive' });
      return;
    }
    
    if (items.length === 0) {
      toast({ title: 'Add at least one item', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      const result = await createInvoiceAction({
        idToken: appUser.idToken,
        invoice: {
          clientId: prefillClient?.id,
          clientName,
          clientEmail,
          clientPhone: clientPhone || undefined,
          clientGstin: clientGstin || undefined,
          dueDate: dueDate || undefined,
          items: items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: gstEnabled ? item.taxRate : undefined,
          })),
          discountPercent: discount || undefined,
          gstEnabled,
          placeOfSupply: gstEnabled ? placeOfSupply : undefined,
          notes: notes || undefined,
        },
      });
      
      if (result.success) {
        toast({ title: `Invoice ${result.invoiceNumber} created!` });
        // Reset form
        setClientName('');
        setClientEmail('');
        setClientPhone('');
        setClientGstin('');
        setItems([]);
        setDiscount(0);
        onSuccess();
      } else {
        toast({ title: result.error || 'Failed to create invoice', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({ title: 'Failed to create invoice', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[520px] sm:max-w-[600px] p-0 rounded-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-4 sm:p-5 pb-0 space-y-1">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:document-add-bold" className="w-5 h-5 text-emerald-500" />
            Create Invoice
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Create a professional invoice with GST support
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Icon icon="solar:spinner-bold" className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <>
              {/* Client Info */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">Client Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Client name"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="client@email.com"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* GST Toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:document-medicine-bold" className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Enable GST</p>
                    <p className="text-xs text-muted-foreground">Add CGST/SGST or IGST to invoice</p>
                  </div>
                </div>
                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
              </div>

              {/* GST Details */}
              {gstEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Client GSTIN</Label>
                    <Input
                      value={clientGstin}
                      onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                      placeholder="22AAAAA0000A1Z5"
                      className="h-9 text-sm font-mono"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Place of Supply</Label>
                    <Select value={placeOfSupply} onValueChange={setPlaceOfSupply}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDIAN_STATES.map(state => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.code} - {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Line Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-foreground">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">
                    <Icon icon="solar:add-circle-linear" className="w-3 h-3 mr-1" />
                    Add Item
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/30">
                    <Icon icon="solar:box-linear" className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-xs text-muted-foreground">No items yet. Click "Add Item" to start.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="p-2.5 bg-muted/50 dark:bg-muted/30 rounded-lg space-y-2 border border-border/50">
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="h-8 text-xs bg-background"
                        />
                        <div className="flex gap-2 items-center">
                          <div className="w-16">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                              placeholder="Qty"
                              className="h-8 text-xs bg-background"
                              min={1}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                              placeholder="Price"
                              className="h-8 text-xs bg-background"
                              min={0}
                            />
                          </div>
                          {gstEnabled && (
                            <div className="w-20">
                              <Select 
                                value={String(item.taxRate)} 
                                onValueChange={(v) => updateItem(item.id, 'taxRate', parseInt(v))}
                              >
                                <SelectTrigger className="h-8 text-xs bg-background">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="12">12%</SelectItem>
                                  <SelectItem value="18">18%</SelectItem>
                                  <SelectItem value="28">28%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <span className="text-xs font-medium w-20 text-right text-foreground">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount */}
              <div className="space-y-1.5">
                <Label className="text-xs">Discount (%)</Label>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="h-9 text-sm w-24"
                  min={0}
                  max={100}
                />
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, bank details..."
                  className="min-h-[60px] text-sm resize-none"
                />
              </div>

              {/* Totals */}
              {items.length > 0 && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg space-y-1.5">
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
                  {gstEnabled && taxAmount > 0 && (
                    <div className="flex justify-between text-xs text-blue-600">
                      <span>GST</span>
                      <span>+{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-emerald-200 dark:border-emerald-800">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 pt-3 border-t bg-muted/30">
          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving || items.length === 0 || !clientName || !clientEmail}
              className="w-full sm:flex-1 h-9 text-sm"
            >
              {isSaving ? (
                <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Icon icon="solar:document-add-bold" className="w-4 h-4 mr-1.5" />
              )}
              Create Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
