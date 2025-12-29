'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Plan, Feature } from '@/types/saas';
import { getStoredFeatures } from '@/lib/saas-data';

interface PlanFeaturesModalProps {
  plan: Plan;
  allPlans: Plan[];
  trigger?: React.ReactNode;
  className?: string;
}

export function PlanFeaturesModal({ plan, allPlans, trigger, className }: PlanFeaturesModalProps) {
  const [open, setOpen] = useState(false);
  const [allFeatures, setAllFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    if (open && allFeatures.length === 0) {
      getStoredFeatures().then(setAllFeatures);
    }
  }, [open, allFeatures.length]);

  const getFeatureDetails = (featureId: string) => {
    const feature = allFeatures.find(f => f.id === featureId);
    return feature || {
      id: featureId,
      name: featureId.replace('feat_', '').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
      description: '',
      active: true
    };
  };

  // Get all unique features across all plans
  const allUniqueFeatureIds = Array.from(
    new Set(allPlans.flatMap(p => p.featureIds))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className={cn("text-xs text-primary hover:underline cursor-pointer", className)}>
            +{plan.featureIds.length > 4 ? plan.featureIds.length - 4 : plan.featureIds.length} more features
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:checklist-bold" className="h-5 w-5 text-primary" />
            {plan.name} Plan - All Features
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Plan Limits Section */}
            <div className="rounded-lg border p-4 bg-muted/30">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon icon="solar:chart-bold" className="h-4 w-4" />
                Plan Limits & Quotas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-bold" className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{plan.maxUsers}</strong> {plan.maxUsers === 1 ? 'User' : 'Users'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon icon="solar:cpu-bolt-bold" className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{plan.aiCreditsPerMonth.toLocaleString()}</strong> AI Credits{plan.priceMonthlyUSD === 0 ? ' (one-time)' : '/mo'}</span>
                </div>
                {plan.maxImagesPerMonth && (
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:gallery-bold" className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{plan.maxImagesPerMonth.toLocaleString()}</strong> Images/mo</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Icon icon="solar:database-bold" className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{plan.maxContacts === null ? 'Unlimited' : plan.maxContacts?.toLocaleString()}</strong> Contacts</span>
                </div>
                {plan.maxLandingPages !== undefined && (
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:window-frame-bold" className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{plan.maxLandingPages === null ? 'Unlimited' : plan.maxLandingPages}</strong> Landing Pages</span>
                  </div>
                )}
                {plan.maxSavedPosts !== undefined && (
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:posts-carousel-horizontal-bold" className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{plan.maxSavedPosts === null ? 'Unlimited' : plan.maxSavedPosts}</strong> Saved Posts</span>
                  </div>
                )}
                {plan.digitalCardsPerUser !== undefined && (
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:card-bold" className="h-4 w-4 text-muted-foreground" />
                    <span><strong>{plan.digitalCardsPerUser}</strong> Digital Cards/User</span>
                  </div>
                )}
              </div>
              
              {/* Special Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {plan.allowBYOK && (
                  <Badge variant="default" className="bg-emerald-600">
                    <Icon icon="solar:bolt-bold" className="h-3 w-3 mr-1" />
                    BYOK - Unlimited AI
                  </Badge>
                )}
                {plan.allowOverage && (
                  <Badge variant="secondary">
                    <Icon icon="solar:add-circle-bold" className="h-3 w-3 mr-1" />
                    Overage Credits Available
                  </Badge>
                )}
                {plan.allowBulkImport && (
                  <Badge variant="outline">
                    <Icon icon="solar:import-bold" className="h-3 w-3 mr-1" />
                    Bulk Import
                  </Badge>
                )}
                {plan.allowBulkExport && (
                  <Badge variant="outline">
                    <Icon icon="solar:export-bold" className="h-3 w-3 mr-1" />
                    Bulk Export
                  </Badge>
                )}
              </div>
            </div>

            {/* All Features List */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Icon icon="solar:list-check-bold" className="h-4 w-4" />
                Included Features ({plan.featureIds.length})
              </h3>
              <div className="grid gap-2">
                {plan.featureIds.map((featureId) => {
                  const feature = getFeatureDetails(featureId);
                  return (
                    <div 
                      key={featureId}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">{feature.name}</p>
                        {feature.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Features NOT included */}
            {allUniqueFeatureIds.filter(id => !plan.featureIds.includes(id)).length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
                  <Icon icon="solar:close-circle-bold" className="h-4 w-4" />
                  Not Included (Upgrade to access)
                </h3>
                <div className="grid gap-2 opacity-60">
                  {allUniqueFeatureIds
                    .filter(id => !plan.featureIds.includes(id))
                    .map((featureId) => {
                      const feature = getFeatureDetails(featureId);
                      // Find which plan has this feature
                      const availableIn = allPlans.find(p => p.featureIds.includes(featureId));
                      return (
                        <div 
                          key={featureId}
                          className="flex items-start gap-3 p-3 rounded-lg border border-dashed"
                        >
                          <Icon icon="solar:lock-bold" className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{feature.name}</p>
                            {feature.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                            )}
                          </div>
                          {availableIn && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {availableIn.name}+
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
