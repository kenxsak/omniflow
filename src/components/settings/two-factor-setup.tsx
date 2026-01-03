'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getTwoFactorStatus,
  initializeTwoFactorSetup,
  verifyAndEnableTwoFactor,
  disableTwoFactor,
  regenerateBackupCodes,
  type TwoFactorStatus,
  type TwoFactorSetupData,
} from '@/app/actions/two-factor-actions';

export function TwoFactorSetup() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'backup'>('qr');
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);

  useEffect(() => {
    loadStatus();
  }, [appUser?.idToken]);

  const loadStatus = async () => {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    const result = await getTwoFactorStatus(appUser.idToken);
    if (result.success && result.status) {
      setStatus(result.status);
    }
    setIsLoading(false);
  };

  const handleStartSetup = async () => {
    if (!appUser?.idToken) return;

    setIsLoading(true);
    const result = await initializeTwoFactorSetup(appUser.idToken);
    
    if (result.success && result.data) {
      setSetupData(result.data);
      setSetupStep('qr');
      setShowSetupDialog(true);
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to start 2FA setup',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleVerifyAndEnable = async () => {
    if (!appUser?.idToken || !verificationCode) return;

    setIsVerifying(true);
    const result = await verifyAndEnableTwoFactor(appUser.idToken, verificationCode);
    
    if (result.success) {
      setSetupStep('backup');
      toast({
        title: '2FA Enabled! 🔐',
        description: 'Two-factor authentication is now active on your account.',
      });
      await loadStatus();
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error || 'Invalid code. Please try again.',
        variant: 'destructive',
      });
    }
    setIsVerifying(false);
  };

  const handleDisable = async () => {
    if (!appUser?.idToken || !verificationCode) return;

    setIsVerifying(true);
    const result = await disableTwoFactor(appUser.idToken, verificationCode);
    
    if (result.success) {
      setShowDisableDialog(false);
      setVerificationCode('');
      toast({
        title: '2FA Disabled',
        description: 'Two-factor authentication has been removed from your account.',
      });
      await loadStatus();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to disable 2FA',
        variant: 'destructive',
      });
    }
    setIsVerifying(false);
  };

  const handleRegenerateBackupCodes = async () => {
    if (!appUser?.idToken || !verificationCode) return;

    setIsVerifying(true);
    const result = await regenerateBackupCodes(appUser.idToken, verificationCode);
    
    if (result.success && result.backupCodes) {
      setNewBackupCodes(result.backupCodes);
      setVerificationCode('');
      toast({
        title: 'Backup Codes Regenerated',
        description: 'Your old backup codes are no longer valid.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to regenerate backup codes',
        variant: 'destructive',
      });
    }
    setIsVerifying(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Copied to clipboard' });
  };

  const closeSetupDialog = () => {
    setShowSetupDialog(false);
    setSetupData(null);
    setVerificationCode('');
    setSetupStep('qr');
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Two-Factor Authentication</span>
            {status?.enabled && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                <Icon icon="solar:shield-check-linear" className="h-3 w-3" />
                Enabled
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {status?.enabled
              ? `Enabled on ${new Date(status.enabledAt!).toLocaleDateString()}`
              : 'Add an extra layer of security using Google Authenticator'}
          </p>
        </div>
        
        <div className="flex gap-2">
          {status?.enabled ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setVerificationCode('');
                  setNewBackupCodes([]);
                  setShowBackupCodesDialog(true);
                }}
              >
                <Icon icon="solar:key-linear" className="h-3.5 w-3.5 mr-1" />
                Backup Codes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => {
                  setVerificationCode('');
                  setShowDisableDialog(true);
                }}
              >
                Disable
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={handleStartSetup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Icon icon="solar:shield-plus-linear" className="h-3.5 w-3.5 mr-1" />
              )}
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={closeSetupDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="solar:shield-keyhole-linear" className="h-5 w-5 text-primary" />
              {setupStep === 'backup' ? 'Save Backup Codes' : 'Set Up 2FA'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              {setupStep === 'qr' && 'Scan the QR code with Google Authenticator'}
              {setupStep === 'verify' && 'Enter the 6-digit code from your authenticator app'}
              {setupStep === 'backup' && 'Save these codes in a safe place'}
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'qr' && setupData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qrCodeUri)}`}
                  alt="2FA QR Code"
                  className="w-40 h-40 sm:w-48 sm:h-48"
                />
              </div>

              {/* Manual Entry */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Can't scan? Enter this code manually:
                </Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 text-xs font-mono bg-muted rounded break-all">
                    {setupData.secret}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(setupData.secret)}
                  >
                    <Icon icon="solar:copy-linear" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                className="w-full h-9 sm:h-10"
                onClick={() => setSetupStep('verify')}
              >
                Continue
                <Icon icon="solar:arrow-right-linear" className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="verify-code" className="text-xs">
                  Verification Code
                </Label>
                <Input
                  id="verify-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="h-9 sm:h-10 text-center text-lg font-mono tracking-widest"
                  autoFocus
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="w-full sm:flex-1 h-9 sm:h-10"
                  onClick={() => setSetupStep('qr')}
                >
                  Back
                </Button>
                <Button
                  className="w-full sm:flex-1 h-9 sm:h-10"
                  onClick={handleVerifyAndEnable}
                  disabled={verificationCode.length !== 6 || isVerifying}
                >
                  {isVerifying ? (
                    <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Icon icon="solar:shield-check-linear" className="h-4 w-4 mr-1" />
                  )}
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {setupStep === 'backup' && setupData && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Save these backup codes now. You won't be able to see them again!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code, i) => (
                  <code
                    key={i}
                    className="p-2 text-xs font-mono text-center bg-muted rounded"
                  >
                    {code}
                  </code>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full h-9"
                onClick={() => copyToClipboard(setupData.backupCodes.join('\n'))}
              >
                <Icon icon="solar:copy-linear" className="h-4 w-4 mr-1" />
                Copy All Codes
              </Button>

              <Button className="w-full h-9 sm:h-10" onClick={closeSetupDialog}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg text-destructive">
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter your authenticator code or a backup code to disable 2FA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="disable-code" className="text-xs">
                Verification Code
              </Label>
              <Input
                id="disable-code"
                type="text"
                placeholder="Enter code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button
                variant="outline"
                className="w-full sm:flex-1 h-9 sm:h-10"
                onClick={() => setShowDisableDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:flex-1 h-9 sm:h-10"
                onClick={handleDisable}
                disabled={!verificationCode || isVerifying}
              >
                {isVerifying ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">
              Backup Codes
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Generate new backup codes. Your old codes will be invalidated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {newBackupCodes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {newBackupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="p-2 text-xs font-mono text-center bg-muted rounded"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full h-9"
                  onClick={() => copyToClipboard(newBackupCodes.join('\n'))}
                >
                  <Icon icon="solar:copy-linear" className="h-4 w-4 mr-1" />
                  Copy All Codes
                </Button>
                <Button
                  className="w-full h-9 sm:h-10"
                  onClick={() => {
                    setShowBackupCodesDialog(false);
                    setNewBackupCodes([]);
                  }}
                >
                  Done
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="backup-code" className="text-xs">
                    Enter your authenticator code to regenerate
                  </Label>
                  <Input
                    id="backup-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:flex-1 h-9 sm:h-10"
                    onClick={() => setShowBackupCodesDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-full sm:flex-1 h-9 sm:h-10"
                    onClick={handleRegenerateBackupCodes}
                    disabled={verificationCode.length !== 6 || isVerifying}
                  >
                    {isVerifying ? (
                      <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Regenerate
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
