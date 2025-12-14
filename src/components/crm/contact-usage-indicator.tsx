'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, AlertTriangle, Sparkles, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  getContactUsagePercentage, 
  getContactLimitStatus, 
  getContactUsageMessage 
} from '@/lib/plan-helpers';

interface ContactUsageIndicatorProps {
  currentContactCount: number;
  maxContacts: number | null;
  planName: string;
  compact?: boolean;
}

export function ContactUsageIndicator({
  currentContactCount,
  maxContacts,
  planName,
  compact = false
}: ContactUsageIndicatorProps) {
  const router = useRouter();
  const usagePercentage = getContactUsagePercentage(currentContactCount, maxContacts);
  const limitStatus = getContactLimitStatus(currentContactCount, maxContacts);
  const usageMessage = getContactUsageMessage(currentContactCount, maxContacts);

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Contact Usage</span>
            <span className={`text-xs font-semibold ${
              limitStatus === 'limit_reached' ? 'text-destructive' :
              limitStatus === 'warning' ? 'text-warning' :
              limitStatus === 'unlimited' ? 'text-success' :
              'text-info'
            }`}>
              {limitStatus === 'unlimited' ? '∞' : `${Math.round(usagePercentage)}%`}
            </span>
          </div>
          {maxContacts !== null && (
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${
                limitStatus === 'limit_reached' ? '[&>div]:bg-destructive' :
                limitStatus === 'warning' ? '[&>div]:bg-warning' :
                '[&>div]:bg-info'
              }`}
            />
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {currentContactCount.toLocaleString()} {maxContacts !== null && `/ ${maxContacts.toLocaleString()}`} contacts
          </p>
        </div>
        {limitStatus === 'limit_reached' && (
          <Button 
            variant="default" 
            size="sm"
            onClick={() => router.push('/settings?tab=billing')}
          >
            Upgrade
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`${
      limitStatus === 'limit_reached' 
        ? 'border-destructive-border bg-destructive-muted' 
        : limitStatus === 'warning' 
          ? 'border-warning-border bg-warning-muted' 
          : limitStatus === 'unlimited'
            ? 'border-success-border bg-success-muted'
            : 'border-info-border bg-info-muted'
    }`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className={`h-5 w-5 ${
              limitStatus === 'limit_reached' ? 'text-destructive' :
              limitStatus === 'warning' ? 'text-warning' :
              limitStatus === 'unlimited' ? 'text-success' :
              'text-info'
            }`} />
            <CardTitle className="text-lg">Contact Usage</CardTitle>
          </div>
          {limitStatus === 'limit_reached' && (
            <AlertTriangle className="h-5 w-5 text-destructive" />
          )}
          {limitStatus === 'warning' && (
            <AlertTriangle className="h-5 w-5 text-warning" />
          )}
          {limitStatus === 'unlimited' && (
            <Sparkles className="h-5 w-5 text-success" />
          )}
        </div>
        <CardDescription>
          {planName} plan {maxContacts === null ? '• Unlimited contacts' : `• ${maxContacts.toLocaleString()} contact limit`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-2xl font-bold ${
              limitStatus === 'limit_reached' ? 'text-red-600' :
              limitStatus === 'warning' ? 'text-warning' :
              limitStatus === 'unlimited' ? 'text-success' :
              'text-info'
            }`}>
              {maxContacts !== null ? (
                <>
                  <span>{currentContactCount}</span>
                  <span className="text-muted-foreground text-lg"> / {maxContacts.toLocaleString()}</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {currentContactCount.toLocaleString()} 
                  <span className="text-success text-lg">∞</span>
                </span>
              )}
            </span>
            {maxContacts !== null && (
              <span className={`text-sm font-semibold px-2 py-1 rounded ${
                limitStatus === 'limit_reached' ? 'bg-destructive-muted text-destructive' :
                limitStatus === 'warning' ? 'bg-warning-muted text-warning-muted-foreground' :
                'bg-info-muted text-info-muted-foreground'
              }`}>
                {Math.round(usagePercentage)}%
              </span>
            )}
          </div>
          {maxContacts !== null && (
            <Progress 
              value={usagePercentage} 
              className={`h-3 ${
                limitStatus === 'limit_reached' ? '[&>div]:bg-destructive' :
                limitStatus === 'warning' ? '[&>div]:bg-warning' :
                '[&>div]:bg-info'
              }`}
            />
          )}
        </div>

        {limitStatus === 'limit_reached' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Contact Limit Reached!</strong> You cannot add more contacts until you upgrade your plan.
            </AlertDescription>
          </Alert>
        )}

        {limitStatus === 'warning' && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Almost at limit!</strong> You're using {Math.round(usagePercentage)}% of your contacts. Consider upgrading soon.
            </AlertDescription>
          </Alert>
        )}

        {limitStatus === 'unlimited' && (
          <Alert className="border-success-border bg-success-muted">
            <TrendingUp className="h-4 w-4 text-success" />
            <AlertDescription className="text-success-muted-foreground">
              <strong>Unlimited Contacts!</strong> Add as many contacts as you need with your {planName} plan.
            </AlertDescription>
          </Alert>
        )}

        {(limitStatus === 'limit_reached' || limitStatus === 'warning') && maxContacts !== null && (
          <Button 
            onClick={() => router.push('/settings?tab=billing')}
            className="w-full"
            variant={limitStatus === 'limit_reached' ? 'default' : 'outline'}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Upgrade for Unlimited Contacts
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
