/**
 * Invoice Types
 * Complete invoicing system with GST support for India
 */

export type InvoiceStatus = 
  | 'draft'      // Not sent yet
  | 'sent'       // Sent to client
  | 'viewed'     // Client opened it
  | 'paid'       // Payment received
  | 'partial'    // Partially paid
  | 'overdue'    // Past due date
  | 'cancelled'; // Cancelled/voided

export type PaymentMethod = 
  | 'razorpay'   // Online payment (India)
  | 'stripe'     // Online payment (International)
  | 'bank'       // Bank transfer
  | 'cash'       // Cash payment
  | 'cheque'     // Cheque payment
  | 'upi'        // UPI payment
  | 'other';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  hsnCode?: string;      // HSN/SAC code for GST
  taxRate?: number;      // Tax rate percentage
  taxAmount?: number;    // Calculated tax
  discount?: number;     // Item-level discount %
  discountAmount?: number;
}

export interface InvoiceTax {
  name: string;          // e.g., "CGST", "SGST", "IGST", "VAT"
  rate: number;          // Percentage
  amount: number;        // Calculated amount
}

export interface InvoicePayment {
  id: string;
  date: string;          // ISO string
  amount: number;
  method: PaymentMethod;
  reference?: string;    // Transaction ID, cheque number, etc.
  notes?: string;
  gatewayId?: string;    // Razorpay/Stripe payment ID
  recordedBy: string;    // User ID who recorded
  recordedAt: string;    // ISO string
}

export interface Invoice {
  id: string;
  companyId: string;
  
  // Invoice identification
  invoiceNumber: string;  // e.g., "INV-2024-001"
  status: InvoiceStatus;
  
  // Client info
  clientId?: string;      // Link to CRM lead/contact
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;   // GST number (India)
  
  // Dates
  issueDate: string;      // ISO string
  dueDate: string;        // ISO string
  
  // Items
  items: InvoiceItem[];
  
  // Amounts
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxes: InvoiceTax[];
  taxTotal: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  
  // Currency
  currency: string;       // INR, USD, etc.
  
  // GST Details (India)
  gstEnabled?: boolean;
  companyGstin?: string;
  placeOfSupply?: string; // State code for GST
  isInterState?: boolean; // IGST vs CGST+SGST
  
  // Payment
  payments: InvoicePayment[];
  paymentLink?: string;   // Razorpay/Stripe payment link
  paymentLinkId?: string; // Gateway link ID
  
  // Additional
  notes?: string;
  terms?: string;
  attachments?: string[]; // URLs to attached files
  
  // Tracking
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  
  // Conversion from quote
  quoteId?: string;
}

export interface InvoiceSettings {
  companyId: string;
  
  // Numbering
  prefix: string;         // e.g., "INV"
  nextNumber: number;     // Auto-increment
  numberFormat: string;   // e.g., "{prefix}-{year}-{number}"
  
  // GST Settings
  gstEnabled: boolean;
  gstin?: string;
  gstState?: string;      // State code
  defaultTaxRate: number; // Default GST rate (18%, 12%, etc.)
  
  // Defaults
  defaultDueDays: number; // Days until due
  defaultNotes?: string;
  defaultTerms?: string;
  
  // Payment
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    upiId?: string;
  };
  
  // Payment Gateway Credentials (per company)
  paymentGateway?: {
    razorpay?: {
      keyId: string;
      keySecret: string;
      enabled: boolean;
    };
    stripe?: {
      publishableKey: string;
      secretKey: string;
      enabled: boolean;
    };
    preferredGateway?: 'razorpay' | 'stripe' | 'auto'; // auto = INR->Razorpay, others->Stripe
  };
  
  // Branding (inherits from company but can override)
  logoUrl?: string;
  primaryColor?: string;
  
  updatedAt: string;
}

export interface CreateInvoiceInput {
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;
  issueDate?: string;
  dueDate?: string;
  items: Omit<InvoiceItem, 'id' | 'amount' | 'taxAmount' | 'discountAmount'>[];
  discountPercent?: number;
  gstEnabled?: boolean;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
  quoteId?: string;
}

export interface InvoiceFilter {
  status?: InvoiceStatus | InvoiceStatus[];
  clientId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export interface InvoiceStats {
  total: number;
  draft: number;
  sent: number;
  paid: number;
  overdue: number;
  totalRevenue: number;
  totalOutstanding: number;
  thisMonth: number;
  lastMonth: number;
}

// ============================================
// RECURRING INVOICES
// ============================================

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoice {
  id: string;
  companyId: string;
  
  // Template info (used to generate invoices)
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;
  
  // Items template
  items: Omit<InvoiceItem, 'id' | 'amount' | 'taxAmount' | 'discountAmount'>[];
  discountPercent?: number;
  gstEnabled?: boolean;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
  
  // Recurring settings
  frequency: RecurringFrequency;
  startDate: string;        // ISO date
  endDate?: string;         // Optional end date
  nextInvoiceDate: string;  // Next scheduled invoice
  dayOfMonth?: number;      // For monthly (1-28)
  dayOfWeek?: number;       // For weekly (0-6, 0=Sunday)
  
  // Status
  isActive: boolean;
  totalGenerated: number;   // Count of invoices generated
  lastGeneratedAt?: string;
  lastInvoiceId?: string;
  
  // Auto-send settings
  autoSend: boolean;        // Auto-send when generated
  autoReminder: boolean;    // Send payment reminders
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringInvoiceInput {
  clientId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientGstin?: string;
  items: Omit<InvoiceItem, 'id' | 'amount' | 'taxAmount' | 'discountAmount'>[];
  discountPercent?: number;
  gstEnabled?: boolean;
  placeOfSupply?: string;
  notes?: string;
  terms?: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  dayOfMonth?: number;
  autoSend?: boolean;
  autoReminder?: boolean;
}

// ============================================
// PAYMENT REMINDERS
// ============================================

export interface PaymentReminderSettings {
  companyId: string;
  
  // Reminder schedule (days before/after due date)
  reminderDays: number[];     // e.g., [-3, 0, 3, 7] = 3 days before, on due date, 3 & 7 days after
  
  // Templates
  emailSubject?: string;
  emailTemplate?: string;     // Supports {{clientName}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, {{paymentLink}}
  whatsappTemplate?: string;
  
  // Channels
  sendEmail: boolean;
  sendWhatsApp: boolean;
  sendSms: boolean;
  
  // Limits
  maxReminders: number;       // Max reminders per invoice
  stopOnPayment: boolean;     // Stop reminders when paid
  
  updatedAt: string;
}

export interface InvoiceReminder {
  id: string;
  invoiceId: string;
  companyId: string;
  
  // Reminder details
  scheduledFor: string;       // ISO date
  sentAt?: string;
  channel: 'email' | 'whatsapp' | 'sms';
  status: 'pending' | 'sent' | 'failed' | 'skipped';
  
  // Result
  error?: string;
  
  createdAt: string;
}
