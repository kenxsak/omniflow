"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getInvoiceSettingsAction, updateInvoiceSettingsAction, getPaymentReminderSettingsAction, updatePaymentReminderSettingsAction } from '@/app/actions/invoice-actions';
import type { InvoiceSettings, PaymentReminderSettings } from '@/types/invoice';

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

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<InvoiceSettings | null>(null);
  const [reminderSettings, setReminderSettings] = useState<PaymentReminderSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [prefix, setPrefix] = useState('INV');
  const [nextNumber, setNextNumber] = useState(1);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstin, setGstin] = useState('');
  const [gstState, setGstState] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [defaultDueDays, setDefaultDueDays] = useState(30);
  const [defaultNotes, setDefaultNotes] = useState('');
  const [defaultTerms, setDefaultTerms] = useState('');
  
  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  
  // Payment Gateway
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [preferredGateway, setPreferredGateway] = useState<'razorpay' | 'stripe' | 'auto'>('auto');
  
  // Payment Reminders
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderDays, setReminderDays] = useState<number[]>([-3, 0, 3, 7]);
  const [reminderEmail, setReminderEmail] = useState(true);
  const [reminderWhatsApp, setReminderWhatsApp] = useState(false);
  const [maxReminders, setMaxReminders] = useState(4);
  
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, [appUser?.idToken]);

  const loadSettings = async () => {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [result, reminderResult] = await Promise.all([
        getInvoiceSettingsAction({ idToken: appUser.idToken }),
        getPaymentReminderSettingsAction({ idToken: appUser.idToken }),
      ]);
      
      if (result.success && result.settings) {
        const s = result.settings;
        setSettings(s);
        setPrefix(s.prefix || 'INV');
        setNextNumber(s.nextNumber || 1);
        setGstEnabled(s.gstEnabled || false);
        setGstin(s.gstin || '');
        setGstState(s.gstState || '');
        setDefaultTaxRate(s.defaultTaxRate || 18);
        setDefaultDueDays(s.defaultDueDays || 30);
        setDefaultNotes(s.defaultNotes || '');
        setDefaultTerms(s.defaultTerms || '');
        
        if (s.bankDetails) {
          setBankName(s.bankDetails.bankName || '');
          setAccountName(s.bankDetails.accountName || '');
          setAccountNumber(s.bankDetails.accountNumber || '');
          setIfscCode(s.bankDetails.ifscCode || '');
          setUpiId(s.bankDetails.upiId || '');
        }
        
        // Payment Gateway
        if (s.paymentGateway) {
          if (s.paymentGateway.razorpay) {
            setRazorpayEnabled(s.paymentGateway.razorpay.enabled || false);
            setRazorpayKeyId(s.paymentGateway.razorpay.keyId || '');
            setRazorpayKeySecret(s.paymentGateway.razorpay.keySecret || '');
          }
          if (s.paymentGateway.stripe) {
            setStripeEnabled(s.paymentGateway.stripe.enabled || false);
            setStripePublishableKey(s.paymentGateway.stripe.publishableKey || '');
            setStripeSecretKey(s.paymentGateway.stripe.secretKey || '');
          }
          setPreferredGateway(s.paymentGateway.preferredGateway || 'auto');
        }
      }
      
      if (reminderResult.success && reminderResult.settings) {
        const r = reminderResult.settings;
        setReminderSettings(r);
        setReminderEnabled(r.sendEmail || r.sendWhatsApp || r.sendSms);
        setReminderDays(r.reminderDays || [-3, 0, 3, 7]);
        setReminderEmail(r.sendEmail);
        setReminderWhatsApp(r.sendWhatsApp);
        setMaxReminders(r.maxReminders || 4);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({ title: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!appUser?.idToken) return;
    
    setIsSaving(true);
    try {
      const [result, reminderResult] = await Promise.all([
        updateInvoiceSettingsAction({
          idToken: appUser.idToken,
          settings: {
            prefix,
            nextNumber,
            numberFormat: '{prefix}-{year}-{number}',
            gstEnabled,
            gstin: gstEnabled ? gstin : undefined,
            gstState: gstEnabled ? gstState : undefined,
            defaultTaxRate,
            defaultDueDays,
            defaultNotes: defaultNotes || undefined,
            defaultTerms: defaultTerms || undefined,
            bankDetails: (bankName || accountNumber || upiId) ? {
              bankName,
              accountName,
              accountNumber,
              ifscCode,
              upiId,
            } : undefined,
            paymentGateway: {
              razorpay: razorpayEnabled ? {
                keyId: razorpayKeyId,
                keySecret: razorpayKeySecret,
                enabled: true,
              } : { keyId: '', keySecret: '', enabled: false },
              stripe: stripeEnabled ? {
                publishableKey: stripePublishableKey,
                secretKey: stripeSecretKey,
                enabled: true,
              } : { publishableKey: '', secretKey: '', enabled: false },
              preferredGateway,
            },
          },
        }),
        updatePaymentReminderSettingsAction({
          idToken: appUser.idToken,
          settings: {
            reminderDays,
            sendEmail: reminderEnabled && reminderEmail,
            sendWhatsApp: reminderEnabled && reminderWhatsApp,
            sendSms: false,
            maxReminders,
            stopOnPayment: true,
          },
        }),
      ]);
      
      if (result.success && reminderResult.success) {
        toast({ title: 'Settings saved!' });
      } else {
        toast({ title: result.error || reminderResult.error || 'Failed to save', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <Icon icon="solar:spinner-bold" className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Invoice Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Configure your invoice numbering, GST, and defaults</p>
      </div>

      {/* Invoice Numbering */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:hashtag-linear" className="w-5 h-5 text-blue-500" />
            Invoice Numbering
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Customize how your invoice numbers are generated
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Prefix</Label>
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="INV"
                className="h-9 sm:h-10 text-sm font-mono"
                maxLength={10}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Next Number</Label>
              <Input
                type="number"
                value={nextNumber}
                onChange={(e) => setNextNumber(parseInt(e.target.value) || 1)}
                className="h-9 sm:h-10 text-sm font-mono"
                min={1}
              />
            </div>
          </div>
          <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
            <p className="text-xs text-muted-foreground">Preview:</p>
            <p className="font-mono text-sm font-medium">{prefix}-{new Date().getFullYear()}-{String(nextNumber).padStart(4, '0')}</p>
          </div>
        </CardContent>
      </Card>

      {/* GST Settings */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:document-medicine-linear" className="w-5 h-5 text-emerald-500" />
                GST Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure GST for Indian tax compliance
              </CardDescription>
            </div>
            <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} />
          </div>
        </CardHeader>
        {gstEnabled && (
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Your GSTIN</Label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="22AAAAA0000A1Z5"
                  className="h-9 sm:h-10 text-sm font-mono"
                  maxLength={15}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">State</Label>
                <Select value={gstState} onValueChange={setGstState}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Default Tax Rate</Label>
                <Select value={String(defaultTaxRate)} onValueChange={(v) => setDefaultTaxRate(parseInt(v))}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (Exempt)</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:settings-linear" className="w-5 h-5 text-violet-500" />
            Defaults
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Default values for new invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Payment Due (days)</Label>
            <Select value={String(defaultDueDays)} onValueChange={(v) => setDefaultDueDays(parseInt(v))}>
              <SelectTrigger className="h-9 sm:h-10 text-sm w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="15">15 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="45">45 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Default Notes</Label>
            <Textarea
              value={defaultNotes}
              onChange={(e) => setDefaultNotes(e.target.value)}
              placeholder="Thank you for your business!"
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Default Terms & Conditions</Label>
            <Textarea
              value={defaultTerms}
              onChange={(e) => setDefaultTerms(e.target.value)}
              placeholder="Payment is due within the specified period..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:bank-linear" className="w-5 h-5 text-amber-500" />
            Bank Details
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            For bank transfer payments (shown on invoices)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="HDFC Bank"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Account Name</Label>
              <Input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Your Business Name"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Account Number</Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="h-9 sm:h-10 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">IFSC Code</Label>
              <Input
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="HDFC0001234"
                className="h-9 sm:h-10 text-sm font-mono"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">UPI ID</Label>
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="business@upi"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:card-linear" className="w-5 h-5 text-blue-500" />
            Online Payment Gateway
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Accept online payments on invoices via Razorpay or Stripe
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
          {/* Status Summary */}
          {(settings?.paymentGateway?.razorpay?.enabled || settings?.paymentGateway?.stripe?.enabled) && (
            <Alert className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
              <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-xs ml-2 text-emerald-700 dark:text-emerald-400">
                Payment gateway configured! 
                {settings?.paymentGateway?.razorpay?.enabled && settings?.paymentGateway?.razorpay?.keyId && ' Razorpay ✓'}
                {settings?.paymentGateway?.stripe?.enabled && settings?.paymentGateway?.stripe?.secretKey && ' Stripe ✓'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Razorpay */}
          <div className="p-3 sm:p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon icon="simple-icons:razorpay" className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-sm">Razorpay</span>
                <Badge variant="outline" className="text-[10px]">INR</Badge>
                {razorpayEnabled && razorpayKeyId && razorpayKeySecret && (
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Icon icon="solar:check-circle-bold" className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                {razorpayEnabled && (!razorpayKeyId || !razorpayKeySecret) && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Icon icon="solar:danger-triangle-linear" className="w-3 h-3 mr-1" />
                    Keys Missing
                  </Badge>
                )}
              </div>
              <Switch checked={razorpayEnabled} onCheckedChange={setRazorpayEnabled} />
            </div>
            {razorpayEnabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Key ID</Label>
                  <Input
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    placeholder="rzp_test_xxxxxxxxxxxxx"
                    className="h-9 sm:h-10 text-sm font-mono"
                  />
                  {razorpayKeyId && (
                    <p className="text-[10px] text-muted-foreground">
                      {razorpayKeyId.startsWith('rzp_test_') ? '🧪 Test mode' : razorpayKeyId.startsWith('rzp_live_') ? '🟢 Live mode' : '⚠️ Invalid key format'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Key Secret</Label>
                  <Input
                    type="password"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="h-9 sm:h-10 text-sm font-mono"
                  />
                  {razorpayKeySecret && (
                    <p className="text-[10px] text-emerald-600">✓ Secret key configured</p>
                  )}
                </div>
                <Alert className="p-2.5">
                  <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                  <AlertDescription className="text-[11px] ml-2">
                    Get your API keys from{' '}
                    <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      Razorpay Dashboard
                    </a>
                    . Use test keys (rzp_test_) for testing.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Stripe */}
          <div className="p-3 sm:p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon icon="simple-icons:stripe" className="w-5 h-5 text-violet-600" />
                <span className="font-medium text-sm">Stripe</span>
                <Badge variant="outline" className="text-[10px]">USD/EUR/GBP</Badge>
                {stripeEnabled && stripePublishableKey && stripeSecretKey && (
                  <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Icon icon="solar:check-circle-bold" className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                {stripeEnabled && (!stripePublishableKey || !stripeSecretKey) && (
                  <Badge className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Icon icon="solar:danger-triangle-linear" className="w-3 h-3 mr-1" />
                    Keys Missing
                  </Badge>
                )}
              </div>
              <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
            </div>
            {stripeEnabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Publishable Key</Label>
                  <Input
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    placeholder="pk_test_xxxxxxxxxxxxx"
                    className="h-9 sm:h-10 text-sm font-mono"
                  />
                  {stripePublishableKey && (
                    <p className="text-[10px] text-muted-foreground">
                      {stripePublishableKey.startsWith('pk_test_') ? '🧪 Test mode' : stripePublishableKey.startsWith('pk_live_') ? '🟢 Live mode' : '⚠️ Invalid key format'}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Secret Key</Label>
                  <Input
                    type="password"
                    value={stripeSecretKey}
                    onChange={(e) => setStripeSecretKey(e.target.value)}
                    placeholder="sk_test_xxxxxxxxxxxxx"
                    className="h-9 sm:h-10 text-sm font-mono"
                  />
                  {stripeSecretKey && (
                    <p className="text-[10px] text-emerald-600">✓ Secret key configured</p>
                  )}
                </div>
                <Alert className="p-2.5">
                  <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
                  <AlertDescription className="text-[11px] ml-2">
                    Get your API keys from{' '}
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">
                      Stripe Dashboard
                    </a>
                    . Use test keys (pk_test_, sk_test_) for testing.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          {/* Preferred Gateway */}
          {(razorpayEnabled || stripeEnabled) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preferred Gateway</Label>
              <Select value={preferredGateway} onValueChange={(v) => setPreferredGateway(v as any)}>
                <SelectTrigger className="h-9 sm:h-10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (INR → Razorpay, Others → Stripe)</SelectItem>
                  {razorpayEnabled && <SelectItem value="razorpay">Always Razorpay</SelectItem>}
                  {stripeEnabled && <SelectItem value="stripe">Always Stripe</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Reminders */}
      <Card>
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Icon icon="solar:bell-linear" className="w-5 h-5 text-orange-500" />
                Payment Reminders
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Automatically remind clients about unpaid invoices
              </CardDescription>
            </div>
            <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
          </div>
        </CardHeader>
        {reminderEnabled && (
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reminder Schedule</Label>
              <p className="text-[11px] text-muted-foreground mb-2">
                Days relative to due date (negative = before, positive = after)
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: -7, label: '7 days before' },
                  { value: -3, label: '3 days before' },
                  { value: 0, label: 'On due date' },
                  { value: 3, label: '3 days after' },
                  { value: 7, label: '7 days after' },
                  { value: 14, label: '14 days after' },
                ].map((opt) => (
                  <Badge
                    key={opt.value}
                    variant={reminderDays.includes(opt.value) ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px] sm:text-xs"
                    onClick={() => {
                      if (reminderDays.includes(opt.value)) {
                        setReminderDays(reminderDays.filter(d => d !== opt.value));
                      } else {
                        setReminderDays([...reminderDays, opt.value].sort((a, b) => a - b));
                      }
                    }}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-xs font-medium">Reminder Channels</Label>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:letter-linear" className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Email</span>
                </div>
                <Switch checked={reminderEmail} onCheckedChange={setReminderEmail} />
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <Icon icon="logos:whatsapp-icon" className="w-4 h-4" />
                  <span className="text-sm">WhatsApp</span>
                  <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                </div>
                <Switch checked={reminderWhatsApp} onCheckedChange={setReminderWhatsApp} disabled />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Max Reminders per Invoice</Label>
              <Select value={String(maxReminders)} onValueChange={(v) => setMaxReminders(parseInt(v))}>
                <SelectTrigger className="h-9 sm:h-10 text-sm w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Alert className="p-2.5">
              <Icon icon="solar:info-circle-linear" className="h-3.5 w-3.5" />
              <AlertDescription className="text-[11px] ml-2">
                Reminders are sent automatically at 10 AM daily. They stop when the invoice is paid.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="h-9 sm:h-10">
          {isSaving ? (
            <Icon icon="solar:spinner-bold" className="w-4 h-4 mr-1.5 animate-spin" />
          ) : (
            <Icon icon="solar:diskette-bold" className="w-4 h-4 mr-1.5" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
