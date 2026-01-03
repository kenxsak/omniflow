"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody, DialogCloseButton } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/types/task';
import type { Lead } from '@/lib/mock-data';
import type { Appointment } from '@/types/appointments';
import { addStoredTask, updateStoredTask } from '@/lib/task-data';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks } from 'date-fns';
import { logActivity } from '@/lib/activity-log';
import { generateTaskSuggestions, type GenerateTaskSuggestionsInput } from '@/ai/flows/generate-task-suggestions-flow';
import { useAuth } from '@/hooks/use-auth';
import { Icon } from '@iconify/react';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  priority: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  dueDate: z.date({ required_error: "A due date is required." }),
  leadId: z.string().optional(),
  appointmentId: z.string().optional(),
  companyId: z.string(),
});

type TaskFormData = z.infer<typeof taskSchema>;

// Initial values for pre-filling the form (e.g., from URL params)
interface InitialTaskValues {
  title?: string;
  leadId?: string;
  leadName?: string;
  dueDate?: Date;
}

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskSaved: () => void;
  taskToEdit?: Task | null;
  allLeads: Lead[];
  allAppointments?: Appointment[];
  initialValues?: InitialTaskValues | null;
}

// Follow-up options for quick selection
const FOLLOW_UP_OPTIONS = [
  { label: 'Tomorrow', days: 1 },
  { label: 'In 3 Days', days: 3 },
  { label: 'Next Week', days: 7 },
  { label: 'In 2 Weeks', days: 14 },
  { label: 'Custom', days: 0 },
];

// Task completion outcomes (like HubSpot/Pipedrive dispositions)
const TASK_OUTCOMES = [
  { value: 'completed', label: 'Completed Successfully', icon: 'solar:check-circle-bold', color: 'text-emerald-600', suggestFollowUp: false },
  { value: 'contacted', label: 'Contacted - Interested', icon: 'solar:phone-calling-bold', color: 'text-blue-600', suggestFollowUp: true, defaultDays: 3 },
  { value: 'no_answer', label: 'No Answer', icon: 'solar:phone-bold', color: 'text-amber-600', suggestFollowUp: true, defaultDays: 1 },
  { value: 'left_message', label: 'Left Voicemail/Message', icon: 'solar:chat-round-dots-bold', color: 'text-purple-600', suggestFollowUp: true, defaultDays: 2 },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled', icon: 'solar:calendar-bold', color: 'text-indigo-600', suggestFollowUp: false },
  { value: 'not_interested', label: 'Not Interested', icon: 'solar:close-circle-bold', color: 'text-red-600', suggestFollowUp: false },
  { value: 'other', label: 'Other', icon: 'solar:document-bold', color: 'text-stone-600', suggestFollowUp: false },
];

