"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, UserPlus, AlertTriangle, Mail, Lock, ArrowRight, Sparkles, CheckCircle2, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isFirebaseConfigured } from '@/lib/firebase-config';
import { lightweightSignup } from '@/lib/lightweight-auth';
import gsap from 'gsap';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      if (formRef.current) {
        gsap.to(formRef.current, { x: [-10, 10, -10, 10, 0], duration: 0.4, ease: 'power2.inOut' });
      }
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      if (formRef.current) {
        gsap.to(formRef.current, { x: [-10, 10, -10, 10, 0], duration: 0.4, ease: 'power2.inOut' });
      }
      toast({ title: 'Invalid Password', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const result = await lightweightSignup(email, password);
      if (result.success) {
        toast({ title: 'Account Created', description: "Welcome! Your workspace is ready. Please log in." });
        router.push('/login');
      } else {
        if (formRef.current) {
          gsap.to(formRef.current, { x: [-10, 10, -10, 10, 0], duration: 0.4, ease: 'power2.inOut' });
        }
        toast({
          title: 'Sign Up Failed',
          description: result.error || 'Could not create your account. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Could not create your account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-accent/5 via-background to-primary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
      
      <Card ref={cardRef} className="w-full max-w-md relative z-10 shadow-2xl border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-accent to-primary p-0.5 shadow-lg">
                <div className="h-full w-full rounded-2xl bg-card flex items-center justify-center">
                  <img 
                    src="/logo.png" 
                    alt="OmniFlow Logo" 
                    className="h-10 w-10 sm:h-12 sm:w-12"
                  />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-bounce-subtle">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Create Account</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Start your 14-day free trial today
            </CardDescription>
          </div>
        </CardHeader>
        
        {!isFirebaseConfigured && (
          <CardContent className="pb-0">
            <Alert variant="destructive" className="animate-fade-in">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Firebase Not Configured</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm">
                Account creation is disabled. Please configure Firebase.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        <form ref={formRef} onSubmit={handleSignUp}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
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
              {password && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 'strong' ? 'w-full bg-emerald-500' :
                        passwordStrength === 'medium' ? 'w-2/3 bg-amber-500' :
                        'w-1/3 bg-red-500'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${
                    passwordStrength === 'strong' ? 'text-emerald-600' :
                    passwordStrength === 'medium' ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {passwordStrength === 'strong' ? 'Strong' : passwordStrength === 'medium' ? 'Good' : 'Weak'}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-10 h-11 sm:h-12 text-sm sm:text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
                {confirmPassword && password === confirmPassword && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                )}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                No credit card
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                14-day trial
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                Cancel anytime
              </span>
            </div>
            
            <div className="w-full space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-semibold text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
                >
                  Sign in
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
