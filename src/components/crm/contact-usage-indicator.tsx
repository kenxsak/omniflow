'use client';

import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';
import { 
  getContactUsagePercentage, 
  getContactLimitStatus, 
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

  if (compact) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden p-3 sm:p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Contact Usage</span>
              <span className={`text-[10px] font-semibold tabular-nums ${
                limitStatus === 'limit_reached' ? 'text-destructive-muted-foreground' :
                limitStatus === 'warning' ? 'text-warning-muted-foreground' :
                limitStatus === 'unlimited' ? 'text-success-muted-foreground' :
                'text-info-muted-foreground'
              }`}>
                {limitStatus === 'unlimited' ? '∞' : `${Math.round(usagePercentage)}%`}
              </span>
            </div>
            {maxContacts !== null && (
              <Progress 
                value={usagePercentage} 
                className={`h-1.5 ${
                  limitStatus === 'limit_reached' ? '[&>div]:bg-destructive' :
                  limitStatus === 'warning' ? '[&>div]:bg-warning' :
                  '[&>div]:bg-primary'
                }`}
              />
            )}
            <p className="text-[10px] text-muted-foreground mt-1.5 tabular-nums">
              {currentContactCount.toLocaleString()} {maxContacts !== null && `/ ${maxContacts.toLocaleString()}`} contacts • {planName}
            </p>
          </div>
          {limitStatus === 'limit_reached' && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => router.push('/settings?tab=billing')}
              className="h-8 text-xs"
            >
              Upgrade
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative border rounded-xl sm:rounded-2xl overflow-hidden ${
      limitStatus === 'limit_reached' 
        ? 'border-destructive-border bg-destructive-muted' 
        : limitStatus === 'warning' 
          ? 'border-warning-border bg-warning-muted' 
          : limitStatus === 'unlimited'
            ? 'border-success-border bg-success-muted'
            : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950'
    }`}>
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="solar:users-group-two-rounded-linear" className={`h-5 w-5 ${
              limitStatus === 'limit_reached' ? 'text-destructive-muted-foreground' :
              limitStatus === 'warning' ? 'text-warning-muted-foreground' :
              limitStatus === 'unlimited' ? 'text-success-muted-foreground' :
              'text-muted-foreground'
            }`} />
            <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Contact Usage
            </span>
          </div>
          {limitStatus === 'limit_reached' && (
            <Icon icon="solar:danger-triangle-linear" className="h-5 w-5 text-destructive-muted-foreground" />
          )}
          {limitStatus === 'warning' && (
            <Icon icon="solar:danger-triangle-linear" className="h-5 w-5 text-warning-muted-foreground" />
          )}
          {limitStatus === 'unlimited' && (
            <Icon icon="solar:star-linear" className="h-5 w-5 text-success-muted-foreground" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {planName} plan {maxContacts === null ? '• Unlimited contacts' : `• ${maxContacts.toLocaleString()} contact limit`}
        </p>
      </div>
      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xl sm:text-2xl font-semibold tabular-nums ${
              limitStatus === 'limit_reached' ? 'text-destructive-muted-foreground' :
              limitStatus === 'warning' ? 'text-warning-muted-foreground' :
              limitStatus === 'unlimited' ? 'text-success-muted-foreground' :
              'text-foreground'
            }`}>
              {maxContacts !== null ? (
                <>
                  <span>{currentContactCount}</span>
                  <span className="text-muted-foreground text-base sm:text-lg"> / {maxContacts.toLocaleString()}</span>
                </>
              ) : (
                <span className="flex items-center gap-2">
                  {currentContactCount.toLocaleString()} 
                  <span className="text-success-muted-foreground text-base sm:text-lg">∞</span>
                </span>
              )}
            </span>
            {maxContacts !== null && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-md tabular-nums ${
                limitStatus === 'limit_reached' ? 'bg-destructive/10 text-destructive-muted-foreground' :
                limitStatus === 'warning' ? 'bg-warning/10 text-warning-muted-foreground' :
                'bg-primary/10 text-primary'
              }`}>
                {Math.round(usagePercentage)}%
              </span>
            )}
          </div>
          {maxContacts !== null && (
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${
                limitStatus === 'limit_reached' ? '[&>div]:bg-destructive' :
                limitStatus === 'warning' ? '[&>div]:bg-warning' :
                '[&>div]:bg-primary'
              }`}
            />
          )}
        </div>

        {limitStatus === 'limit_reached' && (
          <div className="p-3 rounded-lg border border-destructive-border bg-destructive-muted/50">
            <div className="flex items-start gap-2">
              <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-destructive-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive-muted-foreground">Contact Limit Reached!</p>
                <p className="text-xs text-destructive-muted-foreground/80 mt-0.5">You cannot add more contacts until you upgrade your plan.</p>
              </div>
            </div>
          </div>
        )}

        {limitStatus === 'warning' && (
          <div className="p-3 rounded-lg border border-warning-border bg-warning-muted/50">
            <div className="flex items-start gap-2">
              <Icon icon="solar:danger-triangle-linear" className="h-4 w-4 text-warning-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-muted-foreground">Almost at limit!</p>
                <p className="text-xs text-warning-muted-foreground/80 mt-0.5">You're using {Math.round(usagePercentage)}% of your contacts. Consider upgrading soon.</p>
              </div>
            </div>
          </div>
        )}

        {limitStatus === 'unlimited' && (
          <div className="p-3 rounded-lg border border-success-border bg-success-muted/50">
            <div className="flex items-start gap-2">
              <Icon icon="solar:graph-up-linear" className="h-4 w-4 text-success-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium text-success-muted-foreground">Unlimited Contacts!</p>
                <p className="text-xs text-success-muted-foreground/80 mt-0.5">Add as many contacts as you need with your {planName} plan.</p>
              </div>
            </div>
          </div>
        )}

        {(limitStatus === 'limit_reached' || limitStatus === 'warning') && maxContacts !== null && (
          <Button 
            onClick={() => router.push('/settings?tab=billing')}
            className="w-full h-9 text-sm"
            variant={limitStatus === 'limit_reached' ? 'default' : 'outline'}
          >
            <Icon icon="solar:star-linear" className="mr-2 h-4 w-4" />
            Upgrade for Unlimited Contacts
          </Button>
        )}
      </div>
    </div>
  );
}
