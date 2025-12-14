"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightSignup } from '@/lib/lightweight-auth';
import { Logo } from '@/components/ui/logo';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await lightweightSignup(email, password);
      if (result.success) {
        toast({ title: 'Account Created', description: "Please sign in." });
        router.push('/login');
      } else {
        toast({
          title: 'Sign Up Failed',
          description: result.error || 'Could not create account.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Could not create account.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Simple header */}
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Logo href="/" size="md" />
        <Link 
          href="/login" 
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-sm space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
            <p className="text-sm text-muted-foreground">
              Start your 14-day free trial
            </p>
          </div>

          {!isFirebaseConfigured && (
            <Alert variant="destructive">
              <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
              <AlertDescription>
                Firebase not configured. Sign up disabled.
              </AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
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
              {password && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        passwordStrength === 'strong' ? 'w-full bg-success' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-warning' :
                        'w-1/3 bg-destructive'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {passwordStrength === 'strong' ? 'Strong' : passwordStrength === 'medium' ? 'Good' : 'Weak'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10"
                />
                {confirmPassword && password === confirmPassword && (
                  <Icon icon="solar:check-circle-linear" className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success" />
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-10" 
              disabled={isLoading || !isFirebaseConfigured}
            >
              {isLoading ? (
                <>
                  <Icon icon="solar:refresh-circle-linear" className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          {/* Benefits */}
          <div className="flex justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 text-success" />
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 text-success" />
              14-day trial
            </span>
          </div>

          {/* Footer link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
