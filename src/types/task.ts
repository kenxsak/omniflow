
export interface Task {
  id: string;
  title: string;
  description?: string; // Task description
  notes?: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'To Do' | 'In Progress' | 'Done';
  dueDate: string; // ISO string (date only: YYYY-MM-DD)
  dueTime?: string; // Optional specific time (HH:mm format)
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  completedAt?: string; // ISO string when task was marked done
  leadId?: string; // Optional link to a Lead
  leadName?: string; // Denormalized for display
  companyId: string; // To scope tasks to a company
  appointmentId?: string; // Optional link to an Appointment
  appointmentTitle?: string; // Denormalized for display
  assignedTo?: string; // User ID of assignee
  assignedToName?: string; // Denormalized for display
  hourReminderSent?: boolean; // Track if 1-hour reminder was sent
}
