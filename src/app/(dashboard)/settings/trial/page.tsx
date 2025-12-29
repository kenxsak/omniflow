'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import type { Plan, TrialSettings } from '@/types/saas';
import { getStoredPlans, getTrialSettings, saveTrialSettings } from '@/lib/saas-data';

export default function TrialSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [trialSettings, setTrialSettings] = useState<TrialSettings>({ trialPlanId: '', trialDurationDays: 14 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect non-super admins
  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [plansData, settingsData] = await Promise.all([
        getStoredPlans(),
        getTrialSettings()
      ]);
      setPlans(plansData);
      if (settingsData) {
        setTrialSettings(settingsData);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveTrialSettings(trialSettings);
      toast({ title: 'Settings Saved', description: 'Trial settings updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Trial Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure free trial duration and plan for new users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Free Trial Configuration</CardTitle>
          <CardDescription>Set up the trial experience for new signups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Trial Plan</Label>
              <Select
                value={trialSettings.trialPlanId}
                onValueChange={(value) => setTrialSettings({ ...trialSettings, trialPlanId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan for trials" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} (${plan.priceMonthlyUSD}/mo)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                New users will get access to this plan during their trial
              </p>
            </div>

            <div className="space-y-2">
              <Label>Trial Duration (Days)</Label>
              <Input
                type="number"
                min={1}
                max={90}
                value={trialSettings.trialDurationDays}
                onChange={(e) => setTrialSettings({ ...trialSettings, trialDurationDays: parseInt(e.target.value) || 14 })}
              />
              <p className="text-xs text-muted-foreground">
                How many days the free trial lasts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="solar:diskette-linear" className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trial Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Icon icon="solar:info-circle-linear" className="h-5 w-5 text-blue-500" />
            How Trials Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• New users signing up get automatic access to the selected trial plan</p>
          <p>• Trial period starts from the moment of signup</p>
          <p>• Users can upgrade to a paid plan at any time during the trial</p>
          <p>• After trial expires, users are downgraded to the Free plan</p>
          <p>• Trial users have full access to all features in the trial plan</p>
        </CardContent>
      </Card>
    </div>
  );
}
