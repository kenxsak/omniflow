"use client";

/**
 * Workflow Data Management
 * CRUD operations for workflows stored in Firestore
 */

import { getFirebaseDb } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, addDoc, 
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, Timestamp
} from 'firebase/firestore';
import type { 
  Workflow, WorkflowNode, WorkflowConnection,
  WorkflowExecutionState, WorkflowRunLog 
} from '@/types/workflows';

const getDb = () => getFirebaseDb();

// Collection references
const workflowsCol = (companyId: string) => 
  collection(getDb()!, 'companies', companyId, 'workflows');

const executionStatesCol = (companyId: string) => 
  collection(getDb()!, 'companies', companyId, 'workflowExecutionStates');

const runLogsCol = (companyId: string) => 
  collection(getDb()!, 'companies', companyId, 'workflowRunLogs');

// ============ WORKFLOW CRUD ============

export async function getWorkflows(companyId: string): Promise<Workflow[]> {
  if (!getDb()) return [];
  
  const snapshot = await getDocs(
    query(workflowsCol(companyId), orderBy('updatedAt', 'desc'))
  );
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  } as Workflow));
}

export async function getWorkflow(companyId: string, workflowId: string): Promise<Workflow | null> {
  if (!getDb()) return null;
  
  const docRef = doc(getDb()!, 'companies', companyId, 'workflows', workflowId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    ...docSnap.data(),
    id: docSnap.id,
  } as Workflow;
}

export async function createWorkflow(
  companyId: string, 
  userId: string,
  data: Omit<Workflow, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'stats'>
): Promise<string> {
  if (!getDb()) throw new Error('Database not initialized');
  
  const workflowData = {
    ...data,
    companyId,
    createdBy: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    stats: {
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
    },
  };
  
  const docRef = await addDoc(workflowsCol(companyId), workflowData);
  return docRef.id;
}

export async function updateWorkflow(
  companyId: string,
  workflowId: string,
  data: Partial<Omit<Workflow, 'id' | 'companyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  if (!getDb()) return;
  
  const docRef = doc(getDb()!, 'companies', companyId, 'workflows', workflowId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorkflow(companyId: string, workflowId: string): Promise<void> {
  if (!getDb()) return;
  
  // First, cancel all active executions
  const activeStates = await getDocs(
    query(
      executionStatesCol(companyId),
      where('workflowId', '==', workflowId),
      where('status', 'in', ['active', 'waiting'])
    )
  );
  
  for (const stateDoc of activeStates.docs) {
    await updateDoc(stateDoc.ref, { status: 'paused' });
  }
  
  // Delete the workflow
  await deleteDoc(doc(getDb()!, 'companies', companyId, 'workflows', workflowId));
}

export async function toggleWorkflowActive(
  companyId: string, 
  workflowId: string, 
  isActive: boolean
): Promise<void> {
  await updateWorkflow(companyId, workflowId, { isActive });
}

// ============ ACTIVE WORKFLOWS BY TRIGGER ============

export async function getActiveWorkflowsByTrigger(
  companyId: string,
  triggerEvent: string
): Promise<Workflow[]> {
  if (!getDb()) return [];
  
  // Get all active workflows
  const snapshot = await getDocs(
    query(
      workflowsCol(companyId),
      where('isActive', '==', true)
    )
  );
  
  // Filter by trigger event (need to check nodes)
  return snapshot.docs
    .map(doc => ({ ...doc.data(), id: doc.id } as Workflow))
    .filter(workflow => {
      const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
      return triggerNode && (triggerNode as any).config?.event === triggerEvent;
    });
}

// ============ EXECUTION STATE MANAGEMENT ============

export async function createExecutionState(
  companyId: string,
  data: Omit<WorkflowExecutionState, 'id'>
): Promise<string> {
  if (!getDb()) throw new Error('Database not initialized');
  
  const docRef = await addDoc(executionStatesCol(companyId), {
    ...data,
    startedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getExecutionState(
  companyId: string,
  stateId: string
): Promise<WorkflowExecutionState | null> {
  if (!getDb()) return null;
  
  const docRef = doc(getDb()!, 'companies', companyId, 'workflowExecutionStates', stateId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    ...docSnap.data(),
    id: docSnap.id,
  } as WorkflowExecutionState;
}

export async function updateExecutionState(
  companyId: string,
  stateId: string,
  data: Partial<WorkflowExecutionState>
): Promise<void> {
  if (!getDb()) return;
  
  const docRef = doc(getDb()!, 'companies', companyId, 'workflowExecutionStates', stateId);
  await updateDoc(docRef, data);
}

export async function getPendingExecutionStates(
  companyId: string,
  limitCount: number = 50
): Promise<WorkflowExecutionState[]> {
  if (!getDb()) return [];
  
  const now = Timestamp.now();
  
  const snapshot = await getDocs(
    query(
      executionStatesCol(companyId),
      where('status', 'in', ['active', 'waiting']),
      where('nextExecutionTime', '<=', now),
      limit(limitCount)
    )
  );
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  } as WorkflowExecutionState));
}

// Check if entity is already in a workflow
export async function isEntityInWorkflow(
  companyId: string,
  workflowId: string,
  entityId: string
): Promise<boolean> {
  if (!getDb()) return false;
  
  const snapshot = await getDocs(
    query(
      executionStatesCol(companyId),
      where('workflowId', '==', workflowId),
      where('entityId', '==', entityId),
      where('status', 'in', ['active', 'waiting']),
      limit(1)
    )
  );
  
  return !snapshot.empty;
}

// ============ RUN LOGS ============

export async function addRunLog(
  companyId: string,
  log: Omit<WorkflowRunLog, 'id' | 'executedAt'>
): Promise<void> {
  if (!getDb()) return;
  
  await addDoc(runLogsCol(companyId), {
    ...log,
    executedAt: serverTimestamp(),
  });
}

export async function getWorkflowRunLogs(
  companyId: string,
  workflowId: string,
  limitCount: number = 100
): Promise<WorkflowRunLog[]> {
  if (!getDb()) return [];
  
  const snapshot = await getDocs(
    query(
      runLogsCol(companyId),
      where('workflowId', '==', workflowId),
      orderBy('executedAt', 'desc'),
      limit(limitCount)
    )
  );
  
  return snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  } as WorkflowRunLog));
}

// ============ WORKFLOW STATS ============

export async function incrementWorkflowStats(
  companyId: string,
  workflowId: string,
  success: boolean
): Promise<void> {
  if (!getDb()) return;
  
  const workflow = await getWorkflow(companyId, workflowId);
  if (!workflow) return;
  
  const stats = workflow.stats || { totalRuns: 0, successfulRuns: 0, failedRuns: 0 };
  
  await updateWorkflow(companyId, workflowId, {
    stats: {
      totalRuns: stats.totalRuns + 1,
      successfulRuns: stats.successfulRuns + (success ? 1 : 0),
      failedRuns: stats.failedRuns + (success ? 0 : 1),
      lastRunAt: new Date().toISOString(),
    },
  });
}
