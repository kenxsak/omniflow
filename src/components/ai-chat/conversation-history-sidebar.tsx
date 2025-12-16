"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { listChatSessions, deleteChatSession } from '@/lib/chat-session-service';
import type { ChatSession } from '@/types/chat';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Map agent IDs to Solar icons (linear style)
const agentIcons: Record<string, string> = {
  'content-writer': 'solar:document-text-linear',
  'ad-strategist': 'solar:chart-2-linear',
  'visual-designer': 'solar:gallery-linear',
  'seo-expert': 'solar:magnifer-linear',
  'customer-service': 'solar:chat-round-dots-linear',
  'video-producer': 'solar:videocamera-record-linear',
  'general-assistant': 'solar:stars-linear',
};

interface ConversationHistorySidebarProps {
  currentSessionId?: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export default function ConversationHistorySidebar({
  currentSessionId,
  onSelectSession,
  onNewChat
}: ConversationHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const { appUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [appUser]);

  const loadSessions = async () => {
    if (!appUser?.companyId || !appUser?.uid) return;

    setIsLoading(true);
    try {
      const chatSessions = await listChatSessions(appUser.companyId, appUser.uid, 20);
      setSessions(chatSessions);
    } catch (error: any) {
      toast({
        title: 'Error loading conversations',
        description: error.message || 'Failed to load conversation history',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || !appUser?.companyId || !appUser?.uid) return;

    try {
      await deleteChatSession(sessionToDelete, appUser.companyId, appUser.uid);
      setSessions(prev => prev.filter(s => s.id !== sessionToDelete));
      
      if (currentSessionId === sessionToDelete) {
        onNewChat();
      }
      
      toast({ title: 'Conversation deleted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete',
        variant: 'destructive'
      });
    } finally {
      setSessionToDelete(null);
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return session.title?.toLowerCase().includes(query);
  });

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) return format(date, 'h:mm a');
    if (diffInHours < 168) return format(date, 'EEE');
    return format(date, 'MMM d');
  };

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const timestamp = session.updatedAt instanceof Timestamp ? session.updatedAt.toDate() : new Date(session.updatedAt);
    const now = new Date();
    const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    
    let group = 'Older';
    if (diffInHours < 24) group = 'Today';
    else if (diffInHours < 48) group = 'Yesterday';
    else if (diffInHours < 168) group = 'This Week';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(session);
    return groups;
  }, {} as Record<string, ChatSession[]>);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Older'];

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-3">
        <Button 
          onClick={onNewChat} 
          variant="outline"
          className="w-full h-9 text-xs font-medium"
        >
          <Icon icon="solar:add-circle-linear" className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 px-3 pb-3">
        <div className="relative">
          <Icon icon="solar:magnifer-linear" className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-700 transition-all"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin text-muted-foreground/60" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 px-3">
            <Icon icon="solar:chat-round-dots-linear" className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'No results' : 'No chats yet'}
            </p>
          </div>
        ) : (
          groupOrder.map(group => {
            const groupSessions = groupedSessions[group];
            if (!groupSessions || groupSessions.length === 0) return null;
            
            return (
              <div key={group} className="mb-3">
                <p className="text-[9px] font-semibold tracking-wider text-muted-foreground/60 uppercase px-2 py-1.5">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {groupSessions.map((session) => {
                    const isActive = session.id === currentSessionId;
                    const displayTitle = session.title 
                      ? (session.title.length > 28 ? session.title.substring(0, 28) + '...' : session.title)
                      : 'Untitled';
                    
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors",
                          isActive 
                            ? "bg-stone-100 dark:bg-stone-800" 
                            : "hover:bg-stone-100/50 dark:hover:bg-stone-800/50"
                        )}
                        onClick={() => onSelectSession(session.id)}
                      >
                        <Icon 
                          icon={session.agentId ? (agentIcons[session.agentId] || 'solar:chat-round-dots-linear') : 'solar:chat-round-dots-linear'} 
                          className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" 
                        />
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-xs leading-tight truncate",
                            isActive ? "font-medium text-foreground" : "text-muted-foreground"
                          )}>
                            {displayTitle}
                          </p>
                        </div>

                        <span className="text-[9px] text-muted-foreground/50 flex-shrink-0">
                          {formatTimestamp(session.updatedAt)}
                        </span>

                        <button
                          className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session.id);
                          }}
                        >
                          <Icon icon="solar:trash-bin-minimalistic-linear" className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-3 border-t border-stone-200 dark:border-stone-800">
        <p className="text-[9px] text-muted-foreground/60 text-center">
          {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base">Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSession}
              className="h-8 text-xs bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
