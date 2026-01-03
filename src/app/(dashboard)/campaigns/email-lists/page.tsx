"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { getEmailLists, addEmailList, deleteEmailList, getEmailContacts, addEmailContact, deleteEmailContact, bulkImportEmailContacts, getListTypeLabel, getListTypeColor } from '@/lib/email-list-data';
import type { EmailList, EmailContact, EmailListType } from '@/types/email-lists';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useCompanyApiKeys } from '@/hooks/use-company-api-keys';
import { fetchBrevoListsAction } from '@/actions/brevo-subscribers';
import { fetchSenderListsAction } from '@/app/actions/sender-actions';
import { syncEmailListToBrevoAction, syncEmailListToSenderAction } from '@/app/actions/sync-email-list-to-provider-action';
import type { BrevoContactList } from '@/services/brevo';
import type { SenderContactList } from '@/lib/sender-client';

export default function EmailListsPage() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const { apiKeys } = useCompanyApiKeys();

  const [emailLists, setEmailLists] = useState<EmailList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListType, setNewListType] = useState<EmailListType>("custom");
  const [selectedList, setSelectedList] = useState<EmailList | null>(null);
  const [contactsInSelectedList, setContactsInSelectedList] = useState<EmailContact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactCompany, setNewContactCompany] = useState("");
  const [isUploadingContacts, setIsUploadingContacts] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 10;

  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [syncProvider, setSyncProvider] = useState<'brevo' | 'sender'>('brevo');
  const [syncTargetListId, setSyncTargetListId] = useState<string>('');
  const [createNewProviderList, setCreateNewProviderList] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingProviderLists, setIsLoadingProviderLists] = useState(false);
  const [brevoLists, setBrevoLists] = useState<BrevoContactList[]>([]);
  const [senderLists, setSenderLists] = useState<SenderContactList[]>([]);

  const brevoApiKey = apiKeys?.brevo?.apiKey || '';
  const senderApiKey = apiKeys?.sender?.apiKey || '';

  const loadLists = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    const lists = await getEmailLists(appUser.companyId);
    setEmailLists(lists);
    setIsLoadingLists(false);
  }, [appUser]);

  useEffect(() => {
    if (appUser) {
      loadLists();
    }
  }, [appUser, loadLists]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !appUser?.companyId) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    await addEmailList(newListName, appUser.companyId, newListType, newListDescription);
    await loadLists();
    toast({ title: "List Created", description: `Email list "${newListName}" created successfully.` });
    setNewListName("");
    setNewListDescription("");
    setNewListType("custom");
    setIsCreateListDialogOpen(false);
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!appUser?.companyId) return;
    await deleteEmailList(listId, appUser.companyId);
    await loadLists();
    if (selectedList?.id === listId) {
      setSelectedList(null);
      setContactsInSelectedList([]);
    }
    toast({ title: "List Deleted", description: `Email list "${listName}" and its contacts have been deleted.` });
  };

  const handleViewContacts = async (list: EmailList) => {
    if (!appUser?.companyId) return;
    setSelectedList(list);
    setIsLoadingContacts(true);
    setCurrentPage(1);
    const contacts = await getEmailContacts(list.id, appUser.companyId);
    setContactsInSelectedList(contacts);
    setIsLoadingContacts(false);
  };

  const handleAddContactToList = async () => {
    if (!selectedList || !newContactName.trim() || !newContactEmail.trim() || !appUser?.companyId) {
      toast({ title: "Error", description: "Name and email are required.", variant: "destructive" });
      return;
    }
    try {
      await addEmailContact(selectedList.id, appUser.companyId, newContactName, newContactEmail, newContactPhone, newContactCompany);
      await loadLists();
      const contacts = await getEmailContacts(selectedList.id, appUser.companyId);
      setContactsInSelectedList(contacts);
      toast({ title: "Contact Added", description: `Contact "${newContactName}" added to list "${selectedList.name}".` });
      setNewContactName("");
      setNewContactEmail("");
      setNewContactPhone("");
      setNewContactCompany("");
      setIsAddContactDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add contact.", variant: "destructive" });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedList || !appUser?.companyId) return;
    await deleteEmailContact(contactId, appUser.companyId);
    await loadLists();
    const contacts = await getEmailContacts(selectedList.id, appUser.companyId);
    setContactsInSelectedList(contacts);
    toast({ title: "Contact Deleted" });
  };

  const handleContactFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedList || !appUser?.companyId) {
      toast({ title: "No List Selected", description: "Please select a list to upload contacts to.", variant: "destructive" });
      if (event.target) event.target.value = '';
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      setIsUploadingContacts(true);
      try {
        const XLSX = await import('xlsx');
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target?.result;
          if (data) {
            try {
              const workbook = XLSX.read(data, { type: 'binary' });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
              const contactsToImport: { name: string; email: string; phone?: string; company?: string }[] = [];
              let invalidCount = 0;
              for (const row of jsonData) {
                const name = row['Name'] || row['name'] || row['First Name'] || row['FirstName'];
                const email = row['Email'] || row['email'] || row['EMAIL'] || row['Email Address'];
                const phone = row['Phone'] || row['phone'] || row['Mobile'];
                const company = row['Company'] || row['company'] || row['Organization'];
                if (name && email) {
                  contactsToImport.push({ name: String(name), email: String(email), phone: phone ? String(phone) : undefined, company: company ? String(company) : undefined });
                } else {
                  invalidCount++;
                }
              }
              const result = await bulkImportEmailContacts(selectedList.id, appUser.companyId!, contactsToImport);
              await loadLists();
              const contacts = await getEmailContacts(selectedList.id, appUser.companyId!);
              setContactsInSelectedList(contacts);
              const totalSkipped = result.skipped + invalidCount;
              toast({ title: "Upload Complete", description: `${result.added} contacts added. ${totalSkipped} rows skipped.` });
            } catch (error) {
              toast({ title: "Upload Failed", description: "Error processing file.", variant: "destructive" });
            }
          }
          setIsUploadingContacts(false);
          if (event.target) event.target.value = '';
        };
        reader.readAsBinaryString(file);
      } catch (xlsxError) {
        toast({ title: "Upload Failed", description: "Could not load file processing library.", variant: "destructive" });
        setIsUploadingContacts(false);
        if (event.target) event.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    const csvContent = `Name,Email,Phone,Company
John Doe,john@example.com,"919876543210",Acme Inc
Jane Smith,jane@example.com,"919123456789",Sample Corp`;
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'OmniFlow_Email_Contacts_Template.csv';
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast({ title: "Template Downloaded", description: "Phone may show as 9.19E+11 in Excel - that's OK, imports correctly!" });
  };

  const openSyncDialog = (list: EmailList) => {
    setSelectedList(list);
    setIsSyncDialogOpen(true);
    setSyncProvider('brevo');
    setSyncTargetListId('');
    setCreateNewProviderList(true);
  };

  const loadProviderLists = useCallback(async () => {
    if (syncProvider === 'brevo' && brevoApiKey) {
      setIsLoadingProviderLists(true);
      try {
        const result = await fetchBrevoListsAction(brevoApiKey, 50);
        if (result.success && result.lists) setBrevoLists(result.lists);
      } catch (error) {
        console.error('Error loading Brevo lists:', error);
      } finally {
        setIsLoadingProviderLists(false);
      }
    } else if (syncProvider === 'sender' && senderApiKey) {
      setIsLoadingProviderLists(true);
      try {
        const result = await fetchSenderListsAction(senderApiKey, 50);
        if (result.success && result.lists) setSenderLists(result.lists);
      } catch (error) {
        console.error('Error loading Sender.net lists:', error);
      } finally {
        setIsLoadingProviderLists(false);
      }
    }
  }, [syncProvider, brevoApiKey, senderApiKey]);

  useEffect(() => {
    if (isSyncDialogOpen && !createNewProviderList) loadProviderLists();
  }, [isSyncDialogOpen, createNewProviderList, loadProviderLists]);

  const handleSyncToProvider = async () => {
    if (!selectedList || !appUser?.companyId) return;
    setIsSyncing(true);
    try {
      let result;
      if (syncProvider === 'brevo') {
        if (!brevoApiKey) {
          toast({ title: 'Brevo Not Configured', description: 'Please set your Brevo API Key in Settings.', variant: 'destructive' });
          setIsSyncing(false);
          return;
        }
        result = await syncEmailListToBrevoAction(selectedList.id, appUser.companyId, brevoApiKey, createNewProviderList ? undefined : parseInt(syncTargetListId, 10), createNewProviderList);
      } else {
        if (!senderApiKey) {
          toast({ title: 'Sender.net Not Configured', description: 'Please set your Sender.net API Key in Settings.', variant: 'destructive' });
          setIsSyncing(false);
          return;
        }
        if (!createNewProviderList && !syncTargetListId) {
          toast({ title: 'Select Target List', description: 'Please select a target list in Sender.net.', variant: 'destructive' });
          setIsSyncing(false);
          return;
        }
        result = await syncEmailListToSenderAction(selectedList.id, appUser.companyId, senderApiKey, createNewProviderList ? undefined : syncTargetListId, createNewProviderList);
      }
      if (result.success) {
        let description = `${result.syncedCount} contact${result.syncedCount !== 1 ? 's' : ''} synced.`;
        if (result.providerListName) description += ` New list: "${result.providerListName}".`;
        if (result.skippedCount > 0) description += ` ${result.skippedCount} skipped.`;
        toast({ title: 'Sync Complete', description });
        setIsSyncDialogOpen(false);
      } else {
        toast({ title: 'Sync Failed', description: result.errorMessage || 'An error occurred.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to sync contacts.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const getValidDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp);
    return null;
  };

  const filteredContacts = contactsInSelectedList.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.company?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastContact = currentPage * contactsPerPage;
  const indexOfFirstContact = indexOfLastContact - contactsPerPage;
  const currentContacts = filteredContacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(filteredContacts.length / contactsPerPage);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Active</span>;
      case 'unsubscribed': return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsubscribed</span>;
      case 'bounced': return <span className="text-xs font-medium text-red-600 dark:text-red-400">Bounced</span>;
      default: return <span className="text-xs font-medium text-muted-foreground">{status}</span>;
    }
  };

  if (isLoadingLists) {
    return (
      <div className="space-y-6">
        <header className="relative flex w-full flex-col gap-4">
          <div className="flex justify-between gap-x-8 items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-2xl font-semibold text-foreground">Email Lists</h1>
              <p className="text-sm text-muted-foreground">Create and manage email lists for your marketing campaigns</p>
            </div>
          </div>
        </header>
        <div className="flex justify-center py-12">
          <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold text-foreground">Email Lists</h1>
            <p className="text-sm text-muted-foreground">Create and manage email lists for your marketing campaigns</p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 shadow-sm">
            <Link href="/campaigns/email-automations">
              <Icon icon="solar:robot-linear" className="mr-1.5 h-4 w-4" />
              Manage Automations
            </Link>
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ background: '#3b82f6' }} />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Lists</span>
              <Icon icon="solar:folder-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#3b82f6' }}>{emailLists.length}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ background: '#14b8a6' }} />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Contacts</span>
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" style={{ color: '#14b8a6' }} />
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#14b8a6' }}>{emailLists.reduce((sum, l) => sum + (l.contactCount || 0), 0)}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ background: '#10b981' }} />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Selected</span>
              <Icon icon="solar:checklist-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#10b981' }}>{selectedList?.contactCount || 0}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full" style={{ background: '#f59e0b' }} />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Filtered</span>
              <Icon icon="solar:filter-linear" className="h-4 w-4" style={{ color: '#f59e0b' }} />
            </div>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: '#f59e0b' }}>{filteredContacts.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Your Email Lists */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }} />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))' }}>
            <div>
              <div className="flex items-center gap-2">
                <Icon icon="solar:folder-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Your Email Lists</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Create lists for different customer segments</p>
            </div>
            <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs shadow-sm" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}>
                  <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" />
                  Create New List
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-md p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                  <DialogTitle>Create New Email List</DialogTitle>
                  <DialogDescription>Create a list to organize your email contacts by segment.</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}>
                  <div className="grid gap-4 py-4">
                    <div>
                      <Label htmlFor="new-list-name">List Name *</Label>
                      <Input id="new-list-name" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g., Free Trial Users" required />
                    </div>
                    <div>
                      <Label htmlFor="new-list-type">List Type</Label>
                      <Select value={newListType} onValueChange={(value) => setNewListType(value as EmailListType)}>
                        <SelectTrigger><SelectValue placeholder="Select list type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free-trial">Free Trial Users</SelectItem>
                          <SelectItem value="paid-customer">Paid Customers</SelectItem>
                          <SelectItem value="churned">Churned/Dead Leads</SelectItem>
                          <SelectItem value="newsletter">Newsletter Subscribers</SelectItem>
                          <SelectItem value="prospects">Prospects</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="new-list-description">Description (Optional)</Label>
                      <Textarea id="new-list-description" value={newListDescription} onChange={(e) => setNewListDescription(e.target.value)} placeholder="Describe the purpose..." rows={2} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsCreateListDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Create List</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="p-4">
            {emailLists.length === 0 ? (
              <div className="text-center py-12">
                <Icon icon="solar:letter-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground mb-1">No email lists created yet</p>
                <p className="text-xs text-muted-foreground">Create your first list to start organizing contacts</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {emailLists.map(list => (
                  <div key={list.id} className={cn("border border-stone-200 dark:border-stone-800 rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/30", selectedList?.id === list.id && "bg-muted/50 border-stone-400 dark:border-stone-600")} onClick={() => handleViewContacts(list)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{list.name}</p>
                          <span className={cn("text-[10px] font-medium", getListTypeColor(list.type))}>{getListTypeLabel(list.type)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{list.contactCount || 0} contacts | {getValidDate(list.createdAt) ? format(getValidDate(list.createdAt)!, 'PP') : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewContacts(list); }} className="h-7 text-xs">
                        <Icon icon="solar:users-group-rounded-linear" className="mr-1 h-3 w-3" />Contacts
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openSyncDialog(list); }} disabled={(list.contactCount || 0) === 0} className="h-7 text-xs">
                        <Icon icon="solar:cloud-upload-linear" className="mr-1 h-3 w-3" />Sync
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                            <Icon icon="solar:trash-bin-minimalistic-linear" className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete List "{list.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>This will delete the list and all its contacts. This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteList(list.id, list.name)} className={buttonVariants({ variant: "destructive" })}>Delete List</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contacts Panel */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }} />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(20, 184, 166, 0.05), rgba(16, 185, 129, 0.05))' }}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" style={{ color: '#14b8a6' }} />
                  <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{selectedList ? `Contacts in "${selectedList.name}"` : 'Select a List'}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedList ? `${contactsInSelectedList.length} contacts in this list` : 'Click on a list to view contacts'}</p>
              </div>
              {selectedList && (
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-7 text-xs">
                    <Icon icon="solar:download-linear" className="mr-1 h-3 w-3" />Template
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => document.getElementById('email-contact-upload-input')?.click()} disabled={isUploadingContacts} className="h-7 text-xs">
                    {isUploadingContacts ? <Icon icon="solar:refresh-linear" className="mr-1 h-3 w-3 animate-spin" /> : <Icon icon="solar:upload-linear" className="mr-1 h-3 w-3" />}Upload
                  </Button>
                  <input type="file" id="email-contact-upload-input" accept=".csv, .xlsx, .xls" onChange={handleContactFileUpload} style={{ display: 'none' }} />
                  <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 text-xs"><Icon icon="solar:add-circle-linear" className="mr-1 h-3 w-3" />Add</Button>
                    </DialogTrigger>
                    <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-md p-4 sm:p-6 rounded-xl">
                      <DialogHeader><DialogTitle>Add Contact to "{selectedList?.name}"</DialogTitle></DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); handleAddContactToList(); }}>
                        <div className="space-y-3 py-3">
                          <div><Label htmlFor="contact-name">Name *</Label><Input id="contact-name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} required /></div>
                          <div><Label htmlFor="contact-email">Email *</Label><Input id="contact-email" type="email" value={newContactEmail} onChange={(e) => setNewContactEmail(e.target.value)} placeholder="email@example.com" required /></div>
                          <div><Label htmlFor="contact-phone">Phone (Optional)</Label><Input id="contact-phone" type="tel" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} placeholder="919876543210" /></div>
                          <div><Label htmlFor="contact-company">Company (Optional)</Label><Input id="contact-company" value={newContactCompany} onChange={(e) => setNewContactCompany(e.target.value)} placeholder="Company name" /></div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" type="button" onClick={() => setIsAddContactDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Add Contact</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
          <div className="p-4">
            {!selectedList ? (
              <div className="text-center py-12">
                <Icon icon="solar:users-group-rounded-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
                <p className="text-sm text-muted-foreground">Select a list from above to view contacts</p>
              </div>
            ) : isLoadingContacts ? (
              <div className="flex justify-center py-12"><Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <>
                {contactsInSelectedList.length > 0 && (
                  <div className="relative mb-3">
                    <Icon icon="solar:magnifer-linear" className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search contacts..." className="pl-8 h-8 text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                  </div>
                )}
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">{searchTerm ? 'No contacts match your search.' : 'No contacts in this list yet.'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Add contacts manually or upload an Excel/CSV file.</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
                      <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-x-auto">
                        <table className="w-full text-sm min-w-[400px]">
                          <thead>
                            <tr className="bg-stone-100/50 dark:bg-stone-800/50">
                              <th className="text-left py-2.5 sm:py-3 px-2 sm:px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Name</th>
                              <th className="hidden sm:table-cell text-left py-2.5 sm:py-3 px-2 sm:px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Email</th>
                              <th className="text-center py-2.5 sm:py-3 px-2 sm:px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Status</th>
                              <th className="text-right py-2.5 sm:py-3 px-2 sm:px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-stone-950">
                            {currentContacts.map(contact => (
                              <tr key={contact.id} className="border-t border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 sm:py-3 px-2 sm:px-3 align-middle">
                                  <div>
                                    <p className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{contact.name}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[120px] sm:hidden">{contact.email}</p>
                                    {contact.company && <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">{contact.company}</p>}
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell py-2.5 sm:py-3 px-2 sm:px-3 align-middle text-xs text-muted-foreground truncate max-w-[150px]">{contact.email}</td>
                                <td className="text-center py-2.5 sm:py-3 px-2 sm:px-3 align-middle">{getStatusText(contact.status)}</td>
                                <td className="text-right py-2.5 sm:py-3 px-2 sm:px-3 align-middle">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7"><Icon icon="solar:trash-bin-minimalistic-linear" className="h-3.5 w-3.5 text-red-500" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[420px] rounded-xl">
                                      <AlertDialogHeader><AlertDialogTitle className="text-base sm:text-lg">Delete Contact?</AlertDialogTitle><AlertDialogDescription className="text-xs sm:text-sm">Remove {contact.name} from this list?</AlertDialogDescription></AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2"><AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteContact(contact.id)} className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}>Delete</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800 mt-4">
                        <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><Icon icon="solar:alt-arrow-left-linear" className="h-3.5 w-3.5" /></Button>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sync Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-md p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="solar:cloud-upload-linear" className="h-5 w-5" />
              Sync to Email Provider
            </DialogTitle>
            <DialogDescription>Push contacts from "{selectedList?.name}" to your email marketing provider.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
              <Icon icon="solar:users-group-rounded-linear" className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{selectedList?.contactCount || 0} contacts</p>
                <p className="text-xs text-muted-foreground">Will be synced to provider</p>
              </div>
            </div>
            <div>
              <Label htmlFor="sync-provider">Select Provider</Label>
              <Select value={syncProvider} onValueChange={(value) => { setSyncProvider(value as 'brevo' | 'sender'); setSyncTargetListId(''); }}>
                <SelectTrigger id="sync-provider" className="mt-2"><SelectValue placeholder="Choose provider..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brevo">Brevo</SelectItem>
                  <SelectItem value="sender">Sender.net</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {syncProvider === 'brevo' && !brevoApiKey && (
              <Alert variant="destructive">
                <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
                <AlertTitle>Brevo Not Configured</AlertTitle>
                <AlertDescription>Please set your Brevo API Key in Settings first.</AlertDescription>
              </Alert>
            )}
            {syncProvider === 'sender' && !senderApiKey && (
              <Alert variant="destructive">
                <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
                <AlertTitle>Sender.net Not Configured</AlertTitle>
                <AlertDescription>Please set your Sender.net API Key in Settings first.</AlertDescription>
              </Alert>
            )}
            {((syncProvider === 'brevo' && brevoApiKey) || (syncProvider === 'sender' && senderApiKey)) && (
              <>
                <div className="space-y-3">
                  <Label>Target List</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant={createNewProviderList ? "default" : "outline"} size="sm" onClick={() => { setCreateNewProviderList(true); setSyncTargetListId(''); }}>
                      <Icon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" />Create New List
                    </Button>
                    <Button type="button" variant={!createNewProviderList ? "default" : "outline"} size="sm" onClick={() => setCreateNewProviderList(false)}>Use Existing List</Button>
                  </div>
                </div>
                {!createNewProviderList && (
                  <div>
                    <Label htmlFor="sync-target-list">Select Existing List</Label>
                    {isLoadingProviderLists ? (
                      <div className="flex items-center justify-center p-4"><Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : syncProvider === 'brevo' ? (
                      brevoLists.length === 0 ? (
                        <Alert className="mt-2"><Icon icon="solar:danger-triangle-linear" className="h-4 w-4" /><AlertTitle>No Lists Found</AlertTitle><AlertDescription>No lists found in Brevo.</AlertDescription></Alert>
                      ) : (
                        <Select value={syncTargetListId} onValueChange={setSyncTargetListId}>
                          <SelectTrigger id="sync-target-list" className="mt-2"><SelectValue placeholder="Choose a list..." /></SelectTrigger>
                          <SelectContent>{brevoLists.map((list) => (<SelectItem key={list.id} value={list.id.toString()}>{list.name} ({list.totalSubscribers || 0} subscribers)</SelectItem>))}</SelectContent>
                        </Select>
                      )
                    ) : (
                      senderLists.length === 0 ? (
                        <Alert className="mt-2"><Icon icon="solar:danger-triangle-linear" className="h-4 w-4" /><AlertTitle>No Lists Found</AlertTitle><AlertDescription>No lists found in Sender.net.</AlertDescription></Alert>
                      ) : (
                        <Select value={syncTargetListId} onValueChange={setSyncTargetListId}>
                          <SelectTrigger id="sync-target-list" className="mt-2"><SelectValue placeholder="Choose a list..." /></SelectTrigger>
                          <SelectContent>{senderLists.map((list) => (<SelectItem key={list.id} value={list.id.toString()}>{list.title} ({list.active || 0} active)</SelectItem>))}</SelectContent>
                        </Select>
                      )
                    )}
                  </div>
                )}
                {createNewProviderList && (
                  <Alert>
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4" />
                    <AlertTitle>New List</AlertTitle>
                    <AlertDescription>A new list will be created in {syncProvider === 'brevo' ? 'Brevo' : 'Sender.net'} with the name "{selectedList?.name}".</AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)} disabled={isSyncing}>Cancel</Button>
            <Button onClick={handleSyncToProvider} disabled={isSyncing || (syncProvider === 'brevo' && !brevoApiKey) || (syncProvider === 'sender' && !senderApiKey) || (!createNewProviderList && !syncTargetListId)}>
              {isSyncing ? (<><Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />Syncing...</>) : (<><Icon icon="solar:plain-linear" className="mr-2 h-4 w-4" />Sync {selectedList?.contactCount || 0} Contacts</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
