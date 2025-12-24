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
import { SettingsCard } from '@/components/settings/settings-ui';

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
    return 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300';
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-4">
        <SettingsCard
          title="Personal Information"
          description="Your public profile details"
          icon="solar:user-circle-linear"
        >
          <div className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
              <Avatar className="h-16 w-16 border border-stone-200 dark:border-stone-700">
                <AvatarImage
                  src={(appUser as { photoURL?: string })?.photoURL || undefined}
                  alt={appUser?.name || 'User'}
                />
                <AvatarFallback className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-lg font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium">{appUser?.name || 'Unnamed User'}</p>
                    <p className="text-sm text-muted-foreground">{appUser?.email}</p>
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      <Icon icon="solar:pen-linear" className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('px-2 py-0.5 text-[10px] font-medium uppercase rounded-md', getRoleBadge(appUser?.role))}>
                    {appUser?.role || 'User'}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                    {appUser?.type || 'Office'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                <Icon icon="solar:camera-linear" className="h-3.5 w-3.5 mr-1.5" />
                Change
              </Button>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{appUser?.name || '—'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Phone Number</Label>
                {isEditing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone"
                    className="h-9"
                  />
                ) : (
                  <p className="text-sm font-medium py-2">{appUser?.phone || '—'}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <p className="text-sm font-medium py-2">{appUser?.email || '—'}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Member Since</Label>
                <p className="text-sm font-medium py-2">{formatDate(appUser?.createdAt)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
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
                <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </SettingsCard>

        {/* Account Details Card - Keeping it as it shows slighty different info presentation or could be removed in future */}
        <SettingsCard
          title="Account Details"
          description="Your account information"
          icon="solar:info-circle-linear"
        >
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Email Address</Label>
              <p className="text-sm font-medium py-2">{appUser?.email || '—'}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Member Since</Label>
              <p className="text-sm font-medium py-2">{formatDate(appUser?.createdAt)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="flex items-center gap-2 py-2">
                <span className={cn('px-2 py-0.5 text-[10px] font-medium uppercase rounded-md', getRoleBadge(appUser?.role))}>
                  {appUser?.role || 'User'}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-md bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                  {appUser?.type || 'Office'}
                </span>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>

      {/* Danger Zone Section */}
      <div className="max-w-4xl pt-4">
        <SettingsCard
          title="Danger Zone"
          description="Irreversible account actions"
          icon="solar:danger-triangle-linear"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              Delete Account
            </Button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}
