"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody, DialogCloseButton } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { format } from 'date-fns';
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

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskSaved: () => void;
  taskToEdit?: Task | null;
  allLeads: Lead[];
  allAppointments?: Appointment[];
}

export default function AddTaskDialog({ isOpen, onOpenChange, onTaskSaved, taskToEdit, allLeads, allAppointments = [] }: AddTaskDialogProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
  });

  const selectedLeadId = watch("leadId");
  const [taskSuggestions, setTaskSuggestions] = useState<string[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && appUser?.companyId) {
      if (taskToEdit) {
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
  }, [isOpen, taskToEdit, reset, appUser]);

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

    const taskPayload = {
        ...data,
        dueDate: data.dueDate.toISOString(),
        leadId: data.leadId === '_NONE_' ? undefined : data.leadId,
        appointmentId: data.appointmentId === '_NONE_' ? undefined : data.appointmentId,
    };

    if (taskToEdit) {
      await updateStoredTask({ ...taskToEdit, ...taskPayload });
      toast({ title: 'Task Updated', description: `Task "${data.title}" has been saved.` });
      logActivity({ companyId: appUser.companyId, description: `Task updated: "${data.title.substring(0,30)}..."`, type: 'task' });
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
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
