"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightLogin } from '@/lib/lightweight-auth';
import { Logo } from '@/components/ui/logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await lightweightLogin(email, password);

    if (result.success) {
      toast({ title: 'Login Successful', description: "Welcome back!" });
      await new Promise(resolve => setTimeout(resolve, 300));
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo href="/" size="md" />
        <Link 
          href="/signup" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign up
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="text-sm text-muted-foreground">
              Welcome back to OmniFlow
            </p>
          </div>

          {!isFirebaseConfigured && (
            <Alert variant="destructive">
              <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
              <AlertDescription>
                Firebase not configured. Authentication disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-10" 
              disabled={isLoading || !isFirebaseConfigured}
            >
              {isLoading ? (
                <>
                  <Icon icon="solar:refresh-circle-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-foreground font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
