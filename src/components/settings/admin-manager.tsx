
"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllAdminsAndCompanies, updateCompanyPlanExpiry, updateCompanyStatus, deleteCompanyAndUsers, updateCompanyPlan, updateCompanyBillingCycle } from '@/lib/saas-data';
import type { AppUser, Company, Plan } from '@/types/saas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { getStoredPlans } from '@/lib/saas-data';
import { format, addMonths, addYears, endOfMonth, isWithinInterval, isBefore, differenceInDays } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, LogIn, Mail, Phone, MessageCircle, Calendar as CalendarIcon, Trash2, PauseCircle, PlayCircle, Search, Award, Check, CalendarClock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface AdminData {
  admin: AppUser;
  company: Company;
}

export default function AdminManager() {
  const [data, setData] = useState<AdminData[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const { startImpersonation } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'paused', 'expiring'
  const [customDateDialogOpen, setCustomDateDialogOpen] = useState(false);
  const [selectedCompanyForDate, setSelectedCompanyForDate] = useState<{ id: string; name: string } | null>(null);
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  const loadData = useCallback(() => {
    const loadAsync = async () => {
      const adminData = await getAllAdminsAndCompanies();
      setData(adminData);
      const storedPlans = await getStoredPlans();
      setPlans(storedPlans);
    };
    loadAsync();
  }, []);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'omniFlowSaasUsers' || event.key === 'omniFlowSaasCompanies' || event.key === 'omniFlowSaasPlans') {
            loadData();
        }
    };
    // Note: Firestore live updates would be better here in a real app
  }, [loadData]);
  
  const filteredData = useMemo(() => {
    const now = new Date();
    const endOfThisMonth = endOfMonth(now);
    return data
      .filter(item => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return item.company.status === 'active';
        if (filterStatus === 'paused') return item.company.status === 'paused';
        if (filterStatus === 'expiring') {
          return item.company.planExpiresAt && isWithinInterval(new Date(item.company.planExpiresAt), { start: now, end: endOfThisMonth });
        }
        return true;
      })
      .filter(item => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        return (
          item.admin.email.toLowerCase().includes(term) ||
          item.company.name.toLowerCase().includes(term)
        );
      });
  }, [data, searchTerm, filterStatus]);

  const getPlanName = (planId: string) => plans.find(p => p.id === planId)?.name || 'N/A';

  const handleImpersonate = (user: AppUser) => {
    startImpersonation(user);
    toast({ title: `Impersonating ${user.email}`, description: 'Redirecting to dashboard...' });
    router.push('/dashboard');
  };
  
  const handleExtend = async (companyId: string, duration: { months?: number; years?: number }) => {
    const companyToUpdate = data.find(d => d.company.id === companyId)?.company;
    if (!companyToUpdate) return;

    let currentExpiry = new Date(companyToUpdate.planExpiresAt);
    // If plan has expired, extend from today, otherwise from the expiry date
    if (isBefore(currentExpiry, new Date())) {
        currentExpiry = new Date();
    }
    
    let newExpiryDate: Date;

    if (duration.months) {
        newExpiryDate = addMonths(currentExpiry, duration.months);
    } else if (duration.years) {
        newExpiryDate = addYears(currentExpiry, duration.years);
    } else {
        return;
    }
    
    await updateCompanyPlanExpiry(companyId, newExpiryDate);
    toast({ title: "Subscription Extended", description: `Plan for ${companyToUpdate.name} extended.` });
    loadData();
  };

  const handleChangePlan = async (companyId: string, companyName: string, newPlanId: string, newPlanName: string) => {
    await updateCompanyPlan(companyId, newPlanId);
    toast({ title: "Plan Changed", description: `Plan for ${companyName} has been changed to ${newPlanName}.` });
    loadData();
  };

  const handleStatusToggle = async (companyId: string, companyName: string, currentStatus: 'active' | 'paused' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    await updateCompanyStatus(companyId, newStatus);
    toast({ title: `Company ${newStatus === 'active' ? 'Activated' : 'Paused'}`, description: `The status for ${companyName} has been updated.` });
    loadData();
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    await deleteCompanyAndUsers(companyId);
    toast({ title: "Company Deleted", description: `The company "${companyName}" and all its users have been removed.`, variant: "destructive" });
    loadData();
  };

  const handleOpenCustomDateDialog = (companyId: string, companyName: string, currentExpiryDate?: string) => {
    setSelectedCompanyForDate({ id: companyId, name: companyName });
    setCustomDate(currentExpiryDate ? new Date(currentExpiryDate) : new Date());
    setCustomDateDialogOpen(true);
  };

  const handleSaveCustomDate = async () => {
    if (!selectedCompanyForDate || !customDate) return;
    
    await updateCompanyPlanExpiry(selectedCompanyForDate.id, customDate);
    toast({ 
      title: "Expiry Date Updated", 
      description: `Plan expiry for ${selectedCompanyForDate.name} set to ${format(customDate, 'PPP')}.` 
    });
    setCustomDateDialogOpen(false);
    setSelectedCompanyForDate(null);
    setCustomDate(undefined);
    loadData();
  };

  const handleChangeBillingCycle = async (companyId: string, companyName: string, newBillingCycle: 'monthly' | 'yearly', planId: string) => {
    const plan = plans.find(p => p.id === planId);
    const discount = plan?.yearlyDiscountPercentage || 0;
    
    try {
      await updateCompanyBillingCycle(companyId, newBillingCycle);
      
      const cycleText = newBillingCycle === 'yearly' 
        ? `Yearly (${discount}% discount)` 
        : 'Monthly';
      
      toast({ 
        title: "Billing Cycle Updated", 
        description: `Billing cycle for ${companyName} changed to ${cycleText}.` 
      });
      loadData();
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: `Failed to update billing cycle for ${companyName}.`,
        variant: "destructive"
      });
    }
  };


  // Render action menu for a company (reusable for both mobile and desktop)
  const renderActionMenu = (admin: AppUser, company: Company) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Manage Account</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => handleImpersonate(admin)}>
          <LogIn className="mr-2 h-4 w-4" /> Login as Admin
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Account Control</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => handleStatusToggle(company.id, company.name, company.status)}>
          {company.status === 'active' ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
          {company.status === 'active' ? 'Pause Account' : 'Activate Account'}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Extend Subscription</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={() => handleExtend(company.id, { months: 1 })}>Extend 1 Month</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExtend(company.id, { months: 3 })}>Extend 3 Months</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleExtend(company.id, { years: 1 })}>Extend 1 Year</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleOpenCustomDateDialog(company.id, company.name, company.planExpiresAt)}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Set Custom Date
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Award className="mr-2 h-4 w-4" />
            <span>Change Plan</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {plans.map(plan => (
              <DropdownMenuItem
                key={plan.id}
                disabled={company.planId === plan.id}
                onSelect={() => handleChangePlan(company.id, company.name, plan.id, plan.name)}
              >
                {plan.name}
                {company.planId === plan.id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Billing Cycle</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem
              disabled={company.billingCycle === 'monthly'}
              onSelect={() => handleChangeBillingCycle(company.id, company.name, 'monthly', company.planId)}
            >
              Monthly
              {company.billingCycle === 'monthly' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={company.billingCycle === 'yearly'}
              onSelect={() => handleChangeBillingCycle(company.id, company.name, 'yearly', company.planId)}
            >
              Yearly
              {(() => {
                const plan = plans.find(p => p.id === company.planId);
                const discount = plan?.yearlyDiscountPercentage;
                return discount ? (
                  <span className="ml-1 text-xs text-success">({discount}% off)</span>
                ) : null;
              })()}
              {company.billingCycle === 'yearly' && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Company
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">This will permanently delete the company "{company.name}" and all its users. This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto h-9 sm:h-10">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleDeleteCompany(company.id, company.name)} className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto h-9 sm:h-10")}>Delete Company</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Contact Admin</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={`mailto:${admin.email}`}><Mail className="mr-2 h-4 w-4" /> Email Admin</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!admin.phone}>
          <a href={`tel:${admin.phone}`}><Phone className="mr-2 h-4 w-4" /> Call Admin</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild disabled={!admin.phone}>
          <a href={`https://api.whatsapp.com/send?phone=${admin.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Admin
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <Card>
      <CardHeader className="p-3 sm:p-4 lg:p-6">
        <CardTitle className="text-sm sm:text-base">Admin & Company Management</CardTitle>
        <CardDescription className="text-[10px] sm:text-xs">Manage all admin users and their company details.</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
        {/* Filters - Mobile First */}
        <div className="flex flex-col gap-2 mb-3 sm:mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <Input
              placeholder="Search Admin or Company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9 sm:h-10 text-xs sm:text-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="expiring">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-2">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No companies found</p>
            </div>
          ) : (
            filteredData.map(({ admin, company }) => {
              const expiryDate = company.planExpiresAt ? new Date(company.planExpiresAt) : null;
              let expiryClass = "text-muted-foreground";
              if (expiryDate) {
                if (isBefore(expiryDate, new Date())) {
                  expiryClass = "text-destructive font-semibold";
                } else if (differenceInDays(expiryDate, new Date()) <= 30) {
                  expiryClass = "text-orange-500 font-semibold";
                }
              }
              return (
                <div key={admin.uid} className="p-3 rounded-lg border border-stone-200 dark:border-stone-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{company.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{admin.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={company.status === 'active' ? 'success' : 'warning'} className="text-[9px] px-1.5 py-0">
                        {company.status}
                      </Badge>
                      {renderActionMenu(admin, company)}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-muted-foreground">Plan</p>
                      <p className="text-[10px] font-medium truncate">{getPlanName(company.planId)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Billing</p>
                      <p className="text-[10px] font-medium capitalize">
                        {company.billingCycle}
                        {company.billingCycle === 'yearly' && (() => {
                          const plan = plans.find(p => p.id === company.planId);
                          const discount = plan?.yearlyDiscountPercentage;
                          return discount ? <span className="text-success ml-0.5">-{discount}%</span> : null;
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground">Expires</p>
                      <p className={cn("text-[10px] font-medium", expiryClass)}>
                        {company.planExpiresAt ? format(new Date(company.planExpiresAt), 'MMM d') : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Admin Email</TableHead>
                <TableHead className="text-xs">Company</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <TableHead className="text-xs">Billing Cycle</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Expires On</TableHead>
                <TableHead className="text-right text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map(({ admin, company }) => {
                  const expiryDate = company.planExpiresAt ? new Date(company.planExpiresAt) : null;
                  let expiryClass = "";
                  if (expiryDate) {
                    if (isBefore(expiryDate, new Date())) {
                      expiryClass = "text-destructive font-semibold";
                    } else if (differenceInDays(expiryDate, new Date()) <= 30) {
                      expiryClass = "text-orange-500 font-semibold";
                    }
                  }
                  return (
                    <TableRow key={admin.uid}>
                      <TableCell className="font-medium text-sm">{admin.email}</TableCell>
                      <TableCell className="text-sm">{company.name}</TableCell>
                      <TableCell className="text-sm">{getPlanName(company.planId)}</TableCell>
                      <TableCell className="capitalize text-sm">
                        {company.billingCycle}
                        {company.billingCycle === 'yearly' && (() => {
                          const plan = plans.find(p => p.id === company.planId);
                          const discount = plan?.yearlyDiscountPercentage;
                          return discount ? (
                            <span className="ml-1 text-xs text-success font-semibold">({discount}% off)</span>
                          ) : null;
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={company.status === 'active' ? 'success' : 'warning'}>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={cn(expiryClass, "text-sm")}>
                        {company.planExpiresAt ? format(new Date(company.planExpiresAt), 'PP') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderActionMenu(admin, company)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Custom Date Picker Dialog - Mobile First */}
      <Dialog open={customDateDialogOpen} onOpenChange={setCustomDateDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[380px] sm:max-w-[420px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Set Custom Expiry Date</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Select expiry date for {selectedCompanyForDate?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-2 sm:py-4">
            <Calendar
              mode="single"
              selected={customDate}
              onSelect={setCustomDate}
              className="rounded-md border"
            />
          </div>
          {customDate && (
            <div className="text-xs sm:text-sm text-center text-muted-foreground">
              Selected: <span className="font-semibold">{format(customDate, 'PPP')}</span>
            </div>
          )}
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 sm:pt-4">
            <Button variant="outline" onClick={() => setCustomDateDialogOpen(false)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
              Cancel
            </Button>
            <Button onClick={handleSaveCustomDate} disabled={!customDate} className="w-full sm:w-auto h-9 sm:h-10 text-sm">
              Save Date
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
