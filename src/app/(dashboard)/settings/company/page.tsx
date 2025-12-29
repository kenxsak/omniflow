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
import { useState, useEffect, useCallback } from 'react';
import { getCompany } from '@/lib/saas-data';
import { updateCompanyProfileAction } from '@/app/actions/profile-actions';
import type { Company } from '@/types/saas';
import { cn } from '@/lib/utils';
import { SettingsCard } from '@/components/settings/settings-ui';
import { EmbedFormGenerator } from '@/components/settings/embed-form-generator';

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
                <p className="text-xs font-mono bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 break-all">
                  {company.id}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                    <div className={cn('h-2 w-2 rounded-full', company.status === 'active' ? 'bg-emerald-500' : 'bg-stone-400')} />
                    <p className="text-sm font-medium capitalize">{company.status}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
                  <p className="text-sm font-medium bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 capitalize">
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
    </div>
  );
}
