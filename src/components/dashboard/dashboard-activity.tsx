'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Animated } from '@/components/ui/animated';
import { Icon } from '@iconify/react';
import { EnterpriseActivityCard } from '@/components/dashboard/enterprise-activity-card';
import Link from 'next/link';
import { format, isToday, isTomorrow, isPast, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { getAppointmentsAction } from '@/app/actions/appointment-actions';
import { getStoredTasks, updateStoredTask } from '@/lib/task-data';
import type { Appointment } from '@/types/appointments';
import type { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function DashboardActivity() {
  const { idToken, appUser } = useAuth();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!idToken || !appUser?.companyId) {
        setIsLoadingAppointments(false);
        return;
      }

      try {
        const result = await getAppointmentsAction({
          idToken,
          filters: {
            status: ['scheduled', 'pending'],
            startDate: new Date().toISOString(),
          },
        });

        if (result.success && result.appointments) {
          const upcoming = result.appointments
            .filter(apt => new Date(apt.startTime) >= new Date())
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
            .slice(0, 3);
          setAppointments(upcoming);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      } finally {
        setIsLoadingAppointments(false);
      }
    }

    async function loadTasks() {
      if (!appUser?.companyId) {
        setIsLoadingTasks(false);
        return;
      }

      try {
        const allTasks = await getStoredTasks(appUser.companyId);
        const pendingTasks = allTasks
          .filter(task => task.status !== 'Done')
          .sort((a, b) => {
            const priorityOrder = { High: 0, Medium: 1, Low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            if (a.dueDate && b.dueDate) {
              return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            }
            return 0;
          })
          .slice(0, 4);
        setTasks(pendingTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    }

    loadAppointments();
    loadTasks();
  }, [idToken, appUser?.companyId]);

  const handleCompleteTask = async (task: Task) => {
    if (!appUser?.companyId) return;

    try {
      await updateStoredTask({ id: task.id, status: 'Done' });
      setTasks(prev => prev.filter(t => t.id !== task.id));
      toast({
        title: 'Task Completed',
        description: `"${task.title}" marked as done`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const getTimeLabel = (startTime: string) => {
    const date = new Date(startTime);
    if (isToday(date)) {
      const minutesUntil = differenceInMinutes(date, new Date());
      if (minutesUntil <= 60 && minutesUntil > 0) {
        return { label: `In ${minutesUntil}m`, urgent: true };
      }
      return { label: 'Today', urgent: false };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', urgent: false };
    }
    return { label: format(date, 'MMM d'), urgent: false };
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'bg-destructive-muted text-destructive-muted-foreground border border-destructive-border';
      case 'Medium': return 'bg-warning-muted text-warning-muted-foreground border border-warning-border';
      case 'Low': return 'bg-muted text-muted-foreground border border-border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDueLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return { label: 'Overdue', className: 'text-destructive' };
    }
    if (isToday(date)) {
      return { label: 'Due today', className: 'text-warning-muted-foreground' };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', className: 'text-muted-foreground' };
    }
    return { label: format(date, 'MMM d'), className: 'text-muted-foreground' };
  };

  return (
    <Animated animation="fadeUp">
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Appointments Card - Clerk style */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              UPCOMING
            </span>
            <Button variant="ghost" size="sm" asChild className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
              <Link href="/appointments" className="inline-flex items-center gap-1">
                VIEW ALL
                <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="p-3 sm:p-4">
            {isLoadingAppointments ? (
              <div className="flex justify-center py-6">
                <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">No upcoming appointments</p>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                  <Link href="/appointments" className="inline-flex items-center gap-1.5">
                    SCHEDULE
                    <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-stone-200 dark:divide-stone-800">
                {appointments.map((apt) => {
                  const timeInfo = getTimeLabel(apt.startTime);
                  return (
                    <div
                      key={apt.id}
                      className="flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex-shrink-0 w-10 sm:w-12 text-center">
                        <div className="text-xs sm:text-sm font-semibold tabular-nums text-foreground">
                          {format(new Date(apt.startTime), 'HH:mm')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-xs sm:text-sm truncate text-foreground">{apt.title}</span>
                          {timeInfo.urgent && (
                            <span className="flex items-center gap-1">
                              <span className="size-1.5 sm:size-2 border-[1.5px] rounded-full bg-rose-300 border-rose-700" />
                              <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                                {timeInfo.label}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                          <span className="truncate">{apt.clientName}</span>
                          {apt.meetingLink && (
                            <span className="hidden sm:flex items-center gap-1">
                              <Icon icon="solar:videocamera-linear" className="h-3 w-3" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-muted-foreground tabular-nums font-mono">{apt.duration}m</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Tasks Card - Clerk style */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-amber-500 dark:bg-amber-400" />
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                TASKS
              </span>
              {tasks.length > 0 && (
                <span className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground font-mono">
                  ({tasks.length})
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
              <Link href="/tasks" className="inline-flex items-center gap-1">
                VIEW ALL
                <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
              </Link>
            </Button>
          </div>
          <div className="p-3 sm:p-4">
            {isLoadingTasks ? (
              <div className="flex justify-center py-6">
                <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">All caught up!</p>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs">
                  <Link href="/tasks" className="inline-flex items-center gap-1.5">
                    ADD TASK
                    <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {tasks.map((task) => {
                  const dueInfo = getDueLabel(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2"
                    >
                      <Checkbox
                        checked={false}
                        onCheckedChange={() => handleCompleteTask(task)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-sm border-stone-300 dark:border-stone-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm truncate text-foreground">{task.title}</span>
                          {/* Status badge - Clerk style with colored dot */}
                          <span className="flex items-center gap-1">
                            <span className={`size-1.5 sm:size-2 border-[1.5px] rounded-full ${
                              task.priority === 'High' ? 'bg-rose-300 border-rose-700' : 
                              task.priority === 'Medium' ? 'bg-amber-300 border-amber-700' : 'bg-stone-300 border-stone-500'
                            }`} />
                            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                              {task.priority.toUpperCase()}
                            </span>
                          </span>
                        </div>
                        {dueInfo && (
                          <div className={`text-[10px] sm:text-[11px] mt-0.5 ${dueInfo.className}`}>
                            {dueInfo.label}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Enterprise Activity Card */}
        <EnterpriseActivityCard />
      </div>
    </Animated>
  );
}
