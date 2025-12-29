/**
 * Workflow Execution Engine
 * Processes workflow nodes and executes actions
 * Runs server-side via cron jobs
 */

import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { 
  Workflow, WorkflowNode, WorkflowExecutionState,
  ActionNode, ConditionNode, DelayNode, TriggerNode,
  WorkflowTriggerPayload
} from '@/types/workflows';

// Import action executors
import { sendTransactionalEmail as sendBrevoEmail } from '@/services/brevo';
import { sendTransactionalEmail as sendSenderEmail } from '@/lib/sender-client';
import { sendEmailSMTP } from '@/lib/smtp-client';
import { sendBulkSMSMSG91 } from '@/lib/msg91-client';
import { sendBulkSMSFast2SMS } from '@/lib/fast2sms-client';
import { sendBulkAuthkeyWhatsApp } from '@/lib/authkey-client';
import { sendBulkWhatsAppAiSensy } from '@/lib/aisensy-client';
import { sendBulkWhatsAppGupshup } from '@/lib/gupshup-client';
import { decryptApiKeyServerSide } from '@/lib/encryption-server';

interface ExecutionResult {
  success: boolean;
  nextNodeId?: string;
  error?: string;
  message?: string;
}

interface CompanyAPIKeys {
  brevo?: { apiKey?: string; senderEmail?: string; senderName?: string };
  sender?: { apiKey?: string; senderEmail?: string; senderName?: string };
  smtp?: { host?: string; port?: number; username?: string; user?: string; password?: string; fromEmail?: string; fromName?: string };
  // SMS Providers
  msg91?: { authKey?: string; senderId?: string; dltTemplateId?: string };
  fast2sms?: { apiKey?: string; senderId?: string; dltTemplateId?: string };
  // WhatsApp Providers
  authkey?: { authKey?: string };
  aisensy?: { apiKey?: string };
  gupshup?: { apiKey?: string; appName?: string; srcName?: string; phoneNumber?: string };
}

// ============ MAIN EXECUTION FUNCTION ============

