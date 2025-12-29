
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Edit, Trash2, Loader2, Flag, Timer, Sparkles, Users, CreditCard, Database, Image, Key, Layers, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Plan, Feature, TrialSettings } from '@/types/saas';
import { getStoredPlans, addStoredPlan, updateStoredPlan, deleteStoredPlan, getStoredFeatures, addStoredFeature, deleteStoredFeature, getTrialSettings, saveTrialSettings, saveStoredFeatures, initialFeatures, syncPlansFromCode } from '@/lib/saas-data';
import { useCurrency } from '@/contexts/currency-context';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Section Card Component for consistent styling - MUST be outside dialog to prevent re-renders
const SectionCard: React.FC<{ title: string; description?: string; icon?: React.ReactNode; children: React.ReactNode }> = 
  ({ title, description, icon, children }) => (
  <div className="rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 p-3 sm:p-4 space-y-3 sm:space-y-4">
    <div className="flex items-start sm:items-center gap-2">
      {icon && <span className="text-primary shrink-0">{icon}</span>}
      <div className="min-w-0">
        <h4 className="font-semibold text-sm">{title}</h4>
        {description && <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>}
      </div>
    </div>
    {children}
  </div>
);

// --- DIALOG COMPONENT ---
const PlanEditDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (plan: Plan) => void;
  planToEdit?: Plan | null;
}> = ({ isOpen, onOpenChange, onSave, planToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMonthlyUSD, setPriceMonthlyUSD] = useState(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [paymentLinkMonthlyUSD, setPaymentLinkMonthlyUSD] = useState('');
  const [paymentLinkYearlyUSD, setPaymentLinkYearlyUSD] = useState('');
  const [yearlyDiscountPercentage, setYearlyDiscountPercentage] = useState(0);
  const [maxUsers, setMaxUsers] = useState(1);
  const [aiCredits, setAiCredits] = useState(100);
  const [maxImagesPerMonth, setMaxImagesPerMonth] = useState<number | undefined>(undefined);
  const [maxTextPerMonth, setMaxTextPerMonth] = useState<number | undefined>(undefined);
  const [maxTTSPerMonth, setMaxTTSPerMonth] = useState<number | undefined>(undefined);
  const [allowOverage, setAllowOverage] = useState(false);
  const [overagePricePerCredit, setOveragePricePerCredit] = useState<number | undefined>(undefined);

  // BYOK Settings
  const [allowBYOK, setAllowBYOK] = useState(false);
  
  // Digital Card Settings
  const [digitalCardsPerUser, setDigitalCardsPerUser] = useState<number | undefined>(undefined);
  const [maxDigitalCardsCap, setMaxDigitalCardsCap] = useState<number | undefined>(undefined);
  const [maxDigitalCards, setMaxDigitalCards] = useState<number | undefined>(undefined);
  
  // CRM Limitation Settings
  const [crmAccessLevel, setCrmAccessLevel] = useState<'basic' | 'full'>('basic');
  const [maxContacts, setMaxContacts] = useState<number | null>(null);
  const [allowBulkImport, setAllowBulkImport] = useState(false);
  const [allowBulkExport, setAllowBulkExport] = useState(false);
  const [allowAdvancedFields, setAllowAdvancedFields] = useState(false);
  
  // Landing Pages & Social Media Limits
  const [maxLandingPages, setMaxLandingPages] = useState<number | null>(null);
  const [maxSavedPosts, setMaxSavedPosts] = useState<number | null>(null);

  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const loadAndSetData = async () => {
        const features = await getStoredFeatures();
        setAllFeatures(features.filter(f => f.active)); 

        if (planToEdit) {
            setName(planToEdit.name);
            setDescription(planToEdit.description);
            setPriceMonthlyUSD(planToEdit.priceMonthlyUSD);
            setIsFeatured(planToEdit.isFeatured || false);
            setPaymentLinkMonthlyUSD(planToEdit.paymentLinkMonthlyUSD || '');
            setPaymentLinkYearlyUSD(planToEdit.paymentLinkYearlyUSD || '');
            setSelectedFeatureIds(new Set(planToEdit.featureIds || []));
            setYearlyDiscountPercentage(planToEdit.yearlyDiscountPercentage || 0);
            setMaxUsers(planToEdit.maxUsers || 1);
            setAiCredits(planToEdit.aiCreditsPerMonth || 100);
            setMaxImagesPerMonth(planToEdit.maxImagesPerMonth);
            setMaxTextPerMonth(planToEdit.maxTextPerMonth);
            setMaxTTSPerMonth(planToEdit.maxTTSPerMonth);
            setAllowOverage(planToEdit.allowOverage || false);
            setOveragePricePerCredit(planToEdit.overagePricePerCredit);
            // BYOK
            setAllowBYOK(planToEdit.allowBYOK || false);
            // Digital Cards
            setDigitalCardsPerUser(planToEdit.digitalCardsPerUser);
            setMaxDigitalCardsCap(planToEdit.maxDigitalCardsCap);
            setMaxDigitalCards(planToEdit.maxDigitalCards);
            // CRM Limitations
            setCrmAccessLevel(planToEdit.crmAccessLevel || 'basic');
            setMaxContacts(planToEdit.maxContacts ?? null);
            setAllowBulkImport(planToEdit.allowBulkImport || false);
            setAllowBulkExport(planToEdit.allowBulkExport || false);
            setAllowAdvancedFields(planToEdit.allowAdvancedFields || false);
            // Landing Pages & Social Media
            setMaxLandingPages(planToEdit.maxLandingPages ?? null);
            setMaxSavedPosts(planToEdit.maxSavedPosts ?? null);
        } else {
            setName('');
            setDescription('');
            setPriceMonthlyUSD(0);
            setIsFeatured(false);
            setPaymentLinkMonthlyUSD('');
            setPaymentLinkYearlyUSD('');
            setSelectedFeatureIds(new Set());
            setYearlyDiscountPercentage(0);
            setMaxUsers(1);
            setAiCredits(100);
            setMaxImagesPerMonth(undefined);
            setMaxTextPerMonth(undefined);
            setMaxTTSPerMonth(undefined);
            setAllowOverage(false);
            setOveragePricePerCredit(undefined);
            // BYOK
            setAllowBYOK(false);
            // Digital Cards
            setDigitalCardsPerUser(undefined);
            setMaxDigitalCardsCap(undefined);
            setMaxDigitalCards(undefined);
            // CRM Limitations
            setCrmAccessLevel('basic');
            setMaxContacts(null);
            setAllowBulkImport(false);
            setAllowBulkExport(false);
            setAllowAdvancedFields(false);
            // Landing Pages & Social Media
            setMaxLandingPages(null);
            setMaxSavedPosts(null);
        }
    };
    
    if (isOpen) {
        loadAndSetData();
    }
  }, [planToEdit, isOpen]);

  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    setSelectedFeatureIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(featureId);
      } else {
        newSet.delete(featureId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    if (!name || !description) {
      toast({ title: "Validation Error", description: "Plan name and description are required.", variant: "destructive" });
      return;
    }
    const planData: Plan = {
      id: planToEdit?.id || crypto.randomUUID(),
      name,
      description,
      priceMonthlyUSD,
      isFeatured,
      paymentLinkMonthlyUSD,
      paymentLinkYearlyUSD,
      featureIds: Array.from(selectedFeatureIds),
      yearlyDiscountPercentage,
      maxUsers,
      aiCreditsPerMonth: aiCredits,
      maxImagesPerMonth,
      maxTextPerMonth,
      maxTTSPerMonth,
      allowOverage,
      overagePricePerCredit,
      // BYOK
      allowBYOK,
      // Digital Cards
      digitalCardsPerUser,
      maxDigitalCardsCap,
      maxDigitalCards,
      // CRM Limitations
      crmAccessLevel,
      maxContacts,
      allowBulkImport,
      allowBulkExport,
      allowAdvancedFields,
      // Landing Pages & Social Media
      maxLandingPages,
      maxSavedPosts,
    };
    onSave(planData);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[95vh] sm:h-[90vh] max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header - Responsive padding */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-background shrink-0">
          <DialogTitle className="text-lg sm:text-xl">{planToEdit ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Configure subscription plan details, limits, and features.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Tabs - Scrollable on mobile */}
          <div className="shrink-0 px-3 sm:px-6 pt-3 sm:pt-4 overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max sm:grid sm:grid-cols-5 gap-1">
              <TabsTrigger value="basic" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">AI Limits</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="crm" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                CRM
              </TabsTrigger>
              <TabsTrigger value="content" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Content</span>
                <span className="sm:hidden">More</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                <Flag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                <span className="hidden sm:inline">Features</span>
                <span className="sm:hidden">Feat</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
            {/* Basic Info Tab */}
            <TabsContent value="basic" className="mt-0 space-y-3 sm:space-y-4 data-[state=inactive]:hidden">
              <SectionCard title="Plan Information" icon={<CreditCard className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-name" className="text-xs sm:text-sm">Plan Name *</Label>
                    <Input id="plan-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Starter, Pro" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-max-users" className="text-xs sm:text-sm">Max Users</Label>
                    <Input id="plan-max-users" type="number" value={maxUsers} onChange={e => setMaxUsers(Number(e.target.value))} min="1" className="h-9 sm:h-10 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-description" className="text-xs sm:text-sm">Description *</Label>
                  <Input id="plan-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" className="h-9 sm:h-10 text-sm" />
                </div>
                <div className="flex items-start sm:items-center space-x-2 pt-1">
                  <Checkbox id="plan-featured" checked={isFeatured} onCheckedChange={checked => setIsFeatured(!!checked)} className="mt-0.5 sm:mt-0" />
                  <Label htmlFor="plan-featured" className="cursor-pointer text-xs sm:text-sm leading-tight">Mark as Featured Plan</Label>
                </div>
              </SectionCard>

              <SectionCard title="Pricing" description="USD - auto-converts to local currency" icon={<CreditCard className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-price-monthly-usd" className="text-xs sm:text-sm">Monthly Price (USD)</Label>
                    <Input id="plan-price-monthly-usd" type="number" value={priceMonthlyUSD} onChange={e => setPriceMonthlyUSD(Number(e.target.value))} placeholder="0 for free" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-discount-yearly" className="text-xs sm:text-sm">Yearly Discount (%)</Label>
                    <Input id="plan-discount-yearly" type="number" value={yearlyDiscountPercentage} onChange={e => setYearlyDiscountPercentage(Number(e.target.value))} min="0" max="100" placeholder="e.g., 20" className="h-9 sm:h-10 text-sm" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Payment Links" description="Optional Stripe/Razorpay links" icon={<CreditCard className="h-4 w-4" />}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-link-monthly-usd" className="text-xs sm:text-sm">Monthly Payment Link</Label>
                    <Input id="plan-link-monthly-usd" type="url" placeholder="https://buy.stripe.com/..." value={paymentLinkMonthlyUSD} onChange={e => setPaymentLinkMonthlyUSD(e.target.value)} className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-link-yearly-usd" className="text-xs sm:text-sm">Yearly Payment Link</Label>
                    <Input id="plan-link-yearly-usd" type="url" placeholder="https://buy.stripe.com/..." value={paymentLinkYearlyUSD} onChange={e => setPaymentLinkYearlyUSD(e.target.value)} className="h-9 sm:h-10 text-sm" />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* AI Limits Tab */}
            <TabsContent value="ai" className="mt-0 space-y-3 sm:space-y-4 data-[state=inactive]:hidden">
              <SectionCard title="AI Credits" description="Monthly credit allocation" icon={<Sparkles className="h-4 w-4" />}>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-ai-credits" className="text-xs sm:text-sm">AI Credits per Month</Label>
                  <Input id="plan-ai-credits" type="number" value={aiCredits} onChange={e => setAiCredits(Number(e.target.value))} min="0" placeholder="e.g., 2000" className="h-9 sm:h-10 text-sm" />
                  <p className="text-xs text-muted-foreground">Free: 20 lifetime. Paid: monthly renewable.</p>
                </div>
              </SectionCard>

              <SectionCard title="Operation Limits" description="Prevent expensive operations" icon={<Image className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-max-images" className="text-xs sm:text-sm">Max Images/Month</Label>
                    <Input id="plan-max-images" type="number" value={maxImagesPerMonth ?? ''} onChange={e => setMaxImagesPerMonth(e.target.value ? Number(e.target.value) : undefined)} placeholder="Unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-max-text" className="text-xs sm:text-sm">Max Text Ops/Month</Label>
                    <Input id="plan-max-text" type="number" value={maxTextPerMonth ?? ''} onChange={e => setMaxTextPerMonth(e.target.value ? Number(e.target.value) : undefined)} placeholder="Unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-max-tts" className="text-xs sm:text-sm">Max TTS Ops/Month</Label>
                    <Input id="plan-max-tts" type="number" value={maxTTSPerMonth ?? ''} onChange={e => setMaxTTSPerMonth(e.target.value ? Number(e.target.value) : undefined)} placeholder="Unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Overage Settings" description="Extra credits purchase" icon={<CreditCard className="h-4 w-4" />}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start sm:items-center space-x-2">
                    <Checkbox id="plan-allow-overage" checked={allowOverage} onCheckedChange={checked => setAllowOverage(!!checked)} className="mt-0.5 sm:mt-0" />
                    <Label htmlFor="plan-allow-overage" className="cursor-pointer text-xs sm:text-sm leading-tight">Allow extra credit purchases</Label>
                  </div>
                  {allowOverage && (
                    <div className="space-y-1.5 sm:space-y-2 pl-4 sm:pl-6 border-l-2 border-primary/20">
                      <Label htmlFor="plan-overage-price" className="text-xs sm:text-sm">Price per Credit (USD)</Label>
                      <Input id="plan-overage-price" type="number" step="0.001" value={overagePricePerCredit ?? ''} onChange={e => setOveragePricePerCredit(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g., 0.005" className="h-9 sm:h-10 text-sm" />
                      <p className="text-xs text-muted-foreground">$0.004-0.005 suggested</p>
                    </div>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="BYOK" description="Bring Your Own API Key" icon={<Key className="h-4 w-4" />}>
                <div className="flex items-start sm:items-center space-x-2">
                  <Checkbox id="plan-allow-byok" checked={allowBYOK} onCheckedChange={checked => setAllowBYOK(!!checked)} className="mt-0.5 sm:mt-0" />
                  <Label htmlFor="plan-allow-byok" className="cursor-pointer text-xs sm:text-sm leading-tight">Allow own Gemini API key for unlimited AI</Label>
                </div>
              </SectionCard>
            </TabsContent>

            {/* CRM Tab */}
            <TabsContent value="crm" className="mt-0 space-y-3 sm:space-y-4 data-[state=inactive]:hidden">
              <SectionCard title="CRM Access Level" description="Feature access control" icon={<Database className="h-4 w-4" />}>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-crm-access-level" className="text-xs sm:text-sm">Access Level</Label>
                  <Select value={crmAccessLevel} onValueChange={(value: 'basic' | 'full') => setCrmAccessLevel(value)}>
                    <SelectTrigger id="plan-crm-access-level" className="h-9 sm:h-10 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic CRM (Limited)</SelectItem>
                      <SelectItem value="full">Full CRM (All features)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </SectionCard>

              <SectionCard title="Contact Limits" description="Maximum contacts" icon={<Users className="h-4 w-4" />}>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-max-contacts" className="text-xs sm:text-sm">Maximum Contacts</Label>
                  <Input id="plan-max-contacts" type="number" value={maxContacts ?? ''} onChange={e => setMaxContacts(e.target.value ? Number(e.target.value) : null)} placeholder="Empty = unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  <p className="text-xs text-muted-foreground">100 for Free, empty for paid plans</p>
                </div>
              </SectionCard>

              <SectionCard title="Import/Export" description="Bulk operations" icon={<Database className="h-4 w-4" />}>
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-start sm:items-center space-x-2">
                    <Checkbox id="plan-allow-bulk-import" checked={allowBulkImport} onCheckedChange={checked => setAllowBulkImport(!!checked)} className="mt-0.5 sm:mt-0" />
                    <Label htmlFor="plan-allow-bulk-import" className="cursor-pointer text-xs sm:text-sm leading-tight">Allow CSV import</Label>
                  </div>
                  <div className="flex items-start sm:items-center space-x-2">
                    <Checkbox id="plan-allow-bulk-export" checked={allowBulkExport} onCheckedChange={checked => setAllowBulkExport(!!checked)} className="mt-0.5 sm:mt-0" />
                    <Label htmlFor="plan-allow-bulk-export" className="cursor-pointer text-xs sm:text-sm leading-tight">Allow CSV export</Label>
                  </div>
                  <div className="flex items-start sm:items-center space-x-2">
                    <Checkbox id="plan-allow-advanced-fields" checked={allowAdvancedFields} onCheckedChange={checked => setAllowAdvancedFields(!!checked)} className="mt-0.5 sm:mt-0" />
                    <Label htmlFor="plan-allow-advanced-fields" className="cursor-pointer text-xs sm:text-sm leading-tight">Allow custom fields</Label>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="mt-0 space-y-3 sm:space-y-4 data-[state=inactive]:hidden">
              <SectionCard title="Landing Pages" description="Page creation limits" icon={<Layers className="h-4 w-4" />}>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-max-landing-pages" className="text-xs sm:text-sm">Maximum Landing Pages</Label>
                  <Input id="plan-max-landing-pages" type="number" value={maxLandingPages ?? ''} onChange={e => setMaxLandingPages(e.target.value ? Number(e.target.value) : null)} placeholder="Empty = unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  <p className="text-xs text-muted-foreground">1 for Free, empty for paid</p>
                </div>
              </SectionCard>

              <SectionCard title="Social Media" description="Saved posts limits" icon={<Layers className="h-4 w-4" />}>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="plan-max-saved-posts" className="text-xs sm:text-sm">Maximum Saved Posts</Label>
                  <Input id="plan-max-saved-posts" type="number" value={maxSavedPosts ?? ''} onChange={e => setMaxSavedPosts(e.target.value ? Number(e.target.value) : null)} placeholder="Empty = unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  <p className="text-xs text-muted-foreground">5 for Free, empty for paid</p>
                </div>
              </SectionCard>

              <SectionCard title="Digital Cards" description="Business card limits" icon={<CreditCard className="h-4 w-4" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-digital-cards-per-user" className="text-xs sm:text-sm">Cards/User</Label>
                    <Input id="plan-digital-cards-per-user" type="number" value={digitalCardsPerUser ?? ''} onChange={e => setDigitalCardsPerUser(e.target.value ? Number(e.target.value) : undefined)} placeholder="0 = fixed" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-digital-cards-cap" className="text-xs sm:text-sm">Max Cap</Label>
                    <Input id="plan-digital-cards-cap" type="number" value={maxDigitalCardsCap ?? ''} onChange={e => setMaxDigitalCardsCap(e.target.value ? Number(e.target.value) : undefined)} placeholder="Unlimited" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="plan-max-digital-cards" className="text-xs sm:text-sm">Fixed Limit</Label>
                    <Input id="plan-max-digital-cards" type="number" value={maxDigitalCards ?? ''} onChange={e => setMaxDigitalCards(e.target.value ? Number(e.target.value) : undefined)} placeholder="1" min="0" className="h-9 sm:h-10 text-sm" />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="mt-0 space-y-3 sm:space-y-4 data-[state=inactive]:hidden">
              <SectionCard title="Plan Features" description="Select included features" icon={<Flag className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-[50vh] sm:max-h-[400px] overflow-y-auto pr-1 sm:pr-2">
                  {allFeatures.map(feature => (
                    <div key={feature.id} className="flex items-start space-x-2 sm:space-x-3 p-2.5 sm:p-3 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                      <Checkbox id={`feature-${feature.id}`} checked={selectedFeatureIds.has(feature.id)} onCheckedChange={(checked) => handleFeatureToggle(feature.id, !!checked)} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`feature-${feature.id}`} className="font-medium cursor-pointer text-xs sm:text-sm">{feature.name}</Label>
                        <p className="text-xs text-muted-foreground line-clamp-1">{feature.description || 'No description'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {allFeatures.length === 0 && (
                  <p className="text-xs sm:text-sm text-muted-foreground text-center py-6 sm:py-8">No active features. Create features in Feature Management.</p>
                )}
              </SectionCard>
            </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer - Responsive */}
        <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto h-9 sm:h-10 text-sm">Cancel</Button>
          <Button onClick={handleSave} className="w-full sm:w-auto h-9 sm:h-10 text-sm">Save Plan</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- MAIN COMPONENT ---
export default function PlanManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newFeatureName, setNewFeatureName] = useState('');
  const [newFeatureDescription, setNewFeatureDescription] = useState('');
  const [isAddingFeature, setIsAddingFeature] = useState(false);
  const { toast } = useToast();
  const { currency, formatCurrency, convertFromUSD } = useCurrency();
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
  const [trialSettings, setTrialSettings] = useState<TrialSettings | null>(null);
  const [convertedPrices, setConvertedPrices] = useState<{ [planId: string]: number }>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [storedPlans, storedFeatures, storedTrialSettings] = await Promise.all([
        getStoredPlans(),
        getStoredFeatures(),
        getTrialSettings(),
    ]);
    const sortedPlans = storedPlans.sort((a, b) => a.priceMonthlyUSD - b.priceMonthlyUSD);
    setPlans(sortedPlans);
    setAllFeatures(storedFeatures);
    setTrialSettings(storedTrialSettings);
    
    // Convert all prices to local currency
    const priceMap: { [planId: string]: number } = {};
    for (const plan of sortedPlans) {
      if (plan.priceMonthlyUSD > 0) {
        priceMap[plan.id] = await convertFromUSD(plan.priceMonthlyUSD);
      }
    }
    setConvertedPrices(priceMap);
    setIsLoading(false);
  }, [convertFromUSD]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleCreateNew = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleSavePlan = (planData: Plan) => {
    if (plans.some(p => p.id === planData.id)) {
      updateStoredPlan(planData);
      toast({ title: "Plan Updated", description: `Plan "${planData.name}" has been saved.` });
    } else {
      addStoredPlan(planData);
      toast({ title: "Plan Created", description: `New plan "${planData.name}" has been added.` });
    }
    loadData();
  };

  const handleDelete = (plan: Plan) => {
    deleteStoredPlan(plan.id);
    toast({ title: "Plan Deleted", description: `Plan "${plan.name}" has been removed.`, variant: "destructive" });
    loadData();
  };

  const handleToggleVisibility = async (plan: Plan) => {
    const updatedPlan = { ...plan, isHidden: !plan.isHidden };
    await updateStoredPlan(updatedPlan);
    toast({ 
      title: updatedPlan.isHidden ? "Plan Hidden" : "Plan Visible", 
      description: `"${plan.name}" is now ${updatedPlan.isHidden ? 'hidden from' : 'visible to'} regular users.` 
    });
    loadData();
  };

  const handleAddNewFeature = async () => {
    if (!newFeatureName.trim()) {
      toast({ title: "Feature name is required", variant: "destructive" });
      return;
    }
    setIsAddingFeature(true);
    const result = await addStoredFeature({
        name: newFeatureName,
        description: newFeatureDescription,
        active: true,
    });

    if (result.success) {
        toast({ title: "Feature Added", description: `New feature "${newFeatureName}" added to master list.` });
        setNewFeatureName('');
        setNewFeatureDescription('');
        await loadData();
    } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
    }
    setIsAddingFeature(false);
  };

  const handleDeleteFeature = async (featureId: string, featureName: string) => {
    const isDefault = initialFeatures.some(f => f.id === featureId);
    if (isDefault) {
      toast({ title: "Action Not Allowed", description: "Default system features cannot be deleted.", variant: "destructive" });
      return;
    }
    await deleteStoredFeature(featureId);
    toast({ title: "Feature Deleted", description: `Feature "${featureName}" removed from master list.` });
    await loadData();
  };
  
  const handleFeatureToggle = async (featureId: string, active: boolean) => {
    const updatedFeatures = allFeatures.map(f => f.id === featureId ? { ...f, active } : f);
    setAllFeatures(updatedFeatures);
    await saveStoredFeatures(updatedFeatures); // Ensure this saves to the database
    toast({ title: 'Feature status updated.' });
  };
  
  const handleTrialSettingsChange = (field: keyof TrialSettings, value: string | number) => {
    if (!trialSettings) return;
    setTrialSettings({ ...trialSettings, [field]: value });
  };

  const handleSaveTrialSettings = () => {
    if (trialSettings) {
        saveTrialSettings(trialSettings);
        toast({ title: 'Trial settings saved.' });
    }
  };

  const handleSyncPlans = async () => {
    setIsSyncing(true);
    const result = await syncPlansFromCode();
    if (result.success) {
      toast({ 
        title: "Plans Synced Successfully", 
        description: result.message,
        variant: "default"
      });
      await loadData(); // Reload to show updated values
    } else {
      toast({ 
        title: "Sync Failed", 
        description: result.message,
        variant: "destructive"
      });
    }
    setIsSyncing(false);
  };

  const priceColumnHeader = `Price (${currency}/Mo)`;

  return (
    <div className="space-y-6">
      {/* SaaS Plan Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle>SaaS Plan Management</CardTitle>
              <CardDescription>View, create, edit, and delete your application's subscription plans.</CardDescription>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={handleSyncPlans} variant="outline" disabled={isSyncing} className="self-start sm:self-center">
                {isSyncing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isSyncing && <span className="mr-2">🔄</span>}
                Sync Plans from Code
              </Button>
              <Button onClick={handleCreateNew} className="self-start sm:self-center">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Plan
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>{priceColumnHeader}</TableHead>
                    <TableHead className="hidden sm:table-cell">Max Users</TableHead>
                    <TableHead className="hidden md:table-cell">AI Credits</TableHead>
                    <TableHead className="hidden md:table-cell">CRM Access</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact Limit</TableHead>
                    <TableHead className="hidden xl:table-cell">BYOK</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length > 0 ? (
                    plans.map(plan => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col gap-1">
                            <span>{plan.name}</span>
                            {plan.isFeatured && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded w-fit">Featured</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {plan.priceMonthlyUSD === 0 ? 'Free' : formatCurrency(convertedPrices[plan.id] || plan.priceMonthlyUSD)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{plan.maxUsers ?? 'N/A'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span>{plan.aiCreditsPerMonth?.toLocaleString() ?? '0'}</span>
                            {plan.maxImagesPerMonth && (
                              <span className="text-xs text-muted-foreground">{plan.maxImagesPerMonth} img/mo</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className={plan.crmAccessLevel === 'full' ? 'text-success' : 'text-muted-foreground'}>
                              {plan.crmAccessLevel === 'full' ? 'Full CRM' : 'Basic CRM'}
                            </span>
                            <div className="flex gap-1 text-xs">
                              {plan.allowBulkImport && <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1 py-0.5 rounded">Import</span>}
                              {plan.allowBulkExport && <span className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300 px-1 py-0.5 rounded">Export</span>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className={(plan.maxContacts === null || plan.maxContacts === undefined) ? 'text-success' : ''}>
                            {(plan.maxContacts === null || plan.maxContacts === undefined) ? '∞ Unlimited' : `${plan.maxContacts.toLocaleString()} max`}
                          </span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {plan.allowBYOK ? (
                            <span className="text-success">✓ Yes</span>
                          ) : (
                            <span className="text-muted-foreground">✗ No</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleVisibility(plan)}
                            title={plan.isHidden ? "Show to users" : "Hide from users"}
                          >
                            {plan.isHidden ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(plan)}><Edit className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to delete this plan?</AlertDialogTitle>
                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the "{plan.name}" plan.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(plan)} className={buttonVariants({ variant: "destructive" })}>Delete Plan</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={7} className="h-24 text-center">No plans found. Create one to get started.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         <CardFooter className="flex-col items-start border-t pt-4">
             {trialSettings && (
                 <div className="w-full space-y-4">
                    <h4 className="font-semibold text-md flex items-center"><Timer className="mr-2 h-5 w-5 text-primary"/>Free Trial Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="trial-plan">Trial Plan</Label>
                          <Select value={trialSettings.trialPlanId} onValueChange={(planId) => handleTrialSettingsChange('trialPlanId', planId)}>
                            <SelectTrigger id="trial-plan"><SelectValue /></SelectTrigger>
                            <SelectContent>{plans.map(plan => (<SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>))}</SelectContent>
                          </Select>
                           <p className="text-xs text-muted-foreground mt-1">This plan will be assigned to new companies on signup.</p>
                        </div>
                        <div>
                          <Label htmlFor="trial-duration">Trial Duration (days)</Label>
                          <Input id="trial-duration" type="number" value={trialSettings.trialDurationDays} onChange={(e) => handleTrialSettingsChange('trialDurationDays', Number(e.target.value))} min="1" />
                        </div>
                    </div>
                    <Button onClick={handleSaveTrialSettings} size="sm">Save Trial Settings</Button>
                </div>
             )}
         </CardFooter>
      </Card>
      
      {/* Unified Feature Management Card */}
      <Card>
          <CardHeader>
              <CardTitle className="flex items-center"><Flag className="mr-2 h-5 w-5 text-primary" />Feature Management</CardTitle>
              <CardDescription>Create new features and manage their global availability. Inactive features cannot be added to plans.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="border rounded-md p-4">
                <h4 className="text-md font-semibold mb-2">Create New Feature</h4>
                 <div className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-grow space-y-1">
                          <Label htmlFor="new-feature-name" className="text-xs">Feature Name</Label>
                          <Input id="new-feature-name" value={newFeatureName} onChange={e => setNewFeatureName(e.target.value)} placeholder="e.g., Advanced Reporting"/>
                      </div>
                      <div className="flex-grow space-y-1">
                          <Label htmlFor="new-feature-desc" className="text-xs">Feature Description (Optional)</Label>
                          <Input id="new-feature-desc" value={newFeatureDescription} onChange={e => setNewFeatureDescription(e.target.value)} placeholder="e.g., Generate detailed PDF reports"/>
                      </div>
                      <Button onClick={handleAddNewFeature} disabled={isAddingFeature} className="w-full sm:w-auto">
                        {isAddingFeature && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Feature
                      </Button>
                 </div>
              </div>
              <div>
                <h4 className="text-md font-semibold mb-2">Available Features</h4>
                <div className="space-y-2">
                    {isLoading ? <div className="flex justify-center items-center h-20"><Loader2 className="h-6 w-6 animate-spin" /></div> :
                        allFeatures.map(feature => (
                          <div key={feature.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30">
                            <div>
                                <Label htmlFor={`feature-toggle-${feature.id}`} className="font-medium cursor-pointer">{feature.name}</Label>
                                <p className="text-xs text-muted-foreground">{feature.description || 'No description'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch id={`feature-toggle-${feature.id}`} checked={feature.active} onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)} />
                                <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" title={`Delete ${feature.name}`} disabled={initialFeatures.some(f => f.id === feature.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Delete Feature "{feature.name}"?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the feature from the master list. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteFeature(feature.id, feature.name)} className={buttonVariants({ variant: "destructive" })}>Delete Feature</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                                </AlertDialog>
                            </div>
                          </div>
                        ))
                    }
                </div>
              </div>
          </CardContent>
      </Card>
      
      <PlanEditDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSavePlan}
        planToEdit={editingPlan}
      />
    </div>
  );
}
