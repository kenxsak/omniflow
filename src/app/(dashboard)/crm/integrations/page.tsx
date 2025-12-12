
"use client";

import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link as LinkIcon, AlertTriangle } from 'lucide-react'; // Use Link Lucide icon
import HubspotContactList from '@/components/crm/HubspotContactList'; // Import the HubSpot component
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Bitrix24ContactList from '@/components/crm/Bitrix24ContactList';
import ZohoContactList from '@/components/crm/ZohoContactList';

export default function CrmIntegrationsPage() {

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <PageTitle
        title="Import Contacts from Other CRMs"
        description="One-time migration from HubSpot, Zoho, or Bitrix24 into OmniFlow"
      />

       <Alert variant="default" className="border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/30 py-2 sm:py-3">
          <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 !text-blue-600 dark:!text-blue-400" />
          <AlertTitle className="text-blue-700 dark:text-blue-300 text-sm sm:text-base">Easy Migration to OmniFlow</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
            Already using HubSpot, Zoho, or Bitrix24? No problem! Connect your account in <a href="/settings?tab=integrations" className="font-medium underline">Settings &gt; Connected Tools</a>, 
            then import your contacts here with one click. After import, OmniFlow becomes your main CRM - manage everything from one place and save money.
          </AlertDescription>
        </Alert>

      <Tabs defaultValue="hubspot" className="w-full">
        <TabsList className="flex flex-wrap h-auto justify-start mb-4 sm:mb-6 gap-1">
          <TabsTrigger value="hubspot" className="text-xs sm:text-sm px-2 sm:px-3">HubSpot</TabsTrigger>
          <TabsTrigger value="zoho" className="text-xs sm:text-sm px-2 sm:px-3">Zoho CRM</TabsTrigger>
          <TabsTrigger value="bitrix24" className="text-xs sm:text-sm px-2 sm:px-3">Bitrix24</TabsTrigger>
        </TabsList>

        <TabsContent value="hubspot">
          <HubspotContactList />
        </TabsContent>

        <TabsContent value="zoho">
           <ZohoContactList />
        </TabsContent>

        <TabsContent value="bitrix24">
             <Bitrix24ContactList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