export default function AddTaskDialog({ isOpen, onOpenChange, onTaskSaved, taskToEdit, allLeads, allAppointments = [], initialValues }: AddTaskDialogProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const selectedLeadId = watch("leadId");
  const selectedStatus = watch("status");
  const [taskSuggestions, setTaskSuggestions] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Completion & Follow-up state
  const [showCompletionOptions, setShowCompletionOptions] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpOption, setFollowUpOption] = useState<string>('');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<Date | undefined>(undefined);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [originalTaskStatus, setOriginalTaskStatus] = useState<string | null>(null);

  // Watch for status change to "Done" when editing
  useEffect(() => {
    // Show completion options if status is Done and original was not Done
    if (taskToEdit && selectedStatus === 'Done' && originalTaskStatus && originalTaskStatus !== 'Done') {
      setShowCompletionOptions(true);
      // Pre-fill follow-up title based on original task
      if (!followUpTitle) {
        setFollowUpTitle(`Follow-up: ${taskToEdit.title}`);
      }
    } else if (selectedStatus !== 'Done') {
      setShowCompletionOptions(false);
    }
  }, [selectedStatus, taskToEdit, originalTaskStatus, followUpTitle]);

  // Auto-suggest follow-up based on outcome
  useEffect(() => {
    const outcome = TASK_OUTCOMES.find(o => o.value === selectedOutcome);
    if (outcome) {
      setScheduleFollowUp(outcome.suggestFollowUp);
      if (outcome.suggestFollowUp && outcome.defaultDays) {
        const defaultOption = FOLLOW_UP_OPTIONS.find(o => o.days === outcome.defaultDays);
        if (defaultOption) {
          setFollowUpOption(defaultOption.label);
        } else {
          setFollowUpOption('Tomorrow');
        }
      }
    }
  }, [selectedOutcome]);

  useEffect(() => {
    if (isOpen && appUser?.companyId) {
      // Reset completion state
      setShowCompletionOptions(false);
      setCompletionNotes('');
      setSelectedOutcome('');
      setScheduleFollowUp(false);
      setFollowUpOption('');
      setCustomFollowUpDate(undefined);
      setFollowUpTitle('');
      setOriginalTaskStatus(null);
      
      if (taskToEdit) {
        // Store the REAL original status (before any modifications like from handleMarkComplete)
        // If taskToEdit.status is 'Done' but we're editing, check if it was passed with status changed
        const taskWithOriginal = taskToEdit as Task & { _originalStatus?: string };
        const realOriginalStatus = taskWithOriginal._originalStatus || taskToEdit.status;
        setOriginalTaskStatus(realOriginalStatus);
        
        reset({
          title: taskToEdit.title,
          notes: taskToEdit.notes || '',
          priority: taskToEdit.priority,
          status: taskToEdit.status,
          dueDate: new Date(taskToEdit.dueDate),
          leadId: taskToEdit.leadId || '_NONE_',
          appointmentId: taskToEdit.appointmentId || '_NONE_',
          companyId: taskToEdit.companyId,
        });
        
        // If status is already Done (from Mark Complete), show completion options immediately
        if (taskToEdit.status === 'Done' && realOriginalStatus !== 'Done') {
          setShowCompletionOptions(true);
          setFollowUpTitle(`Follow-up: ${taskToEdit.title}`);
        }
      } else if (initialValues) {
        // Pre-fill from URL params (e.g., from Set Reminder button)
        reset({
          title: initialValues.title || '',
          notes: initialValues.leadName ? `Follow-up reminder for ${initialValues.leadName}` : '',
          priority: 'Medium',
          status: 'To Do',
          dueDate: initialValues.dueDate || new Date(),
          leadId: initialValues.leadId || '_NONE_',
          appointmentId: '_NONE_',
          companyId: appUser.companyId,
        });
      } else {
        reset({
          title: '',
          notes: '',
          priority: 'Medium',
          status: 'To Do',
          dueDate: new Date(),
          leadId: '_NONE_',
          appointmentId: '_NONE_',
          companyId: appUser.companyId,
        });
      }
      setTaskSuggestions(null);
    }
  }, [isOpen, taskToEdit, initialValues, reset, appUser]);

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    setTaskSuggestions(null);
    
    const lead = allLeads.find(l => l.id === selectedLeadId);

    const input: GenerateTaskSuggestionsInput = {
        leadStatus: lead?.status || 'New',
        leadContext: lead?.notes?.slice(-200) || 'General business task',
        numSuggestions: 3,
    };

    try {
        const result = await generateTaskSuggestions(input);
        setTaskSuggestions(result.taskSuggestions);
        toast({ title: 'AI Suggestions Ready' });
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Could not generate suggestions.";
        toast({ title: "Suggestion Error", description: errorMessage, variant: "destructive"});
    } finally {
        setIsGenerating(false);
    }
  };

  const useSuggestion = (title: string) => {
    setValue('title', title, { shouldValidate: true });
    setTaskSuggestions(null);
  };

  const onSubmit: SubmitHandler<TaskFormData> = async (data) => {
     if (!appUser?.companyId) {
        toast({ title: "Error", description: "Cannot save task without a company context.", variant: "destructive"});
        return;
    }

    // Build task payload, excluding undefined fields (Firebase doesn't accept undefined)
    const basePayload = {
        title: data.title,
        notes: data.notes || '',
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate.toISOString(),
        companyId: data.companyId,
    };
    
    // Only include leadId and appointmentId if they have actual values
    const taskPayload = {
      ...basePayload,
      ...(data.leadId && data.leadId !== '_NONE_' ? { leadId: data.leadId } : {}),
      ...(data.appointmentId && data.appointmentId !== '_NONE_' ? { appointmentId: data.appointmentId } : {}),
    };

    // If completing a task, append completion notes with timestamp and outcome
    if (taskToEdit && data.status === 'Done' && originalTaskStatus && originalTaskStatus !== 'Done') {
      const timestamp = format(new Date(), 'MMM d, yyyy h:mm a');
      const outcome = TASK_OUTCOMES.find(o => o.value === selectedOutcome);
      const outcomeLabel = outcome?.label || 'Completed';
      const existingNotes = taskPayload.notes || '';
      
      let completionLog = `--- ${outcomeLabel} on ${timestamp} ---`;
      if (completionNotes.trim()) {
        completionLog += `\n${completionNotes.trim()}`;
      }
      
      taskPayload.notes = existingNotes 
        ? `${existingNotes}\n\n${completionLog}`
        : completionLog;
    }

    if (taskToEdit) {
      await updateStoredTask({ ...taskToEdit, ...taskPayload });
      toast({ title: 'Task Updated', description: `Task "${data.title}" has been saved.` });
      logActivity({ companyId: appUser.companyId, description: `Task updated: "${data.title.substring(0,30)}..."`, type: 'task' });
      
      // If completing and scheduling follow-up, create the follow-up task
      if (data.status === 'Done' && originalTaskStatus && originalTaskStatus !== 'Done' && scheduleFollowUp && followUpTitle.trim()) {
        let followUpDate: Date;
        
        if (followUpOption === 'Custom' && customFollowUpDate) {
          followUpDate = customFollowUpDate;
        } else {
          const selectedOption = FOLLOW_UP_OPTIONS.find(o => o.label === followUpOption);
          followUpDate = addDays(new Date(), selectedOption?.days || 1);
        }
        
        const followUpPayload = {
          title: followUpTitle.trim(),
          notes: `Follow-up from completed task: "${data.title}"`,
          priority: data.priority,
          status: 'To Do' as const,
          dueDate: followUpDate.toISOString(),
          companyId: data.companyId,
          ...(data.leadId && data.leadId !== '_NONE_' ? { leadId: data.leadId } : {}),
        };
        
        await addStoredTask(followUpPayload);
        toast({ 
          title: 'Follow-up Scheduled', 
          description: `New task "${followUpTitle}" scheduled for ${format(followUpDate, 'MMM d, yyyy')}` 
        });
        logActivity({ 
          companyId: appUser.companyId, 
          description: `Follow-up task created: "${followUpTitle.substring(0,30)}..."`, 
          type: 'task' 
        });
      }
    } else {
      await addStoredTask(taskPayload);
      toast({ title: 'Task Created', description: `New task "${data.title}" has been added.` });
      logActivity({ companyId: appUser.companyId, description: `New task created: "${data.title.substring(0,30)}..."`, type: 'task' });
    }
    onTaskSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[420px] sm:max-w-lg max-h-[90vh] flex flex-col p-4 sm:p-6 rounded-xl">
        <DialogHeader className="relative">
          <DialogTitle className="text-base sm:text-lg">{taskToEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Fill in the details for your task. Click save when you're done.</DialogDescription>
          <DialogCloseButton />
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4 sm:space-y-5 flex-1 overflow-y-auto px-4 sm:px-6">
            <input type="hidden" {...control.register("companyId")} />
            
            {/* Title */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="title" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Title</Label>
                <button 
                  type="button" 
                  onClick={handleGenerateSuggestions} 
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors disabled:opacity-50"
                >
                  <Icon icon="solar:magic-stick-3-linear" className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {isGenerating ? 'Suggesting...' : 'Suggest with AI'}
                </button>
              </div>
              <Controller 
                name="title" 
                control={control} 
                render={({ field }) => (
                  <Input 
                    id="title" 
                    {...field} 
                    className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-10 sm:h-11 text-sm"
                    placeholder="Enter task title..."
                  />
                )} 
              />
              {errors.title && <p className="text-xs sm:text-sm text-destructive">{errors.title.message}</p>}
              
              {isGenerating && (
                <div className="flex items-center text-stone-500 text-xs sm:text-sm">
                  <Icon icon="solar:refresh-linear" className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" /> 
                  Generating suggestions...
                </div>
              )}
              
              {taskSuggestions && (
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] sm:text-xs text-stone-500 font-medium uppercase tracking-wide">Suggestions:</p>
                  <div className="space-y-1.5">
                    {taskSuggestions.map((suggestion, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between text-xs sm:text-sm p-2 sm:p-2.5 bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg"
                      >
                        <span className="flex-grow pr-2 text-stone-700 dark:text-stone-300 line-clamp-2">{suggestion}</span>
                        <button 
                          type="button" 
                          onClick={() => useSuggestion(suggestion)}
                          className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 rounded transition-colors flex-shrink-0"
                        >
                          Use
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Status</Label>
                <Controller name="status" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status" className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-10 sm:h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Priority</Label>
                <Controller name="priority" control={control} render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="priority" className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-10 sm:h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                )} />
              </div>
            </div>
            
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Due Date</Label>
              <Controller
                name="dueDate"
                control={control}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 sm:h-11 bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg text-sm",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        <Icon icon="solar:calendar-linear" className="mr-2 h-4 w-4" />
                        {field.value ? (
                          <span className="font-mono uppercase text-xs sm:text-sm tracking-wide">
                            {format(field.value, "MMMM do, yyyy")}
                          </span>
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.dueDate && <p className="text-xs sm:text-sm text-destructive">{errors.dueDate.message}</p>}
            </div>

            {/* Link to Lead */}
            <div className="space-y-2">
              <Label htmlFor="leadId" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Link to Lead (Optional)</Label>
              <Controller
                name="leadId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || '_NONE_'}>
                    <SelectTrigger id="leadId" className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Select a lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_NONE_">None</SelectItem>
                      {Array.isArray(allLeads) && allLeads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id}>{lead.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Link to Appointment */}
            <div className="space-y-2">
              <Label htmlFor="appointmentId" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Link to Appointment (Optional)</Label>
              <Controller
                name="appointmentId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || '_NONE_'}>
                    <SelectTrigger id="appointmentId" className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Select an appointment..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_NONE_">None</SelectItem>
                      {Array.isArray(allAppointments) && allAppointments.map(appt => (
                        <SelectItem key={appt.id} value={appt.id}>
                          {appt.title} - {format(new Date(appt.startTime), 'MMM d, yyyy')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-stone-800 dark:text-stone-200 font-medium text-xs sm:text-sm">Notes</Label>
              <Controller 
                name="notes" 
                control={control} 
                render={({ field }) => (
                  <Textarea 
                    id="notes" 
                    {...field} 
                    placeholder="Add any relevant notes here..."
                    className="bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-lg min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                  />
                )} 
              />
            </div>

            {/* Completion Options - Only show when marking task as Done */}
            {showCompletionOptions && taskToEdit && (
              <div className="space-y-4 p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:check-circle-bold" className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Completing Task</span>
                </div>
                
                {/* Outcome Selection - Like HubSpot/Pipedrive Dispositions */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    What was the outcome?
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TASK_OUTCOMES.map((outcome) => (
                      <button
                        key={outcome.value}
                        type="button"
                        onClick={() => setSelectedOutcome(outcome.value)}
                        className={cn(
                          "flex items-center gap-2 p-2 sm:p-2.5 rounded-lg text-left transition-all text-xs",
                          selectedOutcome === outcome.value
                            ? "bg-emerald-600 text-white ring-2 ring-emerald-600 ring-offset-1"
                            : "bg-white dark:bg-stone-900 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-stone-200 dark:border-stone-700"
                        )}
                      >
                        <Icon 
                          icon={outcome.icon} 
                          className={cn(
                            "h-4 w-4 flex-shrink-0",
                            selectedOutcome === outcome.value ? "text-white" : outcome.color
                          )} 
                        />
                        <span className="line-clamp-1">{outcome.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Completion Notes */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Any important details about this interaction..."
                    className="bg-white dark:bg-stone-900 border-emerald-200 dark:border-emerald-800 rounded-lg min-h-[60px] resize-none text-sm"
                  />
                </div>

                {/* Schedule Follow-up */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="scheduleFollowUp"
                      checked={scheduleFollowUp}
                      onCheckedChange={(checked) => setScheduleFollowUp(checked === true)}
                    />
                    <Label htmlFor="scheduleFollowUp" className="text-xs font-medium text-emerald-700 dark:text-emerald-300 cursor-pointer">
                      Schedule a follow-up task
                      {TASK_OUTCOMES.find(o => o.value === selectedOutcome)?.suggestFollowUp && (
                        <span className="ml-1.5 text-[10px] text-amber-600 dark:text-amber-400">(Recommended)</span>
                      )}
                    </Label>
                  </div>

                  {scheduleFollowUp && (
                    <div className="space-y-3 pl-6">
                      {/* Follow-up Title */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Follow-up Title</Label>
                        <Input
                          value={followUpTitle}
                          onChange={(e) => setFollowUpTitle(e.target.value)}
                          placeholder="Follow-up task title..."
                          className="h-9 text-sm bg-white dark:bg-stone-900"
                        />
                      </div>

                      {/* Quick Date Options */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">When?</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {FOLLOW_UP_OPTIONS.map((option) => (
                            <button
                              key={option.label}
                              type="button"
                              onClick={() => {
                                setFollowUpOption(option.label);
                                if (option.label !== 'Custom') {
                                  setCustomFollowUpDate(undefined);
                                }
                              }}
                              className={cn(
                                "px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                followUpOption === option.label
                                  ? "bg-emerald-600 text-white"
                                  : "bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Date Picker */}
                      {followUpOption === 'Custom' && (
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Select Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal h-9 text-sm bg-white dark:bg-stone-900",
                                  !customFollowUpDate && "text-muted-foreground"
                                )}
                              >
                                <Icon icon="solar:calendar-linear" className="mr-2 h-4 w-4" />
                                {customFollowUpDate ? format(customFollowUpDate, "MMM d, yyyy") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={customFollowUpDate}
                                onSelect={setCustomFollowUpDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogBody>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0 px-4 sm:px-6 py-4 border-t border-stone-200 dark:border-stone-800 mt-auto">
            <button 
              type="button" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold font-mono uppercase tracking-wide text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors border border-stone-200 dark:border-stone-700 rounded-lg sm:border-0"
            >
              Cancel
            </button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2.5 h-auto text-sm font-semibold font-mono uppercase tracking-wide bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {isSubmitting ? 'Saving...' : 'Save Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
