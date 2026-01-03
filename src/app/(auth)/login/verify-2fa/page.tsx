'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { verifyTwoFactorCode } from '@/app/actions/two-factor-actions';
import { completeLoginAfter2FA } from '@/lib/lightweight-auth';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { LogoIcon } from '@/components/ui/logo';

export default function Verify2FAPage() {
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // Get user data from URL params and sessionStorage
    const uid = searchParams.get('uid');
    if (!uid) {
      router.push('/login');
      return;
    }
    setUserId(uid);

    // Get email from sessionStorage
    try {
      const pending2FA = sessionStorage.getItem('pending2FA');
      if (pending2FA) {
        const data = JSON.parse(pending2FA);
        if (data.email) setEmail(data.email);
      }
    } catch (e) {
      // Ignore
    }
  }, [searchParams, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !twoFactorCode) {
      toast({
        title: 'Enter Code',
        description: 'Please enter your 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    
    // Verify the 2FA code
    const verifyResult = await verifyTwoFactorCode(userId, twoFactorCode);
    
    if (!verifyResult.success) {
      toast({
        title: 'Invalid Code',
        description: verifyResult.error || 'The verification code is incorrect.',
        variant: 'destructive',
      });
      setIsVerifying(false);
      setTwoFactorCode('');
      return;
    }
    
    // Get stored password
    const storedPassword = sessionStorage.getItem('pending2FAPassword');
    if (!storedPassword || !email) {
      toast({
        title: 'Session Expired',
        description: 'Please login again.',
        variant: 'destructive',
      });
      sessionStorage.removeItem('pending2FA');
      sessionStorage.removeItem('pending2FAPassword');
      router.push('/login');
      return;
    }
    
    // Complete the login
    const loginResult = await completeLoginAfter2FA(email, storedPassword);
    
    // Clear stored data
    sessionStorage.removeItem('pending2FA');
    sessionStorage.removeItem('pending2FAPassword');
    
    if (loginResult.success) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      // Small delay so user can see the success message
      await new Promise((resolve) => setTimeout(resolve, 800));
      window.location.href = '/dashboard';
    } else {
      toast({
        title: 'Login Failed',
        description: loginResult.error || 'Could not complete login.',
        variant: 'destructive',
      });
      router.push('/login');
    }
  };

  const handleBack = () => {
    sessionStorage.removeItem('pending2FA');
    sessionStorage.removeItem('pending2FAPassword');
    router.push('/login');
  };

  if (!userId) {
    return null;
  }

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-3 sm:px-4 pt-16">
        <div className="flex flex-col items-center gap-4 sm:gap-6 flex-grow justify-center w-full max-w-sm">
          <LogoIcon size={48} />

          <form noValidate onSubmit={handleVerify} className="flex flex-col items-center w-full isolate">
            <div className="p-4 sm:p-6 flex flex-col gap-1 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 z-10 w-full">
              <h3 className="text-stone-700 dark:text-stone-200 font-normal text-xl sm:text-2xl leading-[120%]">
                Two-Factor Authentication
              </h3>
              <p className="text-stone-500 dark:text-stone-400 font-normal text-xs sm:text-sm">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex flex-col items-stretch gap-4 sm:gap-6 pt-10 sm:pt-12 pb-4 sm:pb-6 w-full -mt-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-2xl">
              <div className="flex flex-col items-stretch gap-4 sm:gap-6 px-4 sm:px-6">
                <div className="flex flex-col gap-1 group">
                  <label htmlFor="twoFactorCode" className="text-xs sm:text-sm font-medium text-stone-800 dark:text-stone-200">
                    Verification Code<span className="text-rose-500">&nbsp;*</span>
                  </label>
                  <input
                    required
                    autoFocus
                    className="w-full p-2 pl-3 outline-none text-sm rounded-lg border h-9 sm:h-10 transition-all duration-100 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600 focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800 text-center tracking-widest font-mono"
                    id="twoFactorCode"
                    placeholder="000000"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9A-Za-z]*"
                    maxLength={8}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                    disabled={isVerifying}
                  />
                  <p className="text-[10px] sm:text-xs text-stone-500 dark:text-stone-400 mt-1">
                    You can also use a backup code
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isVerifying}
                    className="text-center text-sm cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border-2 transition-all ease-in duration-75 whitespace-nowrap select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none active:scale-95 leading-5 rounded-xl px-4 py-1.5 h-9 sm:h-10 w-full sm:flex-1 text-stone-700 dark:text-stone-300 bg-transparent border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || twoFactorCode.length < 6}
                    className="text-center text-sm cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border-2 transition-all ease-in duration-75 whitespace-nowrap select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none active:scale-95 leading-5 rounded-xl px-4 py-1.5 h-9 sm:h-10 w-full sm:flex-1 text-stone-50 bg-stone-700 border-stone-800 hover:bg-stone-800 disabled:bg-stone-700 disabled:border-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700"
                  >
                    {isVerifying ? (
                      <><Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin mr-1" />Verifying...</>
                    ) : (
                      'Verify'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
