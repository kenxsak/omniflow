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

// Reusable Settings Card
function SettingsCard({
  title,
  description,
  icon,
  children,
  status,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  status?: 'active' | 'inactive' | 'warning';
}) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center',
              status === 'active'
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : 'bg-stone-100 dark:bg-stone-800'
            )}
          >
            <Icon
              icon={icon}
              className={cn(
                'h-4.5 w-4.5',
                status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-stone-500 dark:text-stone-400'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

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
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Organization
          </h2>
          <p className="text-sm text-stone-500 mt-1">Manage your organization settings</p>
        </div>
        <div className="space-y-4">
          <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />
          <div className="h-48 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Organization
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            {isAdmin
              ? 'Manage your organization profile and settings'
              : 'View your organization details'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-9">
            {isSaving ? (
              <>
                <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        )}
      </div>

      {/* Read-only notice for non-admins */}
      {!isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50">
          <Icon
            icon="solar:lock-linear"
            className="h-4 w-4 text-amber-600 dark:text-amber-400"
          />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You are viewing in read-only mode. Contact your administrator to make changes.
          </p>
        </div>
      )}

      {/* Basic Info */}
      <SettingsCard
        title="Basic Information"
        description="Organization name and website"
        icon="solar:buildings-2-linear"
        status="active"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Organization Name</Label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your Company"
              disabled={!isAdmin}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Website</Label>
            <Input
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://yourcompany.com"
              disabled={!isAdmin}
              className="h-10"
            />
          </div>
        </div>
      </SettingsCard>

      {/* Location & Currency */}
      <SettingsCard
        title="Location & Currency"
        description="Regional settings for your business"
        icon="solar:globe-linear"
      >
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Country</Label>
            <Select
              value={selectedCountryCode}
              onValueChange={handleCountryChange}
              disabled={!isAdmin}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select country">
                  {selectedCountryCode && (
                    <span className="flex items-center gap-2">
                      <span>
                        {COUNTRIES.find((c) => c.code === selectedCountryCode)?.flag}
                      </span>
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
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Currency</Label>
            <Input
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
              placeholder="USD"
              disabled={!isAdmin}
              className="h-10 uppercase"
              maxLength={3}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone} disabled={!isAdmin}>
              <SelectTrigger className="h-10">
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
      </SettingsCard>

      {/* Contact Info */}
      <SettingsCard
        title="Contact Information"
        description="Business contact details"
        icon="solar:phone-linear"
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500">Business Email</Label>
              <Input
                type="email"
                value={registeredEmail}
                onChange={(e) => setRegisteredEmail(e.target.value)}
                placeholder="info@company.com"
                disabled={!isAdmin}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500">Phone Number</Label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                disabled={!isAdmin}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-stone-500">Business Address</Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, City, State, ZIP"
              disabled={!isAdmin}
              className="h-10"
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
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs text-stone-500 mb-1">Organization ID</p>
              <p className="text-sm font-mono text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800">
                {company.id}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">Status</p>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div
                  className={cn(
                    'h-2.5 w-2.5 rounded-full',
                    company.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 capitalize">
                  {company.status}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-1">Current Plan</p>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-800 capitalize">
                {company.planId?.replace('plan_', '')}
              </p>
            </div>
          </div>
        </SettingsCard>
      )}
    </div>
  );
}
