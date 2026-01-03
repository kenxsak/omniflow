'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { SettingsCard, SettingsRow } from '@/components/settings/settings-ui';
import { TwoFactorSetup } from '@/components/settings/two-factor-setup';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getAuth, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

export default function SecuritySettingsPage() {
  const { firebaseUser, appUser } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!firebaseUser) return;

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        firebaseUser.email!,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, newPassword);

      toast({
        title: 'Password Changed',
        description: 'Your password has been updated successfully.',
      });

      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      let message = 'Failed to change password';
      if (error.code === 'auth/wrong-password') {
        message = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        message = 'New password is too weak';
      }
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="max-w-4xl">
        <SettingsCard
          title="Security Preferences"
          description="Manage your account security settings"
          icon="solar:shield-keyhole-linear"
        >
          <div className="divide-y divide-stone-200 dark:divide-stone-800">
            {/* Password */}
            <SettingsRow 
              label="Password" 
              description="Change your account password" 
              border={true}
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs"
                onClick={() => setShowPasswordDialog(true)}
              >
                Change Password
              </Button>
            </SettingsRow>

            {/* Two-Factor Authentication */}
            <div className="py-3 sm:py-4">
              <TwoFactorSetup />
            </div>

            {/* Email Verification Status */}
            <SettingsRow
              label="Email Verification"
              description={firebaseUser?.emailVerified ? 'Your email is verified' : 'Please verify your email'}
              border={true}
            >
              {firebaseUser?.emailVerified ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Icon icon="solar:check-circle-linear" className="h-3 w-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  <Icon icon="solar:danger-triangle-linear" className="h-3 w-3" />
                  Not Verified
                </span>
              )}
            </SettingsRow>

            {/* Account Info */}
            <SettingsRow
              label="Account Email"
              description={appUser?.email || 'Not available'}
              border={false}
            >
              <span className="text-xs text-muted-foreground">
                Contact support to change
              </span>
            </SettingsRow>
          </div>
        </SettingsCard>

        {/* Security Tips */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
          <div className="flex items-start gap-3">
            <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-medium mb-1">Security Tips</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Use a strong, unique password with at least 8 characters</li>
                <li>• Enable two-factor authentication for extra security</li>
                <li>• Never share your password or backup codes with anyone</li>
                <li>• Log out from shared or public devices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Change Password</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-xs">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-xs">
                New Password
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm-password" className="text-xs">
                Confirm New Password
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 h-9 sm:h-10"
                onClick={() => setShowPasswordDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:flex-1 h-9 sm:h-10"
                onClick={handleChangePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword || isChangingPassword}
              >
                {isChangingPassword ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
