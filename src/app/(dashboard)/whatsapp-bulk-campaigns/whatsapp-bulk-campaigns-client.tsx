"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PageTitle from '@/components/ui/page-title';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  MessageCircle,
  Plus,
  Loader2,
  Users,
  RefreshCw,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { WhatsAppCampaign, WhatsAppRecipient } from '@/types/messaging';
import { getWhatsAppCampaigns, getWhatsAppCampaignRecipients, deleteWhatsAppCampaign } from '@/lib/messaging-campaigns-data';
import { getWhatsAppLists } from '@/lib/whatsapp-marketing-data';
import type { WhatsAppList } from '@/types/whatsapp';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';
import Link from 'next/link';

const CampaignDetailsDialog = dynamic(
  () => import('./components/campaign-details-dialog'),
  { 
    ssr: false,
    loading: () => null 
  }
);

const CreateCampaignForm = dynamic(
  () => import('./components/create-campaign-form'),
  { 
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }
);

const CampaignsTable = dynamic(
  () => import('./components/campaigns-table'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
);

export default function WhatsAppBulkCampaignsClient() {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'create'>('campaigns');
  
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  
  const [whatsappLists, setWhatsappLists] = useState<WhatsAppList[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  
  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null);
  const [campaignRecipients, setCampaignRecipients] = useState<WhatsAppRecipient[]>([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  useEffect(() => {
    if (appUser?.companyId) {
      loadCampaigns();
      loadWhatsAppLists();
    }
  }, [appUser?.companyId]);

  const loadCampaigns = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingCampaigns(true);
    try {
      const campaignsList = await getWhatsAppCampaigns(appUser.companyId);
      setCampaigns(campaignsList);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadWhatsAppLists = async () => {
    if (!appUser?.companyId) return;
    setIsLoadingLists(true);
    try {
      const lists = await getWhatsAppLists(appUser.companyId);
      setWhatsappLists(lists);
    } catch (error) {
      console.error('Error loading WhatsApp lists:', error);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!appUser?.companyId) return;
    
    try {
      await deleteWhatsAppCampaign(appUser.companyId, campaignId);
      toast({
        title: 'Campaign Deleted',
        description: 'Campaign has been removed',
      });
      loadCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete campaign',
        variant: 'destructive',
      });
    }
  };

  const handleViewCampaign = async (campaign: WhatsAppCampaign) => {
    if (!appUser?.companyId) return;
    
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
    setIsLoadingRecipients(true);
    
    try {
      const recipients = await getWhatsAppCampaignRecipients(appUser.companyId, campaign.id);
      setCampaignRecipients(recipients);
    } catch (error) {
      console.error('Error loading recipients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign recipients',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <PageTitle
          title="Send to Many People"
          subtitle="Send WhatsApp messages to hundreds or thousands of contacts at once"
          icon={MessageCircle}
        />
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/ai-campaigns?channel=whatsapp">
            <Sparkles className="mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Create with AI
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 && !isLoadingCampaigns && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 py-3 sm:py-4">
          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-100 text-sm sm:text-base">Quick Start Guide</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="space-y-2 mt-2">
              <p className="text-xs sm:text-sm">To send your first WhatsApp message to many people:</p>
              <ol className="text-xs sm:text-sm space-y-1 ml-4 list-decimal">
                <li>Choose your platform and connect it in Settings</li>
                <li>Create a list of contacts in WhatsApp Marketing</li>
                <li>Come back here and click "Create Campaign" to send</li>
              </ol>
              <div className="flex flex-col sm:flex-row gap-2 mt-3">
                <Button asChild className="min-h-9 sm:min-h-11 text-xs sm:text-sm" variant="outline" size="sm">
                  <Link href="/settings">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Set Up Connection
                  </Link>
                </Button>
                <Button asChild className="min-h-9 sm:min-h-11 text-xs sm:text-sm" variant="outline" size="sm">
                  <Link href="/whatsapp-marketing">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Manage Contacts
                  </Link>
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'campaigns' | 'create')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <span className="hidden xs:inline">My </span>Campaigns
          </TabsTrigger>
          <TabsTrigger value="create" className="text-xs sm:text-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            Create<span className="hidden xs:inline"> Campaign</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Campaign History</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    View and manage your WhatsApp bulk campaigns
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadCampaigns} disabled={isLoadingCampaigns} className="w-full sm:w-auto text-xs sm:text-sm">
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isLoadingCampaigns ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                </div>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <MessageCircle className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium mb-2">No campaigns yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Create your first WhatsApp bulk campaign to get started
                  </p>
                  <Button onClick={() => setActiveTab('create')} size="sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Create Campaign
                  </Button>
                </div>
              ) : (
                <CampaignsTable
                  campaigns={campaigns}
                  onView={handleViewCampaign}
                  onDelete={handleDeleteCampaign}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {activeTab === 'create' && (
          <TabsContent value="create" className="space-y-4" forceMount>
            <CreateCampaignForm
              whatsappLists={whatsappLists}
              onCampaignCreated={loadCampaigns}
              onTabChange={(tab) => setActiveTab(tab as 'campaigns' | 'create')}
            />
          </TabsContent>
        )}
      </Tabs>

      {showDetailsDialog && (
        <CampaignDetailsDialog
          campaign={selectedCampaign}
          recipients={campaignRecipients}
          isLoadingRecipients={isLoadingRecipients}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
        />
      )}

      <ContextualHelpButton pageId="whatsapp-bulk-campaigns" />
    </div>
  );
}
