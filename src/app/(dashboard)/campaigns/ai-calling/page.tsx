'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  status?: string;
}

export default function AICallingCampaignPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [provider, setProvider] = useState<'vapi' | 'bland'>('vapi');
  const [firstMessage, setFirstMessage] = useState('');
  const [script, setScript] = useState('');
  const [isConfigured, setIsConfigured] = useState({ vapi: false, bland: false });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [callProgress, setCallProgress] = useState({ total: 0, completed: 0, successful: 0, failed: 0 });

  // Check if AI calling providers are configured
  useEffect(() => {
    const checkConfig = async () => {
      if (!appUser?.companyId) return;
      try {
        const { fetchCompanyApiKeysAction } = await import('@/app/actions/api-keys-actions');
        const result = await fetchCompanyApiKeysAction(appUser.companyId);
        if (result.success && result.apiKeys) {
          setIsConfigured({
            vapi: !!(result.apiKeys.vapi?.apiKey),
            bland: !!(result.apiKeys.bland?.apiKey),
          });
        }
      } catch (e) {
        console.error('Failed to check config:', e);
      }
    };
    checkConfig();
  }, [appUser?.companyId]);

  // Fetch leads
  useEffect(() => {
    const fetchLeads = async () => {
      if (!appUser?.companyId) return;
      try {
        const { getLeadsForCompany } = await import('@/lib/crm/lead-data');
        const result = await getLeadsForCompany(appUser.companyId);
        if (result) {
          // Filter leads with phone numbers
          const leadsWithPhone = result.filter((l: any) => l.phone);
          setLeads(leadsWithPhone);
        }
      } catch (e) {
        console.error('Failed to fetch leads:', e);
      }
    };
    fetchLeads();
  }, [appUser?.companyId]);

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleStartCampaign = async () => {
    if (!appUser?.companyId) return;
    if (selectedLeads.length === 0) {
      toast({ title: 'No leads selected', description: 'Please select at least one lead', variant: 'destructive' });
      return;
    }
    if (!campaignName.trim()) {
      toast({ title: 'Campaign name required', description: 'Please enter a campaign name', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setCampaignStatus('running');
    setCallProgress({ total: selectedLeads.length, completed: 0, successful: 0, failed: 0 });

    try {
      // Process calls sequentially with delay to avoid rate limits
      for (let i = 0; i < selectedLeads.length; i++) {
        const leadId = selectedLeads[i];
        const lead = leads.find(l => l.id === leadId);
        if (!lead) continue;

        try {
          const response = await fetch('/api/telephony/ai-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: lead.phone,
              leadId: lead.id,
              leadName: lead.name,
              companyId: appUser.companyId,
              firstMessage: firstMessage || undefined,
              script: script || undefined,
            }),
          });

          const data = await response.json();
          
          setCallProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            successful: data.success ? prev.successful + 1 : prev.successful,
            failed: !data.success ? prev.failed + 1 : prev.failed,
          }));

          // Add delay between calls (2 seconds)
          if (i < selectedLeads.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        } catch (error) {
          setCallProgress(prev => ({
            ...prev,
            completed: prev.completed + 1,
            failed: prev.failed + 1,
          }));
        }
      }

      setCampaignStatus('completed');
      toast({ 
        title: 'Campaign Completed', 
        description: `${callProgress.successful} calls initiated successfully` 
      });
    } catch (error) {
      toast({ 
        title: 'Campaign Failed', 
        description: error instanceof Error ? error.message : 'Failed to run campaign',
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
      setShowCreateDialog(false);
    }
  };

  const hasProvider = isConfigured.vapi || isConfigured.bland;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Icon icon="solar:phone-calling-rounded-bold" className="h-5 w-5 text-purple-600" />
            AI Calling Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Run bulk AI voice call campaigns to your leads
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full sm:w-auto h-9 sm:h-10 gap-2"
              disabled={!hasProvider}
            >
              <Icon icon="solar:add-circle-linear" className="h-4 w-4" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[520px] p-4 sm:p-6 rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="solar:phone-calling-rounded-bold" className="h-5 w-5 text-purple-600" />
              Create AI Calling Campaign
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configure your bulk AI voice call campaign
            </DialogDescription>

            <div className="space-y-4 mt-4">
              {/* Campaign Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Campaign Name</label>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g., January Follow-up Calls"
                  className="h-9 sm:h-10 text-sm"
                />
              </div>

              {/* Provider Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">AI Provider</label>
                <Select value={provider} onValueChange={(v) => setProvider(v as 'vapi' | 'bland')}>
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vapi" disabled={!isConfigured.vapi}>
                      <div className="flex items-center gap-2">
                        <span>Vapi.ai</span>
                        {!isConfigured.vapi && <Badge variant="outline" className="text-[9px]">Not configured</Badge>}
                      </div>
                    </SelectItem>
                    <SelectItem value="bland" disabled={!isConfigured.bland}>
                      <div className="flex items-center gap-2">
                        <span>Bland.ai</span>
                        {!isConfigured.bland && <Badge variant="outline" className="text-[9px]">Not configured</Badge>}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* First Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Opening Message (Optional)</label>
                <Textarea
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Hello {{name}}, this is a call from our team..."
                  className="text-sm min-h-[80px]"
                />
                <p className="text-[10px] text-muted-foreground">Use {"{{name}}"} to personalize with lead name</p>
              </div>

              {/* Script/Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">AI Instructions (Optional)</label>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="You are a friendly sales assistant. Your goal is to..."
                  className="text-sm min-h-[100px]"
                />
              </div>

              {/* Selected Leads Count */}
              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Selected Leads</span>
                  <Badge variant="secondary">{selectedLeads.length} contacts</Badge>
                </div>
              </div>

              {/* Cost Estimate */}
              <Alert className="p-3">
                <Icon icon="solar:info-circle-linear" className="h-4 w-4" />
                <AlertDescription className="text-[10px] sm:text-xs">
                  Estimated cost: ~${(selectedLeads.length * 0.10).toFixed(2)} - ${(selectedLeads.length * 0.15).toFixed(2)} 
                  (based on avg 2-3 min calls)
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="w-full sm:w-auto h-9 sm:h-10"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleStartCampaign}
                className="w-full sm:w-auto h-9 sm:h-10 gap-2 bg-purple-600 hover:bg-purple-700"
                disabled={isLoading || selectedLeads.length === 0}
              >
                {isLoading ? (
                  <>
                    <Icon icon="solar:refresh-bold" className="h-4 w-4 animate-spin" />
                    Calling... ({callProgress.completed}/{callProgress.total})
                  </>
                ) : (
                  <>
                    <Icon icon="solar:phone-calling-linear" className="h-4 w-4" />
                    Start Campaign
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Provider Status */}
      {!hasProvider && (
        <Alert variant="destructive" className="p-3 sm:p-4">
          <Icon icon="solar:danger-triangle-linear" className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            No AI calling provider configured. Go to{' '}
            <a href="/settings/integrations" className="font-medium underline">Settings → Integrations</a>
            {' '}to connect Vapi.ai or Bland.ai.
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Progress (when running) */}
      {campaignStatus === 'running' && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                <Icon icon="solar:phone-calling-bold" className="h-4 w-4 text-purple-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-medium">Campaign Running</p>
                <p className="text-xs text-muted-foreground">{campaignName}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{callProgress.completed} / {callProgress.total}</span>
              </div>
              <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${(callProgress.completed / callProgress.total) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 text-xs">
                <span className="text-green-600">✓ {callProgress.successful} successful</span>
                <span className="text-red-600">✗ {callProgress.failed} failed</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Selection */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base">Select Leads to Call</CardTitle>
              <CardDescription className="text-xs">Choose contacts for your AI calling campaign</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-8 text-xs"
            >
              {selectedLeads.length === leads.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {leads.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="solar:users-group-rounded-linear" className="h-10 w-10 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No leads with phone numbers found</p>
              <Button variant="link" size="sm" className="mt-2" asChild>
                <a href="/crm">Add leads in CRM</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className={cn(
                    "flex items-center gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedLeads.includes(lead.id)
                      ? "border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30"
                      : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900"
                  )}
                  onClick={() => handleSelectLead(lead.id)}
                >
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => handleSelectLead(lead.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  {lead.status && (
                    <Badge variant="outline" className="text-[9px] shrink-0">{lead.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Icon icon="solar:phone-calling-linear" className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{selectedLeads.length}</p>
              <p className="text-[10px] text-muted-foreground">Selected</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{isConfigured.vapi ? 1 : 0 + (isConfigured.bland ? 1 : 0)}</p>
              <p className="text-[10px] text-muted-foreground">Providers</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">{leads.length}</p>
              <p className="text-[10px] text-muted-foreground">Total Leads</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon icon="solar:dollar-linear" className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">~${(selectedLeads.length * 0.12).toFixed(0)}</p>
              <p className="text-[10px] text-muted-foreground">Est. Cost</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
