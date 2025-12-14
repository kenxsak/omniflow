'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import Link from 'next/link';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { getAppointmentsAction } from '@/app/actions/appointment-actions';
import type { Appointment } from '@/types/appointments';

export function UpcomingAppointmentsCard() {
  const { idToken, appUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      if (!idToken || !appUser?.companyId) {
        setIsLoading(false);
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
        setIsLoading(false);
      }
    }

    loadAppointments();
  }, [idToken, appUser?.companyId]);

  const getTimeLabel = (startTime: string) => {
    const date = new Date(startTime);
    if (isToday(date)) {
      const minutesUntil = differenceInMinutes(date, new Date());
      if (minutesUntil <= 60 && minutesUntil > 0) {
        return { label: `In ${minutesUntil} min`, variant: 'destructive' as const };
      }
      return { label: 'Today', variant: 'default' as const };
    }
    if (isTomorrow(date)) {
      return { label: 'Tomorrow', variant: 'secondary' as const };
    }
    return { label: format(date, 'EEE, MMM d'), variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="calendar" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">Upcoming Appointments</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <AppIcon name="loader" size={24} className="animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
              <AppIcon name="calendar" size={16} className="text-muted-foreground" />
            </div>
            <CardTitle className="text-base font-semibold pt-1">Upcoming Appointments</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/appointments">
              View All <AppIcon name="arrow-right" size={14} className="ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-6">
            <div className="h-10 w-10 rounded-xl bg-muted/60 dark:bg-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <AppIcon name="calendar" size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">No upcoming appointments</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/appointments">
                <AppIcon name="plus" size={14} className="mr-1" />
                Schedule One
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => {
              const timeInfo = getTimeLabel(apt.startTime);
              return (
                <div
                  key={apt.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 text-center">
                    <div className="text-lg font-bold">
                      {format(new Date(apt.startTime), 'HH:mm')}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase">
                      {format(new Date(apt.startTime), 'a')}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{apt.title}</h4>
                      <Badge variant={timeInfo.variant} className="text-[10px] px-1.5 py-0">
                        {timeInfo.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <AppIcon name="user" size={12} />
                        {apt.clientName}
                      </span>
                      {apt.meetingLink && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <AppIcon name="video" size={12} />
                          Video
                        </span>
                      )}
                      {apt.location && !apt.meetingLink && (
                        <span className="flex items-center gap-1">
                          <AppIcon name="location" size={12} />
                          {apt.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {apt.duration}m
                    </span>
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
