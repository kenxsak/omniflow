'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { AppointmentList } from '@/components/appointments/appointment-list';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import {
  getAppointmentsAction,
  createAppointmentAction,
  updateAppointmentAction,
  cancelAppointmentAction,
  deleteAppointmentAction,
  markAppointmentCompletedAction,
  getAppointmentStatsAction,
  syncCalComBookingsAction,
} from '@/app/actions/appointment-actions';
import type { Appointment, AppointmentFilter, AppointmentStats, CreateAppointmentInput, UpdateAppointmentInput } from '@/types/appointments';
import { AnimatedCounter } from '@/components/ui/animated';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

export default function AppointmentsPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { notify, requestPermission, isMobile } = useNotifications();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const hasAutoSynced = useRef(false);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<AppointmentFilter>({});

  // Request notification permission on mount (for mobile push)
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const fetchAppointments = useCallback(async () => {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const [appointmentsResult, statsResult] = await Promise.all([
        getAppointmentsAction({ idToken: appUser.idToken, filters }),
        getAppointmentStatsAction({ idToken: appUser.idToken }),
      ]);
      
      if (appointmentsResult.success) {
        setAppointments(appointmentsResult.appointments);
      }
      
      if (statsResult.success) {
        setStats(statsResult.stats);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load appointments.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [appUser?.idToken, filters, toast]);

  // Auto-sync Cal.com on page load (silent background sync)
  const autoSyncCalCom = useCallback(async () => {
    if (!appUser?.idToken || hasAutoSynced.current) return;
    
    hasAutoSynced.current = true;
    
    try {
      const result = await syncCalComBookingsAction({ idToken: appUser.idToken });
      
      if (result.success && result.synced && result.synced > 0) {
        const message = `Synced ${result.synced} new booking${result.synced > 1 ? 's' : ''} from Cal.com`;
        
        // Show notification (toast on desktop, push on mobile)
        notify({
          title: '📅 Cal.com Synced',
          description: message,
          pushOnMobile: true,
        });
        
        // Refresh appointments list
        fetchAppointments();
      }
      // If no new bookings or error, stay silent (don't bother user)
    } catch (error) {
      // Silent fail for auto-sync - don't show error to user
      console.error('Auto-sync Cal.com failed:', error);
    }
  }, [appUser?.idToken, notify, fetchAppointments]);

  useEffect(() => {
    if (appUser?.idToken) {
      fetchAppointments();
    }
  }, [appUser?.idToken, fetchAppointments]);

  // Trigger auto-sync after initial load
  useEffect(() => {
    if (appUser?.idToken && !isLoading && !hasAutoSynced.current) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        autoSyncCalCom();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [appUser?.idToken, isLoading, autoSyncCalCom]);

  const handleCreateAppointment = async (data: CreateAppointmentInput | UpdateAppointmentInput) => {
    if (!appUser?.idToken) return;
    
    try {
      const result = await createAppointmentAction({
        idToken: appUser.idToken,
        input: data as CreateAppointmentInput,
      });
      
      if (result.success) {
        toast({ title: 'Appointment Created', description: 'Scheduled successfully.' });
        setShowCreateDialog(false);
        fetchAppointments();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to create.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create appointment.', variant: 'destructive' });
    }
  };

  const handleUpdateAppointment = async (data: CreateAppointmentInput | UpdateAppointmentInput) => {
    if (!appUser?.idToken || !editingAppointment) return;
    
    try {
      const result = await updateAppointmentAction({
        idToken: appUser.idToken,
        appointmentId: editingAppointment.id,
        updates: data as Partial<UpdateAppointmentInput>,
      });
      
      if (result.success) {
        toast({ title: 'Appointment Updated', description: 'Updated successfully.' });
        setShowEditDialog(false);
        setEditingAppointment(null);
        fetchAppointments();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to update.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to update appointment.', variant: 'destructive' });
    }
  };

  const handleCancelAppointment = async () => {
    if (!appUser?.idToken || !selectedAppointmentId) return;
    
    try {
      const result = await cancelAppointmentAction({
        idToken: appUser.idToken,
        appointmentId: selectedAppointmentId,
      });
      
      if (result.success) {
        toast({ title: 'Appointment Cancelled' });
        setShowCancelDialog(false);
        setSelectedAppointmentId(null);
        fetchAppointments();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to cancel.', variant: 'destructive' });
    }
  };

  const handleDeleteAppointment = async () => {
    if (!appUser?.idToken || !selectedAppointmentId) return;
    
    try {
      const result = await deleteAppointmentAction({
        idToken: appUser.idToken,
        appointmentId: selectedAppointmentId,
      });
      
      if (result.success) {
        toast({ title: 'Appointment Deleted' });
        setShowDeleteDialog(false);
        setSelectedAppointmentId(null);
        fetchAppointments();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleCompleteAppointment = async (appointmentId: string) => {
    if (!appUser?.idToken) return;
    
    try {
      const result = await markAppointmentCompletedAction({
        idToken: appUser.idToken,
        appointmentId,
      });
      
      if (result.success) {
        toast({ title: 'Appointment Completed' });
        fetchAppointments();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to complete.', variant: 'destructive' });
    }
  };

  const handleSyncCalCom = async () => {
    if (!appUser?.idToken) return;
    
    setIsSyncing(true);
    try {
      const result = await syncCalComBookingsAction({ idToken: appUser.idToken });
      
      if (result.success) {
        const message = result.synced && result.synced > 0 
          ? `Synced ${result.synced} booking${result.synced > 1 ? 's' : ''} from Cal.com`
          : 'Already up to date with Cal.com';
        
        notify({
          title: '✅ Sync Complete',
          description: message,
          pushOnMobile: !!(result.synced && result.synced > 0),
        });
        
        fetchAppointments();
      } else {
        toast({ title: 'Sync Failed', description: result.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to sync.', variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFilterChange = (newFilters: AppointmentFilter) => {
    setFilters(newFilters);
  };

  const handleView = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditDialog(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditDialog(true);
  };

  const handleCancelClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowCancelDialog(true);
  };

  const handleDeleteClick = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowDeleteDialog(true);
  };

  // Status dot colors - Clerk style
  const statDotColors = {
    total: 'bg-stone-300 border-stone-600',
    scheduled: 'bg-emerald-300 border-emerald-700',
    completed: 'bg-violet-300 border-violet-700',
    thisWeek: 'bg-rose-300 border-rose-700',
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Clerk style */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Appointments</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Manage your bookings and schedule
            </p>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCalCom}
              disabled={isSyncing}
              className="h-8 text-xs border-stone-200 dark:border-stone-800"
            >
              <Icon icon="solar:refresh-linear" className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Cal.com'}
            </Button>
            <Link href="/settings?tab=integrations">
              <Button variant="outline" size="sm" className="h-8 text-xs border-stone-200 dark:border-stone-800">
                <Icon icon="solar:settings-linear" className="h-3.5 w-3.5 mr-1.5" />
                Settings
              </Button>
            </Link>
            <Button 
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="h-8 text-xs"
              style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
            >
              <Icon icon="solar:add-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
              New Appointment
            </Button>
          </div>
        </div>
        
        {/* Mobile Actions */}
        <div className="flex sm:hidden gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncCalCom}
            disabled={isSyncing}
            className="h-8 text-xs shrink-0 border-stone-200 dark:border-stone-800"
          >
            <Icon icon="solar:refresh-linear" className={`h-3.5 w-3.5 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Link href="/settings?tab=integrations">
            <Button variant="outline" size="sm" className="h-8 text-xs shrink-0 border-stone-200 dark:border-stone-800">
              <Icon icon="solar:settings-linear" className="h-3.5 w-3.5 mr-1" />
              Settings
            </Button>
          </Link>
          <Button 
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="h-8 text-xs shrink-0"
            style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}
          >
            <Icon icon="solar:add-circle-linear" className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clerk style */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {/* Total */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#3b82f6' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  TOTAL
                </span>
                <Icon icon="solar:calendar-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#3b82f6' }}>
                  <AnimatedCounter value={stats.total} />
                </span>
                <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${statDotColors.total}`} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">All time bookings</p>
            </div>
          </div>
          
          {/* Scheduled */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#f59e0b' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  SCHEDULED
                </span>
                <Icon icon="solar:calendar-mark-linear" className="h-4 w-4" style={{ color: '#f59e0b' }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#f59e0b' }}>
                  <AnimatedCounter value={stats.scheduled} />
                </span>
                <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${statDotColors.scheduled}`} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Upcoming</p>
            </div>
          </div>
          
          {/* Completed */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#10b981' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  COMPLETED
                </span>
                <Icon icon="solar:check-circle-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#10b981' }}>
                  <AnimatedCounter value={stats.completed} />
                </span>
                <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${statDotColors.completed}`} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Finished</p>
            </div>
          </div>
          
          {/* This Week */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#8b5cf6' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  THIS WEEK
                </span>
                <Icon icon="solar:calendar-date-linear" className="h-4 w-4" style={{ color: '#8b5cf6' }} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#8b5cf6' }}>
                  <AnimatedCounter value={stats.upcomingThisWeek} />
                </span>
                <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${statDotColors.thisWeek}`} />
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{stats.upcomingToday} today</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointments List Card - Clerk style */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-14 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }} />
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))' }}>
          <div className="flex items-center gap-2">
            <Icon icon="solar:calendar-linear" className="h-4 w-4" style={{ color: '#6366f1' }} />
            <span className="text-sm font-medium text-foreground">All Appointments</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            View, manage, and schedule appointments with your clients
          </p>
        </div>
        <div className="p-4 sm:p-6">
          <AppointmentList
            appointments={appointments}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onCancel={handleCancelClick}
            onComplete={handleCompleteAppointment}
            onDelete={handleDeleteClick}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Schedule New Appointment</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create a new appointment with reminder settings
            </DialogDescription>
          </DialogHeader>
          <AppointmentForm
            onSubmit={handleCreateAppointment}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[560px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Edit Appointment</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update appointment details and reminders
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <AppointmentForm
              appointment={editingAppointment}
              onSubmit={handleUpdateAppointment}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingAppointment(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the appointment and notify the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAppointmentId(null)}>
              Keep
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedAppointmentId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAppointment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="appointments" />
    </div>
  );
}
