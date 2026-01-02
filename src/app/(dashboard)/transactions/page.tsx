'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Search, DollarSign, IndianRupee, CheckCircle2, XCircle, Clock, RefreshCw, Eye, Edit2, CreditCard, Building, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getPaymentTransactions, getTransactionStats, updateTransactionStatus, TransactionWithCompany } from '@/app/actions/payment-transactions-actions';
import StatCard from '@/components/dashboard/stat-card';
import type { PaymentStatus } from '@/types/payment';
import { Animated, AnimatedCounter } from '@/components/ui/animated';
import gsap from 'gsap';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

const formatCurrency = (amount: number, currency: string) => {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const getStatusBadge = (status: PaymentStatus) => {
  switch (status) {
    case 'succeeded':
      return <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
    case 'failed':
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    case 'pending':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
    case 'canceled':
      return <Badge variant="outline"><XCircle className="w-3 h-3 mr-1" /> Canceled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getGatewayBadge = (gateway: 'stripe' | 'razorpay') => {
  if (gateway === 'stripe') {
    return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"><CreditCard className="w-3 h-3 mr-1" /> Stripe</Badge>;
  }
  return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"><CreditCard className="w-3 h-3 mr-1" /> Razorpay</Badge>;
};

export default function TransactionsPage() {
  const { appUser, isSuperAdmin, getIdToken } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [transactions, setTransactions] = useState<TransactionWithCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');
  const [filterGateway, setFilterGateway] = useState<'stripe' | 'razorpay' | 'all'>('all');
  const [stats, setStats] = useState<{ total: number; succeeded: number; failed: number; pending: number; totalRevenue: { USD: number; INR: number } } | null>(null);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithCompany | null>(null);
  const [newStatus, setNewStatus] = useState<PaymentStatus>('pending');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    setIsLoading(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        toast({ title: 'Error', description: 'Authentication failed', variant: 'destructive' });
        return;
      }

      const [transactionsResult, statsResult] = await Promise.all([
        getPaymentTransactions({ 
          idToken, 
          status: filterStatus,
          gateway: filterGateway,
          searchTerm: searchTerm || undefined
        }),
        getTransactionStats({ idToken })
      ]);

      if (transactionsResult.success && transactionsResult.transactions) {
        setTransactions(transactionsResult.transactions);
      }

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast({ title: 'Error', description: 'Failed to load transactions', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [isSuperAdmin, getIdToken, filterStatus, filterGateway, searchTerm, toast]);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [isSuperAdmin, router, loadData]);

  const handleUpdateStatus = async () => {
    if (!selectedTransaction) return;
    
    setIsUpdating(true);
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        toast({ title: 'Error', description: 'Authentication failed', variant: 'destructive' });
        return;
      }

      const result = await updateTransactionStatus({
        idToken,
        transactionId: selectedTransaction.id,
        newStatus,
        notes: reviewNotes
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Transaction status updated successfully' });
        setEditDialogOpen(false);
        setSelectedTransaction(null);
        setReviewNotes('');
        loadData();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update status', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditDialog = (transaction: TransactionWithCompany) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status);
    setReviewNotes('');
    setEditDialogOpen(true);
  };

  const statsRef = useRef<HTMLDivElement>(null);

  // GSAP animation for stats - instant
  useEffect(() => {
    if (statsRef.current && stats) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 10, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, stagger: 0, ease: 'power2.out' }
      );
    }
  }, [stats]);

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <Animated animation="fadeUp">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Payment Transactions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all payment transactions across all companies.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            <CreditCard className="w-3 h-3 mr-1" />
            Super Admin
          </Badge>
        </div>
      </Animated>

      {stats && (
        <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="stat-card group hover:shadow-lg transition-all duration-300 hover:border-blue-500/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Total</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                <AnimatedCounter value={stats.total} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card group hover:shadow-lg transition-all duration-300 hover:border-green-500/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Success</span>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-success">
                <AnimatedCounter value={stats.succeeded} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card group hover:shadow-lg transition-all duration-300 hover:border-destructive/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Failed</span>
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-destructive" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                <AnimatedCounter value={stats.failed} />
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card group hover:shadow-lg transition-all duration-300 hover:border-indigo-500/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">USD</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400 truncate">
                {formatCurrency(stats.totalRevenue.USD, 'USD')}
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card group hover:shadow-lg transition-all duration-300 hover:border-teal-500/50 col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-muted-foreground">INR</span>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-teal-600 dark:text-teal-400 truncate">
                {formatCurrency(stats.totalRevenue.INR, 'INR')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Animated animation="fadeUp">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">All Transactions</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              View all payment transactions from Stripe (global) and Razorpay (India).
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by company, email, or transaction ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 sm:h-11"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as PaymentStatus | 'all')}>
                  <SelectTrigger className="w-full xs:w-[130px] h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterGateway} onValueChange={(v) => setFilterGateway(v as 'stripe' | 'razorpay' | 'all')}>
                  <SelectTrigger className="w-full xs:w-[130px] h-9 sm:h-10 text-xs sm:text-sm">
                    <SelectValue placeholder="Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="razorpay">Razorpay</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={loadData} 
                  disabled={isLoading}
                  size="sm"
                  className="h-9 sm:h-10 flex-shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">Refresh</span>
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col justify-center items-center h-48 gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">Loading transactions...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 opacity-50" />
                </div>
                <p className="font-medium">No transactions found</p>
                <p className="text-sm mt-1">Transactions will appear here once customers make payments.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block lg:hidden space-y-3">
                  {transactions.map((transaction) => (
                    <Card key={transaction.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{transaction.companyName}</p>
                            <p className="text-xs text-muted-foreground truncate">{transaction.companyEmail}</p>
                          </div>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-xs mb-3">
                          <div>
                            <span className="text-muted-foreground">Amount</span>
                            <p className="font-semibold">{formatCurrency(transaction.amount, transaction.currency)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Gateway</span>
                            <div className="mt-0.5">{getGatewayBadge(transaction.gateway)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Plan</span>
                            <p className="font-medium truncate">{transaction.planName || transaction.description}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Date</span>
                            <p className="font-medium">{transaction.createdAt ? format(new Date(transaction.createdAt), 'PP') : 'N/A'}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(transaction)}
                          className="w-full"
                        >
                          <Edit2 className="h-4 w-4 mr-1.5" />
                          Review Transaction
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id} className="hover:bg-muted/50">
                          <TableCell className="whitespace-nowrap text-sm">
                            {transaction.createdAt ? format(new Date(transaction.createdAt), 'PP p') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{transaction.companyName}</p>
                              <p className="text-xs text-muted-foreground">{transaction.companyEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>{getGatewayBadge(transaction.gateway)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </TableCell>
                          <TableCell className="text-sm">{transaction.planName || transaction.description}</TableCell>
                          <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {transaction.gatewayTransactionId?.slice(0, 20)}...
                            </code>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(transaction)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Animated>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Review Transaction</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review and update transaction status if needed.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Company</p>
                  <p className="text-xs sm:text-sm font-medium truncate">{selectedTransaction.companyName}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Amount</p>
                  <p className="text-xs sm:text-sm font-medium">{formatCurrency(selectedTransaction.amount, selectedTransaction.currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Gateway</p>
                  <p className="text-xs sm:text-sm font-medium capitalize">{selectedTransaction.gateway}</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Transaction ID</p>
                  <code className="text-[10px] sm:text-xs break-all">{selectedTransaction.gatewayTransactionId}</code>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Update Status</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as PaymentStatus)}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="succeeded">Succeeded</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Review Notes (Optional)</Label>
                <Textarea 
                  placeholder="Add notes..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="min-h-[70px] sm:min-h-[80px] text-sm resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isUpdating} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="transactions" />
    </div>
  );
}
