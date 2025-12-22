'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions/profile-actions';
import { cn } from '@/lib/utils';

// Reusable Settings Card Component
function SettingsCard({
  title,
  description,
  icon,
  children,
  action,
  status,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  status?: 'active' | 'inactive' | 'warning';
}) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'h-9 w-9 rounded-xl flex items-center justify-center',
              status === 'active'
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : status === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-stone-100 dark:bg-stone-800'
            )}
          >
            <Icon
              icon={icon}
              className={cn(
                'h-4.5 w-4.5',
                status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : status === 'warning'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-stone-500 dark:text-stone-400'
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">
              {description}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// Settings Row Component
function SettingsRow({
  label,
  description,
  children,
  border = true,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between py-4',
        border && 'border-b border-stone-100 dark:border-stone-800/60 last:border-0'
      )}
    >
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
          {label}
        </p>
        {description && (
          <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  const { appUser, refreshAuthContext } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Initialize form values when appUser loads
  useEffect(() => {
    if (appUser) {
      setName(appUser.name || '');
      setPhone(appUser.phone || '');
    }
  }, [appUser]);

  const userInitials = appUser?.name
    ? appUser.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    : appUser?.email?.charAt(0).toUpperCase() || 'U';

  const handleSave = async () => {
    if (!appUser?.idToken) {
      toast({ title: 'Error', description: 'Please sign in again', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateUserProfileAction({
        idToken: appUser.idToken,
        data: {
          name: name.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });

      if (result.success) {
        toast({ title: 'Profile updated successfully' });
        setIsEditing(false);
        refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(appUser?.name || '');
    setPhone(appUser?.phone || '');
    setIsEditing(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRoleBadge = (role?: string) => {
    const roleStyles: Record<string, string> = {
      superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      manager: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      user: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-400',
    };
    return roleStyles[role || 'user'] || roleStyles.user;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
          Profile
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Overview Card */}
      <SettingsCard
        title="Personal Information"
        description="Your public profile details"
        icon="solar:user-circle-linear"
        status="active"
        action={
          !isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 text-xs gap-1.5"
            >
              <Icon icon="solar:pen-linear" className="h-3.5 w-3.5" />
              Edit
            </Button>
          ) : null
        }
      >
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4 pb-4 border-b border-stone-100 dark:border-stone-800/60">
            <Avatar className="h-20 w-20 border-2 border-stone-200 dark:border-stone-700 shadow-sm">
              <AvatarImage
                src={(appUser as { photoURL?: string })?.photoURL || undefined}
                alt={appUser?.name || 'User'}
              />
              <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 text-stone-700 dark:text-stone-300 text-xl font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-base font-semibold text-stone-900 dark:text-stone-100">
                {appUser?.name || 'Unnamed User'}
              </p>
              <p className="text-sm text-stone-500 dark:text-stone-500">
                {appUser?.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md',
                    getRoleBadge(appUser?.role)
                  )}
                >
                  {appUser?.role || 'User'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                  {appUser?.type || 'Office'}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-stone-500 hover:text-stone-700"
            >
              <Icon icon="solar:camera-linear" className="h-3.5 w-3.5 mr-1.5" />
              Change
            </Button>
          </div>

          {/* Form Fields */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500 dark:text-stone-500">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="h-10"
                />
              ) : (
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 py-2.5">
                  {appUser?.name || '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500 dark:text-stone-500">
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone"
                  className="h-10"
                />
              ) : (
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100 py-2.5">
                  {appUser?.phone || '—'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500 dark:text-stone-500">
                Email Address
              </Label>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 py-2.5">
                {appUser?.email || '—'}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-stone-500 dark:text-stone-500">
                Member Since
              </Label>
              <p className="text-sm font-medium text-stone-900 dark:text-stone-100 py-2.5">
                {formatDate(appUser?.createdAt)}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-stone-100 dark:border-stone-800/60">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="h-9 px-4"
              >
                {isSaving ? (
                  <>
                    <Icon
                      icon="solar:refresh-linear"
                      className="h-4 w-4 mr-2 animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="h-9"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Security Section */}
      <SettingsCard
        title="Security"
        description="Manage your account security settings"
        icon="solar:shield-keyhole-linear"
      >
        <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
          <SettingsRow
            label="Password"
            description="Last changed 30 days ago"
            border={true}
          >
            <Button variant="outline" size="sm" className="h-8 text-xs">
              Change Password
            </Button>
          </SettingsRow>

          <SettingsRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            border={true}
          >
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Icon icon="solar:shield-plus-linear" className="h-3.5 w-3.5 mr-1.5" />
              Enable
            </Button>
          </SettingsRow>

          <SettingsRow
            label="Active Sessions"
            description="Manage devices where you're logged in"
            border={false}
          >
            <Button variant="ghost" size="sm" className="h-8 text-xs text-stone-500">
              View All
              <Icon icon="solar:arrow-right-linear" className="h-3.5 w-3.5 ml-1" />
            </Button>
          </SettingsRow>
        </div>
      </SettingsCard>

      {/* Danger Zone */}
      <SettingsCard
        title="Danger Zone"
        description="Irreversible account actions"
        icon="solar:danger-triangle-linear"
        status="warning"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
              Delete Account
            </p>
            <p className="text-xs text-stone-500 dark:text-stone-500 mt-0.5">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 dark:border-red-900 dark:hover:bg-red-950"
          >
            Delete Account
          </Button>
        </div>
      </SettingsCard>
    </div>
  );
}
