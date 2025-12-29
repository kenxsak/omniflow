'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { getCalendarEventsAction } from '@/app/actions/social-accounts-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Loader2 } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  platform: string;
  status: string;
  postId: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  BlogPost: 'bg-orange-500',
  SalesLandingPage: 'bg-green-500',
  TwitterX: 'bg-black dark:bg-white dark:text-black',
  Instagram: 'bg-pink-500',
  LinkedIn: 'bg-blue-600',
  Facebook: 'bg-blue-500',
  YouTubeVideoScript: 'bg-red-500',
  Email: 'bg-purple-500',
};

const PLATFORM_ICONS: Record<string, string> = {
  BlogPost: 'solar:document-text-linear',
  SalesLandingPage: 'solar:shop-linear',
  TwitterX: 'ri:twitter-x-fill',
  Instagram: 'mdi:instagram',
  LinkedIn: 'mdi:linkedin',
  Facebook: 'mdi:facebook',
  YouTubeVideoScript: 'mdi:youtube',
  Email: 'solar:letter-linear',
};

export default function ContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { appUser } = useAuth();
  const { toast } = useToast();

  const loadEvents = useCallback(async () => {
    if (!appUser?.companyId) return;
    
    setIsLoading(true);
    const result = await getCalendarEventsAction(
      appUser.uid,
      appUser.companyId,
      currentDate.getMonth(),
      currentDate.getFullYear()
    );

    if (result.success && result.data) {
      setEvents(result.data);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to load calendar', variant: 'destructive' });
    }
    setIsLoading(false);
  }, [appUser, currentDate, toast]);

  useEffect(() => {
    if (appUser) {
      loadEvents();
    }
  }, [appUser, loadEvents]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (0 = Sunday)
  const startDayOfWeek = monthStart.getDay();
  
  // Create padding for days before month starts
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), day));
  };

  const goToPreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    // On mobile, open sheet
    if (window.innerWidth < 1024) {
      setMobileSheetOpen(true);
    }
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  const DayEventsContent = () => (
    <>
      {!selectedDate ? (
        <div className="text-center py-8">
          <Icon icon="solar:calendar-minimalistic-linear" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Click on a day to see scheduled content</p>
        </div>
      ) : selectedDayEvents.length === 0 ? (
        <div className="text-center py-8">
          <Icon icon="solar:calendar-minimalistic-linear" className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">No content scheduled</p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/social-media">
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1.5" />
              Create Post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {selectedDayEvents.map(event => (
            <Link
              key={event.id}
              href={`/social-media?editPostId=${event.postId}`}
              className="block p-3 rounded-xl border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0",
                  PLATFORM_COLORS[event.platform] || 'bg-gray-400'
                )}>
                  <Icon icon={PLATFORM_ICONS[event.platform] || 'solar:document-linear'} className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2">{event.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <Badge 
                      variant={event.status === 'posted' ? 'default' : 'secondary'} 
                      className="text-[10px] h-5"
                    >
                      {event.status}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(event.date), 'h:mm a')}
                    </span>
                  </div>
                </div>
                <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} className="h-8 w-8">
            <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
          </Button>
          <h2 className="text-base sm:text-lg font-semibold min-w-[140px] sm:min-w-[160px] text-center">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="h-8 w-8">
            <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={goToToday} className="flex-1 sm:flex-none h-8 text-xs">
            Today
          </Button>
          <Button size="sm" asChild className="flex-1 sm:flex-none h-8 text-xs">
            <Link href="/social-media">
              <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-1" />
              Create Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar Grid + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardContent className="p-2 sm:p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-muted-foreground py-2">
                      <span className="hidden sm:inline">{day}</span>
                      <span className="sm:hidden">{day.charAt(0)}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {/* Padding for days before month starts */}
                  {paddingDays.map((_, index) => (
                    <div key={`pad-${index}`} className="aspect-square p-0.5 sm:p-1" />
                  ))}
                  
                  {/* Actual days */}
                  {daysInMonth.map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "aspect-square p-0.5 sm:p-1 rounded-lg transition-all relative",
                          "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                          isSelected && "bg-primary/10 ring-2 ring-primary",
                          isTodayDate && !isSelected && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "text-[11px] sm:text-sm font-medium",
                          isTodayDate && "text-primary font-bold",
                          !isSameMonth(day, currentDate) && "text-muted-foreground/50"
                        )}>
                          {format(day, 'd')}
                        </div>
                        
                        {/* Event indicators */}
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-0.5 sm:bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((event, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full",
                                  PLATFORM_COLORS[event.platform] || 'bg-gray-400'
                                )}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-[7px] sm:text-[8px] text-muted-foreground">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Desktop: Selected Day Details Panel */}
        <Card className="hidden lg:block lg:col-span-1">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <DayEventsContent />
          </CardContent>
        </Card>
      </div>

      {/* Mobile: Bottom Sheet for Day Details */}
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle>
              {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a day'}
            </SheetTitle>
            <SheetDescription>
              {selectedDayEvents.length > 0 
                ? `${selectedDayEvents.length} post${selectedDayEvents.length > 1 ? 's' : ''} scheduled`
                : 'No content scheduled for this day'
              }
            </SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto max-h-[calc(60vh-100px)]">
            <DayEventsContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] sm:text-xs">
        <span className="text-muted-foreground font-medium">Platforms:</span>
        {Object.entries(PLATFORM_COLORS).slice(0, 6).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full", color)} />
            <span className="text-muted-foreground">{platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
