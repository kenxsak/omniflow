import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { executeWorkflowNode } from '@/lib/workflow-executor';
import type { Workflow, WorkflowExecutionState, DelayNode } from '@/types/workflows';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface ProcessingResult {
  companiesProcessed: number;
  statesProcessed: number;
  nodesExecuted: number;
  workflowsCompleted: number;
  errors: string[];
}

async function processWorkflowsForCompany(companyId: string): Promise<{
  statesProcessed: number;
  nodesExecuted: number;
  workflowsCompleted: number;
  errors: string[];
}> {
  const result = {
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [] as string[],
  };

  if (!adminDb) {
    result.errors.push('Database not initialized');
    return result;
  }

  try {
    const now = Timestamp.now();
    
    // Get pending execution states
    const statesSnapshot = await adminDb
      .collection('companies')
      .doc(companyId)
      .collection('workflowExecutionStates')
      .where('status', 'in', ['active', 'waiting'])
      .where('nextExecutionTime', '<=', now)
      .limit(50)
      .get();

    for (const stateDoc of statesSnapshot.docs) {
      const state = { id: stateDoc.id, ...stateDoc.data() } as WorkflowExecutionState;
      result.statesProcessed++;

      try {
        // Get the workflow
        const workflowDoc = await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('workflows')
          .doc(state.workflowId)
          .get();

        if (!workflowDoc.exists) {
          await stateDoc.ref.update({
            status: 'failed',
            lastError: 'Workflow not found',
          });
          continue;
        }

        const workflow = { id: workflowDoc.id, ...workflowDoc.data() } as Workflow;

        // Check if workflow is still active
        if (!workflow.isActive) {
          await stateDoc.ref.update({
            status: 'paused',
          });
          continue;
        }

        // Execute the current node
        const execResult = await executeWorkflowNode(workflow, state, companyId);
        result.nodesExecuted++;

        // Log the execution
        await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('workflowRunLogs')
          .add({
            workflowId: workflow.id,
            executionStateId: state.id,
            companyId,
            nodeId: state.currentNodeId,
            nodeName: workflow.nodes.find(n => n.id === state.currentNodeId)?.name || 'Unknown',
            nodeType: workflow.nodes.find(n => n.id === state.currentNodeId)?.type || 'unknown',
            status: execResult.success ? 'success' : 'failed',
            message: execResult.message,
            error: execResult.error,
            executedAt: FieldValue.serverTimestamp(),
          });

        if (!execResult.success) {
          await stateDoc.ref.update({
            status: 'failed',
            lastError: execResult.error,
          });
          result.errors.push(`Workflow ${workflow.id}: ${execResult.error}`);
          continue;
        }

        // Determine next step
        const currentNode = workflow.nodes.find(n => n.id === state.currentNodeId);
        
        if (!execResult.nextNodeId) {
          // Workflow complete
          await stateDoc.ref.update({
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
            nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
          });
          result.workflowsCompleted++;
          
          // Update workflow stats
          await workflowDoc.ref.update({
            'stats.totalRuns': FieldValue.increment(1),
            'stats.successfulRuns': FieldValue.increment(1),
            'stats.lastRunAt': new Date().toISOString(),
          });
          
          continue;
        }

        // Calculate next execution time
        let nextExecutionTime = Timestamp.now();
        const nextNode = workflow.nodes.find(n => n.id === execResult.nextNodeId);
        
        if (nextNode?.type === 'delay') {
          const delayNode = nextNode as DelayNode;
          const delayMs = 
            ((delayNode.config.delayMinutes || 0) * 60 * 1000) +
            ((delayNode.config.delayHours || 0) * 60 * 60 * 1000) +
            ((delayNode.config.delayDays || 0) * 24 * 60 * 60 * 1000);
          
          nextExecutionTime = Timestamp.fromMillis(Date.now() + delayMs);
        } else {
          // Small delay to prevent tight loops
          nextExecutionTime = Timestamp.fromMillis(Date.now() + 1000);
        }

        // Update state to next node
        await stateDoc.ref.update({
          currentNodeId: execResult.nextNodeId,
          status: nextNode?.type === 'delay' ? 'waiting' : 'active',
          nextExecutionTime,
          nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
        });

      } catch (stateError: any) {
        result.errors.push(`State ${state.id}: ${stateError.message}`);
        
        await stateDoc.ref.update({
          status: 'failed',
          lastError: stateError.message,
        });
      }
    }
  } catch (error: any) {
    result.errors.push(`Company ${companyId}: ${error.message}`);
  }

  return result;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  const result: ProcessingResult = {
    companiesProcessed: 0,
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [],
  };

  try {
    // Get all companies
    const companiesSnapshot = await adminDb.collection('companies').get();

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      result.companiesProcessed++;

      try {
        const companyResult = await processWorkflowsForCompany(companyId);
        result.statesProcessed += companyResult.statesProcessed;
        result.nodesExecuted += companyResult.nodesExecuted;
        result.workflowsCompleted += companyResult.workflowsCompleted;
        result.errors.push(...companyResult.errors);
      } catch (error: any) {
        result.errors.push(`Company ${companyId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      summary: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Workflow cron job error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
