'use client';

import React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';
import type { Appointment, AppointmentStatus } from '@/types/appointments';

interface AppointmentCardProps {
  appointment: Appointment;
  onView?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onComplete?: (appointment: Appointment) => void;
  onDelete?: (appointment: Appointment) => void;
  compact?: boolean;
}

// Clerk-style status dots
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; dotColor: string }> = {
  scheduled: { label: 'SCHEDULED', dotColor: 'bg-emerald-300 border-emerald-700' },
  pending: { label: 'PENDING', dotColor: 'bg-amber-300 border-amber-700' },
  completed: { label: 'COMPLETED', dotColor: 'bg-stone-300 border-stone-600' },
  cancelled: { label: 'CANCELLED', dotColor: 'bg-rose-300 border-rose-700' },
  no_show: { label: 'NO SHOW', dotColor: 'bg-orange-300 border-orange-700' },
  rescheduled: { label: 'RESCHEDULED', dotColor: 'bg-blue-300 border-blue-700' },
};

export function AppointmentCard({
  appointment,
  onView,
  onEdit,
  onCancel,
  onComplete,
  onDelete,
  compact = false,
}: AppointmentCardProps) {
  let startDate = new Date();
  if (appointment.startTime) {
    const parsedDate = new Date(appointment.startTime);
    if (!isNaN(parsedDate.getTime())) {
      startDate = parsedDate;
    }
  }
  const statusConfig = STATUS_CONFIG[appointment.status];

  const formatTime = (date: Date, duration: number) => {
    if (!date || isNaN(date.getTime())) return 'Invalid time';
    try {
      const endDate = new Date(date.getTime() + duration * 60 * 1000);
      return `${format(date, 'h:mm a')} - ${format(endDate, 'h:mm a')}`;
    } catch {
      return 'Invalid time';
    }
  };

  const canEdit = appointment.status === 'scheduled' || appointment.status === 'pending';
  const canCancel = appointment.status === 'scheduled' || appointment.status === 'pending';
  const canComplete = appointment.status === 'scheduled';

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg p-2 min-w-[50px] border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900">
            <span className="text-[10px] text-muted-foreground font-mono uppercase">
              {!isNaN(startDate.getTime()) ? format(startDate, 'MMM') : 'N/A'}
            </span>
            <span className="text-lg font-bold text-foreground">
              {!isNaN(startDate.getTime()) ? format(startDate, 'd') : '--'}
            </span>
          </div>
          <div>
            <p className="font-medium text-sm text-foreground">{appointment.clientName}</p>
            <p className="text-xs text-muted-foreground">
              {!isNaN(startDate.getTime()) ? format(startDate, 'h:mm a') : 'N/A'} · {appointment.duration} min
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5">
          <span className={cn("size-2 border-[1.5px] rounded-full", statusConfig.dotColor)} />
          <span className="text-[9px] font-semibold uppercase tracking-wide text-foreground font-mono">
            {statusConfig.label}
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors h-full flex flex-col">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Icon icon="solar:user-linear" className="h-4 w-4 text-muted-foreground/60 shrink-0" />
              <h3 className="font-medium text-sm text-foreground truncate">{appointment.clientName}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{appointment.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Status badge - Clerk style */}
            <span className="flex items-center gap-1.5">
              <span className={cn("size-2 border-[1.5px] rounded-full", statusConfig.dotColor)} />
              <span className="text-[9px] font-semibold uppercase tracking-wide text-foreground font-mono">
                {statusConfig.label}
              </span>
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <Icon icon="solar:menu-dots-bold" className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(appointment)} className="text-xs">
                    <Icon icon="solar:eye-linear" className="mr-2 h-3.5 w-3.5" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(appointment)} className="text-xs">
                    <Icon icon="solar:pen-linear" className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onComplete && canComplete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onComplete(appointment)} className="text-xs">
                      <Icon icon="solar:check-circle-linear" className="mr-2 h-3.5 w-3.5" />
                      Mark Complete
                    </DropdownMenuItem>
                  </>
                )}
                {onCancel && canCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onCancel(appointment)} className="text-xs text-destructive">
                      <Icon icon="solar:close-circle-linear" className="mr-2 h-3.5 w-3.5" />
                      Cancel
                    </DropdownMenuItem>
                  </>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(appointment)} className="text-xs text-destructive">
                    <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content - flex-1 to push footer to bottom */}
      <div className="px-4 pb-3 space-y-2 flex-1">
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon icon="solar:calendar-linear" className="h-3.5 w-3.5" />
            <span>{!isNaN(startDate.getTime()) ? format(startDate, 'EEE, MMM d, yyyy') : 'Invalid date'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Icon icon="solar:clock-circle-linear" className="h-3.5 w-3.5" />
            <span>{formatTime(startDate, appointment.duration)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {appointment.clientEmail && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="solar:letter-linear" className="h-3.5 w-3.5" />
              <a href={`mailto:${appointment.clientEmail}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                {appointment.clientEmail}
              </a>
            </div>
          )}
          {appointment.clientPhone && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon icon="solar:phone-linear" className="h-3.5 w-3.5" />
              <a href={`tel:${appointment.clientPhone}`} className="hover:text-foreground transition-colors">
                {appointment.clientPhone}
              </a>
            </div>
          )}
        </div>

        {(appointment.location || appointment.meetingLink) && (
          <div className="flex flex-wrap gap-3 text-xs">
            {appointment.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Icon icon="solar:map-point-linear" className="h-3.5 w-3.5" />
                <span>{appointment.location}</span>
              </div>
            )}
            {appointment.meetingLink && (
              <div className="flex items-center gap-1.5">
                <Icon icon="solar:link-linear" className="h-3.5 w-3.5 text-muted-foreground" />
                <a
                  href={appointment.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs"
                >
                  Join Meeting
                </a>
              </div>
            )}
          </div>
        )}

        {appointment.notes && (
          <p className="text-xs text-muted-foreground border-t border-stone-200 dark:border-stone-800 pt-2 mt-2 line-clamp-2">
            {appointment.notes}
          </p>
        )}
      </div>

      {/* Footer Actions - always at bottom */}
      <div className="px-4 pb-4 pt-2 border-t border-stone-200 dark:border-stone-800 mt-auto">
        <div className="flex flex-wrap gap-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => onView(appointment)}
            >
              <Icon icon="solar:eye-linear" className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              View
            </Button>
          )}
          {onEdit && canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => onEdit(appointment)}
            >
              <Icon icon="solar:pen-linear" className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Edit
            </Button>
          )}
          {onComplete && canComplete && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800"
              onClick={() => onComplete(appointment)}
            >
              <Icon icon="solar:check-circle-linear" className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              Done
            </Button>
          )}
          {onCancel && canCancel && (
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onCancel(appointment)}
            >
              <Icon icon="solar:close-circle-linear" className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
