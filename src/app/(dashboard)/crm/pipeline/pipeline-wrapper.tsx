'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Lead } from '@/lib/mock-data';
import { getPipelineData } from '@/app/actions/pipeline-actions';
import { cn } from '@/lib/utils';
import { AppointmentDialog } from '@/components/appointments/appointment-dialog';
import { PipelineManager } from '@/components/crm/pipeline-manager';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function PipelineWrapper() {
  const router = useRouter();
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [leadsByStatus, setLeadsByStatus] = useState<Record<Lead['status'], Lead[]> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPipelineManager, setShowPipelineManager] = useState(false);

  const handleLeadClick = (leadId: string) => {
    router.push(`/crm/leads/${leadId}`);
  };

  const handleScheduleAppointment = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLead(lead);
    setAppointmentDialogOpen(true);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getPipelineData();
        if (!data) {
          setError('Please log in to view your pipeline.');
          return;
        }
        setLeadsByStatus(data);
      } catch (err) {
        console.error('Error loading pipeline data:', err);
        setError('Failed to load pipeline data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const statuses: Array<Lead['status']> = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

  // Clerk-style status dots (subtle colored dots, not backgrounds)
  const statusDotColors: Record<Lead['status'], string> = {
    New: 'bg-blue-300 border-blue-700',
    Contacted: 'bg-amber-300 border-amber-700',
    Qualified: 'bg-emerald-300 border-emerald-700',
    Won: 'bg-violet-300 border-violet-700',
    Lost: 'bg-rose-300 border-rose-700',
  };

  const statusIcons: Record<Lead['status'], string> = {
    New: 'solar:star-linear',
    Contacted: 'solar:phone-calling-linear',
    Qualified: 'solar:check-circle-linear',
    Won: 'solar:cup-star-linear',
    Lost: 'solar:close-circle-linear',
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon icon="solar:refresh-linear" className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon icon="solar:danger-triangle-linear" className="w-5 h-5" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!leadsByStatus) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-sm text-muted-foreground">No pipeline data available</p>
      </div>
    );
  }

  // Lead card component - Clerk style with improved mobile buttons
  const LeadCard = ({ lead }: { lead: Lead }) => (
    <div 
      className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-3 sm:p-4 cursor-pointer transition-all hover:bg-stone-50 dark:hover:bg-stone-900/50"
      onClick={() => handleLeadClick(lead.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate text-sm sm:text-base text-foreground">{lead.name}</div>
          <div className="text-xs sm:text-sm text-muted-foreground truncate">{lead.email}</div>
          {lead.phone && (
            <div className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{lead.phone}</div>
          )}
        </div>
      </div>
      {/* Action buttons - more prominent on mobile */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-8 px-3 text-xs flex-1 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
          onClick={(e) => {
            e.stopPropagation();
            handleLeadClick(lead.id);
          }}
        >
          <Icon icon="solar:eye-linear" className="h-3.5 w-3.5 mr-1.5" />
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 sm:h-8 px-3 text-xs flex-1 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
          onClick={(e) => handleScheduleAppointment(lead, e)}
        >
          <Icon icon="solar:calendar-linear" className="h-3.5 w-3.5 mr-1.5" />
          Book
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header - Clerk style */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground">Pipeline</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
            Visualize your sales pipeline
          </p>
        </div>
        {appUser?.companyId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPipelineManager(true)}
            className="h-8 sm:h-9 text-xs sm:text-sm"
          >
            <Icon icon="solar:settings-linear" className="w-3.5 h-3.5 mr-1.5" />
            <span className="hidden sm:inline">Manage Pipelines</span>
            <span className="sm:hidden">Manage</span>
          </Button>
        )}
      </div>
      
      {/* Summary Stats - Clerk style cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {statuses.map(status => {
          // Colorful accent bars for each status
          const statusAccentColors: Record<Lead['status'], string> = {
            New: 'bg-blue-500 dark:bg-blue-400',
            Contacted: 'bg-amber-500 dark:bg-amber-400',
            Qualified: 'bg-emerald-500 dark:bg-emerald-400',
            Won: 'bg-violet-500 dark:bg-violet-400',
            Lost: 'bg-rose-500 dark:bg-rose-400',
          };
          const statusIconColors: Record<Lead['status'], string> = {
            New: 'text-blue-500 dark:text-blue-400',
            Contacted: 'text-amber-500 dark:text-amber-400',
            Qualified: 'text-emerald-500 dark:text-emerald-400',
            Won: 'text-violet-500 dark:text-violet-400',
            Lost: 'text-rose-500 dark:text-rose-400',
          };
          return (
          <div 
            key={status} 
            className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden"
          >
            {/* Accent bar */}
            <div className={cn("absolute inset-x-6 sm:inset-x-8 top-0 h-0.5 rounded-b-full", statusAccentColors[status])} />
            
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {status.toUpperCase()}
                </span>
                <Icon icon={statusIcons[status]} className={cn("h-4 w-4", statusIconColors[status])} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={cn("text-xl sm:text-2xl font-semibold tabular-nums", statusIconColors[status])}>
                  {leadsByStatus[status].length}
                </span>
                {/* Status dot indicator */}
                <span className="flex items-center gap-1">
                  <span className={cn(
                    "size-1.5 sm:size-2 border-[1.5px] rounded-full",
                    statusDotColors[status]
                  )} />
                </span>
              </div>
            </div>
          </div>
        )})}
      </div>

      {/* Mobile: Tabs View */}
      <div className="block lg:hidden">
        <Tabs defaultValue={statuses[0]} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-stone-100 dark:bg-stone-900 rounded-xl">
            {statuses.map(status => (
              <TabsTrigger 
                key={status} 
                value={status}
                className="text-[9px] sm:text-[10px] py-2 px-1 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800"
              >
                <span className="flex items-center gap-1">
                  <span className={cn(
                    "size-1.5 border-[1.5px] rounded-full",
                    statusDotColors[status]
                  )} />
                  <span className="truncate">{status}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {statuses.map(status => (
            <TabsContent key={status} value={status} className="mt-4">
              <div className="space-y-2">
                {leadsByStatus[status].length === 0 ? (
                  <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 p-6 text-center">
                    <Icon icon={statusIcons[status]} className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No leads</p>
                  </div>
                ) : (
                  leadsByStatus[status].map(lead => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Desktop: Grid View */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-3">
        {statuses.map(status => {
          const columnHeaderBg: Record<Lead['status'], string> = {
            New: 'bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10',
            Contacted: 'bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10',
            Qualified: 'bg-gradient-to-r from-emerald-50 to-emerald-50/50 dark:from-emerald-950/30 dark:to-emerald-950/10',
            Won: 'bg-gradient-to-r from-violet-50 to-violet-50/50 dark:from-violet-950/30 dark:to-violet-950/10',
            Lost: 'bg-gradient-to-r from-rose-50 to-rose-50/50 dark:from-rose-950/30 dark:to-rose-950/10',
          };
          return (
          <div key={status} className="space-y-3">
            {/* Column header - with subtle color */}
            <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800", columnHeaderBg[status])}>
              <span className={cn(
                "size-2 border-[1.5px] rounded-full",
                statusDotColors[status]
              )} />
              <span className="font-medium text-sm text-foreground">{status}</span>
              <span className="ml-auto text-xs font-mono text-muted-foreground">
                {leadsByStatus[status].length}
              </span>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
              {leadsByStatus[status].length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No leads
                </div>
              ) : (
                leadsByStatus[status].map(lead => (
                  <LeadCard key={lead.id} lead={lead} />
                ))
              )}
            </div>
          </div>
        )})}
      </div>

      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        contact={selectedLead ? {
          id: selectedLead.id,
          name: selectedLead.name,
          email: selectedLead.email,
          phone: selectedLead.phone
        } : undefined}
        onSuccess={() => {
          setAppointmentDialogOpen(false);
          toast({
            title: 'Appointment Scheduled',
            description: `Appointment with ${selectedLead?.name} has been scheduled.`,
          });
          setSelectedLead(null);
        }}
      />

      {/* Pipeline Manager */}
      {appUser?.companyId && (
        <PipelineManager
          companyId={appUser.companyId}
          open={showPipelineManager}
          onOpenChange={setShowPipelineManager}
          onPipelineChange={(pipeline) => {
            toast({
              title: 'Pipeline Updated',
              description: `Switched to ${pipeline.name}`,
            });
          }}
        />
      )}
    </div>
  );
}
