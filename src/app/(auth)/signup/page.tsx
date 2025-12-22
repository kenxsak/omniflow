'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightSignup } from '@/lib/lightweight-auth';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { LogoIcon } from '@/components/ui/logo';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Password validation checks
  const passwordChecks = useMemo(() => ({
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasMinLength: password.length >= 8,
  }), [password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      toast({
        title: 'Error',
        description: 'Please meet all password requirements.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await lightweightSignup(email, password);
      if (result.success) {
        toast({ title: 'Account Created', description: 'Please sign in.' });
        router.push('/login');
      } else {
        toast({
          title: 'Sign Up Failed',
          description: result.error || 'Could not create account.',
          variant: 'destructive',
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Could not create account.';
      toast({
        title: 'Sign Up Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Checkmark component
  const CheckIcon = ({ checked }: { checked: boolean }) => (
    <span className={checked ? 'text-emerald-500' : 'text-stone-300 dark:text-stone-600'}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path
          d="M3.33337 9.66675C3.33337 9.66675 4.33337 9.66675 5.66671 12.0001C5.66671 12.0001 9.37257 5.88897 12.6667 4.66675"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 pt-16">
        <div className="flex flex-col items-center gap-6 flex-grow justify-center w-full max-w-sm">
          {/* Logo Icon */}
          <LogoIcon size={48} />

        {/* Form Container */}
        <div className="flex flex-col w-full isolate">
          {/* Header Card */}
          <div className="p-6 flex flex-col gap-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 z-10 w-full">
            <div className="flex flex-col gap-1">
              <h3 className="text-stone-700 dark:text-stone-200 font-normal text-2xl leading-[120%]">
                Create account
              </h3>
              <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold underline hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  Login.
                </Link>
              </p>
            </div>
          </div>

          {/* Form Fields Card */}
          <div className="flex flex-col items-stretch gap-6 pt-12 pb-6 px-6 w-full -mt-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-2xl">
            <form noValidate onSubmit={handleSignUp} className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                {/* Email Field */}
                <div className="flex flex-col gap-1 group">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-stone-800 dark:text-stone-200"
                    >
                      Email
                      <span className="text-rose-500">&nbsp;*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      required
                      className="w-full p-2 pl-3 outline-none text-sm rounded-lg border max-h-9 transition-all duration-100 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600 focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                      id="email"
                      placeholder=""
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field with Requirements */}
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1 group">
                    <div className="flex justify-between items-center">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-stone-800 dark:text-stone-200"
                      >
                        Password
                        <span className="text-rose-500">&nbsp;*</span>
                      </label>
                    </div>
                    <div className="relative">
                      <input
                        required
                        className="w-full p-2 pl-3 pr-9 outline-none text-sm rounded-lg border max-h-9 transition-all duration-100 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600 focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                        id="password"
                        placeholder=""
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-0 p-2 text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 size-9 cursor-pointer"
                      >
                        <Icon
                          icon={showPassword ? 'solar:eye-linear' : 'solar:eye-closed-linear'}
                          className="w-4 h-4"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <p className="text-stone-500 dark:text-stone-400 font-normal text-xs leading-4">
                        At least 1 special character
                      </p>
                      <CheckIcon checked={passwordChecks.hasSpecialChar} />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-stone-500 dark:text-stone-400 font-normal text-xs leading-4">
                        At least 1 uppercase letter
                      </p>
                      <CheckIcon checked={passwordChecks.hasUppercase} />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-stone-500 dark:text-stone-400 font-normal text-xs leading-4">
                        At least 1 number
                      </p>
                      <CheckIcon checked={passwordChecks.hasNumber} />
                    </div>
                    <div className="flex justify-between">
                      <p className="text-stone-500 dark:text-stone-400 font-normal text-xs leading-4">
                        Min 8 characters
                      </p>
                      <CheckIcon checked={passwordChecks.hasMinLength} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button - Indigo style */}
              <button
                type="submit"
                disabled={isLoading || !isFirebaseConfigured || !isPasswordValid}
                className="text-center text-sm cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border transition-all ease-in duration-75 whitespace-nowrap select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none active:scale-95 leading-5 rounded-xl px-4 py-1.5 h-9 text-white bg-indigo-500 border-indigo-600 hover:bg-indigo-600 dark:text-white dark:bg-indigo-600 dark:hover:bg-indigo-500 dark:border-indigo-500"
              >
                {isLoading ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin mr-1" />
                    Creating...
                  </>
                ) : (
                  'Sign up'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Terms & Privacy */}
        <p className="text-stone-500 dark:text-stone-500 font-normal text-xs text-center">
          By signing up, you agree to OmniFlow{' '}
          <Link
            href="/terms"
            className="underline font-semibold hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Terms
          </Link>{' '}
          and{' '}
          <Link
            href="/privacy-policy"
            className="underline font-semibold hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
