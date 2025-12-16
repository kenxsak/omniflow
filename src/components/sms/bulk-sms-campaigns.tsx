"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Users,
  Eye,
  Trash2,
  RefreshCw,
  DollarSign,
  Sparkles,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';
import type { SMSCampaign, SMSRecipient } from '@/types/messaging';
import { getSMSCampaigns, getSMSCampaignRecipients, addSMSCampaign, deleteSMSCampaign } from '@/lib/messaging-campaigns-data';
import { sendBulkSMSViaMSG91Action, calculateSMSCostAction, getMSG91TemplatesAction } from '@/app/actions/msg91-actions';
import { sendBulkSMSViaFast2SMSAction } from '@/app/actions/fast2sms-actions';
import { sendBulkSMSViaTwilioAction } from '@/app/actions/twilio-sms-action';
import { syncFast2SMSTemplatesAction, syncMSG91TemplatesAction, getSMSTemplatesAction } from '@/app/actions/sms-templates-actions';
import { getWhatsAppLists, getWhatsAppContacts } from '@/lib/whatsapp-marketing-data';
import type { WhatsAppList, WhatsAppContact } from '@/types/whatsapp';
import { Badge } from '@/components/ui/badge';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import type { SMSTemplate } from '@/lib/sms-templates-sync';
import { VariableMapping, type VariableMapping as VariableMappingType } from '@/components/sms/variable-mapping';
import { AddTemplateDialog } from '@/components/sms/add-template-dialog';

interface SMSActionResult {
  success: boolean;
  campaignId?: string;
  requestId?: string;
  messageId?: string;
  error?: string;
  smsCount?: number;
  estimatedCost?: number;
  sent?: number;
  failed?: number;
  failedRecipients?: { phone: string; error: string }[];
  message?: string[];
  scheduledAt?: string;
}

interface BulkSMSCampaignsProps {
  defaultProvider?: 'msg91' | 'fast2sms' | 'twilio';
}

interface QuickSMSVariableMapping {
  variableName: string;
  mappingType: 'contact_field' | 'static';
  mappingValue: string;
}

interface RecipientWithFields extends Omit<SMSRecipient, 'status'> {
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  [key: string]: string | number | boolean | undefined;
}

