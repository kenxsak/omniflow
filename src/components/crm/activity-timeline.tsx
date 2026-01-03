'use client';

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icon } from '@iconify/react';
import { Loader2, Plus } from 'lucide-react';
import type { Activity, ActivityType } from '@/types/crm';
import { ACTIVITY_TYPE_LABELS } from '@/types/crm';
import { getActivitiesForContact, logNoteActivity } from '@/app/actions/activity-actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/locale-context';

const activityIcons: Record<ActivityType, string> = {
  email: 'solar:letter-linear',
  sms: 'solar:chat-square-linear',
  whatsapp: 'solar:chat-round-dots-linear',
  call: 'solar:phone-linear',
  meeting: 'solar:calendar-linear',
  note: 'solar:document-text-linear',
  task: 'solar:checklist-linear',
  deal_created: 'solar:hand-money-linear',
  deal_updated: 'solar:graph-up-linear',
  status_change: 'solar:refresh-linear',
};

const activityColors: Record<ActivityType, string> = {
  email: 'bg-info-muted text-info-muted-foreground',
  sms: 'bg-success-muted text-success-muted-foreground',
  whatsapp: 'bg-success-muted text-success-muted-foreground',
  call: 'bg-primary/10 text-primary',
  meeting: 'bg-warning-muted text-warning-muted-foreground',
  note: 'bg-warning-muted text-warning-muted-foreground',
  task: 'bg-primary/10 text-primary',
  deal_created: 'bg-success-muted text-success-muted-foreground',
  deal_updated: 'bg-info-muted text-info-muted-foreground',
  status_change: 'bg-muted text-muted-foreground',
};

interface ActivityTimelineProps {
  contactId: string;
  companyId: string;
}

export function ActivityTimeline({ contactId, companyId }: ActivityTimelineProps) {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const { formatDateTime, formatRelative } = useLocale();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [contactId, companyId]);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      const data = await getActivitiesForContact(companyId, contactId);
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
    setIsLoading(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !appUser) return;

    setIsSaving(true);
    try {
      const result = await logNoteActivity(
        companyId,
        contactId,
        newNote.trim(),
        appUser.uid,
        appUser.name || appUser.email
      );

      if (result.success) {
        toast({ title: 'Note added successfully' });
        setNewNote('');
        setIsAddingNote(false);
        loadActivities();
      } else {
        toast({ title: 'Failed to add note', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Failed to add note', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const formatActivityDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return formatRelative(d);
    } else {
      return formatDateTime(d, 'medium');
    }
  };

  if (isLoading) {
    return (
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800">
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Activity Timeline
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <div className="flex justify-center py-8">
            <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Activity Timeline
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Note
        </Button>
      </div>
      <div className="p-4 sm:p-5">
        {isAddingNote && (
          <div className="mb-4 p-3 sm:p-4 border border-stone-200 dark:border-stone-700 rounded-lg bg-muted/30">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] mb-3 bg-white dark:bg-stone-900 text-sm"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAddingNote(false)} className="h-9 sm:h-7 text-xs w-full sm:w-auto">
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddNote}
                disabled={isSaving || !newNote.trim()}
                className="h-9 sm:h-7 text-xs w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Save Note
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[350px] sm:h-[400px] pr-2 sm:pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <Icon icon="solar:document-text-linear" className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No activities yet</p>
              <p className="text-xs text-muted-foreground mt-1">Activities will appear here when you interact with this contact</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((activity, index) => {
                const iconName = activityIcons[activity.type] || 'solar:document-text-linear';
                const colorClass = activityColors[activity.type] || activityColors.note;
                
                return (
                  <div key={activity.id} className="flex gap-2 sm:gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-1.5 sm:p-2 rounded-full ${colorClass}`}>
                        <Icon icon={iconName} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px h-full bg-stone-200 dark:bg-stone-700 flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-foreground">
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </span>
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          {formatActivityDate(activity.occurredAt)}
                        </span>
                      </div>
                      {activity.subject && (
                        <p className="font-medium text-xs sm:text-sm mb-1 truncate">{activity.subject}</p>
                      )}
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
                        {activity.content}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        by {activity.authorName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
