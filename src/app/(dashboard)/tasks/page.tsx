"use client";

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import PageTitle from '@/components/ui/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Animated, StaggerContainer, StaggerItem } from '@/components/ui/animated';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getAppointmentsAction } from '@/app/actions/appointment-actions';
import { getLeadsForTaskDropdown } from '@/app/actions/task-actions';

const AddTaskDialog = dynamic(() => import('@/components/tasks/add-task-dialog'), { ssr: false });
const TaskCalendarView = dynamic(() => import('@/components/tasks/task-calendar-view'), { ssr: false });
const AppointmentDialog = dynamic(() => import('@/components/appointments/appointment-dialog').then(mod => ({ default: mod.AppointmentDialog })), { ssr: false });

const priorityColors: Record<Task['priority'], string> = {
  High: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  Low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
};

const statusColors: Record<Task['status'], string> = {
  'To Do': 'border-gray-400 text-gray-600',
  'In Progress': 'border-amber-400 text-amber-600',
  'Done': 'border-emerald-500 text-emerald-600',
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
        <Animated animation="fadeDown">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <PageTitle
              title="Tasks"
              description="Manage all your to-dos in one place"
            />
            <Button onClick={handleCreateNew} variant="gradient" size="sm" className="w-full sm:w-auto">
              <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" /> New Task
            </Button>
          </div>
        </Animated>

        {/* Stats */}
        <StaggerContainer className="grid grid-cols-3 gap-2 sm:gap-4">
          <StaggerItem>
            <Card className="card-gradient-blue">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:clock-circle-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-blue-700 dark:text-blue-300">{todoCount}</p>
                  <p className="text-[10px] sm:text-xs text-blue-600/70">To Do</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="card-gradient-amber">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:danger-circle-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-300">{inProgressCount}</p>
                  <p className="text-[10px] sm:text-xs text-amber-600/70">In Progress</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
          <StaggerItem>
            <Card className="card-gradient-green">
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Icon icon="solar:checkmark-circle-linear" className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-300">{doneCount}</p>
                  <p className="text-[10px] sm:text-xs text-emerald-600/70">Done</p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerContainer>

        <Animated animation="fadeUp">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'calendar')} className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
              <CardTitle className="text-base sm:text-lg">All Tasks</CardTitle>
              <TabsList className="h-auto p-1">
                <TabsTrigger value="table" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  <Icon icon="solar:list-linear" className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                  <span className="hidden xs:inline">Table</span>
                </TabsTrigger>
                <TabsTrigger value="calendar" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5">
                  <Icon icon="solar:calendar-linear" className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> 
                  <span className="hidden xs:inline">Calendar</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="table">
              <Card>
                <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                  <CardDescription className="text-xs sm:text-sm">View all your scheduled tasks</CardDescription>
                </CardHeader>
                <CardContent className="p-0 sm:p-6 sm:pt-0">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32 sm:h-40">
                      <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[600px] sm:min-w-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Task</TableHead>
                              <TableHead className="w-[80px]">Priority</TableHead>
                              <TableHead className="w-[100px]">Status</TableHead>
                              <TableHead className="hidden sm:table-cell">Due</TableHead>
                              <TableHead className="hidden md:table-cell">Lead</TableHead>
                              <TableHead className="w-[60px] text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tasks.length > 0 ? (
                              tasks.map(task => (
                                <TableRow key={task.id} className="group">
                                  <TableCell>
                                    <div className="font-medium text-xs sm:text-sm line-clamp-1" title={task.title}>
                                      {task.title}
                                    </div>
                                    <div className="sm:hidden text-[10px] text-muted-foreground mt-0.5">
                                      Due: {format(new Date(task.dueDate), 'MMM dd')}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={`${priorityColors[task.priority]} text-[10px] sm:text-xs`} size="sm">
                                      {task.priority}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={`${statusColors[task.status]} text-[10px] sm:text-xs`} size="sm">
                                      {task.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                                    {format(new Date(task.dueDate), 'PP')}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    {task.leadId ? (
                                      <Button variant="link" asChild className="p-0 h-auto text-xs">
                                        <Link href={`/crm/leads/${task.leadId}`}>{task.leadName || 'View'}</Link>
                                      </Button>
                                    ) : (
                                      <span className="text-muted-foreground text-xs">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon-sm" className="opacity-60 group-hover:opacity-100">
                                          <Icon icon="solar:menu-dots-circle-linear" className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => handleEdit(task)}>
                                          <Icon icon="solar:pen-2-linear" className="mr-2 h-4 w-4" /> Edit
                                        </DropdownMenuItem>
                                        {task.leadId && (
                                          <>
                                            <DropdownMenuItem onSelect={() => handleScheduleAppointment(task)}>
                                              <Icon icon="solar:calendar-add-linear" className="mr-2 h-4 w-4" /> Schedule
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                          </>
                                        )}
                                        <AlertDialog>
                                          <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={(e) => e.preventDefault()}>
                                              <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-4 w-4" /> Delete
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
                              ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                  <div className="flex flex-col items-center gap-2">
                                    <p className="text-sm text-muted-foreground">No tasks yet</p>
                                    <Button onClick={handleCreateNew} variant="outline" size="sm">
                                      <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" /> Create Task
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="calendar">
              {isLoading ? (
                <div className="flex justify-center items-center h-32 sm:h-40">
                  <Icon icon="solar:refresh-circle-linear" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                </div>
              ) : (
                <TaskCalendarView tasks={tasks} onEditTask={handleEdit} />
              )}
            </TabsContent>
          </Tabs>
        </Animated>
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
    </>
  );
}
