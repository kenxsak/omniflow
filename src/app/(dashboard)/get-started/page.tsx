'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  Mail, 
  CreditCard, 
  Sparkles, 
  Workflow, 
  Send,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Clock,
  Target,
  Zap,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import { Animated } from '@/components/ui/animated';
import gsap from 'gsap';

const QUICK_START_STEPS = [
  {
    phase: 'First 24 Hours',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    steps: [
      {
        title: 'Create Your Digital Business Card',
        description: 'Build a professional web presence in minutes. Share via QR code or link to capture leads automatically.',
        time: '15 minutes',
        icon: CreditCard,
        actionLabel: 'Create Card',
        actionLink: '/digital-card/create',
        tips: [
          'Add your contact info, social links, and brand colors',
          'Enable the contact form to capture leads',
          'Share the QR code on business cards or social media'
        ]
      },
      {
        title: 'Add Your First Contacts',
        description: 'Import or manually add 10-20 contacts to get started. Use the built-in CRM - no external tool needed!',
        time: '5 minutes',
        icon: Users,
        actionLabel: 'Go to Contacts',
        actionLink: '/crm',
        tips: [
          'Import from Excel/CSV for bulk contact upload',
          'Or add contacts manually one by one',
          'Include name, email, and phone number for best results'
        ]
      },
      {
        title: 'Try AI Content Generation',
        description: 'Experience the power of AI - let it write a social media post, email, or ad for you in seconds.',
        time: '5 minutes',
        icon: Sparkles,
        actionLabel: 'Use AI Writer',
        actionLink: '/social-media',
        tips: [
          'Be specific in your prompt for better results',
          'Try different AI agents (Content Writer, Email Expert, etc.)',
          'Edit the AI output to match your brand voice'
        ]
      },
      {
        title: 'Send Your First Email Campaign',
        description: 'Create and send an email campaign using OmniFlow\'s built-in email marketing. No Brevo or external service required!',
        time: '10 minutes',
        icon: Mail,
        actionLabel: 'Create Campaign',
        actionLink: '/campaigns/ai-email',
        tips: [
          'Use AI to write your email content in seconds',
          'Send a test to yourself first',
          'Start with a small group of contacts'
        ]
      }
    ]
  },
  {
    phase: 'First Week',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    steps: [
      {
        title: 'Set Up Email Automation',
        description: 'Create a welcome sequence that automatically sends when someone joins your list.',
        time: '20 minutes',
        icon: Workflow,
        actionLabel: 'View Automations',
        actionLink: '/email-marketing/automations',
        tips: [
          'Start with a simple 3-email welcome series',
          'Use pre-built templates to save time',
          'Test the automation by adding yourself as a contact'
        ]
      },
      {
        title: 'Launch Multi-Channel Campaigns',
        description: 'Send campaigns across email, SMS, and WhatsApp to reach your audience everywhere.',
        time: '15 minutes',
        icon: Send,
        actionLabel: 'AI Campaign Studio',
        actionLink: '/ai-campaign-manager',
        tips: [
          'Email for detailed content',
          'SMS for urgent, time-sensitive messages',
          'WhatsApp for international contacts (free wa.me links!)'
        ]
      }
    ]
  }
];

export default function GetStartedPage() {
  const router = useRouter();
  const { isSuperAdmin, loading } = useAuth();
  const phasesRef = useRef<HTMLDivElement>(null);

  // Redirect super admins to dashboard - they don't need onboarding
  useEffect(() => {
    if (!loading && isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [isSuperAdmin, loading, router]);

  // GSAP animation for phases - instant, no delays
  useEffect(() => {
    if (phasesRef.current) {
      const phases = phasesRef.current.querySelectorAll('.phase-card');
      gsap.fromTo(
        phases,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0, ease: 'power2.out', delay: 0 }
      );
    }
  }, []);

  // Don't render the page for super admins
  if (isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      {/* Header */}
      <Animated animation="fadeUp">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Quick Start Guide
              </h1>
              <Badge variant="secondary" className="text-xs">
                <Rocket className="w-3 h-3 mr-1" />
                New
              </Badge>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground">
              Start marketing like a pro in just 24 hours - no external tools required!
            </p>
          </div>
          <ContextualHelpButton pageId="get-started" />
        </div>
      </Animated>

      {/* Info Alert */}
      <Animated animation="fadeUp">
        <Alert className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <AlertTitle className="text-green-700 dark:text-green-300 text-sm sm:text-base">Everything You Need is Built-In</AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400 text-xs sm:text-sm mt-1">
                OmniFlow is a complete platform with built-in CRM, email marketing, SMS, WhatsApp, and AI. 
                You can start sending campaigns immediately without connecting any external tools.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      </Animated>

      {/* Progress Card */}
      <Animated animation="fadeUp">
        <Card className="border-primary/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5" />
          <CardHeader className="relative p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              Track Your Progress
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Complete the checklist on your dashboard to track your onboarding progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative p-4 sm:p-6 pt-0">
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-sm">
                View Dashboard Checklist
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </Animated>

        {/* Phases */}
        <div ref={phasesRef} className="space-y-4 sm:space-y-6">
          {QUICK_START_STEPS.map((phase) => {
            const PhaseIcon = phase.icon;
            return (
              <Card key={phase.phase} className={`phase-card ${phase.borderColor} overflow-hidden`}>
                <CardHeader className={`${phase.bgColor} p-4 sm:p-6`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${phase.bgColor} border ${phase.borderColor} flex items-center justify-center`}>
                      <PhaseIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${phase.color}`} />
                    </div>
                    <div>
                      <CardTitle className={`${phase.color} text-base sm:text-lg`}>{phase.phase}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {phase.phase === 'First 24 Hours' 
                          ? 'Get up and running with quick wins'
                          : 'Build your marketing system'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    {phase.steps.map((step, index) => {
                      const StepIcon = step.icon;
                      return (
                        <div key={index} className="border rounded-xl p-3 sm:p-4 hover:border-primary/50 hover:shadow-md transition-all duration-300 group">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:block">
                              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <StepIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                              </div>
                              {/* Mobile title */}
                              <div className="sm:hidden flex-1">
                                <h3 className="font-semibold text-sm">{step.title}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {step.time}
                                </p>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              {/* Desktop title */}
                              <div className="hidden sm:flex items-start justify-between gap-4 mb-2">
                                <div>
                                  <h3 className="font-semibold text-base lg:text-lg">{step.title}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {step.time}
                                  </p>
                                </div>
                                <Link href={step.actionLink}>
                                  <Button variant="outline" size="sm" className="flex-shrink-0">
                                    {step.actionLabel}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                  </Button>
                                </Link>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                {step.description}
                              </p>
                              {/* Mobile action button */}
                              <Link href={step.actionLink} className="sm:hidden block mb-3">
                                <Button variant="outline" size="sm" className="w-full">
                                  {step.actionLabel}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                              <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3">
                                <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">💡 Quick Tips:</p>
                                <ul className="space-y-1">
                                  {step.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="text-[11px] sm:text-sm text-muted-foreground flex items-start gap-1.5 sm:gap-2">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Card */}
        <Animated animation="fadeUp">
          <Card className="overflow-hidden">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Need More Help?</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Resources to help you succeed with OmniFlow
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
              <Link href="/dashboard" className="block">
                <div className="flex items-center justify-between p-3 border rounded-xl hover:border-primary/50 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm sm:text-base">Dashboard Checklist</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Track your onboarding progress</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    View <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        </Animated>
      </div>
  );
}
