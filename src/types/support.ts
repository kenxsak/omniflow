/**
 * Support Ticket Types for OmniFlow
 */

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'general' | 'account';

export interface SupportTicket {
  id: string;
  ticketNumber: string; // e.g., "OF-2026-0001"
  
  // User Info
  userId: string;
  userEmail: string;
  userName?: string;
  companyId: string;
  companyName?: string;
  planId?: string;
  
  // Ticket Details
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  
  // Attachments (URLs to uploaded files)
  attachments?: string[];
  
  // Timestamps
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  resolvedAt?: any;
  
  // Assignment
  assignedTo?: string; // Super Admin user ID
  assignedToName?: string;
  
  // Resolution
  resolution?: string;
  
  // Internal notes (only visible to admins)
  internalNotes?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderEmail: string;
  senderName?: string;
  senderRole: 'user' | 'admin' | 'superadmin';
  message: string;
  attachments?: string[];
  createdAt: any;
  isInternal?: boolean; // Internal notes not visible to user
}

export interface SupportStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTimeHours: number;
}

export const TICKET_CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
  { value: 'billing', label: 'Billing & Payments', icon: 'solar:card-linear' },
  { value: 'technical', label: 'Technical Issue', icon: 'solar:bug-linear' },
  { value: 'feature_request', label: 'Feature Request', icon: 'solar:lightbulb-linear' },
  { value: 'bug_report', label: 'Bug Report', icon: 'solar:danger-triangle-linear' },
  { value: 'account', label: 'Account & Access', icon: 'solar:user-linear' },
  { value: 'general', label: 'General Inquiry', icon: 'solar:chat-round-line-linear' },
];

export const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-stone-500' },
  { value: 'medium', label: 'Medium', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-amber-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

export const TICKET_STATUSES: { value: TicketStatus; label: string; color: string; bg: string }[] = [
  { value: 'open', label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'in_progress', label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'resolved', label: 'Resolved', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { value: 'closed', label: 'Closed', color: 'text-stone-600', bg: 'bg-stone-100 dark:bg-stone-900/30' },
];
