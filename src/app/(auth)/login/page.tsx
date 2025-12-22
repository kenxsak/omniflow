'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightLogin } from '@/lib/lightweight-auth';
import { PublicNavbar } from '@/components/layout/public-navbar';
import { LogoIcon } from '@/components/ui/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await lightweightLogin(email, password);

    if (result.success) {
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.location.href = '/dashboard';
    } else {
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-4 pt-16">
        <div className="flex flex-col items-center gap-6 flex-grow justify-center w-full max-w-sm">
          {/* Logo Icon */}
          <LogoIcon size={48} />

        {/* Form Container */}
        <form noValidate onSubmit={handleLogin} className="flex flex-col items-center w-full isolate">
          {/* Header Card */}
          <div className="p-6 flex flex-col gap-1 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 z-10 w-full">
            <h3 className="text-stone-700 dark:text-stone-200 font-normal text-2xl leading-[120%]">
              Login
            </h3>
            <p className="text-stone-500 dark:text-stone-400 font-normal text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold underline hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Form Fields Card */}
          <div className="flex flex-col items-stretch gap-6 pt-12 pb-6 w-full -mt-6 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-2xl">
            <div className="flex flex-col items-stretch gap-6 px-6">
              <div className="flex flex-col items-stretch gap-4">
                {/* Email Field */}
                <div className="flex flex-col gap-1 group">
                  <div className="flex justify-between items-center">
                    <label htmlFor="email" className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      Email
                      <span className="text-rose-500">&nbsp;*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      required
                      className="w-full p-2 pl-3 outline-none text-sm rounded-lg border max-h-9 transition-all duration-100 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600 focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                      id="email"
                      placeholder="you@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="flex flex-col gap-1 group">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-sm font-medium text-stone-800 dark:text-stone-200">
                      Password
                      <span className="text-rose-500">&nbsp;*</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      tabIndex={-1}
                      className="text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 font-normal text-[10px] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      required
                      className="w-full p-2 pl-3 pr-9 outline-none text-sm rounded-lg border max-h-9 transition-all duration-100 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-600 focus:border-stone-400 dark:focus:border-stone-500 focus:ring-2 focus:ring-stone-200 dark:focus:ring-stone-800"
                      id="password"
                      placeholder="••••••••"
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
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFirebaseConfigured}
                className="text-center text-sm cursor-pointer box-border flex items-center justify-center font-semibold font-mono uppercase border-2 transition-all ease-in duration-75 whitespace-nowrap select-none disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed gap-x-1 active:shadow-none active:scale-95 leading-5 rounded-xl px-4 py-1.5 h-9 text-stone-50 bg-stone-700 border-stone-800 hover:bg-stone-800 disabled:bg-stone-700 disabled:border-stone-800 dark:border-stone-600 dark:bg-stone-800 dark:hover:bg-stone-700"
              >
                {isLoading ? (
                  <>
                    <Icon icon="solar:refresh-linear" className="w-4 h-4 animate-spin mr-1" />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Terms & Privacy */}
        <p className="text-stone-500 dark:text-stone-500 font-normal text-xs text-center">
          By signing in, you agree to OmniFlow{' '}
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
