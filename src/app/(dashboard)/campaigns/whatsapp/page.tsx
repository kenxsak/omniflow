"use client";

import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogBody, DialogCloseButton } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { getWhatsAppLists, addWhatsAppList, deleteWhatsAppList, getWhatsAppContacts, addWhatsAppContact, deleteWhatsAppContact, bulkImportContacts, recalculateContactCounts } from '@/lib/whatsapp-marketing-data';
import type { WhatsAppList, WhatsAppContact } from '@/types/whatsapp';
import { generateTrackedWhatsappMessageAction } from '@/app/actions/tracked-ai-content-actions';
import type { GenerateWhatsappMessageInput } from '@/ai/flows/generate-whatsapp-message-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import { showAIContentReadyToast } from '@/lib/ai-toast-helpers';
import TemplateBrowser from '@/components/templates/template-browser';

interface ContactForSending extends WhatsAppContact {
  hasBeenSent?: boolean;
}

const CONTACT_NAME_PLACEHOLDER = "{{Name}}";
const CONTACT_NAME_PLACEHOLDER_REGEX = new RegExp(`\\*\\{\\{\\s*${CONTACT_NAME_PLACEHOLDER.replace(/[{}]/g, '')}\\s*\\}\\}\\*`, 'g');

export default function WhatsAppMarketingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'manage-lists' | 'send-campaign'>('manage-lists');
  const { company, appUser } = useAuth();

  const [whatsAppLists, setWhatsAppLists] = useState<WhatsAppList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedList, setSelectedList] = useState<WhatsAppList | null>(null);
  const [contactsInSelectedList, setContactsInSelectedList] = useState<WhatsAppContact[]>([]);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhoneNumber, setNewContactPhoneNumber] = useState("");

  const [selectedListIdForCampaign, setSelectedListIdForCampaign] = useState<string>("");
  const [campaignMessage, setCampaignMessage] = useState<string>("");
  const [contactsForSending, setContactsForSending] = useState<ContactForSending[]>([]);
  const [isAiDraftingMessage, setIsAiDraftingMessage] = useState(false);
  const [aiMessageInputs, setAiMessageInputs] = useState({ leadName: CONTACT_NAME_PLACEHOLDER, context: "Following up on your interest", outcome: "Share an update or offer" });
  const [profileBusinessName, setProfileBusinessName] = useState("Your Company");
  const [singleSendPhoneNumber, setSingleSendPhoneNumber] = useState("");
  const [isUploadingContacts, setIsUploadingContacts] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);

  const placeholderForCampaignMessage = `Hi *${CONTACT_NAME_PLACEHOLDER}*,\n\nExciting news from *${profileBusinessName}*!\n\n[Your message here]\n\nBest regards,\n*${profileBusinessName}*`;

  const loadListsAndContacts = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    let lists = await getWhatsAppLists(appUser.companyId);
    const hasZeroCountLists = lists.some(list => (list.contactCount || 0) === 0);
    if (hasZeroCountLists && lists.length > 0) {
      await recalculateContactCounts(appUser.companyId);
      lists = await getWhatsAppLists(appUser.companyId);
    }
    setWhatsAppLists(lists);
    setIsLoadingLists(false);
  }, [appUser]);

  useEffect(() => {
    if (appUser) loadListsAndContacts();
    if (company) setProfileBusinessName(company.name || 'Your Company');
  }, [appUser?.companyId, company?.name]);

  useEffect(() => {
    if (aiMessageInputs.leadName === CONTACT_NAME_PLACEHOLDER && (campaignMessage.includes("[Your message here]") || campaignMessage.trim() === "" || isAiDraftingMessage)) {
      setCampaignMessage(`Hi *${CONTACT_NAME_PLACEHOLDER}*,\n\nExciting news from *${profileBusinessName}*!\n\n[Your message here]\n\nBest regards,\n*${profileBusinessName}*`);
    }
  }, [profileBusinessName, campaignMessage, isAiDraftingMessage, aiMessageInputs.leadName]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !appUser?.companyId) {
      toast({ title: "Error", description: "List name cannot be empty.", variant: "destructive" });
      return;
    }
    await addWhatsAppList(newListName, appUser.companyId);
    await loadListsAndContacts();
    toast({ title: "List Created", description: `List "${newListName}" created successfully.` });
    setNewListName("");
    setIsCreateListDialogOpen(false);
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!appUser?.companyId) return;
    await deleteWhatsAppList(listId, appUser.companyId);
    await loadListsAndContacts();
    toast({ title: "List Deleted", description: `List "${listName}" deleted.` });
  };

  const handleViewContacts = async (list: WhatsAppList) => {
    if (!appUser?.companyId) return;
    setSelectedList(list);
    setContactsInSelectedList(await getWhatsAppContacts(list.id, appUser.companyId));
  };

  const handleAddContactToList = async () => {
    if (!selectedList || !newContactName.trim() || !newContactPhoneNumber.trim() || !appUser?.companyId) {
      toast({ title: "Error", description: "Name and phone number are required.", variant: "destructive" });
      return;
    }
    if (!/^\+\d{10,15}$/.test(newContactPhoneNumber.replace(/[()\s-]/g, ''))) {
      toast({ title: "Invalid Phone Number", description: "Enter a valid phone number with country code.", variant: "destructive" });
      return;
    }
    await addWhatsAppContact(selectedList.id, appUser.companyId, newContactName, newContactPhoneNumber);
    await loadListsAndContacts();
    setContactsInSelectedList(await getWhatsAppContacts(selectedList.id, appUser.companyId));
    toast({ title: "Contact Added" });
    setNewContactName("");
    setNewContactPhoneNumber("");
    setIsAddContactDialogOpen(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedList || !appUser?.companyId) return;
    await deleteWhatsAppContact(contactId, appUser.companyId);
    setContactsInSelectedList(await getWhatsAppContacts(selectedList.id, appUser.companyId));
    await loadListsAndContacts();
    toast({ title: "Contact Deleted" });
  };

  const handleDraftMessageWithAI = async () => {
    if (!aiMessageInputs.context || !aiMessageInputs.outcome) {
      toast({ title: "Inputs Required", description: "Provide context and desired outcome.", variant: "destructive" });
      return;
    }
    if (!appUser) {
      toast({ title: "Not Authenticated", variant: "destructive" });
      return;
    }
    setIsAiDraftingMessage(true);
    try {
      const aiInput: GenerateWhatsappMessageInput = {
        leadName: CONTACT_NAME_PLACEHOLDER,
        leadContext: aiMessageInputs.context,
        desiredOutcome: aiMessageInputs.outcome,
        senderBusinessName: profileBusinessName,
      };
      const result = await generateTrackedWhatsappMessageAction(appUser.companyId, appUser.uid, aiInput);
      if (result.success && result.data) {
        setCampaignMessage(result.data.suggestedMessage);
        showAIContentReadyToast(toast, "WhatsApp Message", result.quotaInfo);
      } else {
        throw new Error(result.error || 'Failed to generate message.');
      }
    } catch (error: any) {
      toast({ title: "AI Draft Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsAiDraftingMessage(false);
    }
  };

  const handleApplyTemplate = (_subject: string | undefined, content: string) => {
    setCampaignMessage(content);
    setIsTemplateBrowserOpen(false);
    toast({ title: 'Template Applied' });
  };

  const initiateSingleWaMeSend = (phoneNumber: string, baseMessage: string, contactName?: string) => {
    if (!phoneNumber || !baseMessage) {
      toast({ title: "Missing Information", variant: "destructive" });
      return;
    }
    let personalizedMessage = baseMessage;
    if (contactName) {
      personalizedMessage = baseMessage.replace(CONTACT_NAME_PLACEHOLDER_REGEX, `*${contactName}*`);
    } else {
      personalizedMessage = baseMessage.replace(CONTACT_NAME_PLACEHOLDER_REGEX, '*there*');
    }
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (!cleanedPhoneNumber) {
      toast({ title: "Invalid Phone Number", variant: "destructive" });
      return;
    }
    const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${encodeURIComponent(personalizedMessage)}`;
    window.open(whatsappUrl, '_blank') || (window.location.href = whatsappUrl);
    toast({ title: "Opening WhatsApp", description: `Message for ${contactName || phoneNumber}` });
  };

  const handleInitiateCampaignWaMeSend = (contactIndex: number) => {
    if (!contactsForSending[contactIndex] || !campaignMessage) return;
    const contact = contactsForSending[contactIndex];
    initiateSingleWaMeSend(contact.phoneNumber, campaignMessage, contact.name);
    setContactsForSending(prev => prev.map((c, idx) => idx === contactIndex ? { ...c, hasBeenSent: true } : c));
  };


  const handleContactFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedList || !appUser?.companyId) {
      toast({ title: "No List Selected", variant: "destructive" });
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
              const contactsToImport: { name: string; phoneNumber: string }[] = [];
              let invalidCount = 0;
              for (const row of jsonData) {
                const name = row['Name'] || row['name'];
                let phoneNumber = row['PhoneNumber'] || row['Phone'] || row['Mobile'] || row['WhatsApp Number'];
                if (name && phoneNumber) {
                  phoneNumber = String(phoneNumber).replace(/\s+/g, '');
                  if (/^\+?\d{10,15}$/.test(phoneNumber.replace(/[()\s-]/g, ''))) {
                    contactsToImport.push({ name: String(name), phoneNumber });
                  } else invalidCount++;
                } else invalidCount++;
              }
              const result = await bulkImportContacts(selectedList.id, appUser.companyId!, contactsToImport);
              await loadListsAndContacts();
              setContactsInSelectedList(await getWhatsAppContacts(selectedList.id, appUser.companyId!));
              toast({ title: "Upload Complete", description: `${result.added} contacts added. ${result.skipped + invalidCount} skipped.` });
            } catch {
              toast({ title: "Upload Failed", variant: "destructive" });
            }
          }
          setIsUploadingContacts(false);
          if (event.target) event.target.value = '';
        };
        reader.readAsBinaryString(file);
      } catch {
        setIsUploadingContacts(false);
        if (event.target) event.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [{ Name: "John Doe", PhoneNumber: "+919876543210" }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts Template");
    XLSX.writeFile(workbook, "WhatsApp_Contacts_Template.xlsx");
    toast({ title: "Template Downloaded" });
  };

  const getValidDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp);
    return null;
  };

  const messagesInitiatedCount = contactsForSending.filter(c => c.hasBeenSent).length;
  const totalContactsInCampaignList = contactsForSending.length;

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">WhatsApp Marketing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage contact lists and send campaigns via wa.me links</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Lists</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{whatsAppLists.length}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:user-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Contacts</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{whatsAppLists.reduce((acc, l) => acc + (l.contactCount || 0), 0)}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:plain-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Sent</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{messagesInitiatedCount}</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:link-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Method</span>
          </div>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">wa.me Active</p>
        </div>
      </div>

      {/* Clerk-style Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('manage-lists')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'manage-lists' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" />
              Manage Lists
            </span>
            {activeTab === 'manage-lists' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('send-campaign')}
            className={cn(
              "relative py-2 text-sm font-medium transition-colors",
              activeTab === 'send-campaign' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Icon icon="solar:plain-linear" className="h-4 w-4" />
              Send Campaign
            </span>
            {activeTab === 'send-campaign' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Manage Lists Tab */}
      {activeTab === 'manage-lists' && (
        <div className="space-y-4 mt-4">
          {/* Lists Section */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="font-semibold text-sm">Your WhatsApp Lists</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Create and manage contact lists</p>
              </div>
              <Button size="sm" onClick={() => setIsCreateListDialogOpen(true)} className="h-8 text-xs">
                <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" />
                Create List
              </Button>
            </div>
            <div className="p-4">
              {isLoadingLists ? (
                <div className="flex justify-center items-center py-8">
                  <Icon icon="solar:refresh-linear" className="animate-spin h-5 w-5 text-muted-foreground" />
                </div>
              ) : whatsAppLists.length === 0 ? (
                <div className="text-center py-8">
                  <Icon icon="solar:users-group-rounded-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                  <h3 className="text-sm font-medium mb-1">No lists yet</h3>
                  <p className="text-xs text-muted-foreground mb-4">Create your first list to start</p>
                  <Button size="sm" onClick={() => setIsCreateListDialogOpen(true)} className="h-8 text-xs">
                    <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" />
                    Create List
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {whatsAppLists.map(list => (
                    <div
                      key={list.id}
                      className={cn(
                        "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border transition-colors gap-2",
                        selectedList?.id === list.id
                          ? "border-stone-400 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50"
                          : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/30"
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">
                          {list.name}
                          <span className="text-xs text-muted-foreground ml-2">({list.contactCount || 0})</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {getValidDate(list.createdAt) ? format(getValidDate(list.createdAt)!, 'PP') : ''}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleViewContacts(list)} className="h-7 text-xs">
                          <Icon icon="solar:eye-linear" className="mr-1 h-3.5 w-3.5" />
                          View
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Icon icon="solar:trash-bin-trash-linear" className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{list.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This will delete the list and all contacts.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteList(list.id, list.name)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
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


          {/* Contacts in Selected List */}
          {selectedList && (
            <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
              <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="font-semibold text-sm">Contacts in "{selectedList.name}"</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{contactsInSelectedList.length} contacts</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="h-7 text-xs">
                    <Icon icon="solar:file-download-linear" className="mr-1 h-3.5 w-3.5" />
                    Template
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => document.getElementById('contact-upload-input')?.click()} disabled={isUploadingContacts} className="h-7 text-xs">
                    {isUploadingContacts ? <Icon icon="solar:refresh-linear" className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Icon icon="solar:upload-linear" className="mr-1 h-3.5 w-3.5" />}
                    Upload
                  </Button>
                  <input type="file" id="contact-upload-input" accept=".csv, .xlsx, .xls" onChange={handleContactFileUpload} style={{ display: 'none' }} />
                  <Button size="sm" onClick={() => setIsAddContactDialogOpen(true)} className="h-7 text-xs">
                    <Icon icon="solar:add-circle-linear" className="mr-1 h-3.5 w-3.5" />
                    Add
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {contactsInSelectedList.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon icon="solar:user-linear" className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">No contacts yet. Add manually or upload.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Name</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Phone</th>
                            <th className="h-9 px-4 text-right align-middle text-xs font-medium text-muted-foreground w-[60px]"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {contactsInSelectedList.map((contact, index) => (
                            <tr key={contact.id} className={cn("hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors", index !== contactsInSelectedList.length - 1 && "border-b border-stone-200 dark:border-stone-800")}>
                              <td className="h-10 px-4 align-middle font-medium">{contact.name}</td>
                              <td className="h-10 px-4 align-middle text-muted-foreground">{contact.phoneNumber}</td>
                              <td className="h-10 px-4 align-middle text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600">
                                      <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete "{contact.name}"?</AlertDialogTitle>
                                      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteContact(contact.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Send Campaign Tab */}
      {activeTab === 'send-campaign' && (
        <div className="mt-4">
          {/* Two Column Layout: Form + Phone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Column - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-4">
              {/* Step 1: Select List */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold">1</span>
                  <h3 className="font-semibold text-sm">Select Contact List</h3>
                </div>
                <Select value={selectedListIdForCampaign} onValueChange={async (value) => {
                  if (!appUser?.companyId) return;
                  setSelectedListIdForCampaign(value);
                  const contacts = await getWhatsAppContacts(value, appUser.companyId);
                  setContactsForSending(contacts.map((c: WhatsAppContact) => ({ ...c, hasBeenSent: false })));
                }}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choose a list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {whatsAppLists.length === 0 && <SelectItem value="none" disabled>No lists available</SelectItem>}
                    {whatsAppLists.map(list => (
                      <SelectItem key={list.id} value={list.id}>
                        <span className="text-sm">{list.name} <span className="text-muted-foreground text-xs">· {list.contactCount || 0}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Draft Message */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold">2</span>
                  <h3 className="font-semibold text-sm">Draft Your Message</h3>
                </div>

                {/* AI Draft */}
                <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
                  <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">AI Assistant</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-ai-context" className="text-xs text-muted-foreground">Context</Label>
                      <Input id="wa-ai-context" value={aiMessageInputs.context} onChange={(e) => setAiMessageInputs(prev => ({ ...prev, context: e.target.value }))} placeholder="e.g., Product Launch" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wa-ai-outcome" className="text-xs text-muted-foreground">Desired Outcome</Label>
                      <Input id="wa-ai-outcome" value={aiMessageInputs.outcome} onChange={(e) => setAiMessageInputs(prev => ({ ...prev, outcome: e.target.value }))} placeholder="e.g., Visit website" className="h-9" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleDraftMessageWithAI} disabled={isAiDraftingMessage} className="h-8 text-xs">
                      {isAiDraftingMessage ? <Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-3.5 w-3.5" />}
                      AI Draft
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setIsTemplateBrowserOpen(true)} className="h-8 text-xs">
                      <Icon icon="solar:document-text-linear" className="mr-1.5 h-3.5 w-3.5" />
                      Templates
                    </Button>
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1.5">
                  <Label htmlFor="campaign-message" className="text-xs text-muted-foreground">Message</Label>
                  <Textarea id="campaign-message" value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} rows={5} placeholder={placeholderForCampaignMessage} className="resize-none" />
                  <p className="text-[10px] text-muted-foreground">
                    Use <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[9px]">*{CONTACT_NAME_PLACEHOLDER}*</code> for personalization
                  </p>
                </div>
              </div>

              {/* Step 3: Test Send */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold">3</span>
                  <h3 className="font-semibold text-sm">Test Send</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-muted-foreground">Optional</span>
                </div>
                <div className="flex gap-2">
                  <Input type="tel" value={singleSendPhoneNumber} onChange={(e) => setSingleSendPhoneNumber(e.target.value)} placeholder="+919876543210" className="h-9 flex-1" />
                  <Button onClick={() => initiateSingleWaMeSend(singleSendPhoneNumber, campaignMessage, "Test")} disabled={!singleSendPhoneNumber || !campaignMessage} size="sm" className="h-9">
                    <Icon icon="solar:plain-linear" className="mr-1.5 h-3.5 w-3.5" />
                    Test
                  </Button>
                </div>
              </div>

              {/* Step 4: Send to List */}
              {selectedListIdForCampaign && campaignMessage && (
                <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
                  <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold">4</span>
                      <h3 className="font-semibold text-sm">Send to List</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-7">
                      {messagesInitiatedCount} / {totalContactsInCampaignList} sent
                    </p>
                  </div>
                  <div className="p-4 max-h-80 overflow-y-auto space-y-2">
                    {contactsForSending.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No contacts in this list.</p>
                    ) : (
                      contactsForSending.map((contact, index) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30">
                          <div>
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-[10px] text-muted-foreground">{contact.phoneNumber}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleInitiateCampaignWaMeSend(index)}
                            disabled={contact.hasBeenSent}
                            variant={contact.hasBeenSent ? "outline" : "default"}
                            className={cn("h-8 text-xs", contact.hasBeenSent && "text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700")}
                          >
                            {contact.hasBeenSent ? (
                              <>
                                <Icon icon="solar:check-circle-bold" className="mr-1.5 h-3.5 w-3.5" />
                                Sent
                              </>
                            ) : (
                              <>
                                <Icon icon="solar:plain-linear" className="mr-1.5 h-3.5 w-3.5" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Info Note */}
              <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Uses <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[10px]">wa.me</code> links. You'll press send manually in WhatsApp.
                </p>
              </div>
            </div>

            {/* Phone Preview - Sticky on desktop */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-4">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Live Preview</p>
                
                {/* WhatsApp Phone Frame */}
                <div className="mx-auto w-[280px] h-[560px] bg-stone-900 rounded-[3rem] p-3 shadow-xl border-4 border-stone-800">
                  <div className="w-full h-full bg-[#0b141a] rounded-[2.25rem] overflow-hidden flex flex-col">
                    {/* Phone Notch */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-20 h-5 bg-stone-900 rounded-full" />
                    </div>
                    
                    {/* WhatsApp Header */}
                    <div className="px-3 py-2 bg-[#1f2c34] flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#25d366] flex items-center justify-center">
                        <Icon icon="solar:user-bold" className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">
                          {contactsForSending[0]?.name || 'Contact Name'}
                        </p>
                        <p className="text-[10px] text-stone-400">online</p>
                      </div>
                      <Icon icon="solar:videocamera-linear" className="w-5 h-5 text-stone-400" />
                      <Icon icon="solar:phone-linear" className="w-5 h-5 text-stone-400" />
                    </div>
                    
                    {/* Chat Background */}
                    <div className="flex-1 p-3 overflow-y-auto" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23182229\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}>
                      {campaignMessage ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-[#005c4b] rounded-lg rounded-tr-sm px-3 py-2 shadow-sm">
                            <p className="text-xs text-white whitespace-pre-wrap break-words leading-relaxed">
                              {(() => {
                                const contactName = contactsForSending[0]?.name || 'Contact';
                                // Replace {{Name}} or *{{Name}}* with actual contact name
                                let previewMsg = campaignMessage
                                  .replace(/\*?\{\{\s*Name\s*\}\}\*?/gi, contactName)
                                  .replace(/\*([^*]+)\*/g, '$1'); // Remove bold markers for clean preview
                                return previewMsg;
                              })()}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <p className="text-[9px] text-stone-300">
                                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <Icon icon="solar:check-read-bold" className="w-3 h-3 text-[#53bdeb]" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <Icon icon="solar:chat-round-line-linear" className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                            <p className="text-xs text-stone-500">Type a message to preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* WhatsApp Input Bar */}
                    <div className="px-2 py-2 bg-[#1f2c34] flex items-center gap-2">
                      <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-2 flex items-center gap-2">
                        <Icon icon="solar:sticker-smile-circle-linear" className="w-5 h-5 text-stone-400" />
                        <span className="text-xs text-stone-500 flex-1">Type a message</span>
                        <Icon icon="solar:paperclip-linear" className="w-5 h-5 text-stone-400" />
                      </div>
                      <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center">
                        <Icon icon="solar:microphone-bold" className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    
                    {/* Home Indicator */}
                    <div className="flex justify-center py-2 bg-[#0b141a]">
                      <div className="w-24 h-1 bg-stone-700 rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Preview Stats */}
                <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                    <span>{campaignMessage.length} characters</span>
                    <span>{totalContactsInCampaignList} recipients</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded">{`*{{Name}}*`}</code> will be replaced with contact names.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create List Dialog */}
      <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="relative">
            <DialogTitle>Create New List</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateList(); }}>
            <DialogBody>
              <div className="space-y-1.5">
                <Label htmlFor="new-list-name" className="text-xs text-muted-foreground">List Name</Label>
                <Input id="new-list-name" value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="e.g., New Leads Q1" required className="h-9" />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsCreateListDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="relative">
            <DialogTitle>Add Contact</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddContactToList(); }}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name" className="text-xs text-muted-foreground">Name *</Label>
                <Input id="contact-name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone" className="text-xs text-muted-foreground">Phone *</Label>
                <Input id="contact-phone" type="tel" value={newContactPhoneNumber} onChange={(e) => setNewContactPhoneNumber(e.target.value)} placeholder="+919876543210" required className="h-9" />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAddContactDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Template Browser Dialog */}
      <Dialog open={isTemplateBrowserOpen} onOpenChange={setIsTemplateBrowserOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader className="relative">
            <DialogTitle>Select Template</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="max-h-[60vh] overflow-y-auto">
            <TemplateBrowser filterType="sms" onApply={handleApplyTemplate} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
