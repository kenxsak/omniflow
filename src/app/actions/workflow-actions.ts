'use server';

/**
 * Server Actions for Workflow Builder
 * Handles CRUD operations and workflow management
 */

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { 
  Workflow, WorkflowNode, WorkflowConnection,
  WorkflowExecutionState, WorkflowRunLog 
} from '@/types/workflows';

// ============ WORKFLOW CRUD ============

export async function getWorkflowsAction(companyId: string): Promise<Workflow[]> {
  if (!adminDb) return [];
  
  const snapshot = await adminDb
    .collection('companies')
    .doc(companyId)
    .collection('workflows')
    .orderBy('updatedAt', 'desc')
    .get();
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
    } as Workflow;
  });
}

export async function getWorkflowAction(
  companyId: string, 
  workflowId: string
): Promise<Workflow | null> {
  if (!adminDb) return null;
  
  const docRef = adminDb
    .collection('companies')
    .doc(companyId)
    .collection('workflows')
    .doc(workflowId);
  
  const docSnap = await docRef.get();
  
  if (!docSnap.exists) return null;
  
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
  } as Workflow;
}

export async function createWorkflowAction(
  companyId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    isActive: boolean;
  }
): Promise<{ success: boolean; workflowId?: string; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const workflowData = {
      ...data,
      companyId,
      createdBy: userId,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
      },
    };
    
    const docRef = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .add(workflowData);
    
    return { success: true, workflowId: docRef.id };
  } catch (error: any) {
    console.error('Error creating workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWorkflowAction(
  companyId: string,
  workflowId: string,
  data: Partial<{
    name: string;
    description: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
    isActive: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    const docRef = adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .doc(workflowId);
    
    await docRef.update({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error updating workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteWorkflowAction(
  companyId: string,
  workflowId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    // First, cancel all active executions
    const activeStates = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('workflowId', '==', workflowId)
      .where('status', 'in', ['active', 'waiting'])
      .get();
    
    const batch = adminDb.batch();
    
    for (const stateDoc of activeStates.docs) {
      batch.update(stateDoc.ref, { status: 'paused' });
    }
    
    // Delete the workflow
    const workflowRef = adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .doc(workflowId);
    
    batch.delete(workflowRef);
    
    await batch.commit();
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting workflow:', error);
    return { success: false, error: error.message };
  }
}

export async function toggleWorkflowActiveAction(
  companyId: string,
  workflowId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  return updateWorkflowAction(companyId, workflowId, { isActive });
}

// ============ WORKFLOW STATS & LOGS ============

export async function getWorkflowStatsAction(
  companyId: string,
  workflowId: string
): Promise<{
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  activeExecutions: number;
  lastRunAt?: string;
}> {
  if (!adminDb) {
    return { totalRuns: 0, successfulRuns: 0, failedRuns: 0, activeExecutions: 0 };
  }
  
  try {
    // Get workflow stats
    const workflowDoc = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .doc(workflowId)
      .get();
    
    const stats = workflowDoc.data()?.stats || {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
    };
    
    // Count active executions
    const activeSnapshot = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('workflowId', '==', workflowId)
      .where('status', 'in', ['active', 'waiting'])
      .count()
      .get();
    
    return {
      ...stats,
      activeExecutions: activeSnapshot.data().count,
    };
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    return { totalRuns: 0, successfulRuns: 0, failedRuns: 0, activeExecutions: 0 };
  }
}

export async function getWorkflowRunLogsAction(
  companyId: string,
  workflowId: string,
  limitCount: number = 50
): Promise<WorkflowRunLog[]> {
  if (!adminDb) return [];
  
  try {
    const snapshot = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowRunLogs')
      .where('workflowId', '==', workflowId)
      .orderBy('executedAt', 'desc')
      .limit(limitCount)
      .get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        executedAt: data.executedAt?.toDate?.()?.toISOString() || null,
      } as WorkflowRunLog;
    });
  } catch (error) {
    console.error('Error getting workflow logs:', error);
    return [];
  }
}

// ============ MANUAL TRIGGER ============

export async function triggerWorkflowManuallyAction(
  companyId: string,
  workflowId: string,
  contactId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    // Get the workflow
    const workflowDoc = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflows')
      .doc(workflowId)
      .get();
    
    if (!workflowDoc.exists) {
      return { success: false, error: 'Workflow not found' };
    }
    
    const workflow = workflowDoc.data() as Workflow;
    
    if (!workflow.isActive) {
      return { success: false, error: 'Workflow is not active' };
    }
    
    // Check if contact is already in this workflow
    const existingState = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('workflowId', '==', workflowId)
      .where('entityId', '==', contactId)
      .where('status', 'in', ['active', 'waiting'])
      .limit(1)
      .get();
    
    if (!existingState.empty) {
      return { success: false, error: 'Contact is already in this workflow' };
    }
    
    // Get contact data
    const contactDoc = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('contacts')
      .doc(contactId)
      .get();
    
    if (!contactDoc.exists) {
      return { success: false, error: 'Contact not found' };
    }
    
    const contact = contactDoc.data();
    
    // Find the trigger node and first action node
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
    const firstConnection = workflow.connections.find(c => c.from === triggerNode?.id);
    const firstNodeId = firstConnection?.to || triggerNode?.id || workflow.nodes[0]?.id;
    
    // Create execution state
    await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .add({
        workflowId,
        companyId,
        entityType: 'contact',
        entityId: contactId,
        entityEmail: contact?.email,
        currentNodeId: firstNodeId,
        status: 'active',
        nextExecutionTime: Timestamp.now(),
        startedAt: FieldValue.serverTimestamp(),
        nodesExecuted: triggerNode ? [triggerNode.id] : [],
        context: { manualTrigger: true },
      });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error triggering workflow:', error);
    return { success: false, error: error.message };
  }
}

// ============ EXECUTION STATE MANAGEMENT ============

export async function getActiveExecutionsAction(
  companyId: string,
  workflowId?: string,
  limitCount: number = 50
): Promise<WorkflowExecutionState[]> {
  if (!adminDb) return [];
  
  try {
    let query = adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('status', 'in', ['active', 'waiting'])
      .orderBy('startedAt', 'desc')
      .limit(limitCount);
    
    if (workflowId) {
      query = adminDb
        .collection('companies')
        .doc(companyId)
        .collection('workflowExecutionStates')
        .where('workflowId', '==', workflowId)
        .where('status', 'in', ['active', 'waiting'])
        .limit(limitCount);
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        startedAt: data.startedAt?.toDate?.()?.toISOString() || null,
        nextExecutionTime: data.nextExecutionTime?.toDate?.()?.toISOString() || null,
      } as WorkflowExecutionState;
    });
  } catch (error) {
    console.error('Error getting active executions:', error);
    return [];
  }
}

export async function cancelExecutionAction(
  companyId: string,
  executionId: string
): Promise<{ success: boolean; error?: string }> {
  if (!adminDb) {
    return { success: false, error: 'Database not initialized' };
  }
  
  try {
    await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .doc(executionId)
      .update({
        status: 'paused',
      });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error cancelling execution:', error);
    return { success: false, error: error.message };
  }
}
