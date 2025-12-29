/**
 * Workflow Builder Types
 * Visual automation workflows with triggers, actions, conditions, and delays
 */

// Node types in a workflow
export type WorkflowNodeType = 'trigger' | 'action' | 'condition' | 'delay';

// Trigger events that can start a workflow
export type TriggerEvent = 
  | 'contact.created'
  | 'contact.updated'
  | 'contact.tag_added'
  | 'contact.tag_removed'
  | 'form.submitted'
  | 'deal.created'
  | 'deal.stage_changed'
  | 'deal.won'
  | 'deal.lost'
  | 'appointment.scheduled'
  | 'appointment.completed'
  | 'appointment.cancelled'
  | 'email.opened'
  | 'email.clicked'
  | 'landing_page.visited'
  | 'landing_page.form_submitted'
  | 'manual'; // Manually triggered

// Action types that can be performed
export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'send_whatsapp'
  | 'add_tag'
  | 'remove_tag'
  | 'update_contact'
  | 'create_task'
  | 'assign_to_user'
  | 'move_deal_stage'
  | 'notify_team'
  | 'webhook';

// Condition types for branching
export type ConditionType =
  | 'has_tag'
  | 'missing_tag'
  | 'email_opened'
  | 'email_clicked'
  | 'field_equals'
  | 'field_contains'
  | 'deal_stage_is'
  | 'contact_source_is';

// Base node interface
export interface WorkflowNodeBase {
  id: string;
  type: WorkflowNodeType;
  name: string;
  position: { x: number; y: number };
}

// Trigger node
export interface TriggerNode extends WorkflowNodeBase {
  type: 'trigger';
  config: {
    event: TriggerEvent;
    filters?: {
      tagId?: string;
      formId?: string;
      dealStage?: string;
      source?: string;
    };
  };
}

// Action node
export interface ActionNode extends WorkflowNodeBase {
  type: 'action';
  config: {
    action: ActionType;
    // Email config
    emailSubject?: string;
    emailContent?: string;
    emailTemplateId?: string;
    // SMS config
    smsMessage?: string;
    smsTemplateId?: string;
    dltTemplateId?: string; // DLT Template ID for India SMS compliance
    // WhatsApp config
    whatsappTemplateId?: string;
    whatsappTemplateName?: string;
    whatsappParameters?: string[]; // Template variable values
    // Tag config
    tagId?: string;
    tagName?: string;
    // Task config
    taskTitle?: string;
    taskDescription?: string;
    taskDueInDays?: number;
    // Assignment config
    assignToUserId?: string;
    // Deal config
    dealStageId?: string;
    // Notification config
    notificationMessage?: string;
    notifyUserIds?: string[];
    // Webhook config
    webhookUrl?: string;
    webhookMethod?: 'GET' | 'POST';
  };
}

// Condition node (branches into yes/no paths)
export interface ConditionNode extends WorkflowNodeBase {
  type: 'condition';
  config: {
    condition: ConditionType;
    tagId?: string;
    fieldName?: string;
    fieldValue?: string;
    dealStage?: string;
    source?: string;
  };
  // Condition nodes have two outputs
  yesBranch?: string; // Node ID for yes path
  noBranch?: string;  // Node ID for no path
}

// Delay node
export interface DelayNode extends WorkflowNodeBase {
  type: 'delay';
  config: {
    delayMinutes?: number;
    delayHours?: number;
    delayDays?: number;
    // Or wait until specific time
    waitUntilTime?: string; // HH:MM format
    waitUntilDayOfWeek?: number; // 0-6 (Sunday-Saturday)
  };
}

export type WorkflowNode = TriggerNode | ActionNode | ConditionNode | DelayNode;

// Connection between nodes
export interface WorkflowConnection {
  id: string;
  from: string;      // Source node ID
  to: string;        // Target node ID
  fromPort?: 'yes' | 'no' | 'default'; // For condition nodes
}

// Workflow definition
export interface Workflow {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  isActive: boolean;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
  createdBy: string; // User ID
  
  // Stats
  stats?: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    lastRunAt?: string;
  };
}

// Workflow execution state (tracks a contact's progress through a workflow)
export interface WorkflowExecutionState {
  id: string;
  workflowId: string;
  companyId: string;
  
  // The entity being processed
  entityType: 'contact' | 'deal';
  entityId: string;
  entityEmail?: string; // For quick reference
  
  // Current position in workflow
  currentNodeId: string;
  status: 'active' | 'waiting' | 'completed' | 'failed' | 'paused';
  
  // Timing
  nextExecutionTime: any; // Firestore Timestamp - when to process next
  startedAt: any;
  completedAt?: any;
  
  // Tracking
  nodesExecuted: string[]; // IDs of nodes already executed
  lastError?: string;
  
  // Context data passed through the workflow
  context?: Record<string, any>;
}

// Workflow run log (for debugging and analytics)
export interface WorkflowRunLog {
  id: string;
  workflowId: string;
  executionStateId: string;
  companyId: string;
  
  nodeId: string;
  nodeName: string;
  nodeType: WorkflowNodeType;
  
  status: 'success' | 'failed' | 'skipped';
  message?: string;
  error?: string;
  
  // What was done
  actionTaken?: string;
  
  executedAt: any; // Firestore Timestamp
  durationMs?: number;
}

// Event payload when a trigger fires
export interface WorkflowTriggerPayload {
  event: TriggerEvent;
  companyId: string;
  entityType: 'contact' | 'deal' | 'form' | 'appointment';
  entityId: string;
  entityData: Record<string, any>;
  metadata?: {
    tagId?: string;
    formId?: string;
    previousStage?: string;
    newStage?: string;
  };
  timestamp: string;
}
