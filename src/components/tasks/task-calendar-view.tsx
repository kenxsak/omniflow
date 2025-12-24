
"use client";

import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Task } from '@/types/task';

interface TaskCalendarViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const priorityDetails: Record<Task['priority'], string> = {
  High: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 dark:hover:bg-rose-900/60',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900 dark:hover:bg-amber-900/60',
  Low: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 dark:hover:bg-blue-900/60',
};

export default function TaskCalendarView({ tasks, onEditTask }: TaskCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach(task => {
      const date = new Date(task.dueDate);
      const dateKey = format(date, 'yyyy-MM-dd');

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(task);
    });
    return map;
  }, [tasks]);

  const nextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const prevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[600px] bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border-b border-stone-200 dark:border-stone-800 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground capitalize tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-0.5 shadow-sm">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800" onClick={prevMonth}>
              <Icon icon="solar:alt-arrow-left-linear" className="h-4.5 w-4.5" />
            </Button>
            <div className="w-px h-4 bg-stone-200 dark:bg-stone-800 mx-1" />
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800" onClick={nextMonth}>
              <Icon icon="solar:alt-arrow-right-linear" className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs font-medium h-8 border-stone-200 dark:border-stone-800">
            Today
          </Button>
          {/* Legend (optional, but helpful) */}
          <div className="hidden md:flex items-center gap-3 border-l border-stone-200 dark:border-stone-800 pl-3 ml-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-stone-400"></span> To Do
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> In Progress
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Done
            </div>
          </div>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/40 backdrop-blur-sm">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 bg-stone-200 dark:bg-stone-800 gap-px overflow-hidden">
        {/* gap-px with background color creates the borders between cells */}

        {calendarDays.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative bg-white dark:bg-stone-950 p-2 flex flex-col gap-1 transition-colors hover:bg-stone-50/50 dark:hover:bg-stone-900/30 min-h-[100px]",
                !isCurrentMonth && "bg-stone-50/30 dark:bg-stone-900/10 text-muted-foreground/50"
              )}
            >
              <div className="flex justify-between items-start">
                <span
                  className={cn(
                    "text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                    isTodayDate
                      ? "bg-primary text-primary-foreground shadow-md scale-110"
                      : "text-muted-foreground"
                  )}
                >
                  {format(day, 'd')}
                </span>

                {dayTasks.length > 0 && isCurrentMonth && (
                  <span className="text-[10px] text-muted-foreground font-medium md:hidden">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="flex-1 flex flex-col gap-1.5 mt-1 overflow-y-auto overflow-x-hidden scrollbar-none hover:scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-stone-800 pr-0.5">
                {dayTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    className={cn(
                      "group relative flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-md cursor-pointer border text-[10px] mobile:text-[11px] font-medium transition-all shadow-sm hover:translate-x-0.5 hover:shadow-md",
                      priorityDetails[task.priority],
                    )}
                  >
                    {/* Status Indicator Bar */}
                    <span className={cn("absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md transition-colors",
                      task.status === 'Done' ? 'bg-emerald-500' :
                        task.status === 'In Progress' ? 'bg-amber-500' : 'bg-stone-400'
                    )} />

                    <span className="truncate line-clamp-1">{task.title}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
