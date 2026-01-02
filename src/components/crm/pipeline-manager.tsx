"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';

export interface Pipeline {
  id: string;
  name: string;
  icon: string;
  color: string;
  stages: PipelineStage[];
  isDefault?: boolean;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  probability: number; // Win probability %
  order: number;
}

// Default sales pipeline
const DEFAULT_PIPELINE: Pipeline = {
  id: 'default-sales',
  name: 'Sales Pipeline',
  icon: 'solar:chart-2-bold',
  color: '#3b82f6',
  isDefault: true,
  stages: [
    { id: 'new', name: 'New', color: '#3b82f6', probability: 10, order: 0 },
    { id: 'contacted', name: 'Contacted', color: '#f59e0b', probability: 25, order: 1 },
    { id: 'qualified', name: 'Qualified', color: '#10b981', probability: 50, order: 2 },
    { id: 'proposal', name: 'Proposal', color: '#8b5cf6', probability: 75, order: 3 },
    { id: 'won', name: 'Won', color: '#059669', probability: 100, order: 4 },
    { id: 'lost', name: 'Lost', color: '#ef4444', probability: 0, order: 5 },
  ],
  createdAt: new Date().toISOString(),
};

// Pre-built pipeline templates
const PIPELINE_TEMPLATES: Omit<Pipeline, 'id' | 'createdAt'>[] = [
  {
    name: 'Support Tickets',
    icon: 'solar:headphones-round-bold',
    color: '#06b6d4',
    stages: [
      { id: 'open', name: 'Open', color: '#3b82f6', probability: 0, order: 0 },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b', probability: 0, order: 1 },
      { id: 'waiting', name: 'Waiting on Customer', color: '#8b5cf6', probability: 0, order: 2 },
      { id: 'resolved', name: 'Resolved', color: '#10b981', probability: 100, order: 3 },
      { id: 'closed', name: 'Closed', color: '#6b7280', probability: 100, order: 4 },
    ],
  },
  {
    name: 'Recruitment',
    icon: 'solar:users-group-rounded-bold',
    color: '#8b5cf6',
    stages: [
      { id: 'applied', name: 'Applied', color: '#3b82f6', probability: 10, order: 0 },
      { id: 'screening', name: 'Screening', color: '#f59e0b', probability: 25, order: 1 },
      { id: 'interview', name: 'Interview', color: '#8b5cf6', probability: 50, order: 2 },
      { id: 'offer', name: 'Offer', color: '#10b981', probability: 80, order: 3 },
      { id: 'hired', name: 'Hired', color: '#059669', probability: 100, order: 4 },
      { id: 'rejected', name: 'Rejected', color: '#ef4444', probability: 0, order: 5 },
    ],
  },
  {
    name: 'Project Pipeline',
    icon: 'solar:folder-bold',
    color: '#f59e0b',
    stages: [
      { id: 'planning', name: 'Planning', color: '#3b82f6', probability: 20, order: 0 },
      { id: 'in-progress', name: 'In Progress', color: '#f59e0b', probability: 50, order: 1 },
      { id: 'review', name: 'Review', color: '#8b5cf6', probability: 80, order: 2 },
      { id: 'completed', name: 'Completed', color: '#10b981', probability: 100, order: 3 },
      { id: 'on-hold', name: 'On Hold', color: '#6b7280', probability: 0, order: 4 },
    ],
  },
];

interface PipelineManagerProps {
  companyId: string;
  currentPipelineId?: string;
  onPipelineChange?: (pipeline: Pipeline) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PipelineManager({ companyId, currentPipelineId, onPipelineChange, open, onOpenChange }: PipelineManagerProps) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([DEFAULT_PIPELINE]);
  const [activePipeline, setActivePipeline] = useState<Pipeline>(DEFAULT_PIPELINE);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  // Use controlled state if provided, otherwise use internal state
  const isManageDialogOpen = open ?? false;
  const setManageDialogOpen = onOpenChange ?? (() => {});

