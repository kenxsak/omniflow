'use client';

import { useState, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { 
  getWorkflowsAction, createWorkflowAction, updateWorkflowAction, 
  deleteWorkflowAction, toggleWorkflowActiveAction, getWorkflowStatsAction 
} from '@/app/actions/workflow-actions';
import type { Workflow, WorkflowNode, WorkflowConnection, TriggerEvent, ActionType } from '@/types/workflows';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// Node templates with proper types
const triggerTemplates = [
  { type: 'trigger' as const, name: 'New Contact Added', icon: 'solar:user-plus-linear', event: 'contact.created' as TriggerEvent },
  { type: 'trigger' as const, name: 'Form Submitted', icon: 'solar:document-add-linear', event: 'form.submitted' as TriggerEvent },
  { type: 'trigger' as const, name: 'Tag Added', icon: 'solar:tag-linear', event: 'contact.tag_added' as TriggerEvent },
  { type: 'trigger' as const, name: 'Deal Stage Changed', icon: 'solar:widget-5-linear', event: 'deal.stage_changed' as TriggerEvent },
  { type: 'trigger' as const, name: 'Deal Won', icon: 'solar:cup-star-linear', event: 'deal.won' as TriggerEvent },
  { type: 'trigger' as const, name: 'Appointment Scheduled', icon: 'solar:calendar-linear', event: 'appointment.scheduled' as TriggerEvent },
  { type: 'trigger' as const, name: 'Manual Trigger', icon: 'solar:play-linear', event: 'manual' as TriggerEvent },
];

const actionTemplates = [
  { type: 'action' as const, name: 'Send Email', icon: 'solar:letter-linear', action: 'send_email' as ActionType },
  { type: 'action' as const, name: 'Send SMS', icon: 'solar:chat-square-linear', action: 'send_sms' as ActionType },
  { type: 'action' as const, name: 'Send WhatsApp', icon: 'solar:chat-round-dots-linear', action: 'send_whatsapp' as ActionType },
  { type: 'action' as const, name: 'Add Tag', icon: 'solar:tag-linear', action: 'add_tag' as ActionType },
  { type: 'action' as const, name: 'Remove Tag', icon: 'solar:tag-cross-linear', action: 'remove_tag' as ActionType },
  { type: 'action' as const, name: 'Create Task', icon: 'solar:checklist-linear', action: 'create_task' as ActionType },
  { type: 'action' as const, name: 'Notify Team', icon: 'solar:bell-linear', action: 'notify_team' as ActionType },
  { type: 'action' as const, name: 'Webhook', icon: 'solar:programming-linear', action: 'webhook' as ActionType },
];

const conditionTemplates = [
  { type: 'condition' as const, name: 'Has Tag', icon: 'solar:tag-linear', condition: 'has_tag' },
  { type: 'condition' as const, name: 'Missing Tag', icon: 'solar:tag-cross-linear', condition: 'missing_tag' },
  { type: 'condition' as const, name: 'Field Equals', icon: 'solar:text-field-linear', condition: 'field_equals' },
  { type: 'condition' as const, name: 'Contact Source', icon: 'solar:user-id-linear', condition: 'contact_source_is' },
];

const delayTemplates = [
  { type: 'delay' as const, name: 'Wait Minutes', icon: 'solar:clock-circle-linear', delayMinutes: 30 },
  { type: 'delay' as const, name: 'Wait Hours', icon: 'solar:clock-circle-linear', delayHours: 1 },
  { type: 'delay' as const, name: 'Wait Days', icon: 'solar:calendar-linear', delayDays: 1 },
];

const nodeColors: Record<string, string> = {
  trigger: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
  action: 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400',
  condition: 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400',
  delay: 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400',
};


export default function WorkflowBuilderPage() {
  const { toast } = useToast();
  const { appUser, company } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [isNodePanelOpen, setIsNodePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [workflowStats, setWorkflowStats] = useState<Record<string, any>>({});

  // Load workflows on mount
  useEffect(() => {
    if (company?.id) {
      loadWorkflows();
    }
  }, [company?.id]);

  const loadWorkflows = async () => {
    if (!company?.id) return;
    setIsLoading(true);
    try {
      const data = await getWorkflowsAction(company.id);
      setWorkflows(data);
      
      // Load stats for each workflow
      const stats: Record<string, any> = {};
      for (const wf of data) {
        stats[wf.id] = await getWorkflowStatsAction(company.id, wf.id);
      }
      setWorkflowStats(stats);
    } catch (error) {
      console.error('Error loading workflows:', error);
      toast({ title: 'Error', description: 'Failed to load workflows', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const createNewWorkflow = async () => {
    if (!company?.id || !appUser?.uid) return;
    
    const newWorkflow: Omit<Workflow, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'stats'> = {
      name: 'New Workflow',
      description: '',
      nodes: [],
      connections: [],
      isActive: false,
    };
    
    setIsSaving(true);
    const result = await createWorkflowAction(company.id, appUser.uid, newWorkflow);
    setIsSaving(false);
    
    if (result.success && result.workflowId) {
      const created: Workflow = {
        ...newWorkflow,
        id: result.workflowId,
        companyId: company.id,
        createdBy: appUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: { totalRuns: 0, successfulRuns: 0, failedRuns: 0 },
      };
      setWorkflows(prev => [created, ...prev]);
      setActiveWorkflow(created);
      toast({ title: 'Workflow Created', description: 'Start by adding a trigger node' });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to create workflow', variant: 'destructive' });
    }
  };


  const addNode = useCallback((template: any) => {
    if (!activeWorkflow) return;
    
    const nodeId = `node_${Date.now()}`;
    let newNode: WorkflowNode;
    
    if (template.type === 'trigger') {
      newNode = {
        id: nodeId,
        type: 'trigger',
        name: template.name,
        position: { x: 100, y: 100 + (activeWorkflow.nodes.length * 100) },
        config: { event: template.event },
      };
    } else if (template.type === 'action') {
      newNode = {
        id: nodeId,
        type: 'action',
        name: template.name,
        position: { x: 100, y: 100 + (activeWorkflow.nodes.length * 100) },
        config: { action: template.action },
      };
    } else if (template.type === 'condition') {
      newNode = {
        id: nodeId,
        type: 'condition',
        name: template.name,
        position: { x: 100, y: 100 + (activeWorkflow.nodes.length * 100) },
        config: { condition: template.condition },
      };
    } else {
      newNode = {
        id: nodeId,
        type: 'delay',
        name: template.name,
        position: { x: 100, y: 100 + (activeWorkflow.nodes.length * 100) },
        config: {
          delayMinutes: template.delayMinutes,
          delayHours: template.delayHours,
          delayDays: template.delayDays,
        },
      };
    }

    const updatedNodes = [...activeWorkflow.nodes, newNode];
    let updatedConnections = [...activeWorkflow.connections];

    // Auto-connect to previous node
    if (activeWorkflow.nodes.length > 0 && template.type !== 'trigger') {
      const lastNode = activeWorkflow.nodes[activeWorkflow.nodes.length - 1];
      updatedConnections.push({
        id: `conn_${Date.now()}`,
        from: lastNode.id,
        to: newNode.id,
      });
    }

    const updatedWorkflow = {
      ...activeWorkflow,
      nodes: updatedNodes,
      connections: updatedConnections,
    };

    setActiveWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    setSelectedNode(newNode);
    setIsNodePanelOpen(true);
  }, [activeWorkflow]);

  const deleteNode = (nodeId: string) => {
    if (!activeWorkflow) return;
    
    const updatedWorkflow = {
      ...activeWorkflow,
      nodes: activeWorkflow.nodes.filter(n => n.id !== nodeId),
      connections: activeWorkflow.connections.filter(c => c.from !== nodeId && c.to !== nodeId),
    };
    
    setActiveWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    setSelectedNode(null);
    setIsNodePanelOpen(false);
  };


  const saveWorkflow = async () => {
    if (!activeWorkflow || !company?.id) return;
    
    setIsSaving(true);
    const result = await updateWorkflowAction(company.id, activeWorkflow.id, {
      name: activeWorkflow.name,
      description: activeWorkflow.description,
      nodes: activeWorkflow.nodes,
      connections: activeWorkflow.connections,
      isActive: activeWorkflow.isActive,
    });
    setIsSaving(false);
    
    if (result.success) {
      toast({ title: 'Workflow Saved', description: `"${activeWorkflow.name}" has been saved` });
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save workflow', variant: 'destructive' });
    }
  };

  const toggleWorkflowActive = async () => {
    if (!activeWorkflow || !company?.id) return;
    
    // Validate workflow has at least a trigger and one action
    const hasTrigger = activeWorkflow.nodes.some(n => n.type === 'trigger');
    const hasAction = activeWorkflow.nodes.some(n => n.type === 'action');
    
    if (!activeWorkflow.isActive && (!hasTrigger || !hasAction)) {
      toast({ 
        title: 'Cannot Activate', 
        description: 'Workflow needs at least one trigger and one action', 
        variant: 'destructive' 
      });
      return;
    }
    
    const newStatus = !activeWorkflow.isActive;
    
    setIsSaving(true);
    const result = await toggleWorkflowActiveAction(company.id, activeWorkflow.id, newStatus);
    setIsSaving(false);
    
    if (result.success) {
      const updated = { ...activeWorkflow, isActive: newStatus };
      setActiveWorkflow(updated);
      setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
      toast({ 
        title: newStatus ? 'Workflow Activated' : 'Workflow Paused',
        description: newStatus ? 'Automation is now running' : 'Automation has been paused'
      });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!company?.id) return;
    
    const result = await deleteWorkflowAction(company.id, workflowId);
    
    if (result.success) {
      setWorkflows(prev => prev.filter(w => w.id !== workflowId));
      if (activeWorkflow?.id === workflowId) {
        setActiveWorkflow(null);
      }
      toast({ title: 'Workflow Deleted' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    if (!activeWorkflow) return;
    
    const updatedNodes = activeWorkflow.nodes.map(n => 
      n.id === nodeId ? { ...n, config: { ...n.config, ...config } } : n
    );
    
    const updatedWorkflow = { ...activeWorkflow, nodes: updatedNodes };
    setActiveWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    
    if (selectedNode?.id === nodeId) {
      setSelectedNode({ ...selectedNode, config: { ...selectedNode.config, ...config } } as WorkflowNode);
    }
  };


  // Render workflow list
  const renderWorkflowList = () => (
    <div className="flex-1 border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 p-6">
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : workflows.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
            <Icon icon="solar:branching-paths-up-linear" className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No Workflows Yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Create automated workflows to send emails, SMS, or WhatsApp messages when contacts take actions.
          </p>
          <Button onClick={createNewWorkflow} size="sm" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" />
            Create Your First Workflow
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map(workflow => {
            const stats = workflowStats[workflow.id] || {};
            return (
              <button
                key={workflow.id}
                onClick={() => setActiveWorkflow(workflow)}
                className="p-4 border border-stone-200 dark:border-stone-800 rounded-xl text-left hover:border-stone-300 dark:hover:border-stone-700 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                    <Icon icon="solar:branching-paths-up-linear" className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Badge variant={workflow.isActive ? "default" : "secondary"} className="text-[10px]">
                    {workflow.isActive ? 'Active' : 'Draft'}
                  </Badge>
                </div>
                <h3 className="font-medium text-sm mb-1">{workflow.name}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {workflow.nodes.length} nodes • {workflow.connections.length} connections
                </p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>{stats.totalRuns || 0} runs</span>
                  {stats.activeExecutions > 0 && (
                    <span className="text-emerald-600">• {stats.activeExecutions} active</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );


  // Render node palette
  const renderNodePalette = () => (
    <div className="lg:w-64 border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Nodes</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setActiveWorkflow(null)}>
          <Icon icon="solar:arrow-left-linear" className="h-3.5 w-3.5 mr-1" />
          Back
        </Button>
      </div>
      
      {/* Triggers */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Triggers</p>
        <div className="space-y-1.5">
          {triggerTemplates.map((template, i) => (
            <button
              key={i}
              onClick={() => addNode(template)}
              disabled={activeWorkflow?.nodes.some(n => n.type === 'trigger')}
              className="w-full flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", nodeColors.trigger)}>
                <Icon icon={template.icon} className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
        <div className="space-y-1.5">
          {actionTemplates.map((template, i) => (
            <button
              key={i}
              onClick={() => addNode(template)}
              className="w-full flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-left"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", nodeColors.action)}>
                <Icon icon={template.icon} className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Conditions</p>
        <div className="space-y-1.5">
          {conditionTemplates.map((template, i) => (
            <button
              key={i}
              onClick={() => addNode(template)}
              className="w-full flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-left"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", nodeColors.condition)}>
                <Icon icon={template.icon} className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Delays */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Timing</p>
        <div className="space-y-1.5">
          {delayTemplates.map((template, i) => (
            <button
              key={i}
              onClick={() => addNode(template)}
              className="w-full flex items-center gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors text-left"
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", nodeColors.delay)}>
                <Icon icon={template.icon} className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-medium">{template.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );


  // Render workflow canvas
  const renderWorkflowCanvas = () => (
    <div className="flex-1 border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-900/50 relative overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
        <Input
          value={activeWorkflow?.name || ''}
          onChange={(e) => {
            if (activeWorkflow) {
              const updated = { ...activeWorkflow, name: e.target.value };
              setActiveWorkflow(updated);
              setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
            }
          }}
          className="w-48 h-8 text-sm bg-white dark:bg-stone-950"
        />
        <div className="flex gap-2">
          <Button
            variant={activeWorkflow?.isActive ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={toggleWorkflowActive}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            <Icon icon={activeWorkflow?.isActive ? "solar:pause-linear" : "solar:play-linear"} className="h-3.5 w-3.5 mr-1" />
            {activeWorkflow?.isActive ? 'Pause' : 'Activate'}
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={saveWorkflow} disabled={isSaving}>
            {isSaving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            <Icon icon="solar:diskette-linear" className="h-3.5 w-3.5 mr-1" />
            Save
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive">
                <Icon icon="solar:trash-bin-trash-linear" className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Workflow?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{activeWorkflow?.name}" and cancel all active executions.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => activeWorkflow && handleDeleteWorkflow(activeWorkflow.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Nodes */}
      <div className="absolute inset-0 pt-14 p-4 overflow-auto">
        {activeWorkflow?.nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <Icon icon="solar:add-circle-linear" className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Click a node from the left panel to add it</p>
            <p className="text-xs text-muted-foreground mt-1">Start with a Trigger node</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeWorkflow?.nodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-3">
                {index > 0 && (
                  <div className="w-8 flex justify-center">
                    <Icon icon="solar:arrow-down-linear" className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => { setSelectedNode(node); setIsNodePanelOpen(true); }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 bg-white dark:bg-stone-950 transition-all hover:shadow-md min-w-[200px]",
                    nodeColors[node.type],
                    selectedNode?.id === node.id && "ring-2 ring-primary"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", nodeColors[node.type])}>
                    <Icon icon={getNodeIcon(node)} className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{node.type}</p>
                    <p className="text-sm font-medium">{node.name}</p>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const getNodeIcon = (node: WorkflowNode): string => {
    if (node.type === 'trigger') {
      return triggerTemplates.find(t => t.event === (node as any).config?.event)?.icon || 'solar:play-linear';
    }
    if (node.type === 'action') {
      return actionTemplates.find(t => t.action === (node as any).config?.action)?.icon || 'solar:bolt-linear';
    }
    if (node.type === 'condition') {
      return conditionTemplates.find(t => t.condition === (node as any).config?.condition)?.icon || 'solar:branching-paths-up-linear';
    }
    return 'solar:clock-circle-linear';
  };


  // Render node config panel
  const renderNodeConfigPanel = () => (
    <Sheet open={isNodePanelOpen} onOpenChange={setIsNodePanelOpen}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {selectedNode && (
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", nodeColors[selectedNode.type])}>
                <Icon icon={getNodeIcon(selectedNode)} className="h-4 w-4" />
              </div>
            )}
            {selectedNode?.name}
          </SheetTitle>
        </SheetHeader>
        
        {selectedNode && (
          <div className="mt-6 space-y-4">
            <div>
              <Label className="text-xs">Node Name</Label>
              <Input
                value={selectedNode.name}
                onChange={(e) => {
                  const updated = { ...selectedNode, name: e.target.value };
                  setSelectedNode(updated);
                  if (activeWorkflow) {
                    const updatedWorkflow = {
                      ...activeWorkflow,
                      nodes: activeWorkflow.nodes.map(n => n.id === updated.id ? updated : n),
                    };
                    setActiveWorkflow(updatedWorkflow);
                    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
                  }
                }}
                className="mt-1.5"
              />
            </div>

            {/* Action-specific config */}
            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'send_email' && (
              <>
                <div>
                  <Label className="text-xs">Email Subject</Label>
                  <Input 
                    placeholder="Welcome {{first_name}}!" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.emailSubject || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { emailSubject: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Email Content (HTML)</Label>
                  <Textarea 
                    placeholder="<p>Hi {{first_name}},</p><p>Welcome to our platform!</p>" 
                    className="mt-1.5 min-h-[150px] font-mono text-xs"
                    value={(selectedNode as any).config?.emailContent || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { emailContent: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variables: {'{{first_name}}'}, {'{{last_name}}'}, {'{{email}}'}, {'{{company}}'}
                  </p>
                </div>
              </>
            )}

            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'send_sms' && (
              <>
                <div>
                  <Label className="text-xs">SMS Message</Label>
                  <Textarea 
                    placeholder="Hi {{first_name}}, thanks for signing up!" 
                    className="mt-1.5"
                    maxLength={160}
                    value={(selectedNode as any).config?.smsMessage || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { smsMessage: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {((selectedNode as any).config?.smsMessage || '').length}/160 characters
                  </p>
                </div>
                <div>
                  <Label className="text-xs">DLT Template ID (Optional - for India)</Label>
                  <Input 
                    placeholder="e.g., 1107161234567890123" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.dltTemplateId || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { dltTemplateId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Required for transactional SMS in India. Get from your SMS provider.
                  </p>
                </div>
              </>
            )}

            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'send_whatsapp' && (
              <>
                <div>
                  <Label className="text-xs">WhatsApp Template Name</Label>
                  <Input 
                    placeholder="e.g., welcome_message, order_confirmation" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.whatsappTemplateName || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { whatsappTemplateName: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the exact template name from your WhatsApp provider (Authkey/AiSensy/Gupshup).
                  </p>
                </div>
                <div>
                  <Label className="text-xs">Template Parameters (Optional)</Label>
                  <Textarea 
                    placeholder="{{first_name}}&#10;{{company}}&#10;{{custom_value}}" 
                    className="mt-1.5 min-h-[80px] font-mono text-xs"
                    value={((selectedNode as any).config?.whatsappParameters || []).join('\n')}
                    onChange={(e) => {
                      const params = e.target.value.split('\n').filter(p => p.trim());
                      updateNodeConfig(selectedNode.id, { whatsappParameters: params });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    One parameter per line. Use {'{{first_name}}'}, {'{{email}}'}, etc. for personalization.
                  </p>
                </div>
              </>
            )}

            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'add_tag' && (
              <div>
                <Label className="text-xs">Tag Name</Label>
                <Input 
                  placeholder="e.g., Engaged, VIP, Newsletter" 
                  className="mt-1.5"
                  value={(selectedNode as any).config?.tagName || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { tagName: e.target.value })}
                />
              </div>
            )}

            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'create_task' && (
              <>
                <div>
                  <Label className="text-xs">Task Title</Label>
                  <Input 
                    placeholder="Follow up with {{first_name}}" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.taskTitle || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { taskTitle: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Due In (Days)</Label>
                  <Input 
                    type="number"
                    min={1}
                    placeholder="1" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.taskDueInDays || 1}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { taskDueInDays: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </>
            )}

            {selectedNode.type === 'action' && (selectedNode as any).config?.action === 'webhook' && (
              <>
                <div>
                  <Label className="text-xs">Webhook URL</Label>
                  <Input 
                    placeholder="https://your-api.com/webhook" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.webhookUrl || ''}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { webhookUrl: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Method</Label>
                  <Select 
                    value={(selectedNode as any).config?.webhookMethod || 'POST'}
                    onValueChange={(v) => updateNodeConfig(selectedNode.id, { webhookMethod: v })}
                  >
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {selectedNode.type === 'delay' && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Days</Label>
                  <Input 
                    type="number" 
                    min={0}
                    placeholder="0" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.delayDays || 0}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { delayDays: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Hours</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={23}
                    placeholder="0" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.delayHours || 0}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { delayHours: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Minutes</Label>
                  <Input 
                    type="number" 
                    min={0}
                    max={59}
                    placeholder="0" 
                    className="mt-1.5"
                    value={(selectedNode as any).config?.delayMinutes || 0}
                    onChange={(e) => updateNodeConfig(selectedNode.id, { delayMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            )}

            {selectedNode.type === 'condition' && (
              <div>
                <Label className="text-xs">Tag Name (for Has Tag / Missing Tag)</Label>
                <Input 
                  placeholder="e.g., VIP, Newsletter" 
                  className="mt-1.5"
                  value={(selectedNode as any).config?.tagId || ''}
                  onChange={(e) => updateNodeConfig(selectedNode.id, { tagId: e.target.value })}
                />
              </div>
            )}

            <div className="pt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsNodePanelOpen(false)}>
                Done
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => deleteNode(selectedNode.id)}
              >
                <Icon icon="solar:trash-bin-trash-linear" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );


  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold">Workflow Builder</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Create automated workflows with drag & drop
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={createNewWorkflow} size="sm" className="h-8 text-xs flex-1 sm:flex-none" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Icon icon="solar:add-circle-linear" className="mr-1.5 h-3.5 w-3.5" />
            New Workflow
          </Button>
        </div>
      </div>

      {!activeWorkflow ? (
        renderWorkflowList()
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-4">
          {renderNodePalette()}
          {renderWorkflowCanvas()}
        </div>
      )}

      {renderNodeConfigPanel()}
    </div>
  );
}
