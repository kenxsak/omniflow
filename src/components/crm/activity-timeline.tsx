'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Mail, MessageSquare, Phone, Calendar, StickyNote, 
  DollarSign, TrendingUp, RefreshCw, Loader2, Plus,
  MessageCircle, CheckSquare
} from 'lucide-react';
import type { Activity, ActivityType } from '@/types/crm';
import { ACTIVITY_TYPE_LABELS } from '@/types/crm';
import { getActivitiesForContact, logNoteActivity } from '@/app/actions/activity-actions';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const activityIcons: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: MessageCircle,
  call: Phone,
  meeting: Calendar,
  note: StickyNote,
  task: CheckSquare,
  deal_created: DollarSign,
  deal_updated: TrendingUp,
  status_change: RefreshCw,
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
      return formatDistanceToNow(d, { addSuffix: true });
    } else if (diffDays < 7) {
      return format(d, 'EEEE \'at\' h:mm a');
    } else {
      return format(d, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Activity Timeline</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNote(!isAddingNote)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </CardHeader>
      <CardContent>
        {isAddingNote && (
          <div className="mb-4 p-3 border rounded-lg bg-muted/50">
            <Textarea
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] mb-2"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleAddNote}
                disabled={isSaving || !newNote.trim()}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Note
              </Button>
            </div>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <StickyNote className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No activities yet</p>
              <p className="text-sm">Activities will appear here when you interact with this contact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || StickyNote;
                const colorClass = activityColors[activity.type] || activityColors.note;
                
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {index < activities.length - 1 && (
                        <div className="w-px h-full bg-border flex-1 my-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {ACTIVITY_TYPE_LABELS[activity.type]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatActivityDate(activity.occurredAt)}
                        </span>
                      </div>
                      {activity.subject && (
                        <p className="font-medium text-sm mb-1">{activity.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {activity.content}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {activity.authorName || 'Unknown'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
