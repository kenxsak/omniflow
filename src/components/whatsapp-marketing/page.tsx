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
import { getWhatsAppLists, addWhatsAppList, deleteWhatsAppList, getWhatsAppContacts, addWhatsAppContact, deleteWhatsAppContact, bulkImportContacts } from '@/lib/whatsapp-marketing-data';
import type { WhatsAppList, WhatsAppContact } from '@/types/whatsapp';
import { generateWhatsappMessage, type GenerateWhatsappMessageInput } from '@/ai/flows/generate-whatsapp-message-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

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

  const placeholderForCampaignMessage = `Hi *${CONTACT_NAME_PLACEHOLDER}*,\n\nExciting news from *${profileBusinessName}*!\n\n[Your message here]\n\nBest regards,\n*${profileBusinessName}*`;

  const loadListsAndContacts = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    const lists = await getWhatsAppLists(appUser.companyId);
    setWhatsAppLists(lists);
    if (selectedList) {
      const currentListStillExists = lists.find((l: WhatsAppList) => l.id === selectedList.id);
      if (currentListStillExists) {
        const contacts = await getWhatsAppContacts(selectedList.id, appUser.companyId);
        setContactsInSelectedList(contacts);
      } else {
        setSelectedList(null);
        setContactsInSelectedList([]);
      }
    }
    if (selectedListIdForCampaign) {
      const campaignListExists = lists.find((l: WhatsAppList) => l.id === selectedListIdForCampaign);
      if (campaignListExists) {
        const contacts = await getWhatsAppContacts(selectedListIdForCampaign, appUser.companyId);
        setContactsForSending(contacts.map((c: WhatsAppContact) => ({ ...c, hasBeenSent: false })));
      } else {
        setSelectedListIdForCampaign("");
        setContactsForSending([]);
      }
    }
    setIsLoadingLists(false);
  }, [selectedList, selectedListIdForCampaign, appUser]);

  useEffect(() => {
    if (appUser) {
      loadListsAndContacts();
    }
    if (company) {
      setProfileBusinessName(company.name || 'Your Company');
    }
  }, [loadListsAndContacts, appUser, company]);

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
    toast({ title: "List Deleted", description: `List "${listName}" and its contacts have been deleted.` });
  };

  const handleViewContacts = async (list: WhatsAppList) => {
    if (!appUser?.companyId) return;
    setSelectedList(list);
    const contacts = await getWhatsAppContacts(list.id, appUser.companyId);
    setContactsInSelectedList(contacts);
  };

  const handleAddContactToList = async () => {
    if (!selectedList || !newContactName.trim() || !newContactPhoneNumber.trim() || !appUser?.companyId) {
      toast({ title: "Error", description: "Name and phone number are required.", variant: "destructive" });
      return;
    }
    if (!/^\+?\d{10,15}$/.test(newContactPhoneNumber.replace(/[()\s-]/g, ''))) {
      toast({ title: "Invalid Phone Number", description: "Please enter a valid phone number (10-15 digits) with country code.", variant: "destructive" });
      return;
    }
    await addWhatsAppContact(selectedList.id, appUser.companyId, newContactName, newContactPhoneNumber);
    await loadListsAndContacts();
    toast({ title: "Contact Added", description: `Contact "${newContactName}" added to list "${selectedList.name}".` });
    setNewContactName("");
    setNewContactPhoneNumber("");
    setIsAddContactDialogOpen(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!selectedList || !appUser?.companyId) return;
    await deleteWhatsAppContact(contactId, appUser.companyId);
    await loadListsAndContacts();
    toast({ title: "Contact Deleted" });
  };

  const handleDraftMessageWithAI = async () => {
    if (!aiMessageInputs.context || !aiMessageInputs.outcome) {
      toast({ title: "Inputs Required", description: "Please provide context and desired outcome for AI draft.", variant: "destructive" });
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
      const result = await generateWhatsappMessage(aiInput);
      setCampaignMessage(result.suggestedMessage);
      toast({ title: "AI Message Drafted", description: "Review and edit the message below." });
    } catch (error: any) {
      toast({ title: "AI Draft Failed", description: error.message || "Could not generate message.", variant: "destructive" });
    } finally {
      setIsAiDraftingMessage(false);
    }
  };

  const initiateSingleWaMeSend = (phoneNumber: string, baseMessage: string, contactName?: string) => {
    if (!phoneNumber || !baseMessage) {
      toast({ title: "Missing Information", description: "Phone number and message are required.", variant: "destructive" });
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
      toast({ title: "Invalid Phone Number", description: "Please provide a valid phone number including country code.", variant: "destructive" });
      return;
    }
    const whatsappUrl = `https://wa.me/${cleanedPhoneNumber}?text=${encodeURIComponent(personalizedMessage)}`;
    const newWindow = window.open(whatsappUrl, '_blank');
    if (!newWindow) {
      window.location.href = whatsappUrl;
    }
    toast({ title: "Opening WhatsApp", description: `Preparing message for ${contactName || phoneNumber}. Review and send in WhatsApp.` });
  };

  const handleInitiateCampaignWaMeSend = (contactIndex: number) => {
    if (!contactsForSending[contactIndex] || !campaignMessage) return;
    const contact = contactsForSending[contactIndex];
    initiateSingleWaMeSend(contact.phoneNumber, campaignMessage, contact.name);
    setContactsForSending(prev => prev.map((c, idx) => idx === contactIndex ? { ...c, hasBeenSent: true } : c));
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

              const contactsToImport: { name: string; phoneNumber: string }[] = [];
              let invalidCount = 0;

              for (const row of jsonData) {
                const name = row['Name'] || row['name'];
                let phoneNumber = row['PhoneNumber'] || row['Phone'] || row['Mobile'] || row['WhatsApp Number'];

                if (name && phoneNumber) {
                  phoneNumber = String(phoneNumber).replace(/\s+/g, '');
                  if (/^\+?\d{10,15}$/.test(phoneNumber.replace(/[()\s-]/g, ''))) {
                    contactsToImport.push({ name: String(name), phoneNumber });
                  } else {
                    invalidCount++;
                  }
                } else {
                  invalidCount++;
                }
              }

              const result = await bulkImportContacts(selectedList.id, appUser.companyId!, contactsToImport);
              await loadListsAndContacts();

              const totalSkipped = result.skipped + invalidCount;
              toast({
                title: "Upload Complete",
                description: `${result.added} contacts added to "${selectedList.name}". ${totalSkipped} rows skipped.`
              });
            } catch (error) {
              console.error("Error processing Excel/CSV file:", error);
              toast({ title: "Upload Failed", description: "Error processing file. Ensure it's a valid Excel or CSV.", variant: "destructive" });
            }
          }
          setIsUploadingContacts(false);
          if (event.target) event.target.value = '';
        };
        reader.readAsBinaryString(file);
      } catch (xlsxError) {
        console.error("Error loading XLSX library:", xlsxError);
        toast({ title: "Upload Failed", description: "Could not load file processing library. Please try again.", variant: "destructive" });
        setIsUploadingContacts(false);
        if (event.target) event.target.value = '';
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvContent = `Name,PhoneNumber
John Doe,"919876543210"
Jane Smith,"919123456789"`;
      
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'OmniFlow_WhatsApp_Contacts_Template.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      
      toast({ title: "Template Downloaded", description: "Phone may show as 9.19E+11 in Excel - that's OK, imports correctly!" });
    } catch (error) {
      console.error("Error downloading template:", error);
      toast({ title: "Download Failed", description: "Could not generate template file.", variant: "destructive" });
    }
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
          <p className="text-[10px] text-muted-foreground">Total lists</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:user-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Contacts</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{whatsAppLists.reduce((acc, l) => acc + (l.contactCount || 0), 0)}</p>
          <p className="text-[10px] text-muted-foreground">All contacts</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:plain-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Sent</span>
          </div>
          <p className="text-xl font-semibold tabular-nums">{messagesInitiatedCount}</p>
          <p className="text-[10px] text-muted-foreground">This session</p>
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:link-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Method</span>
          </div>
          <p className="text-sm font-medium">wa.me Links</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Active</p>
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
                <p className="text-xs text-muted-foreground mt-0.5">Create and manage lists of contacts for your campaigns</p>
              </div>
              <Button size="sm" onClick={() => setIsCreateListDialogOpen(true)} className="h-8 text-xs">
                <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" />
                Create New List
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
                  <p className="text-xs text-muted-foreground mb-4">Create your first list to start managing contacts</p>
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
                          Created {new Date(list.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                        <Button variant="outline" size="sm" onClick={() => handleViewContacts(list)} className="h-7 text-xs">
                          <Icon icon="solar:eye-linear" className="mr-1 h-3.5 w-3.5" />
                          View Contacts
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Icon icon="solar:trash-bin-trash-linear" className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{list.name}"?</AlertDialogTitle>
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
                    Add Contact
                  </Button>
                </div>
              </div>
              <div className="p-4">
                {contactsInSelectedList.length === 0 ? (
                  <div className="text-center py-8">
                    <Icon icon="solar:user-linear" className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground">No contacts yet. Add manually or upload a file.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Name</th>
                            <th className="h-9 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Phone Number</th>
                            <th className="h-9 px-4 text-right align-middle text-xs font-medium text-muted-foreground w-[80px]">Actions</th>
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
                                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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
        <div className="space-y-4 mt-4">
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
                {whatsAppLists.length === 0 && <SelectItem value="none" disabled>No lists available. Create one first.</SelectItem>}
                {whatsAppLists.map(list => (
                  <SelectItem key={list.id} value={list.id}>
                    <span className="text-sm">{list.name} <span className="text-muted-foreground text-xs">· {list.contactCount || 0} contacts</span></span>
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

            {/* AI Draft Section */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">AI Assistant</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wa-ai-context" className="text-xs text-muted-foreground">Message Context</Label>
                  <Input id="wa-ai-context" value={aiMessageInputs.context} onChange={(e) => setAiMessageInputs(prev => ({ ...prev, context: e.target.value }))} placeholder="e.g., New Product Launch" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wa-ai-outcome" className="text-xs text-muted-foreground">Desired Outcome</Label>
                  <Input id="wa-ai-outcome" value={aiMessageInputs.outcome} onChange={(e) => setAiMessageInputs(prev => ({ ...prev, outcome: e.target.value }))} placeholder="e.g., Visit our website" className="h-9" />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDraftMessageWithAI} disabled={isAiDraftingMessage} className="h-8 text-xs">
                {isAiDraftingMessage ? <Icon icon="solar:refresh-linear" className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-3.5 w-3.5" />}
                Draft with AI
              </Button>
            </div>

            {/* Message Textarea */}
            <div className="space-y-1.5">
              <Label htmlFor="campaign-message" className="text-xs text-muted-foreground">Campaign Message</Label>
              <Textarea id="campaign-message" value={campaignMessage} onChange={(e) => setCampaignMessage(e.target.value)} rows={6} placeholder={placeholderForCampaignMessage} className="resize-none" />
              <p className="text-[10px] text-muted-foreground">
                Use <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[9px]">*{CONTACT_NAME_PLACEHOLDER}*</code> for personalization
              </p>
            </div>
          </div>

          {/* Step 3: Test Send */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-800 text-[10px] font-semibold">3</span>
              <h3 className="font-semibold text-sm">Quick Test Send</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-muted-foreground">Optional</span>
            </div>
            <div className="flex gap-2">
              <Input type="tel" value={singleSendPhoneNumber} onChange={(e) => setSingleSendPhoneNumber(e.target.value)} placeholder="919876543210" className="h-9 flex-1" />
              <Button onClick={() => initiateSingleWaMeSend(singleSendPhoneNumber, campaignMessage, "Test Contact")} disabled={!singleSendPhoneNumber || !campaignMessage} size="sm" className="h-9">
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
                  <h3 className="font-semibold text-sm">Send to "{whatsAppLists.find(l => l.id === selectedListIdForCampaign)?.name}"</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  {messagesInitiatedCount} / {totalContactsInCampaignList} messages initiated
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

          {selectedListIdForCampaign && !campaignMessage && (
            <p className="text-center text-xs text-muted-foreground py-4">Draft a message above to see contacts for sending.</p>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg">
            <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>This uses <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[10px]">wa.me</code> links which open WhatsApp directly. You'll need to press send manually in WhatsApp.</p>
              <p>For full automation, consider the WhatsApp Business API.</p>
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
              <Button type="submit">Create List</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="relative">
            <DialogTitle>Add Contact to "{selectedList?.name}"</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleAddContactToList(); }}>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name-modal" className="text-xs text-muted-foreground">Name *</Label>
                <Input id="contact-name-modal" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} required className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-phone-modal" className="text-xs text-muted-foreground">WhatsApp Number *</Label>
                <Input id="contact-phone-modal" type="tel" value={newContactPhoneNumber} onChange={(e) => setNewContactPhoneNumber(e.target.value)} placeholder="919876543210" required className="h-9" />
                <p className="text-[10px] text-muted-foreground">Enter with country code (e.g., 91 for India)</p>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsAddContactDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Add Contact</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
