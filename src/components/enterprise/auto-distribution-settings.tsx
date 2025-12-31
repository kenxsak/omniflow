'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getAutoDistributionConfigAction,
  saveAutoDistributionConfigAction,
  distributeUnassignedLeadsAction,
  getEligibleRepsAction,
} from '@/app/actions/enterprise-actions';
import type { AutoDistributionConfig } from '@/types/enterprise';
import type { AppUser } from '@/types/saas';
import { SettingsCard } from '@/components/settings/settings-ui';

export function AutoDistributionSettings() {
  const [config, setConfig] = useState<AutoDistributionConfig>({
    enabled: false,
    method: 'round_robin',
    eligibleRoles: ['user', 'manager'],
    excludeUserIds: [],
    maxLeadsPerRep: undefined,
    lastAssignedIndex: 0,
  });
  const [eligibleReps, setEligibleReps] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    const [savedConfig, reps] = await Promise.all([
      getAutoDistributionConfigAction(),
      getEligibleRepsAction(),
    ]);

    if (savedConfig) {
      setConfig(savedConfig);
    }
    setEligibleReps(reps);
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveAutoDistributionConfigAction(config);
    setIsSaving(false);

    if (result.success) {
      toast({
        title: 'Settings Saved',
        description: 'Auto-distribution configuration has been updated',
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  const handleDistributeNow = async () => {
    setIsDistributing(true);
    const result = await distributeUnassignedLeadsAction();
    setIsDistributing(false);

    if (result.success) {
      toast({
        title: 'Distribution Complete',
        description: `${result.summary.assignedCount} leads assigned to ${result.assignedLeads.length > 0 ? 'team members' : 'no one (no unassigned leads found)'}`,
      });
    } else {
      toast({
        title: 'Distribution Failed',
        description: result.errors?.[0] || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const toggleRole = (role: string) => {
    const newRoles = config.eligibleRoles.includes(role)
      ? config.eligibleRoles.filter((r) => r !== role)
      : [...config.eligibleRoles, role];
    setConfig({ ...config, eligibleRoles: newRoles });
  };

  if (isLoading) {
    return (
      <SettingsCard
        title="Auto-Distribution Settings"
        description="Loading configuration..."
        icon="solar:shuffle-linear"
      >
        <div className="flex items-center justify-center py-8">
          <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      title="Auto-Distribution Settings"
      description="Automatically distribute new and unassigned leads fairly among your sales team"
      icon="solar:shuffle-linear"
      footer={
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleDistributeNow}
            disabled={!config.enabled || isDistributing}
          >
            {isDistributing ? (
              <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="solar:shuffle-linear" className="h-3.5 w-3.5 mr-1.5" />
            )}
            Distribute Unassigned Now
          </Button>
          <Button size="sm" className="h-8" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="solar:diskette-linear" className="h-3.5 w-3.5 mr-1.5" />
            )}
            Save Settings
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between py-3 border-b border-stone-200/60 dark:border-stone-800/60">
          <div>
            <Label className="text-sm font-medium">Enable Auto-Distribution</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically assign unassigned leads to eligible team members
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
          />
        </div>

        {/* Distribution Method */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Distribution Method</Label>
          <Select
            value={config.method}
            onValueChange={(method: 'round_robin' | 'load_balanced' | 'random') =>
              setConfig({ ...config, method })
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" />
                  Round Robin - Equal distribution in order
                </div>
              </SelectItem>
              <SelectItem value="load_balanced">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:chart-2-linear" className="h-4 w-4" />
                  Load Balanced - Assign to rep with fewest leads
                </div>
              </SelectItem>
              <SelectItem value="random">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:bolt-linear" className="h-4 w-4" />
                  Random - Random assignment
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Eligible Roles */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Eligible Roles</Label>
          <div className="flex flex-wrap gap-3">
            {['user', 'manager', 'admin'].map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-stone-200/60 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors"
              >
                <Checkbox
                  checked={config.eligibleRoles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <span className="text-sm capitalize">{role}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Max Leads Per Rep */}
        {config.method === 'load_balanced' && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Maximum Leads Per Rep (Optional)
            </Label>
            <Input
              type="number"
              placeholder="No limit"
              className="h-9"
              value={config.maxLeadsPerRep || ''}
              onChange={(e) =>
                setConfig({
                  ...config,
                  maxLeadsPerRep: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
            />
            <p className="text-[10px] text-muted-foreground">
              Stop assigning to a rep once they reach this limit
            </p>
          </div>
        )}

        {/* Eligible Team Members */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Eligible Team Members ({eligibleReps.length})
          </Label>
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-3 rounded-lg border border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
            {eligibleReps.length > 0 ? (
              eligibleReps.map((rep) => (
                <Badge key={rep.uid} variant="secondary" className="text-[10px]">
                  {rep.name || rep.email} ({rep.role})
                </Badge>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No eligible team members found. Check role settings above.
              </p>
            )}
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
