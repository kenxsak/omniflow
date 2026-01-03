/**
 * JustDial Lead Integration Types
 * JustDial sends leads via webhook when a customer inquires
 */

export interface JustDialLead {
  // Lead identification
  leadid: string;                 // Unique lead ID
  leadtype: string;               // Type of lead
  
  // Customer details
  name: string;                   // Customer name
  mobile: string;                 // Customer mobile
  email?: string;                 // Customer email (optional)
  city: string;                   // Customer city
  area?: string;                  // Customer area
  
  // Inquiry details
  category: string;               // Business category
  date: string;                   // Lead date
  time: string;                   // Lead time
  
  // Additional
  prefix?: string;                // Name prefix
  parentid?: string;              // Parent lead ID
  brancharea?: string;            // Branch area
}

export interface JustDialSettings {
  companyId: string;
  
  // API Configuration
  enabled: boolean;
  apiKey: string;                 // JustDial API key
  
  // Lead handling
  autoCreateLead: boolean;
  defaultPipeline?: string;
  defaultStage?: string;
  defaultAssignee?: string;
  
  // Notifications
  notifyOnNewLead: boolean;
  notifyEmail?: string;
  notifyWhatsApp?: string;
  
  // Tracking
  lastSyncAt?: string;
  totalLeadsReceived: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface MappedJustDialLead {
  name: string;
  email: string;
  phone: string;
  city?: string;
  source: 'justdial';
  sourceId: string;
  notes: string;
  attributes: {
    JUSTDIAL_LEAD_ID: string;
    JUSTDIAL_CATEGORY: string;
    CITY?: string;
    AREA?: string;
  };
}
