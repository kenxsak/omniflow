/**
 * Workflow Trigger Utilities
 * Call these functions from various parts of the app to trigger workflows
 */

import { adminDb } from './firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { TriggerEvent, Workflow, TriggerNode } from '@/types/workflows';

interface TriggerOptions {
  companyId: string;
  event: TriggerEvent;
  entityType: 'contact' | 'deal' | 'form' | 'appointment';
  entityId: string;
  entityData: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Trigger workflows for a specific event
 * Call this when contacts are created, deals change, forms are submitted, etc.
 */
export async function triggerWorkflows(options: TriggerOptions): Promise<{
  triggered: number;
  workflows: string[];
}> {
  const { companyId, event, entityType, entityId, entityData, metadata } = options;
  
  if (!adminDb) {
    console.warn('[Workflow Trigger] Database not initialized');
    return { triggered: 0, workflows: [] };
  }
  
  const triggeredWorkflows: string[] = [];
  
  try {
    // Find all active workflows with matching trigger
    const workflowsSnapshot = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .where('isActive', '==', true)
      .get();
    
    for (const workflowDoc of workflowsSnapshot.docs) {
      const workflow = { id: workflowDoc.id, ...workflowDoc.data() } as Workflow;
      
      // Find trigger node
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger') as TriggerNode | undefined;
      
      if (!triggerNode || triggerNode.config.event !== event) {
        continue;
      }
      
      // Check trigger filters if any
      if (triggerNode.config.filters) {
        const { tagId, formId, source } = triggerNode.config.filters;
        
        if (tagId && metadata?.tagId !== tagId) continue;
        if (formId && metadata?.formId !== formId) continue;
        if (source && entityData?.source !== source) continue;
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
        console.log(`[Workflow Trigger] Entity ${entityId} already in workflow ${workflow.id}`);
        continue;
      }
      
      // Find first node after trigger
      const firstConnection = workflow.connections.find(c => c.from === triggerNode.id);
      const firstNodeId = firstConnection?.to;
      
      if (!firstNodeId) {
        console.log(`[Workflow Trigger] Workflow ${workflow.id} has no nodes after trigger`);
        continue;
      }
      
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
          entityEmail: entityData?.email,
          currentNodeId: firstNodeId,
          status: 'active',
          nextExecutionTime: Timestamp.now(),
          startedAt: FieldValue.serverTimestamp(),
          nodesExecuted: [triggerNode.id],
          context: {
            ...metadata,
            triggerEvent: event,
            triggeredAt: new Date().toISOString(),
          },
        });
      
      triggeredWorkflows.push(workflow.name || workflow.id);
      console.log(`[Workflow Trigger] Started workflow "${workflow.name}" for ${entityType} ${entityId}`);
    }
    
    return {
      triggered: triggeredWorkflows.length,
      workflows: triggeredWorkflows,
    };
  } catch (error) {
    console.error('[Workflow Trigger] Error:', error);
    return { triggered: 0, workflows: [] };
  }
}

// Convenience functions for common triggers

export async function triggerContactCreated(
  companyId: string,
  contactId: string,
  contactData: Record<string, any>
) {
  return triggerWorkflows({
    companyId,
    event: 'contact.created',
    entityType: 'contact',
    entityId: contactId,
    entityData: contactData,
  });
}

export async function triggerContactTagAdded(
  companyId: string,
  contactId: string,
  contactData: Record<string, any>,
  tagId: string
) {
  return triggerWorkflows({
    companyId,
    event: 'contact.tag_added',
    entityType: 'contact',
    entityId: contactId,
    entityData: contactData,
    metadata: { tagId },
  });
}

export async function triggerFormSubmitted(
  companyId: string,
  contactId: string,
  contactData: Record<string, any>,
  formId: string
) {
  return triggerWorkflows({
    companyId,
    event: 'form.submitted',
    entityType: 'form',
    entityId: contactId,
    entityData: contactData,
    metadata: { formId },
  });
}

export async function triggerDealStageChanged(
  companyId: string,
  dealId: string,
  dealData: Record<string, any>,
  previousStage: string,
  newStage: string
) {
  return triggerWorkflows({
    companyId,
    event: 'deal.stage_changed',
    entityType: 'deal',
    entityId: dealId,
    entityData: dealData,
    metadata: { previousStage, newStage },
  });
}

export async function triggerDealWon(
  companyId: string,
  dealId: string,
  dealData: Record<string, any>
) {
  return triggerWorkflows({
    companyId,
    event: 'deal.won',
    entityType: 'deal',
    entityId: dealId,
    entityData: dealData,
  });
}

export async function triggerAppointmentScheduled(
  companyId: string,
  contactId: string,
  contactData: Record<string, any>,
  appointmentData: Record<string, any>
) {
  return triggerWorkflows({
    companyId,
    event: 'appointment.scheduled',
    entityType: 'appointment',
    entityId: contactId,
    entityData: { ...contactData, appointment: appointmentData },
    metadata: { appointmentId: appointmentData.id },
  });
}