export async function executeWorkflowNode(
  workflow: Workflow,
  state: WorkflowExecutionState,
  companyId: string
): Promise<ExecutionResult> {
  const node = workflow.nodes.find(n => n.id === state.currentNodeId);
  
  if (!node) {
    return { success: false, error: `Node ${state.currentNodeId} not found in workflow` };
  }
  
  try {
    switch (node.type) {
      case 'action':
        return await executeActionNode(node as ActionNode, state, companyId, workflow);
      
      case 'condition':
        return await executeConditionNode(node as ConditionNode, state, companyId);
      
      case 'delay':
        return await executeDelayNode(node as DelayNode, state);
      
      case 'trigger':
        // Triggers just pass through to next node
        return getNextNode(workflow, node.id);
      
      default:
        // This should never happen if all node types are handled
        const _exhaustiveCheck: never = node;
        return { success: false, error: `Unknown node type: ${(_exhaustiveCheck as any).type}` };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============ ACTION EXECUTOR ============

async function executeActionNode(
  node: ActionNode,
  state: WorkflowExecutionState,
  companyId: string,
  workflow: Workflow
): Promise<ExecutionResult> {
  const { action } = node.config;
  
  // Get entity data
  const entityData = await getEntityData(companyId, state.entityType, state.entityId);
  if (!entityData) {
    return { success: false, error: `Entity ${state.entityId} not found` };
  }
  
  // Get API keys
  const apiKeys = await getCompanyAPIKeys(companyId);
  
  let result: ExecutionResult;
  
  switch (action) {
    case 'send_email':
      result = await executeSendEmail(node, entityData, companyId, apiKeys);
      break;
    
    case 'send_sms':
      result = await executeSendSMS(node, entityData, companyId, apiKeys);
      break;
    
    case 'send_whatsapp':
      result = await executeSendWhatsApp(node, entityData, companyId, apiKeys);
      break;
    
    case 'add_tag':
      result = await executeAddTag(node, entityData, companyId);
      break;
    
    case 'remove_tag':
      result = await executeRemoveTag(node, entityData, companyId);
      break;
    
    case 'update_contact':
      result = await executeUpdateContact(node, entityData, companyId);
      break;
    
    case 'create_task':
      result = await executeCreateTask(node, entityData, companyId, state);
      break;
    
    case 'notify_team':
      result = await executeNotifyTeam(node, entityData, companyId);
      break;
    
    case 'webhook':
      result = await executeWebhook(node, entityData, state);
      break;
    
    default:
      result = { success: false, error: `Unknown action: ${action}` };
  }
  
  if (result.success) {
    // Get next node
    const nextResult = getNextNode(workflow, node.id);
    result.nextNodeId = nextResult.nextNodeId;
  }
  
  return result;
}

// ============ CONDITION EXECUTOR ============

async function executeConditionNode(
  node: ConditionNode,
  state: WorkflowExecutionState,
  companyId: string
): Promise<ExecutionResult> {
  const { condition } = node.config;
  
  // Get entity data
  const entityData = await getEntityData(companyId, state.entityType, state.entityId);
  if (!entityData) {
    return { success: false, error: `Entity ${state.entityId} not found` };
  }
  
  let conditionMet = false;
  
  switch (condition) {
    case 'has_tag':
      conditionMet = entityData.tags?.includes(node.config.tagId);
      break;
    
    case 'missing_tag':
      conditionMet = !entityData.tags?.includes(node.config.tagId);
      break;
    
    case 'field_equals':
      conditionMet = entityData[node.config.fieldName || ''] === node.config.fieldValue;
      break;
    
    case 'field_contains':
      const fieldValue = entityData[node.config.fieldName || ''] || '';
      conditionMet = String(fieldValue).toLowerCase().includes((node.config.fieldValue || '').toLowerCase());
      break;
    
    case 'contact_source_is':
      conditionMet = entityData.source === node.config.source;
      break;
    
    case 'deal_stage_is':
      conditionMet = entityData.stage === node.config.dealStage;
      break;
    
    default:
      conditionMet = false;
  }
  
  // Return the appropriate branch
  const nextNodeId = conditionMet ? node.yesBranch : node.noBranch;
  
  return {
    success: true,
    nextNodeId,
    message: `Condition "${condition}" evaluated to ${conditionMet}`,
  };
}

// ============ DELAY EXECUTOR ============

async function executeDelayNode(
  node: DelayNode,
  state: WorkflowExecutionState
): Promise<ExecutionResult> {
  const { delayMinutes = 0, delayHours = 0, delayDays = 0 } = node.config;
  
  const totalMs = 
    (delayMinutes * 60 * 1000) +
    (delayHours * 60 * 60 * 1000) +
    (delayDays * 24 * 60 * 60 * 1000);
  
  if (totalMs <= 0) {
    // No delay, continue immediately
    return { success: true, message: 'No delay configured' };
  }
  
  // Return special result indicating we need to wait
  return {
    success: true,
    message: `Waiting for ${delayDays}d ${delayHours}h ${delayMinutes}m`,
  };
}

// ============ ACTION IMPLEMENTATIONS ============

async function executeSendEmail(
  node: ActionNode,
  entityData: any,
  companyId: string,
  apiKeys: CompanyAPIKeys
): Promise<ExecutionResult> {
  const { emailSubject, emailContent } = node.config;
  
  if (!emailSubject || !emailContent) {
    return { success: false, error: 'Email subject and content are required' };
  }
  
  if (!entityData.email) {
    return { success: false, error: 'Contact has no email address' };
  }
  
  // Personalize content
  const subject = personalizeContent(emailSubject, entityData);
  const content = personalizeContent(emailContent, entityData);
  
  // Try providers in order
  if (apiKeys.brevo?.apiKey) {
    const result = await sendBrevoEmail(
      apiKeys.brevo.apiKey,
      apiKeys.brevo.senderEmail || 'noreply@omniflow.com',
      apiKeys.brevo.senderName || 'OmniFlow',
      entityData.email,
      entityData.name || 'there',
      subject,
      content
    );
    return result;
  }
  
  if (apiKeys.sender?.apiKey) {
    const result = await sendSenderEmail(
      apiKeys.sender.apiKey,
      apiKeys.sender.senderEmail || 'noreply@omniflow.com',
      apiKeys.sender.senderName || 'OmniFlow',
      entityData.email,
      entityData.name || 'there',
      subject,
      content
    );
    return result;
  }
  
  if (apiKeys.smtp?.host) {
    const result = await sendEmailSMTP(
      {
        host: apiKeys.smtp.host,
        port: apiKeys.smtp.port || 587,
        username: apiKeys.smtp.username || apiKeys.smtp.user || '',
        password: apiKeys.smtp.password || '',
        fromEmail: apiKeys.smtp.fromEmail || 'noreply@omniflow.com',
        fromName: apiKeys.smtp.fromName || 'OmniFlow',
      },
      {
        to: entityData.email,
        subject,
        html: content,
      }
    );
    return result;
  }
  
  return { success: false, error: 'No email provider configured' };
}

async function executeSendSMS(
  node: ActionNode,
  entityData: any,
  companyId: string,
  apiKeys: CompanyAPIKeys
): Promise<ExecutionResult> {
  const { smsMessage, dltTemplateId } = node.config;
  
  if (!smsMessage) {
    return { success: false, error: 'SMS message is required' };
  }
  
  if (!entityData.phone) {
    return { success: false, error: 'Contact has no phone number' };
  }
  
  const message = personalizeContent(smsMessage, entityData);
  
  // Format phone number (remove spaces, dashes, ensure country code)
  let phone = entityData.phone.replace(/[\s\-\(\)]/g, '');
  if (!phone.startsWith('+') && !phone.startsWith('91')) {
    phone = '91' + phone; // Default to India country code
  }
  phone = phone.replace(/^\+/, ''); // Remove + for API calls
  
  // Try MSG91 first
  if (apiKeys.msg91?.authKey) {
    try {
      const config = {
        authKey: decryptApiKeyServerSide(apiKeys.msg91.authKey),
        senderId: apiKeys.msg91.senderId || 'OMNIFL',
      };
      
      const result = await sendBulkSMSMSG91(config, {
        message,
        recipients: [phone],
        route: 'transactional',
        dltTemplateId: dltTemplateId || apiKeys.msg91.dltTemplateId,
      });
      
      if (result.success) {
        console.log(`[Workflow] SMS sent to ${entityData.phone} via MSG91`);
        return { success: true, message: `SMS sent to ${entityData.phone} via MSG91` };
      }
      
      console.error(`[Workflow] MSG91 SMS failed: ${result.error}`);
    } catch (error: any) {
      console.error(`[Workflow] MSG91 error:`, error);
    }
  }
  
  // Try Fast2SMS as fallback
  if (apiKeys.fast2sms?.apiKey) {
    try {
      const config = {
        apiKey: decryptApiKeyServerSide(apiKeys.fast2sms.apiKey),
        senderId: apiKeys.fast2sms.senderId,
      };
      
      // Extract last 10 digits for Fast2SMS (India only)
      const fast2smsPhone = phone.slice(-10);
      
      const result = await sendBulkSMSFast2SMS(config, {
        message,
        recipients: [fast2smsPhone],
        route: dltTemplateId || apiKeys.fast2sms.dltTemplateId ? 'dlt' : 'q',
        dltTemplateId: dltTemplateId || apiKeys.fast2sms.dltTemplateId,
      });
      
      if (result.success) {
        console.log(`[Workflow] SMS sent to ${entityData.phone} via Fast2SMS`);
        return { success: true, message: `SMS sent to ${entityData.phone} via Fast2SMS` };
      }
      
      console.error(`[Workflow] Fast2SMS failed: ${result.error}`);
      return { success: false, error: result.error || 'Fast2SMS send failed' };
    } catch (error: any) {
      console.error(`[Workflow] Fast2SMS error:`, error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'No SMS provider configured. Please configure MSG91 or Fast2SMS in Settings → Integrations.' };
}

async function executeSendWhatsApp(
  node: ActionNode,
  entityData: any,
  companyId: string,
  apiKeys: CompanyAPIKeys
): Promise<ExecutionResult> {
  const { whatsappTemplateName, whatsappParameters } = node.config;
  
  if (!whatsappTemplateName) {
    return { success: false, error: 'WhatsApp template name is required' };
  }
  
  if (!entityData.phone) {
    return { success: false, error: 'Contact has no phone number' };
  }
  
  // Format phone number (remove spaces, dashes, ensure country code)
  let phone = entityData.phone.replace(/[\s\-\(\)]/g, '');
  if (!phone.startsWith('+') && !phone.startsWith('91')) {
    phone = '91' + phone; // Default to India country code
  }
  phone = phone.replace(/^\+/, ''); // Remove + for API calls
  
  // Personalize template parameters if provided
  const params = whatsappParameters 
    ? whatsappParameters.map((p: string) => personalizeContent(p, entityData))
    : [entityData.name?.split(' ')[0] || 'there']; // Default: first name
  
  // Try Authkey first (most cost-effective)
  if (apiKeys.authkey?.authKey) {
    try {
      const config = {
        apiKey: decryptApiKeyServerSide(apiKeys.authkey.authKey),
      };
      
      const result = await sendBulkAuthkeyWhatsApp(config, {
        templateName: whatsappTemplateName,
        templateType: 'text',
        recipients: [{
          phone,
          parameters: params,
        }],
      });
      
      if (result.success && result.totalSent > 0) {
        console.log(`[Workflow] WhatsApp sent to ${entityData.phone} via Authkey`);
        return { success: true, message: `WhatsApp sent to ${entityData.phone} via Authkey` };
      }
      
      // Get error from results if available
      const errorMsg = result.results?.[0]?.error || 'Authkey send failed';
      console.error(`[Workflow] Authkey WhatsApp failed: ${errorMsg}`);
    } catch (error: any) {
      console.error(`[Workflow] Authkey error:`, error);
    }
  }
  
  // Try AiSensy as second option
  if (apiKeys.aisensy?.apiKey) {
    try {
      const config = {
        apiKey: decryptApiKeyServerSide(apiKeys.aisensy.apiKey),
        campaignName: `Workflow: ${whatsappTemplateName}`,
      };
      
      const result = await sendBulkWhatsAppAiSensy(config, {
        campaignName: `Workflow: ${whatsappTemplateName}`,
        recipients: [{
          whatsappNumber: phone,
          userName: entityData.name || 'Customer',
          templateParams: params,
        }],
      });
      
      if (result.success) {
        console.log(`[Workflow] WhatsApp sent to ${entityData.phone} via AiSensy`);
        return { success: true, message: `WhatsApp sent to ${entityData.phone} via AiSensy` };
      }
      
      console.error(`[Workflow] AiSensy WhatsApp failed: ${result.error}`);
    } catch (error: any) {
      console.error(`[Workflow] AiSensy error:`, error);
    }
  }
  
  // Try Gupshup as third option
  if (apiKeys.gupshup?.apiKey && apiKeys.gupshup?.appName) {
    try {
      const config = {
        apiKey: decryptApiKeyServerSide(apiKeys.gupshup.apiKey),
        appName: apiKeys.gupshup.appName,
        srcName: apiKeys.gupshup.srcName,
      };
      
      const result = await sendBulkWhatsAppGupshup(config, {
        source: apiKeys.gupshup.phoneNumber || '',
        templateId: whatsappTemplateName,
        recipients: [{
          phone,
          params,
        }],
      });
      
      if (result.success) {
        const successCount = result.results?.filter(r => r.success).length || 0;
        if (successCount > 0) {
          console.log(`[Workflow] WhatsApp sent to ${entityData.phone} via Gupshup`);
          return { success: true, message: `WhatsApp sent to ${entityData.phone} via Gupshup` };
        }
      }
      
      console.error(`[Workflow] Gupshup WhatsApp failed: ${result.error}`);
      return { success: false, error: result.error || 'Gupshup send failed' };
    } catch (error: any) {
      console.error(`[Workflow] Gupshup error:`, error);
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'No WhatsApp provider configured. Please configure Authkey, AiSensy, or Gupshup in Settings → Integrations.' };
}

async function executeAddTag(
  node: ActionNode,
  entityData: any,
  companyId: string
): Promise<ExecutionResult> {
  const { tagId, tagName } = node.config;
  
  if (!tagId && !tagName) {
    return { success: false, error: 'Tag ID or name is required' };
  }
  
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  const contactRef = adminDb.collection('companies').doc(companyId).collection('contacts').doc(entityData.id);
  
  await contactRef.update({
    tags: FieldValue.arrayUnion(tagId || tagName),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  return { success: true, message: `Added tag "${tagName || tagId}"` };
}

async function executeRemoveTag(
  node: ActionNode,
  entityData: any,
  companyId: string
): Promise<ExecutionResult> {
  const { tagId, tagName } = node.config;
  
  if (!tagId && !tagName) {
    return { success: false, error: 'Tag ID or name is required' };
  }
  
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  const contactRef = adminDb.collection('companies').doc(companyId).collection('contacts').doc(entityData.id);
  
  await contactRef.update({
    tags: FieldValue.arrayRemove(tagId || tagName),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  return { success: true, message: `Removed tag "${tagName || tagId}"` };
}

async function executeUpdateContact(
  node: ActionNode,
  entityData: any,
  companyId: string
): Promise<ExecutionResult> {
  // TODO: Implement field updates based on node config
  return { success: true, message: 'Contact update not yet implemented' };
}

async function executeCreateTask(
  node: ActionNode,
  entityData: any,
  companyId: string,
  state: WorkflowExecutionState
): Promise<ExecutionResult> {
  const { taskTitle, taskDescription, taskDueInDays = 1 } = node.config;
  
  if (!taskTitle) {
    return { success: false, error: 'Task title is required' };
  }
  
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  const title = personalizeContent(taskTitle, entityData);
  const description = taskDescription ? personalizeContent(taskDescription, entityData) : '';
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + taskDueInDays);
  
  await adminDb.collection('companies').doc(companyId).collection('tasks').add({
    title,
    description,
    status: 'pending',
    priority: 'medium',
    dueDate: Timestamp.fromDate(dueDate),
    relatedContactId: state.entityType === 'contact' ? state.entityId : null,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: 'workflow',
    workflowId: state.workflowId,
  });
  
  return { success: true, message: `Created task: ${title}` };
}

async function executeNotifyTeam(
  node: ActionNode,
  entityData: any,
  companyId: string
): Promise<ExecutionResult> {
  const { notificationMessage } = node.config;
  
  if (!notificationMessage) {
    return { success: false, error: 'Notification message is required' };
  }
  
  const message = personalizeContent(notificationMessage, entityData);
  
  // TODO: Implement in-app notifications
  console.log(`[Workflow] Team notification: ${message}`);
  
  return { success: true, message: 'Team notified' };
}

async function executeWebhook(
  node: ActionNode,
  entityData: any,
  state: WorkflowExecutionState
): Promise<ExecutionResult> {
  const { webhookUrl, webhookMethod = 'POST' } = node.config;
  
  if (!webhookUrl) {
    return { success: false, error: 'Webhook URL is required' };
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: webhookMethod,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'workflow.action',
        workflowId: state.workflowId,
        entityType: state.entityType,
        entityId: state.entityId,
        entityData,
        timestamp: new Date().toISOString(),
      }),
    });
    
    if (!response.ok) {
      return { success: false, error: `Webhook returned ${response.status}` };
    }
    
    return { success: true, message: `Webhook called: ${webhookUrl}` };
  } catch (error: any) {
    return { success: false, error: `Webhook failed: ${error.message}` };
  }
}

// ============ HELPER FUNCTIONS ============

function getNextNode(workflow: Workflow, currentNodeId: string): ExecutionResult {
  const connection = workflow.connections.find(c => c.from === currentNodeId);
  
  if (!connection) {
    // No next node - workflow complete
    return { success: true, nextNodeId: undefined };
  }
  
  return { success: true, nextNodeId: connection.to };
}

function personalizeContent(content: string, entityData: any): string {
  const firstName = (entityData.name || '').split(' ')[0] || 'there';
  const lastName = (entityData.name || '').split(' ').slice(1).join(' ') || '';
  
  return content
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{last_name\}\}/gi, lastName)
    .replace(/\{\{name\}\}/gi, entityData.name || 'there')
    .replace(/\{\{email\}\}/gi, entityData.email || '')
    .replace(/\{\{phone\}\}/gi, entityData.phone || '')
    .replace(/\{\{company\}\}/gi, entityData.company || '');
}

async function getEntityData(
  companyId: string,
  entityType: string,
  entityId: string
): Promise<any | null> {
  if (!adminDb) return null;
  
  const collectionName = entityType === 'contact' ? 'contacts' : 'deals';
  
  const docRef = adminDb.collection('companies').doc(companyId).collection(collectionName).doc(entityId);
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) return null;
  
  return { id: docSnap.id, ...docSnap.data() };
}

async function getCompanyAPIKeys(companyId: string): Promise<CompanyAPIKeys> {
  if (!adminDb) return {};
  
  try {
    const apiKeysDoc = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('settings')
      .doc('apiKeys')
      .get();
    
    if (apiKeysDoc.exists) {
      return apiKeysDoc.data() as CompanyAPIKeys;
    }
  } catch (error) {
    console.error('Error fetching API keys:', error);
  }
  
  return {};
}

// ============ TRIGGER HANDLER ============

export async function handleWorkflowTrigger(payload: WorkflowTriggerPayload): Promise<void> {
  if (!adminDb) {
    console.error('[Workflow] Database not initialized');
    return;
  }
  
  const { event, companyId, entityType, entityId } = payload;
  
  // Find all active workflows with this trigger
  const workflowsSnapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('workflows')
    .where('isActive', '==', true)
    .get();
  
  for (const workflowDoc of workflowsSnapshot.docs) {
    const workflow = { id: workflowDoc.id, ...workflowDoc.data() } as Workflow;
    
    // Check if this workflow has a matching trigger
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger') as TriggerNode | undefined;
    
    if (!triggerNode || triggerNode.config.event !== event) {
      continue;
    }
    
    // Check if entity is already in this workflow
    const existingState = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('workflowId', '==', workflow.id)
      .where('entityId', '==', entityId)
      .where('status', 'in', ['active', 'waiting'])
      .limit(1)
      .get();
    
    if (!existingState.empty) {
      console.log(`[Workflow] Entity ${entityId} already in workflow ${workflow.id}`);
      continue;
    }
    
    // Find the first node after trigger
    const firstConnection = workflow.connections.find(c => c.from === triggerNode.id);
    const firstNodeId = firstConnection?.to || triggerNode.id;
    
    // Create execution state
    await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .add({
        workflowId: workflow.id,
        companyId,
        entityType: entityType === 'form' || entityType === 'appointment' ? 'contact' : entityType,
        entityId,
        entityEmail: payload.entityData?.email,
        currentNodeId: firstNodeId,
        status: 'active',
        nextExecutionTime: Timestamp.now(),
        startedAt: FieldValue.serverTimestamp(),
        nodesExecuted: [triggerNode.id],
        context: payload.metadata,
      });
    
    console.log(`[Workflow] Started workflow ${workflow.name} for entity ${entityId}`);
  }
}
