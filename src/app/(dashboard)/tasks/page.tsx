"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getStoredTasks, deleteTask } from '@/lib/task-data';
import type { Task } from '@/types/task';
import type { Lead } from '@/lib/mock-data';
import type { Appointment } from '@/types/appointments';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { logActivity } from '@/lib/activity-log';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getAppointmentsAction } from '@/app/actions/appointment-actions';
import { getLeadsForTaskDropdown } from '@/app/actions/task-actions';
import { cn } from '@/lib/utils';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

const AddTaskDialog = dynamic(() => import('@/components/tasks/add-task-dialog'), { ssr: false });
const TaskCalendarView = dynamic(() => import('@/components/tasks/task-calendar-view'), { ssr: false });
const AppointmentDialog = dynamic(() => import('@/components/appointments/appointment-dialog').then(mod => ({ default: mod.AppointmentDialog })), { ssr: false });

// Clerk-style status dots
const priorityDotColors: Record<Task['priority'], string> = {
  High: 'bg-rose-300 border-rose-700',
  Medium: 'bg-amber-300 border-amber-700',
  Low: 'bg-blue-300 border-blue-700',
};

const statusDotColors: Record<Task['status'], string> = {
  'To Do': 'bg-stone-300 border-stone-600',
  'In Progress': 'bg-amber-300 border-amber-700',
  'Done': 'bg-emerald-300 border-emerald-700',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [selectedTaskLead, setSelectedTaskLead] = useState<Lead | null>(null);
  const { toast } = useToast();
  const { appUser, idToken } = useAuth();

  const loadData = useCallback(async () => {
    if (!appUser?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [storedTasks, leads, appointmentsResult] = await Promise.all([
        getStoredTasks(appUser.companyId),
        getLeadsForTaskDropdown(appUser.companyId),
        idToken ? getAppointmentsAction({ idToken }) : Promise.resolve({ success: false, appointments: [] }),
      ]);

      setTasks(storedTasks);
      setAllLeads(leads);
      if (appointmentsResult.success && appointmentsResult.appointments) {
        setAllAppointments(appointmentsResult.appointments);
      }
    } catch (error) {
      console.error("Failed to load tasks and leads:", error);
      toast({
        title: "Error",
        description: "Could not load tasks data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [appUser, idToken, toast]);

  useEffect(() => {
    if (appUser) {
      loadData();
    }
  }, [appUser, loadData]);

  const handleCreateNew = () => {
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const handleDelete = async (task: Task) => {
    if (!appUser?.companyId) return;
    await deleteTask(task.id);
    toast({ title: "Task Deleted", description: `Task "${task.title}" has been removed.` });
    await logActivity({ companyId: appUser.companyId, description: `Task deleted: "${task.title.substring(0, 30)}..."`, type: 'task' });
    await loadData();
  };

  const handleScheduleAppointment = (task: Task) => {
    if (!task.leadId) return;
    const lead = allLeads.find(l => l.id === task.leadId);
    if (lead) {
      setSelectedTaskLead(lead);
      setAppointmentDialogOpen(true);
    }
  };

  const todoCount = tasks.filter(t => t.status === 'To Do').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Clerk style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">Tasks</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
              Manage all your to-dos in one place
            </p>
          </div>
          <Button onClick={handleCreateNew} size="sm" className="h-8 text-xs w-full sm:w-auto" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}>
            <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" /> New Task
          </Button>
        </div>

        {/* Stats - Clerk style */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* To Do */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#3b82f6' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <Icon icon="solar:clock-circle-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
                <span className={cn("size-1.5 sm:size-2 border-[1.5px] rounded-full", statusDotColors['To Do'])} />
              </div>
              <div className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#3b82f6' }}>{todoCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">To Do</p>
            </div>
          </div>

          {/* In Progress */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#f59e0b' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <Icon icon="solar:hourglass-linear" className="h-4 w-4" style={{ color: '#f59e0b' }} />
                <span className={cn("size-1.5 sm:size-2 border-[1.5px] rounded-full", statusDotColors['In Progress'])} />
              </div>
              <div className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#f59e0b' }}>{inProgressCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">In Progress</p>
            </div>
          </div>

          {/* Done */}
          <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
            <div className="absolute inset-x-6 sm:inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: '#10b981' }} />
            <div className="p-3 sm:p-4 pt-4 sm:pt-5">
              <div className="flex items-center justify-between mb-2">
                <Icon icon="solar:check-circle-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
                <span className={cn("size-1.5 sm:size-2 border-[1.5px] rounded-full", statusDotColors['Done'])} />
              </div>
              <div className="text-xl sm:text-2xl font-semibold tabular-nums" style={{ color: '#10b981' }}>{doneCount}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Done</p>
            </div>
          </div>
        </div>

        {/* Tasks List - Clerk style card */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col gap-3 p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05))' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}>
                  <Icon icon="solar:checklist-minimalistic-linear" className="h-4.5 w-4.5" style={{ color: '#6366f1' }} />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-foreground">All Tasks</h2>
                  <p className="text-xs text-muted-foreground">{tasks.length} total tasks</p>
                </div>
              </div>
            </div>
            {/* View Mode Tabs - Full width on mobile */}
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'calendar')} className="w-full">
              <TabsList className="h-11 sm:h-9 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg w-full grid grid-cols-2">
                <TabsTrigger value="table" className="text-xs sm:text-sm px-4 py-2 sm:py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800 data-[state=active]:shadow-sm gap-2 text-muted-foreground data-[state=active]:text-foreground transition-all font-medium">
                  <Icon icon="solar:list-linear" className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  <span>Table</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs sm:text-sm px-4 py-2 sm:py-1.5 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800 data-[state=active]:shadow-sm gap-2 text-muted-foreground data-[state=active]:text-foreground transition-all font-medium">
                  <Icon icon="solar:calendar-linear" className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  <span>Calendar</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Card Content */}
          {viewMode === 'table' ? (
            <>
              {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-40">
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : tasks.length > 0 ? (
                <>
                  {/* Mobile Card View */}
                  <div className="sm:hidden divide-y divide-stone-200 dark:divide-stone-800">
                    {tasks.map(task => (
                      <div key={task.id} className="p-4 hover:bg-stone-50 dark:hover:bg-stone-900/50">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground line-clamp-2">{task.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-stone-100 dark:hover:bg-stone-800 flex-shrink-0">
                                <Icon icon="solar:menu-dots-bold" className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onSelect={() => handleEdit(task)} className="text-xs py-2.5">
                                <Icon icon="solar:pen-linear" className="mr-2 h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              {task.leadId && (
                                <>
                                  <DropdownMenuItem onSelect={() => handleScheduleAppointment(task)} className="text-xs py-2.5">
                                    <Icon icon="solar:calendar-add-linear" className="mr-2 h-3.5 w-3.5" /> Schedule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem className="text-xs py-2.5 text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                    <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete "{task.title}".
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
                                    <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(task)} className={cn(buttonVariants({ variant: "destructive" }), "w-full sm:w-auto")}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800">
                            <span className={cn("size-2 border-[1.5px] rounded-full", priorityDotColors[task.priority])} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                              {task.priority}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-stone-100 dark:bg-stone-800">
                            <span className={cn("size-2 border-[1.5px] rounded-full", statusDotColors[task.status])} />
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                              {task.status === 'In Progress' ? 'WIP' : task.status.toUpperCase()}
                            </span>
                          </span>
                          {task.leadId && task.leadName && (
                            <Button variant="link" asChild className="p-0 h-auto text-xs text-indigo-600 dark:text-indigo-400">
                              <Link href={`/crm/leads/${task.leadId}`}>
                                <Icon icon="solar:user-linear" className="h-3 w-3 mr-1" />
                                {task.leadName}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Task</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[80px]">Priority</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[100px]">Status</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">Due</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Lead</TableHead>
                          <TableHead className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[60px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tasks.map(task => (
                          <TableRow key={task.id} className="group border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50">
                            <TableCell className="py-3">
                              <div className="font-medium text-xs sm:text-sm text-foreground line-clamp-1" title={task.title}>
                                {task.title}
                              </div>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="flex items-center gap-1.5">
                                <span className={cn("size-2 border-[1.5px] rounded-full", priorityDotColors[task.priority])} />
                                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                                  {task.priority}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="flex items-center gap-1.5">
                                <span className={cn("size-2 border-[1.5px] rounded-full", statusDotColors[task.status])} />
                                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-foreground font-mono">
                                  {task.status === 'In Progress' ? 'WIP' : task.status.toUpperCase()}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-3">
                              {format(new Date(task.dueDate), 'PP')}
                            </TableCell>
                            <TableCell className="hidden md:table-cell py-3">
                              {task.leadId ? (
                                <Button variant="link" asChild className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                                  <Link href={`/crm/leads/${task.leadId}`}>{task.leadName || 'View'}</Link>
                                </Button>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-60 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-800">
                                    <Icon icon="solar:menu-dots-bold" className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onSelect={() => handleEdit(task)} className="text-xs">
                                    <Icon icon="solar:pen-linear" className="mr-2 h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  {task.leadId && (
                                    <>
                                      <DropdownMenuItem onSelect={() => handleScheduleAppointment(task)} className="text-xs">
                                        <Icon icon="solar:calendar-add-linear" className="mr-2 h-3.5 w-3.5" /> Schedule
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                        <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-3.5 w-3.5" /> Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This will permanently delete "{task.title}".
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(task)} className={buttonVariants({ variant: "destructive" })}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Icon icon="solar:checklist-linear" className="h-12 w-12 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No tasks yet</p>
                  <Button onClick={handleCreateNew} size="sm" className="h-10 text-sm px-6" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }}>
                    <Icon icon="solar:add-circle-linear" className="mr-2 h-4 w-4" /> Create Your First Task
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-40">
                  <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <TaskCalendarView tasks={tasks} onEditTask={handleEdit} />
              )}
            </div>
          )}
        </div>
      </div>

      <AddTaskDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onTaskSaved={loadData}
        taskToEdit={editingTask}
        allLeads={allLeads}
        allAppointments={allAppointments}
      />

      <AppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        contact={selectedTaskLead ? {
          id: selectedTaskLead.id,
          name: selectedTaskLead.name,
          email: selectedTaskLead.email,
          phone: selectedTaskLead.phone
        } : undefined}
        onSuccess={() => {
          setAppointmentDialogOpen(false);
          toast({
            title: 'Appointment Scheduled',
            description: `Appointment with ${selectedTaskLead?.name} has been scheduled.`,
          });
          setSelectedTaskLead(null);
          loadData();
        }}
      />

      {/* Help Button */}
      <ContextualHelpButton pageId="tasks" />
    </>
  );
}
