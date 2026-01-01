'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogBody,
  DialogCloseButton 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  enableAgencyMode, 
  addClientCompany, 
  removeClientCompany, 
  getAgencyClients,
  createClientCompany 
} from '@/app/actions/agency-actions';
import type { Company } from '@/types/saas';

// Plan-based agency limits
const AGENCY_LIMITS: Record<string, { allowed: boolean; maxClients: number }> = {
  'plan_free': { allowed: false, maxClients: 0 },
  'plan_starter': { allowed: false, maxClients: 0 },
  'plan_pro': { allowed: true, maxClients: 10 },
  'plan_business': { allowed: true, maxClients: 25 },
  'plan_enterprise': { allowed: true, maxClients: 50 },
};

export default function AgencySettingsPage() {
  const { company, appUser, isSuperAdmin, isAdmin, refreshAuthContext } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clientCompanies, setClientCompanies] = useState<Company[]>([]);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  
  // Form states
  const [newClientCompanyId, setNewClientCompanyId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  const isAgencyEnabled = company?.isAgency && company?.agencySettings?.enabled;
  
  // Check plan-based access
  const planId = company?.planId || 'plan_free';
  const agencyLimits = AGENCY_LIMITS[planId] || AGENCY_LIMITS['plan_free'];
  const canAccessAgencyMode = isSuperAdmin || agencyLimits.allowed;
  const maxClients = isSuperAdmin ? 999 : agencyLimits.maxClients;

  useEffect(() => {
    loadClientCompanies();
  }, [company?.id]);

  const loadClientCompanies = async () => {
    if (!company?.id || !company?.isAgency) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await getAgencyClients(company.id);
      if (result.success && result.clients) {
        setClientCompanies(result.clients);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
    setIsLoading(false);
  };

  const handleEnableAgency = async () => {
    if (!company?.id || !appUser?.idToken) return;
    
    setIsSaving(true);
    try {
      const result = await enableAgencyMode(appUser.idToken, company.id, true);
      if (result.success) {
        toast({ title: 'Agency Mode Enabled', description: 'You can now add client companies.' });
        await refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to enable agency mode', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleDisableAgency = async () => {
    if (!company?.id || !appUser?.idToken) return;
    
    setIsSaving(true);
    try {
      const result = await enableAgencyMode(appUser.idToken, company.id, false);
      if (result.success) {
        toast({ title: 'Agency Mode Disabled' });
        await refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disable agency mode', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleAddExistingClient = async () => {
    if (!company?.id || !appUser?.idToken || !newClientCompanyId.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await addClientCompany(appUser.idToken, company.id, newClientCompanyId.trim());
      if (result.success) {
        toast({ title: 'Client Added', description: 'Client company has been linked to your agency.' });
        setNewClientCompanyId('');
        setIsAddClientOpen(false);
        await loadClientCompanies();
        await refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add client', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleCreateClient = async () => {
    if (!company?.id || !appUser?.idToken || !newClientName.trim() || !newClientEmail.trim()) return;
    
    setIsSaving(true);
    try {
      const result = await createClientCompany(appUser.idToken, company.id, {
        name: newClientName.trim(),
        adminEmail: newClientEmail.trim(),
      });
      if (result.success) {
        toast({ title: 'Client Created', description: `${newClientName} has been created and linked to your agency.` });
        setNewClientName('');
        setNewClientEmail('');
        setIsCreateClientOpen(false);
        await loadClientCompanies();
        await refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create client', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleRemoveClient = async (clientId: string, clientName: string) => {
    if (!company?.id || !appUser?.idToken) return;
    
    if (!confirm(`Remove "${clientName}" from your agency? They will no longer be managed by you.`)) return;
    
    setIsSaving(true);
    try {
      const result = await removeClientCompany(appUser.idToken, company.id, clientId);
      if (result.success) {
        toast({ title: 'Client Removed', description: `${clientName} has been removed from your agency.` });
        await loadClientCompanies();
        await refreshAuthContext();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove client', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  // Only admins and superadmins can access this page
  if (!isSuperAdmin && !isAdmin) {
    return (
      <div className="p-4 sm:p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <Icon icon="solar:lock-linear" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">You don't have permission to access agency settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show upgrade prompt if plan doesn't support agency mode
  if (!canAccessAgencyMode) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Agency Mode</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage multiple client companies from a single dashboard
          </p>
        </div>

        {/* Upgrade Required Card */}
        <Card className="border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/20 dark:to-fuchsia-950/20">
          <CardContent className="p-4 sm:p-8 text-center">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
              <Icon icon="solar:buildings-3-bold" className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-2">Upgrade to Unlock Agency Mode</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Agency Mode lets digital marketing agencies manage multiple client companies from a single dashboard — just like HubSpot Partner Hub and GoHighLevel.
            </p>
            
            {/* Features Preview */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 max-w-lg mx-auto">
              {[
                { icon: "solar:users-group-rounded-bold", title: "Multi-Client CRM" },
                { icon: "solar:letter-bold", title: "Client Campaigns" },
                { icon: "solar:chart-2-bold", title: "Per-Client Analytics" },
                { icon: "solar:shield-check-bold", title: "Data Isolation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-white/50 dark:bg-stone-900/50 border border-violet-200/50 dark:border-violet-800/50">
                  <Icon icon={item.icon} className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                  <span className="text-xs sm:text-sm font-medium">{item.title}</span>
                </div>
              ))}
            </div>

            {/* Plan Comparison */}
            <div className="bg-white/70 dark:bg-stone-900/70 rounded-xl p-3 sm:p-4 mb-6 max-w-md mx-auto border border-violet-200/50 dark:border-violet-800/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Available on:</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">Pro $99/mo</Badge>
                  <span className="text-xs text-muted-foreground">10 clients</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">Enterprise $249/mo</Badge>
                  <span className="text-xs text-muted-foreground">50 clients</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Button asChild className="w-full sm:w-auto h-10 sm:h-11 bg-violet-600 hover:bg-violet-700">
                <Link href="/settings/subscription">
                  <Icon icon="solar:arrow-up-bold" className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto h-10 sm:h-11">
                <Link href="/#agency-mode">
                  Learn More
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Agency Mode</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage multiple client companies from a single dashboard
        </p>
      </div>

      {/* Agency Mode Toggle */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Icon icon="solar:buildings-3-bold" className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">Agency Mode</CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Enable to manage multiple client companies
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAgencyEnabled ? (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Icon icon="solar:check-circle-bold" className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Disabled</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {!isAgencyEnabled ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                <h4 className="text-sm font-medium text-violet-900 dark:text-violet-100 mb-2">
                  What is Agency Mode?
                </h4>
                <ul className="space-y-1.5 text-xs text-violet-700 dark:text-violet-300">
                  <li className="flex items-start gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 mt-0.5 shrink-0" />
                    Manage multiple client companies from one dashboard
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 mt-0.5 shrink-0" />
                    Switch between clients instantly with the company switcher
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 mt-0.5 shrink-0" />
                    Run campaigns, manage leads, and handle social media for all clients
                  </li>
                  <li className="flex items-start gap-2">
                    <Icon icon="solar:check-circle-linear" className="h-4 w-4 mt-0.5 shrink-0" />
                    Each client's data remains completely isolated
                  </li>
                </ul>
              </div>
              <Button onClick={handleEnableAgency} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Icon icon="solar:power-bold" className="h-4 w-4 mr-2" />
                )}
                Enable Agency Mode
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{clientCompanies.length} / {maxClients} client companies</span>
                  {clientCompanies.length >= maxClients && (
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      Limit reached
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisableAgency}
                  disabled={isSaving}
                  className="w-full sm:w-auto h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Disable Agency Mode
                </Button>
              </div>
              {clientCompanies.length >= maxClients && (
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <Icon icon="solar:info-circle-linear" className="h-4 w-4 shrink-0" />
                    <span>
                      You've reached your plan's client limit. 
                      <Link href="/settings/subscription" className="font-medium underline ml-1">
                        Upgrade to add more clients
                      </Link>
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Companies */}
      {isAgencyEnabled && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Icon icon="solar:users-group-rounded-linear" className="h-5 w-5" />
                  Client Companies
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-0.5">
                  Companies you manage on behalf of your clients
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddClientOpen(true)}
                  disabled={clientCompanies.length >= maxClients}
                  className="h-8 text-xs"
                >
                  <Icon icon="solar:link-linear" className="h-3.5 w-3.5 mr-1.5" />
                  Link Existing
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setIsCreateClientOpen(true)}
                  disabled={clientCompanies.length >= maxClients}
                  className="h-8 text-xs"
                >
                  <Icon icon="solar:add-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
                  Create New
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : clientCompanies.length === 0 ? (
              <div className="text-center py-8">
                <Icon icon="solar:buildings-2-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="text-sm font-medium mb-1">No clients yet</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Add your first client company to start managing their marketing
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {clientCompanies.map((client) => (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {client.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {client.adminEmail || client.registeredEmail || 'No email'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge 
                        variant={client.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {client.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                        onClick={() => handleRemoveClient(client.id, client.name)}
                      >
                        <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Existing Client Dialog */}
      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Link Existing Company</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Enter the Company ID of an existing company to link it to your agency
            </DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Company ID</Label>
              <Input
                value={newClientCompanyId}
                onChange={(e) => setNewClientCompanyId(e.target.value)}
                placeholder="Enter company ID"
                className="h-9 sm:h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                The company admin can find their Company ID in Settings → Company
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAddClientOpen(false)}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddExistingClient}
              disabled={isSaving || !newClientCompanyId.trim()}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              {isSaving && <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />}
              Link Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create New Client Dialog */}
      <Dialog open={isCreateClientOpen} onOpenChange={setIsCreateClientOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[480px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Create Client Company</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create a new company for your client. They'll receive an invitation to access it.
            </DialogDescription>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Company Name *</Label>
              <Input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="h-9 sm:h-10 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Client Admin Email *</Label>
              <Input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="h-9 sm:h-10 text-sm"
              />
              <p className="text-[10px] text-muted-foreground">
                This person will be the admin of the client company
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsCreateClientOpen(false)}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateClient}
              disabled={isSaving || !newClientName.trim() || !newClientEmail.trim()}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              {isSaving && <Icon icon="solar:refresh-linear" className="h-4 w-4 mr-2 animate-spin" />}
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
