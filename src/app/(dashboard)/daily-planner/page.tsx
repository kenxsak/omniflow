"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import { format, isToday, isPast, isThisWeek, isThisMonth, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getStoredTasks, updateStoredTask } from '@/lib/task-data';
import { getLeadsForTaskDropdown } from '@/app/actions/task-actions';
import { getAppointmentsAction } from '@/app/actions/appointment-actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';
import type { Lead } from '@/lib/mock-data';
import type { Appointment } from '@/types/appointments';
import { openWhatsApp } from '@/lib/open-external-link';
import dynamic from 'next/dynamic';

const AddTaskDialog = dynamic(() => import('@/components/tasks/add-task-dialog'), { ssr: false });
const QuickEmailComposer = dynamic(() => import('@/components/crm/quick-email-composer').then(m => ({ default: m.QuickEmailComposer })), { ssr: false });

// Priority colors
const priorityColors = {
  High: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300',
  Medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  Low: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
};

// Lead status colors for "rotting" indicator
const getLeadHealthColor = (daysSinceContact: number) => {
  if (daysSinceContact >= 14) return 'text-rose-600 bg-rose-100 dark:bg-rose-950';
  if (daysSinceContact >= 7) return 'text-amber-600 bg-amber-100 dark:bg-amber-950';
  return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950';
};

type TimePeriod = 'today' | 'week' | 'month';
type ViewMode = 'my' | 'team';

