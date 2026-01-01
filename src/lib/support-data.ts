"use client";

import { getFirebaseDb } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, 
  query, where, orderBy, limit, updateDoc, serverTimestamp,
  increment, Timestamp
} from 'firebase/firestore';
import type { SupportTicket, TicketMessage, TicketStatus, TicketPriority, TicketCategory, SupportStats } from '@/types/support';

const getDb = () => getFirebaseDb();

// Collection references
const ticketsCol = () => collection(getDb()!, 'support_tickets');
const messagesCol = (ticketId: string) => collection(getDb()!, 'support_tickets', ticketId, 'messages');
const counterDoc = () => doc(getDb()!, 'settings', 'support_counter');

/**
 * Generate a unique ticket number like "OF-2026-0001"
 */
async function generateTicketNumber(): Promise<string> {
  if (!getDb()) return `OF-${new Date().getFullYear()}-0001`;
  
  const counterRef = counterDoc();
  const counterSnap = await getDoc(counterRef);
  
  let nextNumber = 1;
  const currentYear = new Date().getFullYear();
  
  if (counterSnap.exists()) {
    const data = counterSnap.data();
    if (data.year === currentYear) {
      nextNumber = (data.count || 0) + 1;
    }
    // Reset counter for new year
  }
  
  await setDoc(counterRef, { year: currentYear, count: nextNumber }, { merge: true });
  
  return `OF-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Create a new support ticket
 */
export async function createSupportTicket(data: {
  userId: string;
  userEmail: string;
  userName?: string;
  companyId: string;
  companyName?: string;
  planId?: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority?: TicketPriority;
  attachments?: string[];
}): Promise<{ success: boolean; ticketId?: string; ticketNumber?: string; error?: string }> {
  if (!getDb()) return { success: false, error: "Database not connected" };
  
  try {
    const ticketNumber = await generateTicketNumber();
    
    const ticketData: Omit<SupportTicket, 'id'> = {
      ticketNumber,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      companyId: data.companyId,
      companyName: data.companyName,
      planId: data.planId,
      subject: data.subject,
      description: data.description,
      category: data.category,
      priority: data.priority || 'medium',
      status: 'open',
      attachments: data.attachments || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(ticketsCol(), ticketData);
    
    return { success: true, ticketId: docRef.id, ticketNumber };
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }
}

/**
 * Get all tickets for a user
 */
export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  if (!getDb()) return [];
  
  try {
    const q = query(
      ticketsCol(),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SupportTicket));
  } catch (error) {
    console.error("Error fetching user tickets:", error);
    return [];
  }
}

/**
 * Get all tickets (Super Admin)
 */
export async function getAllTickets(filters?: {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
}): Promise<SupportTicket[]> {
  if (!getDb()) return [];
  
  try {
    let q = query(ticketsCol(), orderBy("createdAt", "desc"), limit(100));
    
    // Note: Firestore requires composite indexes for multiple where clauses
    // For now, we'll filter in memory
    const snapshot = await getDocs(q);
    let tickets = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SupportTicket));
    
    if (filters?.status) {
      tickets = tickets.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      tickets = tickets.filter(t => t.priority === filters.priority);
    }
    if (filters?.category) {
      tickets = tickets.filter(t => t.category === filters.category);
    }
    
    return tickets;
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    return [];
  }
}

/**
 * Get a single ticket by ID
 */
export async function getTicket(ticketId: string): Promise<SupportTicket | null> {
  if (!getDb()) return null;
  
  try {
    const docSnap = await getDoc(doc(getDb()!, 'support_tickets', ticketId));
    return docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as SupportTicket : null;
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return null;
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(
  ticketId: string, 
  status: TicketStatus,
  resolution?: string
): Promise<boolean> {
  if (!getDb()) return false;
  
  try {
    const updateData: any = {
      status,
      updatedAt: serverTimestamp(),
    };
    
    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = serverTimestamp();
      if (resolution) {
        updateData.resolution = resolution;
      }
    }
    
    await updateDoc(doc(getDb()!, 'support_tickets', ticketId), updateData);
    return true;
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return false;
  }
}

/**
 * Assign ticket to admin
 */
export async function assignTicket(
  ticketId: string,
  assignedTo: string,
  assignedToName: string
): Promise<boolean> {
  if (!getDb()) return false;
  
  try {
    await updateDoc(doc(getDb()!, 'support_tickets', ticketId), {
      assignedTo,
      assignedToName,
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return false;
  }
}

/**
 * Add internal notes to ticket
 */
export async function addInternalNotes(ticketId: string, notes: string): Promise<boolean> {
  if (!getDb()) return false;
  
  try {
    await updateDoc(doc(getDb()!, 'support_tickets', ticketId), {
      internalNotes: notes,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error adding internal notes:", error);
    return false;
  }
}

/**
 * Add a message to a ticket
 */
export async function addTicketMessage(data: {
  ticketId: string;
  senderId: string;
  senderEmail: string;
  senderName?: string;
  senderRole: 'user' | 'admin' | 'superadmin';
  message: string;
  attachments?: string[];
  isInternal?: boolean;
}): Promise<boolean> {
  if (!getDb()) return false;
  
  try {
    const messageData: Omit<TicketMessage, 'id'> = {
      ticketId: data.ticketId,
      senderId: data.senderId,
      senderEmail: data.senderEmail,
      senderName: data.senderName,
      senderRole: data.senderRole,
      message: data.message,
      attachments: data.attachments || [],
      createdAt: serverTimestamp(),
      isInternal: data.isInternal || false,
    };
    
    await addDoc(messagesCol(data.ticketId), messageData);
    
    // Update ticket's updatedAt
    await updateDoc(doc(getDb()!, 'support_tickets', data.ticketId), {
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error adding ticket message:", error);
    return false;
  }
}

/**
 * Get messages for a ticket
 */
export async function getTicketMessages(ticketId: string, includeInternal: boolean = false): Promise<TicketMessage[]> {
  if (!getDb()) return [];
  
  try {
    const q = query(messagesCol(ticketId), orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);
    let messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TicketMessage));
    
    if (!includeInternal) {
      messages = messages.filter(m => !m.isInternal);
    }
    
    return messages;
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    return [];
  }
}

/**
 * Get support statistics (Super Admin)
 */
export async function getSupportStats(): Promise<SupportStats> {
  if (!getDb()) return {
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionTimeHours: 0,
  };
  
  try {
    const snapshot = await getDocs(ticketsCol());
    const tickets = snapshot.docs.map(doc => doc.data() as SupportTicket);
    
    const openTickets = tickets.filter(t => t.status === 'open').length;
    const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    
    // Calculate average resolution time
    let totalResolutionTime = 0;
    let resolvedCount = 0;
    
    tickets.forEach(ticket => {
      if (ticket.resolvedAt && ticket.createdAt) {
        const created = ticket.createdAt.toDate?.() || new Date(ticket.createdAt);
        const resolved = ticket.resolvedAt.toDate?.() || new Date(ticket.resolvedAt);
        totalResolutionTime += (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
        resolvedCount++;
      }
    });
    
    return {
      totalTickets: tickets.length,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      avgResolutionTimeHours: resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount) : 0,
    };
  } catch (error) {
    console.error("Error fetching support stats:", error);
    return {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      avgResolutionTimeHours: 0,
    };
  }
}
