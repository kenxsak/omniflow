'use client';

import React, { useState } from 'react';
import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import ContentCalendar from '@/components/social-media/content-calendar';
import SocialAccountsManager from '@/components/social-media/social-accounts-manager';

export default function SocialMediaPlannerPage() {
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <PageTitle
          title="Content Planner"
          description="Plan, schedule, and manage your social media content calendar"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
            <Link href="/social-media/content-hub">
              <Icon icon="solar:folder-linear" className="h-4 w-4 mr-1.5" />
              Content Hub
            </Link>
          </Button>
          <Button size="sm" asChild className="flex-1 sm:flex-none">
            <Link href="/social-media">
              <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 mr-1.5" />
              Create Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex h-auto p-1">
          <TabsTrigger value="calendar" className="gap-1.5 py-2 px-3 sm:px-4 text-xs sm:text-sm">
            <Icon icon="solar:calendar-linear" className="h-4 w-4" />
            <span>Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5 py-2 px-3 sm:px-4 text-xs sm:text-sm">
            <Icon icon="solar:share-linear" className="h-4 w-4" />
            <span>Publish</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="mt-4 space-y-4">
          <ContentCalendar />
        </TabsContent>

        {/* Publish Tab */}
        <TabsContent value="publish" className="mt-4 space-y-4">
          <SocialAccountsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
