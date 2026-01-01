"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@iconify/react";
import { useAuth } from "@/hooks/use-auth";
import { 
  getAllTickets, 
  getSupportStats, 
  updateTicketStatus, 
  assignTicket,
  addTicketMessage,
  getTicketMessages,
} from "@/lib/support-data";
import { 
  TICKET_STATUSES, 
  TICKET_PRIORITIES, 
  type SupportTicket, 
  type TicketMessage,
  type TicketStatus,
  type SupportStats 
} from "@/types/support";
import { formatDistanceToNow, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';

export default function SupportTicketsPage() {
  const { appUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [replyMessage, setReplyMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setIsLoading(true);
    const [allTickets, supportStats] = await Promise.all([
      getAllTickets(),
      getSupportStats()
    ]);
    setTickets(allTickets);
    setStats(supportStats);
    setIsLoading(false);
  };

  const loadTicketMessages = async (ticketId: string) => {
    const messages = await getTicketMessages(ticketId, true);
    setTicketMessages(messages);
  };

  const handleViewTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    await loadTicketMessages(ticket.id);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    const success = await updateTicketStatus(ticketId, newStatus);
    if (success) {
      toast({ title: "Success", description: `Status updated to ${newStatus}` });
      loadData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } else {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleAssignToMe = async (ticket: SupportTicket) => {
    if (!appUser) return;
    const success = await assignTicket(ticket.id, appUser.uid, appUser.name || appUser.email || "Admin");
    if (success) {
      toast({ title: "Success", description: "Ticket assigned to you" });
      loadData();
    } else {
      toast({ title: "Error", description: "Failed to assign ticket", variant: "destructive" });
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !appUser || !replyMessage.trim()) return;

    const success = await addTicketMessage({
      ticketId: selectedTicket.id,
      senderId: appUser.uid,
      senderEmail: appUser.email || "",
      senderName: appUser.name || "Support Team",
      senderRole: "superadmin",
      message: replyMessage,
    });

    if (success) {
      toast({ title: "Success", description: "Reply sent" });
      setReplyMessage("");
      await loadTicketMessages(selectedTicket.id);
    } else {
      toast({ title: "Error", description: "Failed to send reply", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = TICKET_STATUSES.find(s => s.value === status);
    if (!statusConfig) return null;
    return (
      <Badge variant="secondary" className={`${statusConfig.bg} ${statusConfig.color} text-[10px] sm:text-xs`}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = TICKET_PRIORITIES.find(p => p.value === priority);
    if (!priorityConfig) return null;
    return (
      <Badge variant="outline" className={`${priorityConfig.color} text-[10px] sm:text-xs border-current`}>
        {priorityConfig.label}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== "all" && ticket.status !== filterStatus) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.userEmail.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-sm text-muted-foreground">Access denied. Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{stats.totalTickets}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.openTickets}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Open</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{stats.inProgressTickets}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">{stats.resolvedTickets}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{stats.avgResolutionTimeHours}h</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Avg Resolution</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[130px] h-9 sm:h-10 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {TICKET_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadData} className="h-9 sm:h-10 px-3">
            <Icon icon="solar:refresh-linear" className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3">
          <CardTitle className="text-base sm:text-lg">Support Tickets</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Manage customer support requests</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Icon icon="solar:refresh-bold" className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Icon icon="solar:inbox-linear" className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => handleViewTicket(ticket)}
                  className="p-3 sm:p-4 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
                        <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">{ticket.ticketNumber}</span>
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <h4 className="font-medium text-sm truncate">{ticket.subject}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate max-w-[150px] sm:max-w-none">{ticket.userEmail}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline truncate">{ticket.companyName || "Unknown"}</span>
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground sm:text-right shrink-0">
                      {ticket.createdAt?.toDate ? 
                        formatDistanceToNow(ticket.createdAt.toDate(), { addSuffix: true }) :
                        'Just now'
                      }
                      {ticket.assignedToName && (
                        <div className="mt-0.5 sm:mt-1">→ {ticket.assignedToName}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog - Mobile First */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-[480px] sm:max-w-[540px] p-4 sm:p-6 rounded-xl max-h-[85vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader className="space-y-1.5 pb-2">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">{selectedTicket.ticketNumber}</span>
                  {getStatusBadge(selectedTicket.status)}
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <DialogTitle className="text-base sm:text-lg leading-tight">{selectedTicket.subject}</DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {selectedTicket.userEmail} • {selectedTicket.companyName}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 sm:space-y-4">
                {/* Original Message */}
                <div className="bg-stone-50 dark:bg-stone-900 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                    {selectedTicket.createdAt?.toDate && 
                      format(selectedTicket.createdAt.toDate(), "PPp")
                    }
                  </p>
                </div>

                {/* Messages */}
                {ticketMessages.length > 0 && (
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium">Conversation</h4>
                    {ticketMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 sm:p-3 rounded-lg text-xs sm:text-sm ${
                          msg.senderRole === 'user' 
                            ? 'bg-blue-50 dark:bg-blue-950/30 mr-4 sm:mr-8' 
                            : 'bg-emerald-50 dark:bg-emerald-950/30 ml-4 sm:ml-8'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] sm:text-xs font-medium">
                            {msg.senderName || msg.senderEmail}
                          </span>
                          {msg.isInternal && (
                            <Badge variant="outline" className="text-[8px] sm:text-[10px] px-1 py-0">Internal</Badge>
                          )}
                        </div>
                        <p>{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {msg.createdAt?.toDate && format(msg.createdAt.toDate(), "PPp")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Box */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="min-h-[70px] sm:min-h-[80px] text-sm resize-none"
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSendReply} 
                      disabled={!replyMessage.trim()}
                      className="h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <Icon icon="solar:send-square-bold" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      Send Reply
                    </Button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2 sm:pt-3 border-t">
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(value) => handleStatusChange(selectedTicket.id, value as TicketStatus)}
                  >
                    <SelectTrigger className="w-full sm:w-[130px] h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!selectedTicket.assignedTo && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleAssignToMe(selectedTicket)}
                      className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
                    >
                      <Icon icon="solar:user-plus-linear" className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
                      Assign to Me
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