  // Load pipelines from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`crm-pipelines-${companyId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPipelines([DEFAULT_PIPELINE, ...parsed]);
      } catch (e) {
        console.error('Error loading pipelines:', e);
      }
    }
  }, [companyId]);

  // Set active pipeline
  useEffect(() => {
    if (currentPipelineId) {
      const found = pipelines.find(p => p.id === currentPipelineId);
      if (found) setActivePipeline(found);
    }
  }, [currentPipelineId, pipelines]);

  const savePipelines = (newPipelines: Pipeline[]) => {
    const customPipelines = newPipelines.filter(p => !p.isDefault);
    localStorage.setItem(`crm-pipelines-${companyId}`, JSON.stringify(customPipelines));
    setPipelines([DEFAULT_PIPELINE, ...customPipelines]);
  };

  const handleCreatePipeline = () => {
    if (!newPipelineName.trim()) {
      toast({ title: 'Enter pipeline name', variant: 'destructive' });
      return;
    }

    let newPipeline: Pipeline;

    if (selectedTemplate) {
      const template = PIPELINE_TEMPLATES.find(t => t.name === selectedTemplate);
      if (template) {
        newPipeline = {
          ...template,
          id: `pipeline-${Date.now()}`,
          name: newPipelineName,
          createdAt: new Date().toISOString(),
        };
      } else {
        return;
      }
    } else {
      newPipeline = {
        id: `pipeline-${Date.now()}`,
        name: newPipelineName,
        icon: 'solar:widget-5-bold',
        color: '#6366f1',
        stages: [
          { id: 'stage-1', name: 'Stage 1', color: '#3b82f6', probability: 25, order: 0 },
          { id: 'stage-2', name: 'Stage 2', color: '#f59e0b', probability: 50, order: 1 },
          { id: 'stage-3', name: 'Stage 3', color: '#10b981', probability: 75, order: 2 },
          { id: 'done', name: 'Done', color: '#059669', probability: 100, order: 3 },
        ],
        createdAt: new Date().toISOString(),
      };
    }

    savePipelines([...pipelines.filter(p => !p.isDefault), newPipeline]);
    setShowCreateDialog(false);
    setNewPipelineName('');
    setSelectedTemplate(null);
    toast({ title: `Pipeline "${newPipelineName}" created!` });
  };

  const handleSelectPipeline = (pipeline: Pipeline) => {
    setActivePipeline(pipeline);
    onPipelineChange?.(pipeline);
    
    // Show coming soon message for non-default pipelines
    if (!pipeline.isDefault) {
      toast({
        title: 'Pipeline Selected',
        description: 'Custom pipeline filtering coming soon! Currently showing all leads.',
      });
    }
  };

  const handleDeletePipeline = (pipelineId: string) => {
    if (pipelines.find(p => p.id === pipelineId)?.isDefault) {
      toast({ title: 'Cannot delete default pipeline', variant: 'destructive' });
      return;
    }
    savePipelines(pipelines.filter(p => p.id !== pipelineId && !p.isDefault));
    if (activePipeline.id === pipelineId) {
      setActivePipeline(DEFAULT_PIPELINE);
      onPipelineChange?.(DEFAULT_PIPELINE);
    }
    toast({ title: 'Pipeline deleted' });
  };

  return (
    <>
      {/* Inline Pipeline Selector Dropdown */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Icon icon={activePipeline.icon} className="w-3.5 h-3.5" style={{ color: activePipeline.color }} />
              <span className="hidden sm:inline">{activePipeline.name}</span>
              <Icon icon="solar:alt-arrow-down-linear" className="w-3 h-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Pipelines
              </p>
            </div>
            {pipelines.map((pipeline) => (
              <DropdownMenuItem
                key={pipeline.id}
                onClick={() => handleSelectPipeline(pipeline)}
                className="gap-2 group"
              >
                <Icon icon={pipeline.icon} className="w-4 h-4" style={{ color: pipeline.color }} />
                <span className="flex-1">{pipeline.name}</span>
                {pipeline.isDefault ? (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">Default</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] h-4 px-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">Soon</Badge>
                )}
                {activePipeline.id === pipeline.id && (
                  <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-500" />
                )}
                {!pipeline.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePipeline(pipeline.id);
                    }}
                  >
                    <Icon icon="solar:trash-bin-2-linear" className="w-3 h-3 text-destructive" />
                  </Button>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Icon icon="solar:add-circle-linear" className="w-4 h-4 text-primary" />
              <span>Create Pipeline</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Manage Pipelines Dialog - Opens from external button */}
      <Dialog open={isManageDialogOpen} onOpenChange={setManageDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[480px] sm:max-w-[540px] p-4 sm:p-6 rounded-xl">
          <DialogHeader className="space-y-1 pb-3">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="solar:settings-bold" className="w-5 h-5 text-primary" />
              Manage Pipelines
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create, edit, and manage your sales pipelines
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Multiple Pipelines Coming Soon</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                    Create pipeline templates now. Lead filtering by pipeline will be available in the next update.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Pipelines */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Your Pipelines</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pipelines.map((pipeline) => (
                  <div
                    key={pipeline.id}
                    className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                      activePipeline.id === pipeline.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${pipeline.color}20` }}
                    >
                      <Icon icon={pipeline.icon} className="w-4 h-4" style={{ color: pipeline.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{pipeline.name}</span>
                        {pipeline.isDefault && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Default</Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {pipeline.stages.length} stages
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {activePipeline.id === pipeline.id ? (
                        <Badge variant="default" className="text-[9px] h-5 px-2">Active</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleSelectPipeline(pipeline)}
                        >
                          Use
                        </Button>
                      )}
                      {!pipeline.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePipeline(pipeline.id)}
                        >
                          <Icon icon="solar:trash-bin-2-linear" className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create New Button */}
            <Button
              variant="outline"
              className="w-full h-10 text-sm gap-2"
              onClick={() => {
                setManageDialogOpen(false);
                setShowCreateDialog(true);
              }}
            >
              <Icon icon="solar:add-circle-linear" className="w-4 h-4" />
              Create New Pipeline
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Pipeline Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] p-4 sm:p-5 rounded-xl">
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <Icon icon="solar:widget-add-bold" className="w-5 h-5 text-primary" />
              Create Pipeline
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Create a new pipeline for different workflows
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Pipeline Name</Label>
              <Input
                value={newPipelineName}
                onChange={(e) => setNewPipelineName(e.target.value)}
                placeholder="e.g., Support Tickets, Recruitment..."
                className="h-9 sm:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Start from Template (optional)</Label>
              <div className="grid grid-cols-1 gap-2">
                {PIPELINE_TEMPLATES.map((template) => (
                  <button
                    key={template.name}
                    onClick={() => setSelectedTemplate(selectedTemplate === template.name ? null : template.name)}
                    className={`p-3 border rounded-lg text-left hover:bg-accent transition-colors ${
                      selectedTemplate === template.name ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon icon={template.icon} className="w-4 h-4" style={{ color: template.color }} />
                      <span className="text-sm font-medium">{template.name}</span>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-auto">
                        {template.stages.length} stages
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => { setShowCreateDialog(false); setNewPipelineName(''); setSelectedTemplate(null); }}
                className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePipeline}
                className="w-full sm:flex-1 h-9 sm:h-10 text-xs sm:text-sm"
              >
                Create Pipeline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Hook to get pipelines
export function usePipelines(companyId: string) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([DEFAULT_PIPELINE]);

  useEffect(() => {
    const stored = localStorage.getItem(`crm-pipelines-${companyId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPipelines([DEFAULT_PIPELINE, ...parsed]);
      } catch (e) {
        console.error('Error loading pipelines:', e);
      }
    }
  }, [companyId]);

  return pipelines;
}

export { DEFAULT_PIPELINE };
