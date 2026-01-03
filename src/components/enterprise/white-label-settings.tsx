'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { WhiteLabelSettings } from '@/types/saas';
import { getWhiteLabelSettings, saveWhiteLabelSettings, uploadWhiteLabelAsset } from '@/app/actions/white-label-actions';

const DEFAULT_SETTINGS: WhiteLabelSettings = {
  enabled: false,
  brandName: '',
  primaryColor: '#6366f1',
  primaryForeground: '#ffffff',
  accentColor: '#8b5cf6',
};

export function WhiteLabelSettingsPanel() {
  const { company, user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<WhiteLabelSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingLogoDark, setUploadingLogoDark] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (company?.id) {
      loadSettings();
    }
  }, [company?.id]);

  const loadSettings = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const result = await getWhiteLabelSettings(company.id);
      if (result.success && result.settings) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.settings });
      }
    } catch (error) {
      console.error('Failed to load white-label settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!company?.id || !user?.uid) return;
    setSaving(true);
    try {
      const result = await saveWhiteLabelSettings(company.id, user.uid, settings);
      if (result.success) {
        toast({ title: 'Settings saved', description: 'White-label settings updated successfully.' });
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to save settings', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (
    file: File,
    type: 'logo' | 'logoDark' | 'favicon',
    setUploading: (v: boolean) => void
  ) => {
    if (!company?.id) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyId', company.id);
      formData.append('type', type);

      const result = await uploadWhiteLabelAsset(formData);
      if (result.success && result.url) {
        const fieldMap = { logo: 'logoUrl', logoDark: 'logoDarkUrl', favicon: 'faviconUrl' };
        setSettings(prev => ({ ...prev, [fieldMap[type]]: result.url }));
        toast({ title: 'Uploaded', description: `${type === 'logo' ? 'Logo' : type === 'logoDark' ? 'Dark logo' : 'Favicon'} uploaded successfully.` });
      } else {
        toast({ title: 'Upload failed', description: result.error || 'Failed to upload file', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-12 bg-stone-100 dark:bg-stone-900 rounded-lg animate-pulse" />
        <div className="h-32 bg-stone-100 dark:bg-stone-900 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enable Toggle */}
      <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex-shrink-0">
            <Icon icon="solar:palette-bold" className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm sm:text-base truncate">Enable White-Label</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Custom branding across platform</p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
          className="flex-shrink-0 ml-2"
        />
      </div>

      {/* Brand Identity Section */}
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-200/60 dark:border-stone-800/60">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Icon icon="solar:star-bold" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Brand Identity
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-4">
          {/* Brand Name & Support Email */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="brandName" className="text-xs sm:text-sm">Brand Name</Label>
              <Input
                id="brandName"
                placeholder="Your Company Name"
                value={settings.brandName}
                onChange={(e) => setSettings(prev => ({ ...prev, brandName: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
              <p className="text-[10px] sm:text-xs text-muted-foreground">Replaces the default brand name throughout the app</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supportEmail" className="text-xs sm:text-sm">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                placeholder="support@yourdomain.com"
                value={settings.supportEmail || ''}
                onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                className="h-9 sm:h-10 text-sm"
              />
            </div>
          </div>

          {/* Logo Uploads - Stack on mobile */}
          <div className="space-y-3">
            <Label className="text-xs sm:text-sm">Brand Logos</Label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* Light Logo */}
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">Light</p>
                <div
                  className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:border-primary/50 transition-colors aspect-square flex items-center justify-center"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {settings.logoUrl ? (
                    <img src={settings.logoUrl} alt="Logo" className="max-h-8 sm:max-h-12 max-w-full object-contain" />
                  ) : (
                    <div className="space-y-0.5">
                      <Icon icon="solar:upload-linear" className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-muted-foreground" />
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground">Upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo', setUploadingLogo)}
                />
                {uploadingLogo && <p className="text-[8px] text-center text-muted-foreground">Uploading...</p>}
              </div>

              {/* Dark Logo */}
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">Dark</p>
                <div
                  className="border-2 border-dashed border-stone-600 dark:border-stone-600 rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:border-primary/50 transition-colors bg-stone-800 aspect-square flex items-center justify-center"
                  onClick={() => logoDarkInputRef.current?.click()}
                >
                  {settings.logoDarkUrl ? (
                    <img src={settings.logoDarkUrl} alt="Dark Logo" className="max-h-8 sm:max-h-12 max-w-full object-contain" />
                  ) : (
                    <div className="space-y-0.5">
                      <Icon icon="solar:upload-linear" className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-stone-400" />
                      <p className="text-[8px] sm:text-[10px] text-stone-400">Upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={logoDarkInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logoDark', setUploadingLogoDark)}
                />
                {uploadingLogoDark && <p className="text-[8px] text-center text-muted-foreground">Uploading...</p>}
              </div>

              {/* Favicon */}
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">Favicon</p>
                <div
                  className="border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg p-2 sm:p-3 text-center cursor-pointer hover:border-primary/50 transition-colors aspect-square flex items-center justify-center"
                  onClick={() => faviconInputRef.current?.click()}
                >
                  {settings.faviconUrl ? (
                    <img src={settings.faviconUrl} alt="Favicon" className="max-h-6 sm:max-h-8 max-w-full object-contain" />
                  ) : (
                    <div className="space-y-0.5">
                      <Icon icon="solar:window-frame-linear" className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-muted-foreground" />
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground">32x32</p>
                    </div>
                  )}
                </div>
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/png,image/x-icon"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'favicon', setUploadingFavicon)}
                />
                {uploadingFavicon && <p className="text-[8px] text-center text-muted-foreground">Uploading...</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-200/60 dark:border-stone-800/60">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Icon icon="solar:pallete-2-bold" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Brand Colors
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-3">
          {/* Color inputs - stack on mobile */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="primaryColor" className="text-xs sm:text-sm">Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryColor"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="h-9 sm:h-10 w-12 sm:w-14 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer flex-shrink-0"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#6366f1"
                  className="flex-1 h-9 sm:h-10 text-sm font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="primaryForeground" className="text-xs sm:text-sm">Primary Text</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primaryForeground"
                  value={settings.primaryForeground || '#ffffff'}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryForeground: e.target.value }))}
                  className="h-9 sm:h-10 w-12 sm:w-14 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer flex-shrink-0"
                />
                <Input
                  value={settings.primaryForeground || '#ffffff'}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryForeground: e.target.value }))}
                  placeholder="#ffffff"
                  className="flex-1 h-9 sm:h-10 text-sm font-mono"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="accentColor" className="text-xs sm:text-sm">Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="accentColor"
                  value={settings.accentColor || '#8b5cf6'}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="h-9 sm:h-10 w-12 sm:w-14 rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer flex-shrink-0"
                />
                <Input
                  value={settings.accentColor || '#8b5cf6'}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  placeholder="#8b5cf6"
                  className="flex-1 h-9 sm:h-10 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Color Preview */}
          <div className="p-3 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
            <p className="text-[10px] sm:text-xs text-muted-foreground mb-2">Preview</p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors"
                style={{ backgroundColor: settings.primaryColor, color: settings.primaryForeground }}
              >
                Primary
              </button>
              <button
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium border-2 transition-colors"
                style={{ borderColor: settings.primaryColor, color: settings.primaryColor }}
              >
                Outline
              </button>
              <span
                className="px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium"
                style={{ backgroundColor: settings.accentColor, color: '#fff' }}
              >
                Badge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Domain Section */}
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-200/60 dark:border-stone-800/60">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2 flex-wrap">
            <Icon icon="solar:global-bold" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            <span>Custom Domain</span>
            <Badge variant="outline" className="text-[8px] sm:text-[10px] h-4 sm:h-5 px-1.5">Soon</Badge>
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="customDomain" className="text-xs sm:text-sm">Your Domain</Label>
            <Input
              id="customDomain"
              placeholder="crm.youragency.com"
              value={settings.customDomain || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
              disabled
              className="h-9 sm:h-10 text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Contact support to set up a custom domain.
            </p>
          </div>
        </div>
      </div>

      {/* Legal & Footer Section */}
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-200/60 dark:border-stone-800/60">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Icon icon="solar:document-text-bold" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Legal & Footer
          </h3>
        </div>
        <div className="p-3 sm:p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="privacyPolicyUrl" className="text-xs sm:text-sm">Privacy Policy URL</Label>
            <Input
              id="privacyPolicyUrl"
              type="url"
              placeholder="https://yourdomain.com/privacy"
              value={settings.privacyPolicyUrl || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
              className="h-9 sm:h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="termsOfServiceUrl" className="text-xs sm:text-sm">Terms of Service URL</Label>
            <Input
              id="termsOfServiceUrl"
              type="url"
              placeholder="https://yourdomain.com/terms"
              value={settings.termsOfServiceUrl || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, termsOfServiceUrl: e.target.value }))}
              className="h-9 sm:h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="footerText" className="text-xs sm:text-sm">Footer Text</Label>
            <Input
              id="footerText"
              placeholder="© 2025 Your Company. All rights reserved."
              value={settings.footerText || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, footerText: e.target.value }))}
              className="h-9 sm:h-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Login Page Customization */}
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
        <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-stone-50/50 dark:bg-stone-900/30 border-b border-stone-200/60 dark:border-stone-800/60">
          <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Icon icon="solar:login-3-bold" className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
            Login Page
          </h3>
        </div>
        <div className="p-3 sm:p-4">
          <div className="space-y-1.5">
            <Label htmlFor="loginWelcomeText" className="text-xs sm:text-sm">Welcome Text</Label>
            <Textarea
              id="loginWelcomeText"
              placeholder="Welcome back! Sign in to access your dashboard."
              value={settings.loginWelcomeText || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, loginWelcomeText: e.target.value }))}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </div>
      </div>

      {/* Save Button - Full width on mobile */}
      <div className="pt-1">
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto h-10">
          {saving ? (
            <>
              <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icon icon="solar:diskette-bold" className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
