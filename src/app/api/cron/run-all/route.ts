import { NextRequest, NextResponse } from 'next/server';
import { runAllAutomations } from '@/lib/automation-runner';
import { runAllCampaignJobs } from '@/lib/campaign-job-processor';
import { processScheduledPostsAction } from '@/app/actions/social-accounts-actions';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { executeWorkflowNode } from '@/lib/workflow-executor';
import type { Workflow, WorkflowExecutionState, DelayNode } from '@/types/workflows';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * UNIFIED CRON ENDPOINT
 * 
 * Runs ALL automation tasks in a single API call:
 * 1. Email Automations (drip sequences)
 * 2. Campaign Jobs (bulk Email/SMS/WhatsApp)
 * 3. Workflow Builder automations
 * 4. Scheduled Social Media Posts
 * 
 * This reduces the need for multiple cron jobs to just ONE.
 * Set up a single cron job to call this endpoint every 2-5 minutes.
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    success: true,
    timestamp: new Date().toISOString(),
    duration: 0,
    automations: { success: false, error: null as string | null, details: null as any },
    campaigns: { success: false, error: null as string | null, details: null as any },
    workflows: { success: false, error: null as string | null, details: null as any },
    socialPosts: { success: false, error: null as string | null, details: null as any },
  };

  // 1. Run Email Automations
  try {
    const automationResult = await runAllAutomations();
    results.automations = {
      success: automationResult.success,
      error: null,
      details: automationResult,
    };
  } catch (error: any) {
    console.error('[Cron] Email automations error:', error);
    results.automations = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 2. Run Campaign Jobs (Bulk Email/SMS/WhatsApp)
  try {
    const campaignResult = await runAllCampaignJobs();
    results.campaigns = {
      success: campaignResult.success,
      error: null,
      details: campaignResult,
    };
  } catch (error: any) {
    console.error('[Cron] Campaign jobs error:', error);
    results.campaigns = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 3. Run Workflow Builder Automations
  try {
    const workflowResult = await processAllWorkflows();
    results.workflows = {
      success: true,
      error: null,
      details: workflowResult,
    };
  } catch (error: any) {
    console.error('[Cron] Workflow processing error:', error);
    results.workflows = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  // 4. Process Scheduled Social Media Posts
  try {
    const socialResult = await processScheduledPostsAction();
    results.socialPosts = {
      success: socialResult.success,
      error: socialResult.error || null,
      details: socialResult.data,
    };
  } catch (error: any) {
    console.error('[Cron] Social posts processing error:', error);
    results.socialPosts = {
      success: false,
      error: error.message,
      details: null,
    };
  }

  results.duration = Date.now() - startTime;
  results.success = results.automations.success || results.campaigns.success || results.workflows.success || results.socialPosts.success;

  console.log(`[Cron] Unified job completed in ${results.duration}ms`);

  return NextResponse.json(results);
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request);
}

/**
 * Process all workflow automations across all companies
 */
async function processAllWorkflows() {
  if (!adminDb) {
    return { error: 'Database not initialized', companiesProcessed: 0 };
  }

  const result = {
    companiesProcessed: 0,
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [] as string[],
  };

  try {
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
  } catch (error: any) {
    result.errors.push(`Global error: ${error.message}`);
  }

  return result;
}

async function processWorkflowsForCompany(companyId: string) {
  const result = {
    statesProcessed: 0,
    nodesExecuted: 0,
    workflowsCompleted: 0,
    errors: [] as string[],
  };

  if (!adminDb) return result;

  try {
    const now = Timestamp.now();
    
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
        const workflowDoc = await adminDb
          .collection('companies')
          .doc(companyId)
          .collection('workflows')
          .doc(state.workflowId)
          .get();

        if (!workflowDoc.exists) {
          await stateDoc.ref.update({ status: 'failed', lastError: 'Workflow not found' });
          continue;
        }

        const workflow = { id: workflowDoc.id, ...workflowDoc.data() } as Workflow;

        if (!workflow.isActive) {
          await stateDoc.ref.update({ status: 'paused' });
          continue;
        }

        const execResult = await executeWorkflowNode(workflow, state, companyId);
        result.nodesExecuted++;

        // Log execution
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
          await stateDoc.ref.update({ status: 'failed', lastError: execResult.error });
          result.errors.push(`Workflow ${workflow.id}: ${execResult.error}`);
          continue;
        }

        if (!execResult.nextNodeId) {
          // Workflow complete
          await stateDoc.ref.update({
            status: 'completed',
            completedAt: FieldValue.serverTimestamp(),
            nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
          });
          result.workflowsCompleted++;
          
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
          nextExecutionTime = Timestamp.fromMillis(Date.now() + 1000);
        }

        await stateDoc.ref.update({
          currentNodeId: execResult.nextNodeId,
          status: nextNode?.type === 'delay' ? 'waiting' : 'active',
          nextExecutionTime,
          nodesExecuted: FieldValue.arrayUnion(state.currentNodeId),
        });

      } catch (stateError: any) {
        result.errors.push(`State ${state.id}: ${stateError.message}`);
        await stateDoc.ref.update({ status: 'failed', lastError: stateError.message });
      }
    }
  } catch (error: any) {
    result.errors.push(`Company ${companyId}: ${error.message}`);
  }

  return result;
}