export default function BulkSMSCampaigns({ defaultProvider }: BulkSMSCampaignsProps) {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create'>('campaigns');
  
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  
  const [campaignName, setCampaignName] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'msg91' | 'fast2sms' | 'twilio'>(defaultProvider as 'msg91' | 'fast2sms' | 'twilio' || 'msg91');
  
  const initializedVariablesRef = useRef<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'promotional' | 'transactional'>('transactional');
  const [dltTemplateId, setDltTemplateId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [contactLists, setContactLists] = useState<WhatsAppList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [smsCount, setSmsCount] = useState(1);
  const [scheduledDateTime, setScheduledDateTime] = useState<string>('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isTestSending, setIsTestSending] = useState(false);
  const [forceQuickSMS, setForceQuickSMS] = useState(false);
  
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSyncingTemplates, setIsSyncingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  
  const [selectedCampaign, setSelectedCampaign] = useState<SMSCampaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<SMSRecipient[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  
  const [variableMappings, setVariableMappings] = useState<VariableMappingType[]>([]);
  const [quickSMSMappings, setQuickSMSMappings] = useState<QuickSMSVariableMapping[]>([]);
  const [loadedContacts, setLoadedContacts] = useState<WhatsAppContact[]>([]);

  const shouldShowQuickSMSMapping = selectedPlatform === 'fast2sms' && (forceQuickSMS || !dltTemplateId);

  const detectedQuickSMSVariables = useMemo(() => {
    if (!shouldShowQuickSMSMapping) return [];
    const matches = message.match(/\{(\w+)\}/g) || [];
    const uniqueVars = [...new Set(matches.map(m => m.replace(/[{}]/g, '')))];
    return uniqueVars;
  }, [message, shouldShowQuickSMSMapping]);

  const availableContactFields = useMemo(() => {
    const baseFields = [
      { value: 'name', label: 'Contact Name' },
      { value: 'phone', label: 'Phone Number' },
      { value: 'phoneNumber', label: 'Phone Number' },
    ];
    
    if (loadedContacts.length > 0) {
      const firstContact = loadedContacts[0];
      Object.keys(firstContact)
        .filter(k => !['id', 'createdAt', 'updatedAt', 'listId', 'companyId', 'name', 'phone', 'phoneNumber'].includes(k))
        .forEach(key => {
          const value = firstContact[key as keyof typeof firstContact];
          if (typeof value === 'string' || typeof value === 'number') {
            baseFields.push({
              value: key,
              label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
            });
          }
        });
    }
    
    return baseFields;
  }, [loadedContacts]);

  useEffect(() => {
    if (detectedQuickSMSVariables.length === 0) {
      if (quickSMSMappings.length > 0) {
        setQuickSMSMappings([]);
        initializedVariablesRef.current.clear();
      }
      return;
    }
    
    const currentVarNames = new Set(detectedQuickSMSVariables);
    const existingVarNames = new Set(quickSMSMappings.map(m => m.variableName));
    
    const newVarsToAdd = detectedQuickSMSVariables.filter(
      varName => !initializedVariablesRef.current.has(varName) && !existingVarNames.has(varName)
    );
    
    const varsToRemove = quickSMSMappings
      .filter(m => !currentVarNames.has(m.variableName))
      .map(m => m.variableName);
    
    if (newVarsToAdd.length === 0 && varsToRemove.length === 0) {
      return;
    }
    
    setQuickSMSMappings(prev => {
      const filtered = prev.filter(m => currentVarNames.has(m.variableName));
      
      const newMappings = newVarsToAdd.map(varName => {
        const matchingField = availableContactFields.find(f => 
          f.value.toLowerCase() === varName.toLowerCase()
        );
        
        initializedVariablesRef.current.add(varName);
        
        return {
          variableName: varName,
          mappingType: matchingField ? 'contact_field' as const : 'static' as const,
          mappingValue: matchingField?.value || ''
        };
      });
      
      return [...filtered, ...newMappings];
    });
    
    varsToRemove.forEach(varName => {
      initializedVariablesRef.current.delete(varName);
    });
  }, [detectedQuickSMSVariables, availableContactFields, quickSMSMappings]);

  const updateQuickSMSMapping = useCallback((varName: string, type: 'contact_field' | 'static', value: string) => {
    setQuickSMSMappings(prev => 
      prev.map(m => m.variableName === varName ? { ...m, mappingType: type, mappingValue: value } : m)
    );
  }, []);

  const transformMappingsForFast2SMS = useCallback((
    mappings: VariableMappingType[]
  ): QuickSMSVariableMapping[] => {
    return mappings.map(m => ({
      variableName: m.placeholder,
      mappingType: m.mappingType === 'field' ? 'contact_field' as const : 'static' as const,
      mappingValue: m.mappingType === 'field' ? (m.fieldMapping || '') : (m.staticValue || '')
    }));
  }, []);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  useEffect(() => {
    if (defaultProvider && defaultProvider !== selectedPlatform) {
      setSelectedPlatform(defaultProvider);
    }
  }, [defaultProvider]);

  useEffect(() => {
    if (appUser?.companyId) {
      loadCampaigns();
      loadContactLists();
      loadTemplates();
    }
  }, [appUser?.companyId]);

  useEffect(() => {
    if (!appUser?.idToken) {
      console.log('❌ loadTemplates skipped: appUser.idToken not available yet');
      return;
    }
    console.log('🚀 loadTemplates triggered for platform:', selectedPlatform);
    loadTemplates();
    setSelectedTemplate(null);
    setTemplateId('');
    setDltTemplateId('');
  }, [selectedPlatform, appUser?.idToken]);

  const loadCampaigns = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingCampaigns(true);
    try {
      const campaignsList = await getSMSCampaigns(appUser.companyId);
      setCampaigns(campaignsList);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadContactLists = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    try {
      const lists = await getWhatsAppLists(appUser.companyId);
      setContactLists(lists);
    } catch (error) {
      console.error('Error loading contact lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleTestSend = async () => {
    if (!testPhoneNumber.trim()) {
      toast({
        title: 'Phone Number Required',
        description: 'Please enter a phone number to send a test message',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter a message first',
        variant: 'destructive',
      });
      return;
    }

    setIsTestSending(true);
    try {
      const baseContact = loadedContacts[0] || {};
      const testRecipient: RecipientWithFields = {
        phone: testPhoneNumber,
        name: baseContact.name || 'Test User',
        status: 'pending',
      };
      
      Object.keys(baseContact).forEach(key => {
        if (!['phoneNumber', 'name', 'phone', 'status', 'id', 'createdAt', 'updatedAt', 'listId', 'companyId'].includes(key)) {
          const value = baseContact[key as keyof typeof baseContact];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            testRecipient[key] = value;
          }
        }
      });

      let result: SMSActionResult | undefined;
      if (selectedPlatform === 'fast2sms') {
        const route = forceQuickSMS ? 'q' : (dltTemplateId ? 'dlt' : 'q');
        const costWarning = route === 'q' ? ' (₹5 charge for test message)' : ' (₹0.20 charge for test message)';
        
        if (route === 'q') {
          const confirmed = window.confirm(`⚠️ Quick SMS Test Send${costWarning}\n\nYou will be charged ₹5 for this test message. Continue?`);
          if (!confirmed) {
            setIsTestSending(false);
            return;
          }
        }
        
        const fast2smsMappings = shouldShowQuickSMSMapping && quickSMSMappings.length > 0
          ? quickSMSMappings
          : variableMappings.length > 0 
            ? transformMappingsForFast2SMS(variableMappings)
            : undefined;
        
        result = await sendBulkSMSViaFast2SMSAction({
          idToken: appUser!.idToken!,
          message,
          recipients: [testRecipient],
          route,
          dltTemplateId: !forceQuickSMS && dltTemplateId ? dltTemplateId : undefined,
          variableMappings: fast2smsMappings,
        });
      } else if (selectedPlatform === 'msg91') {
        result = await sendBulkSMSViaMSG91Action({
          idToken: appUser!.idToken!,
          message,
          recipients: [testRecipient],
          messageType,
          templateId: templateId || undefined,
          dltTemplateId: dltTemplateId || undefined,
          variableMappings: variableMappings.length > 0 ? variableMappings : undefined,
        });
      } else if (selectedPlatform === 'twilio') {
        result = await sendBulkSMSViaTwilioAction({
          idToken: appUser!.idToken!,
          message,
          recipients: [testRecipient],
        });
      }

      if (result?.success) {
        toast({
          title: 'Test Message Sent!',
          description: `Test SMS sent to ${testPhoneNumber}`,
        });
        setTestPhoneNumber('');
      } else {
        toast({
          title: 'Test Send Failed',
          description: result?.error || 'Failed to send test message',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send test message',
        variant: 'destructive',
      });
    } finally {
      setIsTestSending(false);
    }
  };

  const loadTemplates = async () => {
    if (!appUser?.idToken) {
      console.log('❌ loadTemplates early return: no idToken');
      return;
    }
    if (selectedPlatform === 'twilio') {
      console.log('📱 Twilio selected, clearing templates');
      setTemplates([]);
      return;
    }
    setIsLoadingTemplates(true);
    try {
      let result;
      
      // Use dedicated MSG91 action for MSG91 templates (loads from database, no API sync)
      if (selectedPlatform === 'msg91') {
        console.log('📨 Loading MSG91 templates...');
        result = await getMSG91TemplatesAction({ idToken: appUser.idToken });
        console.log('📨 getMSG91TemplatesAction result:', result);
        if (result.success && result.templates) {
          console.log('✅ Setting templates:', result.templates.length, 'templates found');
          // Transform MSG91Template to SMSTemplate format
          const transformedTemplates: SMSTemplate[] = result.templates.map(t => ({
            id: t.id,
            provider: 'msg91' as const,
            templateId: t.templateId,
            dltId: t.dltId,
            text: t.text,
            name: t.name,
            type: t.type,
            variables: t.variables?.length || 0,
            createdAt: t.createdAt,
            syncedAt: t.updatedAt || t.createdAt,
          }));
          setTemplates(transformedTemplates);
        } else {
          console.log('❌ No templates or API error:', result.error);
          setTemplates([]);
        }
      } else {
        console.log('📩 Loading', selectedPlatform, 'templates...');
        result = await getSMSTemplatesAction({
          idToken: appUser.idToken,
          provider: selectedPlatform as 'msg91' | 'fast2sms'
        });
        if (result.success && result.templates) {
          const filteredTemplates = result.templates.filter(t => t.provider === selectedPlatform);
          console.log('✅ Setting', filteredTemplates.length, selectedPlatform, 'templates');
          setTemplates(filteredTemplates);
        } else {
          console.log('❌ No templates or API error:', result.error);
          setTemplates([]);
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleSyncTemplates = async () => {
    if (!appUser?.idToken) return;
    setIsSyncingTemplates(true);
    try {
      const result = selectedPlatform === 'fast2sms'
        ? await syncFast2SMSTemplatesAction({ idToken: appUser.idToken })
        : selectedPlatform === 'msg91'
        ? await syncMSG91TemplatesAction({ idToken: appUser.idToken })
        : null;
      
      if (!result) {
        if (selectedPlatform === 'twilio') {
          toast({
            title: 'Template Sync Not Available',
            description: 'Twilio does not require template approval. You can send any message directly.',
            variant: 'default',
          });
          setIsSyncingTemplates(false);
          return;
        }
        toast({
          title: 'Sync Failed',
          description: 'Server returned no response. Please refresh the page and try again.',
          variant: 'destructive',
        });
        return;
      }
      
      if (result.success) {
        toast({
          title: 'Templates Synced',
          description: `Fetched ${result.count || 0} templates from ${selectedPlatform.toUpperCase()}`,
        });
        await loadTemplates();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync templates',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error syncing templates:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sync templates. Please refresh the page.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingTemplates(false);
    }
  };

  const handleSelectTemplate = (template: SMSTemplate) => {
    setSelectedTemplate(template);
    setTemplateId(template.templateId);
    setDltTemplateId(template.dltId);
    setMessage(template.text);
  };

  useEffect(() => {
    const loadContactsForPreview = async () => {
      if (!selectedListId || !appUser?.companyId) {
        setLoadedContacts([]);
        return;
      }
      
      try {
        const contacts = await getWhatsAppContacts(selectedListId, appUser.companyId);
        setLoadedContacts(contacts);
      } catch (error) {
        console.error('Error loading contacts for preview:', error);
        setLoadedContacts([]);
      }
    };
    
    loadContactsForPreview();
  }, [selectedListId, appUser?.companyId]);

  // HIDDEN: Cost calculation disabled (future: re-enable if monetizing with markup)
  // useEffect(() => {
  //   const calculateCost = async () => {
  //     if (!message || !selectedListId || !appUser?.idToken) {
  //       setEstimatedCost(null);
  //       return;
  //     }
  //
  //     if (selectedPlatform !== 'msg91') {
  //       setEstimatedCost(null);
  //       return;
  //     }
  //
  //     try {
  //       const selectedList = contactLists.find(l => l.id === selectedListId);
  //       const recipientCount = selectedList?.contactCount || 0;
  //       
  //       if (recipientCount === 0) return;
  //
  //       const result = await calculateSMSCostAction({
  //         message,
  //         recipientCount,
  //       });
  //
  //       setSmsCount(result.smsCount || 1);
  //       setEstimatedCost(result.estimatedCost || 0);
  //     } catch (error) {
  //       console.error('Error calculating cost:', error);
  //     }
  //   };
  //
  //   calculateCost();
  // }, [message, selectedListId, selectedPlatform, appUser?.idToken, contactLists]);

  const handleCreateCampaign = async () => {
    if (!appUser?.companyId || !appUser?.uid || !appUser?.idToken) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to create campaigns',
        variant: 'destructive',
      });
      return;
    }

    if (!campaignName.trim()) {
      toast({
        title: 'Campaign Name Required',
        description: 'Please enter a campaign name',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Message Required',
        description: 'Please enter your SMS message',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedListId) {
      toast({
        title: 'Recipients Required',
        description: 'Please select a contact list',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPlatform !== 'twilio') {
      if (!forceQuickSMS && selectedPlatform === 'fast2sms' && !dltTemplateId.trim()) {
        toast({
          title: 'DLT Template ID Required',
          description: 'DLT Template ID is required for DLT mode in India (TRAI compliance). Please select a template or switch to Quick SMS mode.',
          variant: 'destructive',
        });
        return;
      }

      if (selectedPlatform === 'msg91' && !dltTemplateId.trim()) {
        toast({
          title: 'DLT Template ID Required',
          description: 'DLT Template ID is required for all SMS in India (TRAI compliance). Please select or enter a template.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSending(true);
    try {
      const contacts = await getWhatsAppContacts(selectedListId, appUser.companyId);
      
      if (contacts.length === 0) {
        toast({
          title: 'No Contacts',
          description: 'The selected list has no contacts',
          variant: 'destructive',
        });
        return;
      }

      const recipients: RecipientWithFields[] = contacts.map(contact => {
        const recipient: RecipientWithFields = {
          phone: contact.phoneNumber,
          name: contact.name,
          status: 'pending',
        };
        
        Object.keys(contact).forEach(key => {
          if (!['phoneNumber', 'name', 'status', 'id', 'createdAt', 'updatedAt', 'listId', 'companyId'].includes(key)) {
            const value = contact[key as keyof typeof contact];
            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
              recipient[key] = value;
            }
          }
        });
        
        return recipient;
      });

      let result: SMSActionResult;
      if (selectedPlatform === 'msg91') {
        result = await sendBulkSMSViaMSG91Action({
          idToken: appUser.idToken!,
          message,
          recipients,
          messageType,
          templateId: templateId || undefined,
          dltTemplateId: dltTemplateId || undefined,
          variableMappings: variableMappings.length > 0 ? variableMappings : undefined,
        });
      } else if (selectedPlatform === 'fast2sms') {
        const route = forceQuickSMS ? 'q' : (dltTemplateId ? 'dlt' : 'q');
        const scheduledTime = scheduledDateTime ? Math.floor(new Date(scheduledDateTime).getTime() / 1000) : undefined;
        
        const fast2smsMappings = shouldShowQuickSMSMapping && quickSMSMappings.length > 0
          ? quickSMSMappings
          : variableMappings.length > 0 
            ? transformMappingsForFast2SMS(variableMappings)
            : undefined;
        
        result = await sendBulkSMSViaFast2SMSAction({
          idToken: appUser.idToken!,
          message,
          recipients,
          route,
          dltTemplateId: !forceQuickSMS && dltTemplateId ? dltTemplateId : undefined,
          variableMappings: fast2smsMappings,
          scheduledTime,
        });
      } else if (selectedPlatform === 'twilio') {
        result = await sendBulkSMSViaTwilioAction({
          idToken: appUser.idToken!,
          message,
          recipients,
        });
      } else {
        throw new Error('Invalid platform selected');
      }

      if (result.success) {
        const sentCount = result.sent ?? recipients.length;
        const failedCount = result.failed ?? 0;
        
        const failedPhones = new Set((result.failedRecipients || []).map(f => f.phone));
        const updatedRecipients = recipients.map(recipient => ({
          ...recipient,
          status: failedPhones.has(recipient.phone) ? 'failed' as const : 'sent' as const,
        }));

        const campaignStatus = failedCount === recipients.length ? 'failed' : 'completed';

        const campaign: Omit<SMSCampaign, 'id' | 'createdAt'> = {
          companyId: appUser.companyId,
          name: campaignName,
          platform: selectedPlatform,
          messageType,
          message,
          recipients: updatedRecipients,
          status: campaignStatus,
          createdBy: appUser.uid,
          sentAt: new Date().toISOString(),
          stats: {
            total: recipients.length,
            sent: sentCount,
            delivered: 0,
            failed: failedCount,
          },
          // HIDDEN: Cost not shown to users (affiliate model)
          // estimatedCost: result.estimatedCost,
          dltTemplateId: dltTemplateId || '',
        };

        await addSMSCampaign(campaign);

        if (sentCount > 0) {
          triggerConfetti();
        }

        if (failedCount > 0) {
          toast({
            title: 'Campaign Partially Sent',
            description: `${sentCount} sent, ${failedCount} failed`,
            variant: failedCount === recipients.length ? 'destructive' : 'default',
          });
        } else {
          toast({
            title: 'Campaign Sent Successfully!',
            description: `Sent to ${sentCount} contacts`,
          });
        }

        setCampaignName('');
        setMessage('');
        setDltTemplateId('');
        setTemplateId('');
        setSelectedTemplate(null);
        setVariableMappings([]);
        setQuickSMSMappings([]);
        setSelectedListId('');
        setActiveTab('campaigns');
        loadCampaigns();
      } else {
        throw new Error(result.error || 'Failed to send campaign');
      }
    } catch (error: any) {
      console.error('Error sending campaign:', error);
      toast({
        title: 'Campaign Failed',
        description: error.message || 'Failed to send campaign',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleViewCampaign = async (campaign: SMSCampaign) => {
    if (!appUser?.companyId) return;
    
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
    setIsLoadingRecipients(true);
    
    try {
      const recipients = await getSMSCampaignRecipients(appUser.companyId, campaign.id);
      setCampaignRecipients(recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign recipients',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!appUser?.companyId) return;
    
    try {
      await deleteSMSCampaign(appUser.companyId, campaignId);
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign has been removed',
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: SMSCampaign['status']) => {
    const statusColors: Record<SMSCampaign['status'], string> = {
      draft: 'text-stone-500 dark:text-stone-400',
      scheduled: 'text-amber-600 dark:text-amber-400',
      sending: 'text-blue-600 dark:text-blue-400',
      completed: 'text-emerald-600 dark:text-emerald-400',
      failed: 'text-red-600 dark:text-red-400',
    };

    return (
      <span className={`text-xs font-medium ${statusColors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-20">
      {campaigns.length === 0 && !isLoadingCampaigns && (
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-sm">Quick Start Guide</h3>
                <p className="text-xs text-muted-foreground mt-1">To send your first SMS bulk campaign:</p>
              </div>
              <ol className="text-xs text-muted-foreground space-y-1 ml-4 list-decimal">
                <li>Connect MSG91 or Fast2SMS in Settings</li>
                <li>Create a contact list in WhatsApp Marketing</li>
                <li>Sync your DLT-approved templates</li>
                <li>Select a template and send to bulk contacts</li>
              </ol>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                  <Link href="/settings">
                    <Settings className="h-3.5 w-3.5 mr-1.5" />
                    Settings
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                  <Link href="/whatsapp-marketing">
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    Contacts
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clerk-style underline tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800">
        <nav className="flex gap-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`relative py-2 text-sm font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              My Campaigns
            </span>
            {activeTab === 'campaigns' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`relative py-2 text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Create Campaign
            </span>
            {activeTab === 'create' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-4 mt-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Campaign History</h3>
              <p className="text-xs text-muted-foreground mt-0.5">View and manage your SMS bulk campaigns</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadCampaigns}
              disabled={isLoadingCampaigns}
              className="h-8 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Content */}
          {isLoadingCampaigns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50/50 dark:bg-stone-900/30">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <h3 className="text-sm font-medium mb-1">No campaigns yet</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Create your first SMS bulk campaign to get started
              </p>
              <Button onClick={() => setActiveTab('create')} size="sm" className="h-8 text-xs">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create Campaign
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                      <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Campaign</th>
                      <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground">Status</th>
                      <th className="h-10 px-4 text-center align-middle text-xs font-medium text-muted-foreground">Sent</th>
                      <th className="h-10 px-4 text-right align-middle text-xs font-medium text-muted-foreground w-[100px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign, index) => (
                      <tr key={campaign.id} className={`hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors ${index !== campaigns.length - 1 ? 'border-b border-stone-200 dark:border-stone-800' : ''}`}>
                        <td className="h-12 px-4 align-middle font-medium">{campaign.name}</td>
                        <td className="h-12 px-4 align-middle">{getStatusBadge(campaign.status)}</td>
                        <td className="h-12 px-4 align-middle text-center tabular-nums text-muted-foreground">
                          {campaign.stats.sent}/{campaign.stats.total}
                        </td>
                        <td className="h-12 px-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewCampaign(campaign)}
                              aria-label="View campaign"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteCampaign(campaign.id)}
                              aria-label="Delete campaign"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCampaign?.name}</DialogTitle>
                <DialogDescription>
                  Campaign details and recipient status
                </DialogDescription>
              </DialogHeader>
              {selectedCampaign && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <div className="font-medium">{getStatusBadge(selectedCampaign.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">{selectedCampaign.stats.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sent</p>
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">{selectedCampaign.stats.sent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="font-medium text-red-600 dark:text-red-400">{selectedCampaign.stats.failed}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Recipients</p>
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      {isLoadingRecipients ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : campaignRecipients.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recipient details available</p>
                      ) : (
                        <div className="space-y-2">
                          {campaignRecipients.map((recipient, idx) => (
                            <div key={idx} className="flex justify-between text-sm p-2 bg-stone-50 dark:bg-stone-900/50 rounded border border-stone-200 dark:border-stone-800">
                              <span>{recipient.phone}</span>
                              <span className={`text-xs font-medium ${recipient.status === 'sent' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {recipient.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {activeTab === 'create' && (
        <div className="space-y-4 mt-4">
          {/* Create Campaign Header */}
          <div>
            <h3 className="font-semibold text-sm">Create New Campaign</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Create and send SMS bulk campaigns with DLT-approved templates</p>
          </div>

          {/* Two Column Layout: Form + Phone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Container - Takes 2 columns on large screens */}
            <div className="lg:col-span-2 border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-4 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="campaignName" className="text-xs text-muted-foreground">Campaign Name</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Flash Sale Alert"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className={`grid gap-4 ${(selectedPlatform === 'fast2sms' && dltTemplateId) ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                <div className="space-y-1.5">
                  <Label htmlFor="platform" className="text-xs text-muted-foreground">SMS Platform</Label>
                  <Select value={selectedPlatform} onValueChange={(value) => {
                    setSelectedPlatform(value as 'msg91' | 'fast2sms' | 'twilio');
                    setTemplates([]);
                    setSelectedTemplate(null);
                    setDltTemplateId('');
                    setTemplateId('');
                  }}>
                    <SelectTrigger id="platform" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="msg91">
                        <span className="text-sm">MSG91 <span className="text-muted-foreground text-xs">· India + Global</span></span>
                      </SelectItem>
                      <SelectItem value="fast2sms">
                        <span className="text-sm">Fast2SMS <span className="text-muted-foreground text-xs">· India Only</span></span>
                      </SelectItem>
                      <SelectItem value="twilio">
                        <span className="text-sm">Twilio <span className="text-muted-foreground text-xs">· Global</span></span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!(selectedPlatform === 'fast2sms' && dltTemplateId) && (
                  <div className="space-y-1.5">
                    <Label htmlFor="messageType" className="text-xs text-muted-foreground">Message Type</Label>
                    <Select value={messageType} onValueChange={(value) => setMessageType(value as 'promotional' | 'transactional')}>
                      <SelectTrigger id="messageType" className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactional">Transactional</SelectItem>
                        <SelectItem value="promotional">Promotional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {selectedPlatform === 'fast2sms' && (
                <div className="space-y-3">
                  <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-lg space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="smsMode"
                        value="quick"
                        checked={forceQuickSMS}
                        onChange={() => {
                          setForceQuickSMS(true);
                          setDltTemplateId('');
                          setSelectedTemplate(null);
                        }}
                        className="w-4 h-4 accent-foreground"
                      />
                      <span className="text-sm">Quick SMS Mode <span className="text-muted-foreground text-xs">· Higher cost, no template</span></span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="smsMode"
                        value="dlt"
                        checked={!forceQuickSMS}
                        onChange={() => setForceQuickSMS(false)}
                        className="w-4 h-4 accent-foreground"
                      />
                      <span className="text-sm">DLT Template Mode <span className="text-muted-foreground text-xs">· Cost-effective, TRAI compliant</span></span>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{forceQuickSMS ? 'Quick SMS Mode Active' : 'DLT Template Mode Active'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {forceQuickSMS 
                          ? 'Higher cost - Send any message without template approval'
                          : 'Cost-effective - Using TRAI-approved DLT template'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs text-muted-foreground">SMS Message</Label>
                <Textarea
                  id="message"
                  placeholder={forceQuickSMS && selectedPlatform === 'fast2sms' ? "Enter your SMS message... (Use {name}, {phone}, {email} for personalization)" : "Enter your SMS message..."}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} characters · {smsCount} SMS
                  {smsCount > 1 && <span className="text-amber-500"> (Multi-segment)</span>}
                </p>
              </div>

              {shouldShowQuickSMSMapping && (
                <div className="space-y-3 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                  <p className="text-xs font-medium text-foreground">Personalization Variables</p>
                  <p className="text-xs text-muted-foreground">Click to add variables to your message:</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {['name', 'phone', 'email'].map((field) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => setMessage(message + `{${field}}`)}
                        className="px-2 py-1 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-foreground text-xs rounded font-mono transition-colors"
                      >
                        {`{${field}}`}
                      </button>
                    ))}
                    {loadedContacts.length > 0 && Object.keys(loadedContacts[0] || {})
                      .filter(k => !['name', 'phone', 'email', 'phoneNumber', 'id', 'createdAt', 'updatedAt', 'listId', 'companyId'].includes(k))
                      .map((field) => (
                        <button
                          key={field}
                          type="button"
                          onClick={() => setMessage(message + `{${field}}`)}
                          className="px-2 py-1 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-foreground text-xs rounded font-mono transition-colors"
                        >
                          {`{${field}}`}
                        </button>
                      ))}
                  </div>

                  {quickSMSMappings.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <p className="text-xs font-medium text-foreground">Variable Mapping</p>
                      <div className="space-y-2">
                        {quickSMSMappings.map((mapping) => (
                          <div key={mapping.variableName} className="p-2 bg-white dark:bg-stone-950 rounded border border-stone-200 dark:border-stone-800 space-y-2">
                            <span className="font-mono text-xs text-foreground">{`{${mapping.variableName}}`}</span>
                            <div className="grid grid-cols-2 gap-2">
                              <Select 
                                value={mapping.mappingType}
                                onValueChange={(val) => updateQuickSMSMapping(mapping.variableName, val as 'contact_field' | 'static', mapping.mappingValue)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="contact_field">Contact Field</SelectItem>
                                  <SelectItem value="static">Static Value</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {mapping.mappingType === 'contact_field' ? (
                                <Select
                                  value={mapping.mappingValue || 'name'}
                                  onValueChange={(val) => updateQuickSMSMapping(mapping.variableName, 'contact_field', val)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableContactFields.map((field) => (
                                      <SelectItem key={field.value} value={field.value}>
                                        {field.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  value={mapping.mappingValue}
                                  onChange={(e) => updateQuickSMSMapping(mapping.variableName, 'static', e.target.value)}
                                  placeholder="Enter static value"
                                  className="h-8 text-xs"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedListId && loadedContacts.length > 0 && message.includes('{') && (
                    <div className="space-y-2 pt-3 border-t border-stone-200 dark:border-stone-700">
                      <p className="text-xs font-medium text-foreground">Preview & Test</p>
                      <div className="space-y-2">
                        <Select defaultValue={loadedContacts[0]?.id || ''}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select a contact to preview" />
                          </SelectTrigger>
                          <SelectContent>
                            {loadedContacts.slice(0, 20).map((contact) => (
                              <SelectItem key={contact.id} value={contact.id}>
                                {contact.name || contact.phoneNumber} ({contact.phoneNumber})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {message.includes('{') && (
                          <div className="p-2 bg-stone-50 dark:bg-stone-900/50 rounded border border-stone-200 dark:border-stone-800">
                            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">Preview</p>
                            <p className="text-xs text-foreground whitespace-pre-wrap break-words">
                              {message.replace(/\{(\w+)\}/g, (match, field) => {
                                const mapping = quickSMSMappings.find(m => m.variableName === field);
                                const testContact = loadedContacts[0];
                                if (mapping && testContact) {
                                  if (mapping.mappingType === 'static') {
                                    return mapping.mappingValue || `[${field}]`;
                                  }
                                  const fieldValue = testContact[mapping.mappingValue as keyof typeof testContact];
                                  return String(fieldValue || `[${field}]`);
                                }
                                if (testContact) {
                                  const value = testContact[field as keyof typeof testContact];
                                  return String(value || `[${field}]`);
                                }
                                return match;
                              })}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Input
                            placeholder="Test phone number"
                            value={testPhoneNumber}
                            onChange={(e) => setTestPhoneNumber(e.target.value)}
                            disabled={isTestSending}
                            className="flex-1 h-8 text-xs"
                          />
                          <Button
                            onClick={handleTestSend}
                            disabled={isTestSending || !message.trim() || !testPhoneNumber.trim()}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            {isTestSending ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              'Send Test (₹5)'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="scheduledDateTime" className="text-xs text-muted-foreground">Schedule Message (Optional)</Label>
                <Input
                  id="scheduledDateTime"
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  {scheduledDateTime 
                    ? `Scheduled: ${new Date(scheduledDateTime).toLocaleString()}`
                    : 'Leave empty to send immediately'}
                </p>
              </div>

              {(!forceQuickSMS || selectedPlatform === 'msg91') && (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 border border-stone-200 dark:border-stone-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">DLT Approval Required</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      In India, all SMS messages must use DLT-approved templates (TRAI requirement). Select a template below.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Label className="text-xs text-muted-foreground">Approved Templates</Label>
                      <div className="flex items-center gap-2">
                        {selectedPlatform === 'msg91' && appUser?.idToken && (
                          <AddTemplateDialog 
                            idToken={appUser.idToken} 
                            onTemplateAdded={loadTemplates}
                          />
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleSyncTemplates}
                          disabled={isSyncingTemplates || isLoadingTemplates}
                          className="h-8 text-xs"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1.5 ${isSyncingTemplates ? 'animate-spin' : ''}`} />
                          Sync
                        </Button>
                      </div>
                    </div>

                    {templates.length > 0 ? (
                      <Select value={selectedTemplate?.id || ''} onValueChange={(templateId) => {
                        const t = templates.find(t => t.id === templateId);
                        if (t) handleSelectTemplate(t);
                      }}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select an approved template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => {
                            const varCount = typeof template.variables === 'number' 
                              ? template.variables 
                              : Array.isArray(template.variables) 
                              ? template.variables.length 
                              : 0;
                            return (
                              <SelectItem key={template.id} value={template.id}>
                                <span className="text-sm">{template.name || `Template ${template.templateId.substring(0, 8)}`} <span className="text-muted-foreground text-xs">· {varCount} var</span></span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg text-xs text-muted-foreground">
                        {isLoadingTemplates ? 'Loading templates...' : `No templates found. Click "Sync" to fetch from ${selectedPlatform.toUpperCase()}`}
                      </div>
                    )}

                    {selectedTemplate && (
                      <div className="space-y-3">
                        <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">Template Message</p>
                          <p className="text-sm text-foreground">{selectedTemplate.text}</p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium text-foreground">Auto-Fetched Template IDs</p>
                          
                          <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">DLT Template ID</p>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                readOnly 
                                value={dltTemplateId} 
                                className="flex-1 px-2 py-1.5 text-xs font-mono bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(dltTemplateId);
                                  toast({ title: 'Copied', description: dltTemplateId });
                                }}
                                className="px-2 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-foreground text-xs font-medium rounded transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                              {selectedPlatform === 'msg91' ? 'MSG91 Template ID' : 'Fast2SMS Template ID'}
                            </p>
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                readOnly 
                                value={templateId} 
                                className="flex-1 px-2 py-1.5 text-xs font-mono bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded text-foreground"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(templateId);
                                  toast({ title: 'Copied', description: templateId });
                                }}
                                className="px-2 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-foreground text-xs font-medium rounded transition-colors"
                              >
                                Copy
                              </button>
                            </div>
                          </div>
                        </div>

                        <VariableMapping
                          template={selectedTemplate}
                          provider={selectedPlatform}
                          contacts={loadedContacts.map(c => ({ 
                            name: c.name, 
                            phone: c.phoneNumber
                          }))}
                          onMappingsChange={setVariableMappings}
                        />

                        <div className="mt-4 p-3 rounded-lg border border-stone-200 dark:border-stone-800 space-y-3">
                          <p className="text-xs font-medium text-foreground">
                            Test Send
                            {selectedPlatform === 'fast2sms' && forceQuickSMS && <span className="text-amber-500"> · ₹5 charge</span>}
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Phone number (e.g., 9876543210)"
                              value={testPhoneNumber}
                              onChange={(e) => setTestPhoneNumber(e.target.value)}
                              disabled={isTestSending}
                              className="flex-1 h-9"
                            />
                            <Button
                              onClick={handleTestSend}
                              disabled={isTestSending || !message.trim()}
                              size="sm"
                              variant="outline"
                              className="h-9"
                            >
                              {isTestSending ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                'Test'
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Test your message before sending to the entire list.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="contactList" className="text-xs text-muted-foreground">Select Contact List</Label>
                <Select value={selectedListId} onValueChange={setSelectedListId}>
                  <SelectTrigger id="contactList" className="h-9">
                    <SelectValue placeholder="Select a contact list" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingLists ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : contactLists.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground">
                        No contact lists found. Create one in WhatsApp Marketing first.
                      </div>
                    ) : (
                      contactLists.map((list) => (
                        <SelectItem key={list.id} value={list.id}>
                          <span className="text-sm">{list.name} <span className="text-muted-foreground text-xs">· {list.contactCount} contacts</span></span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* HIDDEN: Pricing display disabled (affiliate model - no markup shown)
              {estimatedCost !== null && selectedPlatform === 'msg91' && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        Estimated Cost: ₹{estimatedCost.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {contactLists.find(l => l.id === selectedListId)?.contactCount || 0} recipients × {smsCount} SMS each
                      </p>
                    </div>
                  </div>
                </div>
              )}
              */}

              <Button
                onClick={handleCreateCampaign}
                disabled={isSending || !campaignName || !message || !selectedListId}
                className="w-full"
                size="lg"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Campaign...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Campaign
                  </>
                )}
              </Button>
            </div>

            {/* Phone Preview - Sticky on desktop */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-3">Live Preview</p>
                
                {/* Phone Frame */}
                <div className="mx-auto w-[280px] h-[560px] bg-stone-900 rounded-[3rem] p-3 shadow-xl border-4 border-stone-800">
                  {/* Phone Inner Frame */}
                  <div className="w-full h-full bg-stone-950 rounded-[2.25rem] overflow-hidden flex flex-col">
                    {/* Phone Notch */}
                    <div className="flex justify-center pt-2 pb-1">
                      <div className="w-20 h-5 bg-stone-900 rounded-full" />
                    </div>
                    
                    {/* Phone Status Bar */}
                    <div className="flex items-center justify-between px-6 py-1 text-[10px] text-stone-400">
                      <span>9:41</span>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/></svg>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M2 22h20V2z"/></svg>
                      </div>
                    </div>
                    
                    {/* Messages Header */}
                    <div className="px-4 py-2 border-b border-stone-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-stone-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-stone-200">{campaignName || 'Campaign Name'}</p>
                          <p className="text-[10px] text-stone-500">{selectedPlatform.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Messages Area */}
                    <div className="flex-1 p-3 overflow-y-auto">
                      {message ? (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] bg-stone-800 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                            <p className="text-xs text-stone-200 whitespace-pre-wrap break-words leading-relaxed">
                              {message.replace(/\{#VAR#\}|##[^#]+##|\{(\w+)\}/g, (match, varName) => {
                                if (varName) {
                                  const mapping = quickSMSMappings.find(m => m.variableName === varName);
                                  if (mapping?.mappingType === 'static' && mapping.mappingValue) {
                                    return mapping.mappingValue;
                                  }
                                  return `[${varName}]`;
                                }
                                return '[value]';
                              })}
                            </p>
                            <p className="text-[9px] text-stone-500 mt-1 text-right">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="w-8 h-8 text-stone-700 mx-auto mb-2" />
                            <p className="text-xs text-stone-600">Enter your message to see preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Message Stats */}
                    <div className="px-3 py-2 border-t border-stone-800 bg-stone-900/50">
                      <div className="flex items-center justify-between text-[10px] text-stone-500">
                        <span>{message.length} chars</span>
                        <span>{smsCount} SMS segment{smsCount > 1 ? 's' : ''}</span>
                        <span>{selectedListId ? (contactLists.find(l => l.id === selectedListId)?.contactCount || 0) : 0} recipients</span>
                      </div>
                    </div>
                    
                    {/* Home Indicator */}
                    <div className="flex justify-center py-2">
                      <div className="w-24 h-1 bg-stone-700 rounded-full" />
                    </div>
                  </div>
                </div>
                
                {/* Preview Info */}
                <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-900/50 rounded-lg border border-stone-200 dark:border-stone-800">
                  <p className="text-xs text-muted-foreground">
                    This preview shows how your SMS will appear on recipients' devices. Variables like <code className="px-1 py-0.5 bg-stone-200 dark:bg-stone-800 rounded text-[10px]">{'{name}'}</code> will be replaced with actual contact data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
