/**
 * IndiaMART Lead Integration Types
 * IndiaMART sends leads via webhook when a buyer inquires about products
 */

export interface IndiaMartLead {
  // Lead identification
  UNIQUE_QUERY_ID: string;        // Unique ID for the inquiry
  QUERY_TYPE: string;             // Type of query (Buy Lead, etc.)
  QUERY_TIME: string;             // Timestamp of inquiry
  
  // Buyer details
  SENDER_NAME: string;            // Buyer's name
  SENDER_MOBILE: string;          // Buyer's mobile number
  SENDER_EMAIL: string;           // Buyer's email
  SENDER_COMPANY: string;         // Buyer's company name
  SENDER_ADDRESS: string;         // Buyer's address
  SENDER_CITY: string;            // Buyer's city
  SENDER_STATE: string;           // Buyer's state
  SENDER_PINCODE: string;         // Buyer's pincode
  SENDER_COUNTRY_ISO: string;     // Country code (IN)
  
  // Product details
  SUBJECT: string;                // Product/inquiry subject
  QUERY_MESSAGE: string;          // Detailed inquiry message
  QUERY_PRODUCT_NAME: string;     // Product name inquired about
  QUERY_MCAT_NAME: string;        // Product category
  
  // Additional fields
  CALL_DURATION?: string;         // If it was a call lead
  RECEIVER_MOBILE?: string;       // Seller's mobile
}

export interface IndiaMartSettings {
  companyId: string;
  
  // API Configuration
  enabled: boolean;
  mobileNumber: string;           // IndiaMART registered mobile
  crmKey: string;                 // IndiaMART CRM API key
  
  // Lead handling
  autoCreateLead: boolean;        // Auto-create lead in CRM
  defaultPipeline?: string;       // Default pipeline for leads
  defaultStage?: string;          // Default stage for leads
  defaultAssignee?: string;       // Default user to assign leads
  
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

export interface IndiaMartWebhookPayload {
  // IndiaMART sends leads in this format
  leads: IndiaMartLead[];
}

// Mapped lead for our CRM
export interface MappedIndiaMartLead {
  name: string;
  email: string;
  phone: string;
  company?: string;
  city?: string;
  state?: string;
  source: 'indiamart';
  sourceId: string;
  notes: string;
  attributes: {
    INDIAMART_QUERY_ID: string;
    INDIAMART_PRODUCT: string;
    INDIAMART_CATEGORY: string;
    INDIAMART_MESSAGE: string;
    COMPANY_NAME?: string;
    CITY?: string;
    STATE?: string;
    PINCODE?: string;
  };
}
