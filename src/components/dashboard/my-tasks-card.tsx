'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AppIcon } from '@/components/ui/app-icon';
import Link from 'next/link';
import { format, isToday, isPast, isTomorrow } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { getStoredTasks, updateStoredTask } from '@/lib/task-data';
import type { Task } from '@/types/task';
import { useToast } from '@/hooks/use-toast';

export function MyTasksCard() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      if (!appUser?.companyId) {
        setIsLoading(false);
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
        setIsLoading(false);
      }
    }

    loadTasks();
  }, [appUser?.companyId]);

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

  const getPriorityColor = () => {
    return 'bg-muted text-muted-foreground border border-border';
  };

  const getDueLabel = (dueDate?: string) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return { label: 'Overdue', className: 'text-muted-foreground' };
    }
    if (isToday(date)) {
      return { label: 'Due today', className: 'text-muted-foreground' };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', className: 'text-muted-foreground' };
    }
    return { label: format(date, 'MMM d'), className: 'text-muted-foreground' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="task" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">My Tasks</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <AppIcon name="loader" size={24} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const overdueCount = tasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate))).length;
  const highPriorityCount = tasks.filter(t => t.priority === 'High').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="task" size={16} className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <CardTitle className="text-base font-semibold">My Tasks</CardTitle>
              {tasks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {tasks.length} pending
                </Badge>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tasks">
              View All <AppIcon name="arrow-right" size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
        {(overdueCount > 0 || highPriorityCount > 0) && (
          <div className="flex gap-2 mt-2">
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <AppIcon name="alert" size={12} className="mr-1" />
                {overdueCount} overdue
              </Badge>
            )}
            {highPriorityCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {highPriorityCount} high priority
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <AppIcon name="check-circle" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No pending tasks</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tasks">
                <AppIcon name="plus" size={14} className="mr-1" />
                Add Task
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const dueInfo = getDueLabel(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleCompleteTask(task)}
                    className="data-[state=checked]:bg-foreground"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">{task.title}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${getPriorityColor()}`}>
                        {task.priority}
                      </Badge>
                    </div>
                    {dueInfo && (
                      <div className={`flex items-center gap-1 text-[11px] ${dueInfo.className}`}>
                        <AppIcon name="clock" size={10} />
                        {dueInfo.label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
