'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { getStoredTasks } from '@/lib/task-data';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import Link from 'next/link';
import type { Task } from '@/types/task';

interface NotificationItem {
  id: string;
  type: 'overdue' | 'today' | 'tomorrow' | 'stale_lead';
  title: string;
  description: string;
  link: string;
  priority?: 'High' | 'Medium' | 'Low';
  leadId?: string;
}

export function NotificationBell() {
  const { appUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownLoginReminder, setHasShownLoginReminder] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!appUser?.companyId) return;

    try {
      const tasks = await getStoredTasks(appUser.companyId);
      const pendingTasks = tasks.filter(t => t.status !== 'Done');
      
      const items: NotificationItem[] = [];
      
      pendingTasks.forEach(task => {
        const dueDate = new Date(task.dueDate);
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          items.push({
            id: `overdue-${task.id}`,
            type: 'overdue',
            title: task.title,
            description: `Overdue since ${format(dueDate, 'MMM d')}`,
            link: task.leadId ? `/crm/leads/${task.leadId}` : '/tasks',
            priority: task.priority,
            leadId: task.leadId,
          });
        } else if (isToday(dueDate)) {
          items.push({
            id: `today-${task.id}`,
            type: 'today',
            title: task.title,
            description: 'Due today',
            link: task.leadId ? `/crm/leads/${task.leadId}` : '/tasks',
            priority: task.priority,
            leadId: task.leadId,
          });
        } else if (isTomorrow(dueDate)) {
          items.push({
            id: `tomorrow-${task.id}`,
            type: 'tomorrow',
            title: task.title,
            description: 'Due tomorrow',
            link: task.leadId ? `/crm/leads/${task.leadId}` : '/tasks',
            priority: task.priority,
            leadId: task.leadId,
          });
        }
      });

      // Sort: overdue first, then today, then tomorrow, high priority first within each
      items.sort((a, b) => {
        const typeOrder = { overdue: 0, today: 1, tomorrow: 2, stale_lead: 3 };
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        
        if (typeOrder[a.type] !== typeOrder[b.type]) {
          return typeOrder[a.type] - typeOrder[b.type];
        }
        return (priorityOrder[a.priority || 'Medium'] || 1) - (priorityOrder[b.priority || 'Medium'] || 1);
      });

      setNotifications(items);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [appUser?.companyId]);

  useEffect(() => {
    loadNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // Show login reminder for overdue/today tasks
  useEffect(() => {
    if (!hasShownLoginReminder && notifications.length > 0) {
      const overdueCount = notifications.filter(n => n.type === 'overdue').length;
      const todayCount = notifications.filter(n => n.type === 'today').length;
      
      if (overdueCount > 0 || todayCount > 0) {
        // Auto-open the bell on first load if there are urgent items
        const sessionKey = `notification_shown_${new Date().toDateString()}`;
        if (!sessionStorage.getItem(sessionKey)) {
          setIsOpen(true);
          sessionStorage.setItem(sessionKey, 'true');
        }
        setHasShownLoginReminder(true);
      }
    }
  }, [notifications, hasShownLoginReminder]);

  const overdueCount = notifications.filter(n => n.type === 'overdue').length;
  const todayCount = notifications.filter(n => n.type === 'today').length;
  const totalUrgent = overdueCount + todayCount;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue': return 'solar:danger-triangle-linear';
      case 'today': return 'solar:calendar-linear';
      case 'tomorrow': return 'solar:calendar-add-linear';
      case 'stale_lead': return 'solar:user-cross-linear';
      default: return 'solar:bell-linear';
    }
  };

  const getTypeColor = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue': return 'text-red-500';
      case 'today': return 'text-amber-500';
      case 'tomorrow': return 'text-blue-500';
      case 'stale_lead': return 'text-orange-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0"
        >
          <Icon 
            icon={totalUrgent > 0 ? "solar:bell-bing-bold" : "solar:bell-linear"} 
            className={`h-5 w-5 ${totalUrgent > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} 
          />
          {totalUrgent > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {totalUrgent > 9 ? '9+' : totalUrgent}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0 border-stone-200 dark:border-stone-800 rounded-xl shadow-lg"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon="solar:bell-bing-linear" className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold">Reminders</span>
            </div>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-5">
                {overdueCount} overdue
              </Badge>
            )}
          </div>
          {todayCount > 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {todayCount} task{todayCount !== 1 ? 's' : ''} due today
            </p>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Icon icon="solar:check-circle-linear" className="h-10 w-10 mx-auto text-green-500 mb-2" />
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">No pending reminders</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {notifications.slice(0, 10).map((item) => (
                <Link
                  key={item.id}
                  href={item.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start gap-3 p-3 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors"
                >
                  <div className={`mt-0.5 ${getTypeColor(item.type)}`}>
                    <Icon icon={getTypeIcon(item.type)} className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {item.title}
                    </p>
                    <p className={`text-xs ${getTypeColor(item.type)}`}>
                      {item.description}
                    </p>
                    {item.priority === 'High' && (
                      <Badge variant="outline" className="text-[9px] h-4 mt-1 border-red-200 text-red-600">
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <Icon icon="solar:arrow-right-linear" className="h-4 w-4 text-muted-foreground mt-0.5" />
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-2 border-t border-stone-200 dark:border-stone-800">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs"
              asChild
            >
              <Link href="/tasks" onClick={() => setIsOpen(false)}>
                View All Tasks
                <Icon icon="solar:arrow-right-linear" className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
