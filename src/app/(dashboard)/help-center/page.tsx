"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/use-auth";
import { getUserTickets } from "@/lib/support-data";
import { SupportTicketForm } from "@/components/support/support-ticket-form";
import { TICKET_CATEGORIES, TICKET_STATUSES, TICKET_PRIORITIES, type SupportTicket } from "@/types/support";
import { formatDistanceToNow } from "date-fns";
import { AIVoiceWidgetScript } from "@/components/ai-voice/ai-voice-widget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function HelpCenterPage() {
  const { appUser } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewTicketDialog, setShowNewTicketDialog] = useState(false);

  useEffect(() => {
    if (appUser?.uid) {
      loadTickets();
    }
  }, [appUser?.uid]);

  const loadTickets = async () => {
    if (!appUser?.uid) return;
    setIsLoading(true);
    const userTickets = await getUserTickets(appUser.uid);
    setTickets(userTickets);
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TICKET_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;
    return (
      <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.color} text-xs`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = TICKET_PRIORITIES.find(p => p.value === priority);
    if (!priorityConfig) return null;
    return (
      <span className={`text-xs font-medium ${priorityConfig.color}`}>
        {priorityConfig.label}
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    const cat = TICKET_CATEGORIES.find(c => c.value === category);
    return cat?.icon || "solar:chat-round-line-linear";
  };

  return (
    <div className="container max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Help Center</h1>
          <p className="text-muted-foreground text-sm">
            Get help with OmniFlow - we&apos;re here to assist you
          </p>
        </div>
        <Button onClick={() => setShowNewTicketDialog(true)}>
          <Icon icon="solar:add-circle-bold" className="w-4 h-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Quick Help Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
              <Icon icon="solar:book-2-linear" className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Help Articles</h3>
              <p className="text-xs text-muted-foreground">Browse our knowledge base</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center shrink-0">
              <Icon icon="solar:microphone-3-linear" className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-medium text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Talk to our AI for instant help</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Your Tickets</CardTitle>
          <CardDescription>Track the status of your support requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon icon="solar:refresh-bold" className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center mx-auto mb-4">
                <Icon icon="solar:inbox-linear" className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">No tickets yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a ticket when you need help with OmniFlow
              </p>
              <Button onClick={() => setShowNewTicketDialog(true)} variant="outline">
                <Icon icon="solar:add-circle-linear" className="w-4 h-4 mr-2" />
                Create Your First Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
                        <Icon icon={getCategoryIcon(ticket.category)} className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                          {getStatusBadge(ticket.status)}
                          {getPriorityBadge(ticket.priority)}
                        </div>
                        <h4 className="font-medium text-sm mt-1 truncate">{ticket.subject}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {ticket.createdAt?.toDate ? 
                        formatDistanceToNow(ticket.createdAt.toDate(), { addSuffix: true }) :
                        'Just now'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Ticket Dialog */}
      <Dialog open={showNewTicketDialog} onOpenChange={setShowNewTicketDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-[460px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Describe your issue and we&apos;ll get back to you soon.
            </DialogDescription>
          </DialogHeader>
          <SupportTicketForm
            onSuccess={(ticketNumber) => {
              setShowNewTicketDialog(false);
              loadTickets();
            }}
            onCancel={() => setShowNewTicketDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* AI Voice Support Widget */}
      <AIVoiceWidgetScript type="support" />
    </div>
  );
}
