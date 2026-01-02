'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect, useCallback, useRef } from 'react';
import { getCompany } from '@/lib/saas-data';
import { updateCompanyProfileAction } from '@/app/actions/profile-actions';
import type { Company, CompanyBranding } from '@/types/saas';
import { cn } from '@/lib/utils';
import { SettingsCard } from '@/components/settings/settings-ui';
import { EmbedFormGenerator } from '@/components/settings/embed-form-generator';
import { uploadImageAction } from '@/app/actions/image-upload-actions';

const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR', timezone: 'Asia/Kolkata', flag: '🇮🇳' },
  { code: 'US', name: 'United States', currency: 'USD', timezone: 'America/New_York', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', currency: 'AUD', timezone: 'Australia/Sydney', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin', flag: '🇩🇪' },
  { code: 'FR', name: 'France', currency: 'EUR', timezone: 'Europe/Paris', flag: '🇫🇷' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', timezone: 'Asia/Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', timezone: 'Asia/Dubai', flag: '🇦🇪' },
  { code: 'JP', name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo', flag: '🇯🇵' },
].sort((a, b) => a.name.localeCompare(b.name));

const TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function CompanySettingsPage() {
  const { appUser, isAdmin, refreshAuthContext } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [timezone, setTimezone] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Company Branding
  const [branding, setBranding] = useState<CompanyBranding>({});
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const loadCompanyData = useCallback(async () => {
    if (appUser?.companyId) {
      setIsLoading(true);
      try {
        const companyData = await getCompany(appUser.companyId);
        if (companyData) {
          setCompany(companyData);
          setCompanyName(companyData.name || '');
          setCompanyWebsite(companyData.website || '');
          setSelectedCountryCode(companyData.countryCode || '');
          setCurrencyCode(companyData.currencyCode || '');
          setTimezone(companyData.timezone || '');
          setRegisteredEmail(companyData.registeredEmail || '');
          setPhone(companyData.phone || '');
          setAddress(companyData.address || '');
          setBranding(companyData.companyBranding || {});
        }
      } catch (error) {
        console.error('Error loading company data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load company details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [appUser, toast]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setCurrencyCode(country.currency);
      setTimezone(country.timezone);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !appUser?.companyId) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({ title: 'Please select a valid image (JPG, PNG, GIF, or WebP)', variant: 'destructive' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image must be less than 2MB', variant: 'destructive' });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      // Upload via server action
      const result = await uploadImageAction(base64, `logo-${appUser.companyId}`);
      
      if (result.success && result.url) {
        setBranding(prev => ({ ...prev, logoUrl: result.url }));
        toast({ title: 'Logo uploaded! Click Save to apply.' });
      } else {
        toast({ title: result.error || 'Upload failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({ title: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!appUser?.idToken) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return;
    }
    if (!companyName.trim()) {
      toast({
        title: 'Error',
        description: 'Company name is required',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const selectedCountry = COUNTRIES.find((c) => c.code === selectedCountryCode);
      const result = await updateCompanyProfileAction({
        idToken: appUser.idToken,
        data: {
          name: companyName.trim(),
          website: companyWebsite.trim() || undefined,
          country: selectedCountry?.name || undefined,
          countryCode: selectedCountryCode || undefined,
          currencyCode: currencyCode || undefined,
          timezone: timezone || undefined,
          registeredEmail: registeredEmail.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          companyBranding: {
            logoUrl: branding.logoUrl,
            logoDarkUrl: branding.logoDarkUrl,
            primaryColor: branding.primaryColor,
            accentColor: branding.accentColor,
            tagline: branding.tagline,
          },
        },
      });

      if (result.success) {
        toast({ title: 'Organization details updated successfully' });
        refreshAuthContext();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Organization</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your organization settings</p>
        </div>
        <div className="h-8 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-lg w-full" />
        <div className="space-y-4">
          <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-xl" />
          <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Actions */}
      <div className="flex items-center justify-end">
        {isAdmin && (
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8">
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        )}
      </div>

      {/* Read-only notice for non-admins */}
      {!isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <Icon icon="solar:lock-linear" className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            You are viewing in read-only mode. Contact your administrator to make changes.
          </p>
        </div>
      )}

      {/* Basic Info */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SettingsCard
          title="Basic Information"
          description="Organization name and website"
          icon="solar:buildings-2-linear"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Organization Name</Label>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your Company"
                disabled={!isAdmin}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                placeholder="https://yourcompany.com"
                disabled={!isAdmin}
                className="h-9"
              />
            </div>
          </div>
        </SettingsCard>

        {/* Location & Currency */}
        <SettingsCard
          title="Location & Currency"
          description="Regional settings for your business"
          icon="solar:map-point-linear"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Country</Label>
              <Select
                value={selectedCountryCode}
                onValueChange={handleCountryChange}
                disabled={!isAdmin}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select country">
                    {selectedCountryCode && (
                      <span className="flex items-center gap-2">
                        <span>{COUNTRIES.find((c) => c.code === selectedCountryCode)?.flag}</span>
                        {COUNTRIES.find((c) => c.code === selectedCountryCode)?.name}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        {country.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Input
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
                  placeholder="USD"
                  disabled={!isAdmin}
                  className="h-9 uppercase"
                  maxLength={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone} disabled={!isAdmin}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Contact Info */}
        <SettingsCard
          title="Contact Information"
          description="Business contact details"
          icon="solar:phone-linear"
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Business Email</Label>
                <Input
                  type="email"
                  value={registeredEmail}
                  onChange={(e) => setRegisteredEmail(e.target.value)}
                  placeholder="info@company.com"
                  disabled={!isAdmin}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  disabled={!isAdmin}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Business Address</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State, ZIP"
                disabled={!isAdmin}
                className="h-9"
              />
            </div>
          </div>
        </SettingsCard>

        {/* Account Info */}
        {company && (
          <SettingsCard
            title="Account Information"
            description="Your organization's account details"
            icon="solar:info-circle-linear"
          >
            <div className="space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground mb-1">Organization ID</p>
                <p className="text-[10px] sm:text-xs font-mono bg-stone-50 dark:bg-stone-900 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 break-all overflow-hidden">
                  {company.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', company.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400')} />
                    <p className="text-xs sm:text-sm font-medium capitalize truncate">{company.status}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
                  <p className="text-xs sm:text-sm font-medium bg-stone-50 dark:bg-stone-900 px-3 py-2.5 rounded-lg border border-stone-200 dark:border-stone-800 capitalize truncate">
                    {company.planId?.replace('plan_', '')}
                  </p>
                </div>
              </div>
            </div>
          </SettingsCard>
        )}
      </div>

      {/* Lead Capture Embed Form */}
      {isAdmin && (
        <div className="pt-2">
          <EmbedFormGenerator />
        </div>
      )}

      {/* Company Branding for Documents */}
      {isAdmin && (
        <SettingsCard
          title="Document Branding"
          description="Logo and colors for quotes, invoices, and emails"
          icon="solar:palette-linear"
        >
          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Company Logo</Label>
              <div className="flex items-start gap-3 sm:gap-4">
                {/* Logo Preview */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center bg-stone-50 dark:bg-stone-900 overflow-hidden shrink-0">
                  {branding.logoUrl ? (
                    <img 
                      src={branding.logoUrl} 
                      alt="Company logo" 
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <Icon icon="solar:gallery-add-linear" className="w-6 h-6 text-muted-foreground/50" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="h-8 text-xs"
                    >
                      {isUploadingLogo ? (
                        <>
                          <Icon icon="solar:refresh-linear" className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Icon icon="solar:upload-linear" className="w-3.5 h-3.5 mr-1.5" />
                          Upload
                        </>
                      )}
                    </Button>
                    {branding.logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: undefined }))}
                        className="h-8 text-xs text-destructive hover:text-destructive"
                      >
                        <Icon icon="solar:trash-bin-2-linear" className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    PNG, JPG up to 2MB. Or paste URL below.
                  </p>
                </div>
              </div>
              {/* URL Input Option */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground">Or paste logo URL</Label>
                <Input
                  value={branding.logoUrl || ''}
                  onChange={(e) => setBranding(prev => ({ ...prev, logoUrl: e.target.value || undefined }))}
                  placeholder="https://example.com/logo.png"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Brand Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.primaryColor || '#10b981'}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer"
                  />
                  <Input
                    value={branding.primaryColor || '#10b981'}
                    onChange={(e) => setBranding(prev => ({ ...prev, primaryColor: e.target.value }))}
                    placeholder="#10b981"
                    className="h-9 text-xs font-mono flex-1"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={branding.accentColor || '#3b82f6'}
                    onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-9 h-9 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer"
                  />
                  <Input
                    value={branding.accentColor || '#3b82f6'}
                    onChange={(e) => setBranding(prev => ({ ...prev, accentColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="h-9 text-xs font-mono flex-1"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tagline (optional)</Label>
              <Input
                value={branding.tagline || ''}
                onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="Your company tagline for documents"
                className="h-9 text-sm"
                maxLength={100}
              />
            </div>

            {/* Preview */}
            {(branding.logoUrl || branding.primaryColor) && (
              <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
                <div className="flex items-center gap-3">
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                  )}
                  <div>
                    <p className="text-sm font-semibold" style={{ color: branding.primaryColor || '#10b981' }}>
                      {companyName || 'Your Company'}
                    </p>
                    {branding.tagline && (
                      <p className="text-[10px] text-muted-foreground">{branding.tagline}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SettingsCard>
      )}
    </div>
  );
}