export default function DailyPlannerPage() {
  const { appUser, idToken } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('my');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);

  const loadData = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    
    try {
      const [tasksData, leadsData, appointmentsResult] = await Promise.all([
        getStoredTasks(appUser.companyId),
        getLeadsForTaskDropdown(appUser.companyId),
        idToken ? getAppointmentsAction({ idToken }) : Promise.resolve({ success: false, appointments: [] }),
      ]);
      
      setTasks(tasksData);
      setLeads(leadsData || []);
      if (appointmentsResult.success && appointmentsResult.appointments) {
        setAppointments(appointmentsResult.appointments);
      }
    } catch (error) {
      console.error('Error loading daily planner data:', error);
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [appUser?.companyId, idToken, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter tasks based on time period
  const filteredData = useMemo(() => {
    const now = new Date();
    
    const isInPeriod = (dateStr: string) => {
      const date = new Date(dateStr);
      switch (timePeriod) {
        case 'today': return isToday(date);
        case 'week': return isThisWeek(date, { weekStartsOn: 1 });
        case 'month': return isThisMonth(date);
        default: return isToday(date);
      }
    };

    const periodTasks = tasks.filter(t => isInPeriod(t.dueDate) && t.status !== 'Done');
    const completedTasks = tasks.filter(t => isInPeriod(t.dueDate) && t.status === 'Done');
    const overdueTasks = tasks.filter(t => {
      const dueDate = new Date(t.dueDate);
      return isPast(dueDate) && !isToday(dueDate) && t.status !== 'Done';
    });

    const periodAppointments = appointments.filter(a => {
      const startTime = new Date(a.startTime);
      switch (timePeriod) {
        case 'today': return isToday(startTime);
        case 'week': return isThisWeek(startTime, { weekStartsOn: 1 });
        case 'month': return isThisMonth(startTime);
        default: return isToday(startTime);
      }
    }).filter(a => a.status !== 'cancelled');

    return { periodTasks, completedTasks, overdueTasks, periodAppointments };
  }, [tasks, appointments, timePeriod]);

  // Leads analysis - "Rotting" leads like Pipedrive
  const leadsAnalysis = useMemo(() => {
    const activeLeads = leads.filter(l => l.status !== 'Won' && l.status !== 'Lost');
    
    const getLastContactDays = (lead: Lead) => {
      if (!lead.lastContacted) return 999;
      const lastDate = lead.lastContacted?.toDate ? lead.lastContacted.toDate() : new Date(lead.lastContacted);
      return differenceInDays(new Date(), lastDate);
    };

    const rottingLeads = activeLeads.filter(l => getLastContactDays(l) >= 14).slice(0, 5);
    const staleLeads = activeLeads.filter(l => {
      const days = getLastContactDays(l);
      return days >= 7 && days < 14;
    }).slice(0, 5);
    const neverContacted = activeLeads.filter(l => !l.lastContacted).slice(0, 5);
    const healthyLeads = activeLeads.filter(l => getLastContactDays(l) < 7);

    return { rottingLeads, staleLeads, neverContacted, healthyLeads, activeLeads, getLastContactDays };
  }, [leads]);

  // Activity goals (simple targets)
  const activityGoals = useMemo(() => {
    const dailyTaskGoal = 5;
    const weeklyTaskGoal = 25;
    const monthlyTaskGoal = 100;
    
    const dailyAppointmentGoal = 2;
    const weeklyAppointmentGoal = 10;
    const monthlyAppointmentGoal = 40;

    const todayCompleted = tasks.filter(t => isToday(new Date(t.dueDate)) && t.status === 'Done').length;
    const weekCompleted = tasks.filter(t => isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }) && t.status === 'Done').length;
    const monthCompleted = tasks.filter(t => isThisMonth(new Date(t.dueDate)) && t.status === 'Done').length;

    const todayAppointments = appointments.filter(a => isToday(new Date(a.startTime)) && a.status === 'completed').length;
    const weekAppointments = appointments.filter(a => isThisWeek(new Date(a.startTime), { weekStartsOn: 1 }) && a.status === 'completed').length;
    const monthAppointments = appointments.filter(a => isThisMonth(new Date(a.startTime)) && a.status === 'completed').length;

    return {
      tasks: {
        today: { completed: todayCompleted, goal: dailyTaskGoal },
        week: { completed: weekCompleted, goal: weeklyTaskGoal },
        month: { completed: monthCompleted, goal: monthlyTaskGoal },
      },
      appointments: {
        today: { completed: todayAppointments, goal: dailyAppointmentGoal },
        week: { completed: weekAppointments, goal: weeklyAppointmentGoal },
        month: { completed: monthAppointments, goal: monthlyAppointmentGoal },
      },
    };
  }, [tasks, appointments]);

  // Progress calculation
  const totalItems = filteredData.periodTasks.length + filteredData.overdueTasks.length;
  const completedItems = filteredData.completedTasks.length;
  const progressPercent = (totalItems + completedItems) > 0 
    ? Math.round((completedItems / (totalItems + completedItems)) * 100) 
    : 100;

  const handleQuickComplete = async (task: Task) => {
    await updateStoredTask({ id: task.id, status: 'Done' });
    toast({ title: 'Task Completed', description: task.title });
    loadData();
  };

  const handleMarkComplete = (task: Task) => {
    setEditingTask({
      ...task,
      status: 'Done',
      _originalStatus: task.status,
    } as Task & { _originalStatus: string });
    setIsTaskDialogOpen(true);
  };

  const handleWhatsApp = (lead: Lead) => {
    if (lead.phone) {
      openWhatsApp(lead.phone, `Hi ${lead.name}, `);
    }
  };

  const handleEmail = (lead: Lead) => {
    setSelectedLeadForEmail(lead);
    setEmailComposerOpen(true);
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
    }
  };

  const getPeriodDateRange = () => {
    const now = new Date();
    switch (timePeriod) {
      case 'today': return format(now, 'EEEE, MMMM d');
      case 'week': return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'MMM d')}`;
      case 'month': return format(now, 'MMMM yyyy');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-foreground">Sales Planner</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                {getPeriodDateRange()}
              </p>
            </div>
            {(appUser?.role === 'admin' || appUser?.role === 'manager') && (
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="w-full sm:w-auto">
                <TabsList className="h-9 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg grid grid-cols-2 w-full sm:w-auto">
                  <TabsTrigger value="my" className="text-xs px-3 py-1.5 rounded-md">My View</TabsTrigger>
                  <TabsTrigger value="team" className="text-xs px-3 py-1.5 rounded-md">Team</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          
          {/* Time Period Tabs - Like Pipedrive */}
          <Tabs value={timePeriod} onValueChange={(v) => setTimePeriod(v as TimePeriod)} className="w-full">
            <TabsList className="h-10 p-1 bg-stone-100 dark:bg-stone-900 rounded-lg grid grid-cols-3 w-full">
              <TabsTrigger value="today" className="text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800">
                <Icon icon="solar:calendar-date-bold" className="h-4 w-4 mr-1.5 hidden sm:inline" />
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800">
                <Icon icon="solar:calendar-bold" className="h-4 w-4 mr-1.5 hidden sm:inline" />
                This Week
              </TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-stone-800">
                <Icon icon="solar:calendar-minimalistic-bold" className="h-4 w-4 mr-1.5 hidden sm:inline" />
                This Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Activity Goals - Like Pipedrive Goals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <GoalCard 
            icon="solar:checklist-bold"
            label="Tasks Done"
            current={activityGoals.tasks[timePeriod].completed}
            goal={activityGoals.tasks[timePeriod].goal}
            color="indigo"
          />
          <GoalCard 
            icon="solar:calendar-mark-bold"
            label="Meetings"
            current={activityGoals.appointments[timePeriod].completed}
            goal={activityGoals.appointments[timePeriod].goal}
            color="purple"
          />
          <GoalCard 
            icon="solar:users-group-rounded-bold"
            label="Active Leads"
            current={leadsAnalysis.activeLeads.length}
            goal={null}
            color="blue"
          />
          <GoalCard 
            icon="solar:danger-triangle-bold"
            label="Need Attention"
            current={leadsAnalysis.rottingLeads.length + leadsAnalysis.neverContacted.length}
            goal={null}
            color="rose"
            isWarning
          />
        </div>

        {/* Progress Card */}
        <Card className="border-stone-200 dark:border-stone-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:chart-2-bold" className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-semibold text-foreground">{getPeriodLabel()} Progress</span>
                </div>
                <Progress value={progressPercent} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {completedItems} of {totalItems + completedItems} tasks completed ({progressPercent}%)
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="text-center p-2 bg-white/50 dark:bg-stone-900/50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-rose-600">{filteredData.overdueTasks.length}</div>
                  <div className="text-[10px] text-muted-foreground">Overdue</div>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-stone-900/50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600">{filteredData.periodTasks.length}</div>
                  <div className="text-[10px] text-muted-foreground">Pending</div>
                </div>
                <div className="text-center p-2 bg-white/50 dark:bg-stone-900/50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">{completedItems}</div>
                  <div className="text-[10px] text-muted-foreground">Done</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Overdue Tasks */}
            {filteredData.overdueTasks.length > 0 && (
              <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-700 dark:text-rose-400">
                    <Icon icon="solar:danger-triangle-bold" className="h-4 w-4" />
                    Overdue ({filteredData.overdueTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                  {filteredData.overdueTasks.slice(0, 5).map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onComplete={handleQuickComplete}
                      onMarkComplete={handleMarkComplete}
                      isOverdue
                    />
                  ))}
                  {filteredData.overdueTasks.length > 5 && (
                    <Button variant="ghost" size="sm" className="w-full h-8 text-xs" asChild>
                      <Link href="/tasks">View all {filteredData.overdueTasks.length} overdue →</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Period Tasks */}
            <Card className="border-stone-200 dark:border-stone-800">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="solar:calendar-bold" className="h-4 w-4 text-amber-600" />
                    {getPeriodLabel()} Tasks ({filteredData.periodTasks.length})
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-xs"
                    onClick={() => { setEditingTask(null); setIsTaskDialogOpen(true); }}
                  >
                    <Icon icon="solar:add-circle-linear" className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                {filteredData.periodTasks.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Icon icon="solar:check-circle-bold" className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                    <p className="text-sm">No pending tasks for {timePeriod === 'today' ? 'today' : `this ${timePeriod}`}!</p>
                  </div>
                ) : (
                  <>
                    {filteredData.periodTasks.slice(0, 10).map(task => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onComplete={handleQuickComplete}
                        onMarkComplete={handleMarkComplete}
                        showDate={timePeriod !== 'today'}
                      />
                    ))}
                    {filteredData.periodTasks.length > 10 && (
                      <Button variant="ghost" size="sm" className="w-full h-8 text-xs" asChild>
                        <Link href="/tasks">View all {filteredData.periodTasks.length} tasks →</Link>
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Appointments */}
            {filteredData.periodAppointments.length > 0 && (
              <Card className="border-stone-200 dark:border-stone-800">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="solar:calendar-mark-bold" className="h-4 w-4 text-indigo-600" />
                    {getPeriodLabel()} Appointments ({filteredData.periodAppointments.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                  {filteredData.periodAppointments.slice(0, 5).map(apt => (
                    <div 
                      key={apt.id}
                      className="flex items-center justify-between p-3 bg-stone-50 dark:bg-stone-900 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-1 h-10 rounded-full bg-indigo-500" />
                        <div>
                          <p className="text-sm font-medium">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(apt.startTime), timePeriod === 'today' ? 'h:mm a' : 'MMM d, h:mm a')} - {apt.clientName}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Rotting Leads - Like Pipedrive */}
            {(leadsAnalysis.rottingLeads.length > 0 || leadsAnalysis.neverContacted.length > 0) && (
              <Card className="border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-700 dark:text-rose-400">
                    <Icon icon="solar:fire-bold" className="h-4 w-4" />
                    Leads at Risk
                  </CardTitle>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">Contact soon or they may go cold!</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                  {[...leadsAnalysis.rottingLeads, ...leadsAnalysis.neverContacted].slice(0, 5).map(lead => {
                    const days = leadsAnalysis.getLastContactDays(lead);
                    return (
                      <LeadItem 
                        key={lead.id}
                        lead={lead}
                        daysSinceContact={days}
                        onWhatsApp={handleWhatsApp}
                        onEmail={handleEmail}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Stale Leads */}
            {leadsAnalysis.staleLeads.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <Icon icon="solar:clock-circle-bold" className="h-4 w-4" />
                    Follow Up Soon
                  </CardTitle>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">7-14 days since last contact</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                  {leadsAnalysis.staleLeads.map(lead => {
                    const days = leadsAnalysis.getLastContactDays(lead);
                    return (
                      <LeadItem 
                        key={lead.id}
                        lead={lead}
                        daysSinceContact={days}
                        onWhatsApp={handleWhatsApp}
                        onEmail={handleEmail}
                      />
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card className="border-stone-200 dark:border-stone-800">
              <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Icon icon="solar:chart-bold" className="h-4 w-4 text-purple-600" />
                  Lead Health
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0 space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Healthy (&lt;7 days)
                  </span>
                  <span className="text-sm font-semibold text-emerald-600">{leadsAnalysis.healthyLeads.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Stale (7-14 days)
                  </span>
                  <span className="text-sm font-semibold text-amber-600">{leadsAnalysis.staleLeads.length}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Rotting (14+ days)
                  </span>
                  <span className="text-sm font-semibold text-rose-600">{leadsAnalysis.rottingLeads.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    Never Contacted
                  </span>
                  <span className="text-sm font-semibold">{leadsAnalysis.neverContacted.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddTaskDialog
        isOpen={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        onTaskSaved={loadData}
        taskToEdit={editingTask}
        allLeads={leads}
        allAppointments={appointments}
      />

      {selectedLeadForEmail && (
        <QuickEmailComposer
          lead={selectedLeadForEmail}
          open={emailComposerOpen}
          onOpenChange={setEmailComposerOpen}
          onEmailSent={loadData}
        />
      )}
    </>
  );
}


// Goal Card Component - Like Pipedrive Goals
function GoalCard({ 
  icon, 
  label, 
  current, 
  goal, 
  color,
  isWarning = false
}: { 
  icon: string; 
  label: string; 
  current: number; 
  goal: number | null; 
  color: 'indigo' | 'purple' | 'blue' | 'rose';
  isWarning?: boolean;
}) {
  const colorClasses = {
    indigo: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-950',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-950',
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
    rose: 'text-rose-600 bg-rose-100 dark:bg-rose-950',
  };

  const percent = goal ? Math.min(100, Math.round((current / goal) * 100)) : null;

  return (
    <Card className={cn(
      "border-stone-200 dark:border-stone-800",
      isWarning && current > 0 && "border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/10"
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={cn("p-1.5 rounded-lg", colorClasses[color])}>
            <Icon icon={icon} className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{label}</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <span className={cn("text-xl sm:text-2xl font-bold", isWarning && current > 0 ? "text-rose-600" : "text-foreground")}>
              {current}
            </span>
            {goal && (
              <span className="text-xs text-muted-foreground">/{goal}</span>
            )}
          </div>
          {percent !== null && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] h-5",
                percent >= 100 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                percent >= 50 ? "bg-amber-100 text-amber-700 border-amber-200" :
                "bg-stone-100 text-stone-600 border-stone-200"
              )}
            >
              {percent}%
            </Badge>
          )}
        </div>
        {goal && (
          <Progress value={percent || 0} className="h-1 mt-2" />
        )}
      </CardContent>
    </Card>
  );
}

// Task Item Component
function TaskItem({ 
  task, 
  onComplete, 
  onMarkComplete,
  isOverdue = false,
  showDate = false
}: { 
  task: Task; 
  onComplete: (task: Task) => void;
  onMarkComplete: (task: Task) => void;
  isOverdue?: boolean;
  showDate?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-colors",
      isOverdue 
        ? "bg-rose-100/50 dark:bg-rose-950/30" 
        : "bg-stone-50 dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800"
    )}>
      <button
        onClick={() => onComplete(task)}
        className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-stone-300 dark:border-stone-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors flex items-center justify-center group"
      >
        <Icon icon="solar:check-read-linear" className="h-3 w-3 text-transparent group-hover:text-emerald-500" />
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium line-clamp-1">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.leadName && (
            <Link 
              href={`/crm/leads/${task.leadId}`}
              className="text-[10px] text-indigo-600 hover:underline"
            >
              {task.leadName}
            </Link>
          )}
          {(isOverdue || showDate) && (
            <span className={cn("text-[10px]", isOverdue ? "text-rose-600" : "text-muted-foreground")}>
              {isOverdue ? 'Due ' : ''}{format(new Date(task.dueDate), 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <Badge className={cn("text-[9px] h-5 hidden sm:flex", priorityColors[task.priority])}>
        {task.priority}
      </Badge>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
        onClick={() => onMarkComplete(task)}
      >
        <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 sm:mr-1" />
        <span className="hidden sm:inline">Done</span>
      </Button>
    </div>
  );
}

// Lead Item Component
function LeadItem({ 
  lead, 
  daysSinceContact,
  onWhatsApp,
  onEmail
}: { 
  lead: Lead; 
  daysSinceContact: number;
  onWhatsApp: (lead: Lead) => void;
  onEmail: (lead: Lead) => void;
}) {
  const healthColor = getLeadHealthColor(daysSinceContact);
  
  return (
    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-stone-900 rounded-lg border border-stone-100 dark:border-stone-800">
      <div className="min-w-0 flex-1">
        <Link href={`/crm/leads/${lead.id}`} className="text-sm font-medium hover:text-indigo-600 line-clamp-1">
          {lead.name}
        </Link>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", healthColor)}>
            {daysSinceContact === 999 ? 'Never' : `${daysSinceContact}d ago`}
          </Badge>
          <span className="text-[10px] text-muted-foreground">{lead.status}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {lead.phone && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={() => onWhatsApp(lead)}
          >
            <Icon icon="logos:whatsapp-icon" className="h-4 w-4" />
          </Button>
        )}
        {lead.email && (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-7 w-7 p-0"
            onClick={() => onEmail(lead)}
          >
            <Icon icon="solar:letter-bold" className="h-4 w-4 text-blue-600" />
          </Button>
        )}
      </div>
    </div>
  );
}
