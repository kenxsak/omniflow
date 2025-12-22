'use client';

import React, { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { AppointmentCard } from './appointment-card';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus, AppointmentFilter } from '@/types/appointments';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading?: boolean;
  onView?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
  onComplete?: (appointmentId: string) => void;
  onDelete?: (appointmentId: string) => void;
  onFilterChange?: (filters: AppointmentFilter) => void;
}

const STATUS_OPTIONS: { value: AppointmentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
  { value: 'rescheduled', label: 'Rescheduled' },
];

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: 'bg-blue-500',
  pending: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-500',
  no_show: 'bg-stone-500',
  rescheduled: 'bg-violet-500',
};

export function AppointmentList({
  appointments,
  isLoading = false,
  onView,
  onEdit,
  onCancel,
  onComplete,
  onDelete,
  onFilterChange,
}: AppointmentListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onFilterChange?.({
      searchQuery: query,
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
    });
  };

  const handleStatusChange = (status: AppointmentStatus | 'all') => {
    setStatusFilter(status);
    onFilterChange?.({
      searchQuery,
      status: status === 'all' ? undefined : status,
      startDate: dateRange.from?.toISOString(),
      endDate: dateRange.to?.toISOString(),
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    onFilterChange?.({
      searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter,
      startDate: range.from?.toISOString(),
      endDate: range.to?.toISOString(),
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      !searchQuery ||
      apt.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.clientEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;

    const matchesDateRange =
      (!dateRange.from || new Date(apt.startTime) >= dateRange.from) &&
      (!dateRange.to || new Date(apt.startTime) <= dateRange.to);

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getAppointmentsForDay = (day: Date) => {
    return filteredAppointments.filter((apt) => isSameDay(new Date(apt.startTime), day));
  };

  const renderCalendarView = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayAppointments = getAppointmentsForDay(day);
        const currentDay = day;
        const isCurrentMonth = isSameMonth(day, calendarMonth);
        const isTodayDate = isToday(day);

        days.push(
          <div
            key={day.toISOString()}
            className={cn(
              'min-h-[110px] sm:min-h-[120px] border-b border-r border-stone-200/60 dark:border-stone-800/60 p-1.5 sm:p-2 transition-colors',
              !isCurrentMonth && 'bg-stone-50/50 dark:bg-stone-900/30',
              isTodayDate && 'bg-indigo-50/50 dark:bg-indigo-950/20'
            )}
          >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={cn(
                  'text-xs sm:text-sm font-medium',
                  !isCurrentMonth && 'text-muted-foreground/50',
                  isTodayDate &&
                    'bg-indigo-600 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-semibold'
                )}
              >
                {format(day, 'd')}
              </span>
              {dayAppointments.length > 0 && !isTodayDate && (
                <span className="text-[9px] text-muted-foreground bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded-full">
                  {dayAppointments.length}
                </span>
              )}
            </div>

            {/* Appointments */}
            <div className="space-y-1">
              {dayAppointments.slice(0, 2).map((apt) => (
                <button
                  key={apt.id}
                  onClick={() => onView?.(apt)}
                  className={cn(
                    'w-full text-left text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded-md truncate transition-all',
                    'hover:ring-1 hover:ring-indigo-500/50 cursor-pointer',
                    'bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-700/80'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        STATUS_COLORS[apt.status] || 'bg-stone-400'
                      )}
                    />
                    <span className="font-medium text-foreground truncate">
                      {format(new Date(apt.startTime), 'h:mm a')}
                    </span>
                    <span className="text-muted-foreground truncate hidden sm:inline">
                      - {apt.clientName}
                    </span>
                  </div>
                </button>
              ))}
              {dayAppointments.length > 2 && (
                <button
                  onClick={() => {
                    setCalendarMonth(currentDay);
                    // Could open a modal with all appointments for this day
                  }}
                  className="text-[9px] sm:text-[10px] text-indigo-600 dark:text-indigo-400 font-medium px-1.5 hover:underline"
                >
                  +{dayAppointments.length - 2} more
                </button>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toISOString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden bg-white dark:bg-stone-950">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
              )
            }
          >
            <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
          </Button>
          <h2 className="text-sm sm:text-base font-semibold">
            {format(calendarMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-stone-200 dark:hover:bg-stone-800"
            onClick={() =>
              setCalendarMonth(
                new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
              )
            }
          >
            <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-stone-200/60 dark:border-stone-800/60">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
            <div
              key={dayName}
              className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground py-2 sm:py-3 border-r border-stone-200/60 dark:border-stone-800/60 last:border-r-0 bg-stone-50/30 dark:bg-stone-900/20"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div>{rows}</div>
      </div>
    );
  };

  const renderListView = () => {
    if (filteredAppointments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Icon icon="solar:calendar-linear" className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No appointments found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {searchQuery || statusFilter !== 'all' || dateRange.from
              ? 'Try adjusting your filters to find appointments.'
              : 'Schedule your first appointment to get started.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {filteredAppointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onView={onView}
            onEdit={onEdit}
            onCancel={onCancel ? (apt) => onCancel(apt.id) : undefined}
            onComplete={onComplete ? (apt) => onComplete(apt.id) : undefined}
            onDelete={onDelete ? (apt) => onDelete(apt.id) : undefined}
          />
        ))}
      </div>
    );
  };

  const renderLoadingSkeleton = () => {
    if (viewMode === 'calendar') {
      return (
        <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-[450px] w-full" />
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="border border-stone-200/60 dark:border-stone-800/60 rounded-xl p-4 space-y-3"
          >
            <div className="flex justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Icon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            placeholder="Search by client name, email, or title..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => handleStatusChange(value as AppointmentStatus | 'all')}
          >
            <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[160px] h-9 justify-start text-xs bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800"
              >
                <Icon icon="solar:calendar-linear" className="mr-2 h-3.5 w-3.5" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
              <div className="p-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs"
                  onClick={() => handleDateRangeChange({})}
                >
                  Clear Dates
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* View Toggle */}
          <div className="flex border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden bg-white dark:bg-stone-950">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'h-9 px-3 flex items-center justify-center transition-colors',
                viewMode === 'list'
                  ? 'bg-stone-100 dark:bg-stone-800 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-900'
              )}
            >
              <Icon icon="solar:list-linear" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'h-9 px-3 flex items-center justify-center transition-colors border-l border-stone-200 dark:border-stone-800',
                viewMode === 'calendar'
                  ? 'bg-stone-100 dark:bg-stone-800 text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-stone-50 dark:hover:bg-stone-900'
              )}
            >
              <Icon icon="solar:calendar-minimalistic-linear" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-[11px] text-muted-foreground">
        {isLoading
          ? 'Loading...'
          : `${filteredAppointments.length} appointment${filteredAppointments.length !== 1 ? 's' : ''} found`}
      </div>

      {/* Content */}
      {isLoading
        ? renderLoadingSkeleton()
        : viewMode === 'calendar'
          ? renderCalendarView()
          : renderListView()}
    </div>
  );
}
