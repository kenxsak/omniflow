'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAction } from '@/app/actions/profile-actions';
import { cn } from '@/lib/utils';

export default function ProfileSettingsPage() {
  const { appUser, refreshAuthContext } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (appUser) {
      setName(appUser.name || '');
      setPhone(appUser.phone || '');
    }
  }, [appUser]);

  const userInitials = appUser?.name
    ? appUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
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
        data: { name: name.trim() || undefined, phone: phone.trim() || undefined },
      });

      if (result.success) {
        toast({ title: 'Profile updated' });
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
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getRoleBadge = () => {
    const role = appUser?.role?.toLowerCase();
    if (role === 'admin' || role === 'superadmin') {
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300';
    }
    if (role === 'manager') {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    }
    return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Cards */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center">
                <Icon icon="solar:user-circle-linear" className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">Personal Information</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Your profile details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-4">
            {/* Avatar Section */}
            <div className="flex items-start gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border border-stone-200 dark:border-stone-700">
                <AvatarImage src={(appUser as { photoURL?: string })?.photoURL || undefined} alt={appUser?.name || 'User'} />
                <AvatarFallback className="bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 text-violet-700 dark:text-violet-300 text-sm sm:text-base font-medium">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-medium truncate">{appUser?.name || 'Unnamed User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{appUser?.email}</p>
                  </div>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-7 sm:h-8 text-xs shrink-0">
                      <Icon icon="solar:pen-linear" className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <Badge className={cn('text-[9px] sm:text-[10px] px-1.5 py-0', getRoleBadge())}>
                    {appUser?.role?.toUpperCase() || 'USER'}
                  </Badge>
                  <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                    {appUser?.type?.toUpperCase() || 'OFFICE'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Full Name</Label>
                {isEditing ? (
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-8 sm:h-9 text-sm" />
                ) : (
                  <p className="text-xs sm:text-sm font-medium py-1.5">{appUser?.name || '—'}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Phone</Label>
                {isEditing ? (
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="h-8 sm:h-9 text-sm" />
                ) : (
                  <p className="text-xs sm:text-sm font-medium py-1.5">{appUser?.phone || '—'}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Email</Label>
                <p className="text-xs sm:text-sm font-medium py-1.5 truncate">{appUser?.email || '—'}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] sm:text-xs text-muted-foreground">Member Since</Label>
                <p className="text-xs sm:text-sm font-medium py-1.5">{formatDate(appUser?.createdAt)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <Button variant="outline" size="sm" onClick={handleCancel} className="h-8 sm:h-9 text-xs w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8 sm:h-9 text-xs w-full sm:w-auto">
                  {isSaving ? (
                    <>
                      <Icon icon="solar:refresh-linear" className="h-3 w-3 mr-1.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">Account Details</CardTitle>
                <CardDescription className="text-[10px] sm:text-xs">Your account information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 space-y-3 sm:space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Email Address</Label>
              <p className="text-xs sm:text-sm font-medium py-1.5 truncate">{appUser?.email || '—'}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Member Since</Label>
              <p className="text-xs sm:text-sm font-medium py-1.5">{formatDate(appUser?.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] sm:text-xs text-muted-foreground">Role</Label>
              <div className="flex items-center gap-1.5 py-1.5">
                <Badge className={cn('text-[9px] sm:text-[10px] px-1.5 py-0', getRoleBadge())}>
                  {appUser?.role?.toUpperCase() || 'USER'}
                </Badge>
                <Badge className="text-[9px] sm:text-[10px] px-1.5 py-0 bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
                  {appUser?.type?.toUpperCase() || 'OFFICE'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      <Card className="border-rose-200 dark:border-rose-900/50">
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
              <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle className="text-sm sm:text-base text-rose-700 dark:text-rose-300">Danger Zone</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs">Irreversible actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-medium">Delete Account</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                Permanently delete your account and all data
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 sm:h-9 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950 w-full sm:w-auto"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
