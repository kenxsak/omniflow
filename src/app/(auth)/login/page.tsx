"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, LogIn, AlertTriangle, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightLogin } from '@/lib/lightweight-auth';
import gsap from 'gsap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate card on mount - instant
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 12, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await lightweightLogin(email, password);

    if (result.success) {
      toast({ title: 'Login Successful', description: "Welcome back! Redirecting..." });
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/get-started';
    } else {
      // Shake animation on error
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: [-10, 10, -10, 10, 0],
          duration: 0.4,
          ease: 'power2.inOut'
        });
      }
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <Card ref={cardRef} className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-primary to-accent p-0.5 shadow-lg">
                <div className="h-full w-full rounded-2xl bg-card flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="OmniFlow Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12"
                  />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-accent rounded-full flex items-center justify-center animate-bounce-subtle">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Welcome Back!</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Sign in to your OmniFlow account
            </CardDescription>
          </div>
        </CardHeader>

        {!isFirebaseConfigured && (
          <CardContent className="pb-0">
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Firebase Not Configured</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Authentication will not work. Please add your Firebase config.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
        
        <form ref={formRef} onSubmit={handleLogin}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" 
              variant="gradient"
              disabled={isLoading || !isFirebaseConfigured}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <div className="w-full space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/signup" 
                  className="font-semibold text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                >
                  Sign up free
                </Link>
              </p>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Link 
                href="/pricing" 
                className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                View Plans & Features
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
