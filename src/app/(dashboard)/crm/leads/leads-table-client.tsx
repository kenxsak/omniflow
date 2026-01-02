"use client";

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { Lead } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeadActionsProvider, useLeadActions } from '@/components/crm/lead-actions-provider';
import { ContactUsageIndicator } from '@/components/crm/contact-usage-indicator';
import { BulkAssignDialog } from '@/components/crm/bulk-assign-dialog';
import { SavedViews } from '@/components/crm/saved-views';
import { Icon } from '@iconify/react';
import { AppointmentDialog } from '@/components/appointments/appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import { createLeadAction, updateLeadAction, bulkDeleteLeadsAction, deleteAllLeadsAction, loadMoreLeadsAction } from '@/app/actions/lead-actions';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const COUNTRY_CODES = [
  { code: '+1', country: 'US/Canada', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
];

const LeadTable = dynamic(() => import('@/components/crm/lead-table'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

interface LeadsTableClientProps {
  initialLeads: Lead[];
  totalLeads: number;
  hasMore: boolean;
  pageSize: number;
  companyId: string;
  planMetadata: {
    planId: string;
    planName: string;
    maxContacts: number | null;
  } | null;
  userRole?: string;
  userId?: string;
}

function LeadsTableInner({ 
  initialLeads, 
  totalLeads: initialTotal,
  hasMore: initialHasMore,
  pageSize,
  companyId, 
  planMetadata, 
  userRole, 
  userId 
}: { 
  initialLeads: Lead[], 
  totalLeads: number,
  hasMore: boolean,
  pageSize: number,
  companyId: string, 
  planMetadata: LeadsTableClientProps['planMetadata'], 
  userRole?: string, 
  userId?: string 
}) {
  const [allLoadedLeads, setAllLoadedLeads] = useState<Lead[]>(initialLeads);
  const [totalLeads, setTotalLeads] = useState(initialTotal);
  const [loadedPages, setLoadedPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+91');
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'unassigned'>('all');
  const [activeViewFilter, setActiveViewFilter] = useState<any>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedLeadForAppointment, setSelectedLeadForAppointment] = useState<Lead | null>(null);
  const { openAddLeadDialog, openEditLeadDialog, openAddToListDialog, handleDeleteLead } = useLeadActions();
  const { toast } = useToast();
  const { appUser } = useAuth();
  const router = useRouter();

  const hasMoreToLoad = allLoadedLeads.length < totalLeads;

  const loadMoreLeads = useCallback(async () => {
    if (isLoadingMore || !userRole || !userId || !hasMoreToLoad) return;
    
    setIsLoadingMore(true);
    try {
      const offset = allLoadedLeads.length;
      const result = await loadMoreLeadsAction(
        companyId,
        offset,
        pageSize,
        userRole as 'superadmin' | 'admin' | 'manager' | 'user',
        userId
      );
      
      setAllLoadedLeads(prev => {
        const existingIds = new Set(prev.map(l => l.id));
        const newLeads = result.leads.filter(l => !existingIds.has(l.id));
        return [...prev, ...newLeads];
      });
      setTotalLeads(result.total);
      setLoadedPages(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load more contacts.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [companyId, pageSize, userRole, userId, isLoadingMore, hasMoreToLoad, allLoadedLeads.length, toast]);

  const handleScheduleAppointment = (lead: Lead) => {
    setSelectedLeadForAppointment(lead);
    setAppointmentDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!appUser?.companyId) {
      toast({ title: "Error", description: "Company context missing", variant: "destructive" });
      if (event.target) event.target.value = '';
      return;
    }
    
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const data = e.target?.result;
      let addedCount = 0;
      let skippedCount = 0;
      
      if (data) {
        try {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
          
          const BATCH_SIZE = 20;
          for (let i = 0; i < jsonData.length; i += BATCH_SIZE) {
            const batch = jsonData.slice(i, i + BATCH_SIZE);
            
            const createPromises = batch.map(async (row) => {
              const name = row['Name'] || row['name'] || row['Full Name'];
              const email = row['Email'] || row['email'];
              let phone = row['Phone'] || row['phone'] || row['Mobile'];
              const company = row['Company'] || row['company'];
              const status = row['Status'] || row['status'] || 'New';
              
              if (phone !== undefined && phone !== null && phone !== '') {
                let phoneStr = String(phone).trim();
                phoneStr = phoneStr.replace(/[\s\-\(\)]/g, '');
                if (!phoneStr.startsWith('+')) {
                  phone = `${defaultCountryCode}${phoneStr}`;
                } else {
                  phone = phoneStr;
                }
              } else {
                phone = undefined;
              }
              
              if (name && email) {
                try {
                  await createLeadAction(companyId, {
                    name: String(name).trim(),
                    email: String(email).toLowerCase().trim(),
                    phone: phone,
                    status: status as any,
                    source: 'CSV Import',
                    notes: company ? `Company: ${company}` : undefined,
                  });
                  return { success: true };
                } catch (error) {
                  return { success: false };
                }
              } else {
                return { success: false };
              }
            });
            
            const results = await Promise.all(createPromises);
            addedCount += results.filter(r => r.success).length;
            skippedCount += results.filter(r => !r.success).length;
          }
          
          toast({ 
            title: "Import Complete", 
            description: `${addedCount} contacts added. ${skippedCount} rows skipped.`,
          });
          
          router.refresh();
        } catch (error) {
          toast({ 
            title: "Upload Failed", 
            description: "Error processing file.", 
            variant: "destructive" 
          });
        }
      }
      
      setIsUploading(false);
      if (event.target) event.target.value = '';
    };
    
    reader.readAsBinaryString(file);
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvContent = `Name,Email,Phone,Company,Status
John Doe,john@example.com,"919876543210",Example Corp,New
Jane Smith,jane@example.com,"918765432109",Sample Inc,Qualified`;
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'OmniFlow_CRM_Contacts_Template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast({ title: "Template Downloaded", description: "Phone may show as 9.19E+11 in Excel - that's OK, imports correctly!" });
    } catch (error) {
      toast({ title: "Download Failed", variant: "destructive" });
    }
  };

  const getFilteredByTab = () => {
    if (userRole === 'user') return allLoadedLeads;
    switch (activeTab) {
      case 'my':
        return allLoadedLeads.filter(lead => lead.assignedTo === userId);
      case 'unassigned':
        return allLoadedLeads.filter(lead => !lead.assignedTo || lead.assignedTo === '_UNASSIGNED_');
      default:
        return allLoadedLeads;
    }
  };

  const tabFilteredLeads = getFilteredByTab();
  
  // Apply saved view filter if active
  const viewFilteredLeads = activeViewFilter 
    ? tabFilteredLeads.filter(lead => {
        // Apply status filter
        if (activeViewFilter.status && activeViewFilter.status.length > 0) {
          if (!activeViewFilter.status.includes(lead.status)) return false;
        }
        // Apply source filter
        if (activeViewFilter.source && activeViewFilter.source.length > 0) {
          if (!activeViewFilter.source.includes(lead.source)) return false;
        }
        // Apply date range filter
        if (activeViewFilter.dateRange) {
          const leadDate = lead.createdAt?.toDate?.() || new Date(lead.createdAt);
          const now = new Date();
          let startDate: Date;
          switch (activeViewFilter.dateRange) {
            case 'today':
              startDate = new Date(now.setHours(0, 0, 0, 0));
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            case 'quarter':
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
              break;
            default:
              startDate = new Date(0);
          }
          if (leadDate < startDate) return false;
        }
        return true;
      })
    : tabFilteredLeads;
  
  const filteredLeads = viewFilteredLeads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectionChange = (leadId: string, isSelected: boolean) => {
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(leadId);
      } else {
        newSet.delete(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedLeadIds(new Set(filteredLeads.map(lead => lead.id)));
    } else {
      setSelectedLeadIds(new Set());
    }
  };

  const handleAddToList = () => {
    openAddToListDialog(selectedLeadIds);
  };

  const handleUpdate = (lead: Lead) => {
    updateLeadAction(lead).then(() => {
      router.refresh();
    });
  };

  const handleBulkDelete = async () => {
    const count = selectedLeadIds.size;
    const confirmed = confirm(`Delete ${count} selected contact${count !== 1 ? 's' : ''}?`);
    
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const leadIdsArray = Array.from(selectedLeadIds);
      const result = await bulkDeleteLeadsAction(leadIdsArray);
      
      toast({
        title: 'Contacts Deleted',
        description: `Successfully deleted ${result?.deletedCount || count} contacts`,
      });
      
      setSelectedLeadIds(new Set());
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete contacts.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = confirm(`Delete ALL ${totalLeads} contacts? This cannot be undone!`);
    if (!confirmed) return;
    
    setIsDeleting(true);
    try {
      const result = await deleteAllLeadsAction(companyId);
      toast({
        title: 'All Contacts Deleted',
        description: `Deleted ${result?.deletedCount || totalLeads} contacts`,
      });
      setSelectedLeadIds(new Set());
      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete contacts.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const myLeadsCount = allLoadedLeads.filter(l => l.assignedTo === userId).length;
  const unassignedCount = allLoadedLeads.filter(l => !l.assignedTo || l.assignedTo === '_UNASSIGNED_').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex justify-between gap-x-8 items-center">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold text-foreground">Contacts</h1>
          </div>
        </div>
      </header>

      {/* Tabs - Clerk Style with semantic colors */}
      {userRole && userRole !== 'user' && (
        <div className="flex items-stretch gap-6 overflow-x-auto pb-px border-b border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setActiveTab('all')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-2 text-sm transition-colors ${
              activeTab === 'all' 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'all' && (
              <span className="absolute left-0 top-full h-0.5 w-full rounded-full" style={{ background: '#3b82f6' }} />
            )}
            All
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-2 text-sm transition-colors ${
              activeTab === 'my' 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'my' && (
              <span className="absolute left-0 top-full h-0.5 w-full rounded-full" style={{ background: '#14b8a6' }} />
            )}
            My Contacts
          </button>
          <button
            onClick={() => setActiveTab('unassigned')}
            className={`relative flex items-center gap-1.5 whitespace-nowrap py-2 text-sm transition-colors ${
              activeTab === 'unassigned' 
                ? 'text-foreground font-medium' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {activeTab === 'unassigned' && (
              <span className="absolute left-0 top-full h-0.5 w-full rounded-full" style={{ background: '#f59e0b' }} />
            )}
            Unassigned
          </button>
        </div>
      )}

      {/* Usage Indicator */}
      {planMetadata && (
        <ContactUsageIndicator
          currentContactCount={totalLeads}
          maxContacts={planMetadata.maxContacts}
          planName={planMetadata.planName}
          compact={true}
        />
      )}

      {/* Saved Views */}
      <SavedViews 
        currentFilters={activeViewFilter || {}}
        onApplyView={(filters) => setActiveViewFilter(Object.keys(filters).length > 0 ? filters : null)}
        companyId={companyId}
      />

      {/* Table Filters Section - Clerk Style */}
      <section>
        <header className="mb-4 flex gap-4 flex-col sm:flex-row sm:items-stretch sm:justify-between">
          <div className="flex flex-grow flex-wrap items-center gap-2">
            {/* Search Input - Clerk Style */}
            <div className="flex-grow sm:max-w-[280px]">
              <div className="flex items-center rounded-md transition bg-white dark:bg-stone-950 ring-1 ring-stone-200 dark:ring-stone-800 shadow-sm hover:ring-stone-300 dark:hover:ring-stone-700 focus-within:ring-2 focus-within:ring-primary">
                <label className="flex items-center self-stretch pl-2.5">
                  <Icon icon="solar:magnifer-linear" className="h-4 w-4 text-muted-foreground" />
                </label>
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full flex-1 self-stretch px-2.5 bg-transparent text-foreground placeholder:text-muted-foreground py-1.5 text-sm outline-none"
                />
              </div>
            </div>

            {/* Import Actions */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
              <Select value={defaultCountryCode} onValueChange={setDefaultCountryCode}>
                <SelectTrigger className="w-[100px] h-8 text-xs shadow-sm px-2.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="min-w-[140px]">
                  {COUNTRY_CODES.map((cc) => (
                    <SelectItem key={cc.code} value={cc.code} className="text-xs">
                      {cc.flag} {cc.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('csv-upload-input')?.click()}
                disabled={isUploading}
                className="h-8 text-xs shadow-sm"
              >
                {isUploading ? (
                  <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon icon="solar:upload-linear" className="h-3.5 w-3.5" />
                )}
              </Button>
              <input 
                type="file" 
                id="csv-upload-input" 
                accept=".csv, .xlsx, .xls" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </div>
          </div>

          {/* Create Button - Blue gradient */}
          <div className="flex-0 sm:ml-auto">
            <Button 
              onClick={openAddLeadDialog}
              className="h-8 px-3 text-sm shadow-sm"
              style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1.5" />
              Create contact
            </Button>
          </div>
        </header>

        {/* Bulk Actions Bar */}
        {selectedLeadIds.size > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <span className="text-sm font-medium" style={{ color: '#3b82f6' }}>{selectedLeadIds.size} selected</span>
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleAddToList} disabled={isDeleting} className="h-7 text-xs">
                <Icon icon="solar:users-group-two-rounded-linear" className="h-3.5 w-3.5 mr-1.5" />
                Add to List
              </Button>
              {userRole && userRole !== 'user' && (
                <Button variant="outline" size="sm" onClick={() => setIsAssignDialogOpen(true)} disabled={isDeleting} className="h-7 text-xs">
                  <Icon icon="solar:user-plus-linear" className="h-3.5 w-3.5 mr-1.5" />
                  Assign
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isDeleting} className="h-7 text-xs">
                {isDeleting ? (
                  <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Icon icon="solar:trash-bin-trash-linear" className="h-3.5 w-3.5 mr-1.5" />
                )}
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLeadIds(new Set())} className="h-7 text-xs">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Lead Table */}
        <LeadTable
          leads={filteredLeads}
          onDeleteLead={handleDeleteLead}
          onUpdateLead={handleUpdate}
          selectedLeadIds={selectedLeadIds}
          onSelectionChange={handleSelectionChange}
          onSelectAll={handleSelectAll}
          onSyncComplete={() => router.refresh()}
          onEditLead={openEditLeadDialog}
          onScheduleAppointment={handleScheduleAppointment}
        />

        {/* Table Footer - Pagination */}
        <footer className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs text-muted-foreground mt-4">
          <div className="flex items-center gap-3">
            <span>{filteredLeads.length === totalLeads ? `1-${filteredLeads.length} of ${totalLeads}` : `${filteredLeads.length} of ${totalLeads}`}</span>
            <span className="h-5 border-r border-stone-300 dark:border-stone-700" />
            <span>Results per page</span>
            <Select defaultValue="50">
              <SelectTrigger className="w-[70px] h-7 text-xs bg-white dark:bg-stone-950 shadow-sm px-2.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" disabled className="h-7 w-7">
              <Icon icon="solar:double-alt-arrow-left-linear" className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="icon" disabled className="h-7 w-7 shadow-sm">
              <Icon icon="solar:alt-arrow-left-linear" className="h-3.5 w-3.5" />
            </Button>
            <span className="mx-2 tabular-nums">
              <span className="text-foreground">1</span>/1
            </span>
            <Button variant="outline" size="icon" disabled={!hasMoreToLoad} onClick={loadMoreLeads} className="h-7 w-7 shadow-sm">
              {isLoadingMore ? (
                <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" disabled className="h-7 w-7">
              <Icon icon="solar:double-alt-arrow-right-linear" className="h-3.5 w-3.5" />
            </Button>
          </div>
        </footer>
      </section>

      <BulkAssignDialog
        isOpen={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        selectedLeadIds={selectedLeadIds}
        companyId={companyId}
        onAssignComplete={() => {
          setSelectedLeadIds(new Set());
          router.refresh();
        }}
      />

      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        contact={selectedLeadForAppointment ? {
          id: selectedLeadForAppointment.id,
          name: selectedLeadForAppointment.name,
          email: selectedLeadForAppointment.email,
          phone: selectedLeadForAppointment.phone
        } : undefined}
        onSuccess={() => {
          setAppointmentDialogOpen(false);
          setSelectedLeadForAppointment(null);
          toast({
            title: 'Appointment Scheduled',
            description: `Appointment with ${selectedLeadForAppointment?.name} has been scheduled.`,
          });
        }}
      />
    </div>
  );
}

export function LeadsTableClient({ 
  initialLeads, 
  totalLeads, 
  hasMore, 
  pageSize, 
  companyId, 
  planMetadata, 
  userRole, 
  userId 
}: LeadsTableClientProps) {
  return (
    <LeadActionsProvider companyId={companyId} leads={initialLeads}>
      <LeadsTableInner 
        initialLeads={initialLeads} 
        totalLeads={totalLeads}
        hasMore={hasMore}
        pageSize={pageSize}
        companyId={companyId} 
        planMetadata={planMetadata} 
        userRole={userRole} 
        userId={userId} 
      />
    </LeadActionsProvider>
  );
}
