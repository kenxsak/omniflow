"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/contexts/currency-context';
import { getInvoicesAction, getInvoiceStatsAction, deleteInvoiceAction, sendInvoiceAction, createPaymentLinkAction, getRecurringInvoicesAction, updateRecurringInvoiceAction, deleteRecurringInvoiceAction } from '@/app/actions/invoice-actions';
import { CreateInvoiceDialog } from '@/components/invoices/create-invoice-dialog';
import { RecordPaymentDialog } from '@/components/invoices/record-payment-dialog';
import { CreateRecurringInvoiceDialog } from '@/components/invoices/create-recurring-invoice-dialog';
import type { Invoice, InvoiceStatus, InvoiceStats, RecurringInvoice, RecurringFrequency } from '@/types/invoice';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300', icon: 'solar:document-linear' },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: 'solar:letter-linear' },
  viewed: { label: 'Viewed', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: 'solar:eye-linear' },
  paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'solar:check-circle-linear' },
  partial: { label: 'Partial', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: 'solar:pie-chart-2-linear' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: 'solar:alarm-linear' },
  cancelled: { label: 'Cancelled', color: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-500', icon: 'solar:close-circle-linear' },
};

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRecurringDialog, setShowRecurringDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices');
  
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();

  const loadData = async () => {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [invoicesResult, statsResult, recurringResult] = await Promise.all([
        getInvoicesAction({ idToken: appUser.idToken }),
        getInvoiceStatsAction({ idToken: appUser.idToken }),
        getRecurringInvoicesAction({ idToken: appUser.idToken }),
      ]);
      
      if (invoicesResult.success && invoicesResult.invoices) {
        setInvoices(invoicesResult.invoices);
      }
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
      if (recurringResult.success && recurringResult.recurring) {
        setRecurringInvoices(recurringResult.recurring);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast({ title: 'Failed to load invoices', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appUser?.idToken]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = !searchQuery || 
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (invoice: Invoice) => {
    if (!appUser?.idToken) return;
    if (!confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    
    const result = await deleteInvoiceAction({ idToken: appUser.idToken, invoiceId: invoice.id });
    if (result.success) {
      toast({ title: 'Invoice deleted' });
      loadData();
    } else {
      toast({ title: result.error || 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleSend = async (invoice: Invoice, method: 'email' | 'whatsapp') => {
    if (!appUser?.idToken) return;
    
    const result = await sendInvoiceAction({ idToken: appUser.idToken, invoiceId: invoice.id, method });
    if (result.success) {
      toast({ title: `Invoice marked as sent` });
      loadData();
      
      // Open email/whatsapp
      const companyName = 'Your Business'; // Would come from context
      if (method === 'email') {
        const subject = `Invoice ${invoice.invoiceNumber} from ${companyName}`;
        const body = `Hi ${invoice.clientName},\n\nPlease find your invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total)}.\n\nView and pay online: ${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}\n\nThank you!`;
        window.location.href = `mailto:${invoice.clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      } else if (method === 'whatsapp' && invoice.clientPhone) {
        const message = `Hi ${invoice.clientName}! 👋\n\nYour invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.total)} is ready.\n\nView & Pay: ${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}`;
        window.open(`https://wa.me/${invoice.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }
    } else {
      toast({ title: result.error || 'Failed to send', variant: 'destructive' });
    }
  };

  const handleCopyLink = async (invoice: Invoice) => {
    if (!appUser?.idToken) return;
    
    let link = invoice.paymentLink;
    if (!link) {
      const result = await createPaymentLinkAction({ idToken: appUser.idToken, invoiceId: invoice.id });
      if (result.success && result.paymentLink) {
        link = result.paymentLink;
        loadData();
      }
    }
    
    if (link) {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Payment link copied!' });
    } else {
      // Fallback to invoice view link
      const viewLink = `${window.location.origin}/invoice/${invoice.id}`;
      await navigator.clipboard.writeText(viewLink);
      toast({ title: 'Invoice link copied!' });
    }
  };

  const handleToggleRecurring = async (recurring: RecurringInvoice) => {
    if (!appUser?.idToken) return;
    
    const result = await updateRecurringInvoiceAction({
      idToken: appUser.idToken,
      recurringId: recurring.id,
      updates: { isActive: !recurring.isActive },
    });
    
    if (result.success) {
      toast({ title: recurring.isActive ? 'Recurring paused' : 'Recurring activated' });
      loadData();
    } else {
      toast({ title: result.error || 'Failed to update', variant: 'destructive' });
    }
  };

  const handleDeleteRecurring = async (recurring: RecurringInvoice) => {
    if (!appUser?.idToken) return;
    if (!confirm(`Delete recurring invoice for ${recurring.clientName}?`)) return;
    
    const result = await deleteRecurringInvoiceAction({
      idToken: appUser.idToken,
      recurringId: recurring.id,
    });
    
    if (result.success) {
      toast({ title: 'Recurring invoice deleted' });
      loadData();
    } else {
      toast({ title: result.error || 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Invoices</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Create, send, and track invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowRecurringDialog(true)} className="h-9 sm:h-10 text-xs sm:text-sm">
            <Icon icon="solar:refresh-circle-bold" className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Recurring</span>
          </Button>
          <Button onClick={() => setShowCreateDialog(true)} className="h-9 sm:h-10">
            <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-1.5" />
            New Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <Icon icon="solar:wallet-money-bold" className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">This Month</p>
                <p className="text-sm sm:text-lg font-bold text-emerald-600">{formatCurrency(stats.thisMonth)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Icon icon="solar:clock-circle-bold" className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Outstanding</p>
                <p className="text-sm sm:text-lg font-bold text-amber-600">{formatCurrency(stats.totalOutstanding)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Icon icon="solar:danger-triangle-bold" className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Overdue</p>
                <p className="text-sm sm:text-lg font-bold text-red-600">{stats.overdue}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Icon icon="solar:document-bold" className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                <p className="text-sm sm:text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-9 w-full sm:w-auto">
          <TabsTrigger value="invoices" className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Icon icon="solar:document-linear" className="w-4 h-4 mr-1.5" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="recurring" className="text-xs sm:text-sm flex-1 sm:flex-none">
            <Icon icon="solar:refresh-circle-linear" className="w-4 h-4 mr-1.5" />
            Recurring
            {recurringInvoices.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{recurringInvoices.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon icon="solar:spinner-bold" className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-8 sm:p-12 text-center">
          <Icon icon="solar:document-add-linear" className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-base font-medium mb-1">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first invoice to start getting paid</p>
          <Button onClick={() => setShowCreateDialog(true)} size="sm">
            <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-1.5" />
            Create Invoice
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredInvoices.map((invoice) => {
            const statusConfig = STATUS_CONFIG[invoice.status];
            const isOverdue = invoice.status !== 'paid' && invoice.status !== 'cancelled' && new Date(invoice.dueDate) < new Date();
            
            return (
              <Card key={invoice.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-medium text-foreground">{invoice.invoiceNumber}</span>
                      <Badge className={`text-[10px] ${statusConfig.color}`}>
                        <Icon icon={statusConfig.icon} className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                      {isOverdue && invoice.status !== 'overdue' && (
                        <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1 truncate text-foreground">{invoice.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{invoice.clientEmail}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}</span>
                      {invoice.amountPaid > 0 && invoice.status !== 'paid' && (
                        <span className="text-emerald-600 dark:text-emerald-400">Paid: {formatCurrency(invoice.amountPaid)}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(invoice.total)}</p>
                    {invoice.amountDue > 0 && invoice.amountDue !== invoice.total && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">Due: {formatCurrency(invoice.amountDue)}</p>
                    )}
                  </div>
                </div>
                
                {/* Quick Actions - Mobile friendly */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs flex-1 sm:flex-none"
                    onClick={() => window.open(`/invoice/${invoice.id}`, '_blank')}
                  >
                    <Icon icon="solar:eye-linear" className="w-3.5 h-3.5 mr-1" />
                    View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs flex-1 sm:flex-none"
                    onClick={() => handleSend(invoice, 'email')}
                  >
                    <Icon icon="solar:letter-linear" className="w-3.5 h-3.5 mr-1" />
                    Email
                  </Button>
                  {invoice.clientPhone && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs flex-1 sm:flex-none text-green-600 dark:text-green-400 border-green-200 dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={() => handleSend(invoice, 'whatsapp')}
                    >
                      <Icon icon="logos:whatsapp-icon" className="w-3.5 h-3.5 mr-1" />
                      <span className="hidden sm:inline">WhatsApp</span>
                      <span className="sm:hidden">WA</span>
                    </Button>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-auto">
                        <Icon icon="solar:menu-dots-bold" className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleCopyLink(invoice)}>
                        <Icon icon="solar:link-linear" className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setSelectedInvoice(invoice); setShowPaymentDialog(true); }}>
                            <Icon icon="solar:wallet-money-linear" className="w-4 h-4 mr-2" />
                            Record Payment
                          </DropdownMenuItem>
                        </>
                      )}
                      {invoice.status === 'draft' && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDelete(invoice)} className="text-red-600 dark:text-red-400">
                            <Icon icon="solar:trash-bin-2-linear" className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            );
          })}
        </div>
      )}
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring" className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="solar:spinner-bold" className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : recurringInvoices.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Icon icon="solar:refresh-circle-linear" className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-medium mb-1">No recurring invoices</h3>
              <p className="text-sm text-muted-foreground mb-4">Set up automatic invoicing for regular clients</p>
              <Button onClick={() => setShowRecurringDialog(true)} size="sm">
                <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-1.5" />
                Create Recurring
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {recurringInvoices.map((recurring) => {
                const total = recurring.items.reduce((sum, item) => {
                  const base = item.quantity * item.unitPrice;
                  const tax = recurring.gstEnabled ? base * 0.18 : 0;
                  return sum + base + tax;
                }, 0);
                
                return (
                  <Card key={recurring.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{recurring.clientName}</span>
                          <Badge className={`text-[10px] ${recurring.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-500'}`}>
                            <Icon icon={recurring.isActive ? 'solar:play-circle-linear' : 'solar:pause-circle-linear'} className="w-3 h-3 mr-1" />
                            {recurring.isActive ? 'Active' : 'Paused'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {FREQUENCY_LABELS[recurring.frequency]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">{recurring.clientEmail}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>Next: {format(new Date(recurring.nextInvoiceDate), 'MMM d, yyyy')}</span>
                          <span>Generated: {recurring.totalGenerated}</span>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <p className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                        <p className="text-[10px] text-muted-foreground">per {recurring.frequency.replace('ly', '')}</p>
                      </div>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs flex-1 sm:flex-none"
                        onClick={() => handleToggleRecurring(recurring)}
                      >
                        <Icon icon={recurring.isActive ? 'solar:pause-circle-linear' : 'solar:play-circle-linear'} className="w-3.5 h-3.5 mr-1" />
                        {recurring.isActive ? 'Pause' : 'Activate'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs flex-1 sm:flex-none text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleDeleteRecurring(recurring)}
                      >
                        <Icon icon="solar:trash-bin-2-linear" className="w-3.5 h-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateInvoiceDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={() => { loadData(); setShowCreateDialog(false); }}
      />
      
      <CreateRecurringInvoiceDialog
        open={showRecurringDialog}
        onOpenChange={setShowRecurringDialog}
        onSuccess={() => { loadData(); setShowRecurringDialog(false); }}
      />
      
      {selectedInvoice && (
        <RecordPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          invoice={selectedInvoice}
          onSuccess={() => { loadData(); setShowPaymentDialog(false); setSelectedInvoice(null); }}
        />
      )}
    </div>
  );
}
