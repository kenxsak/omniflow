'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  ReminderPreference,
  ReminderChannel,
} from '@/types/appointments';

const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

const HOURS_BEFORE_OPTIONS = [
  { value: 1, label: '1 hour before' },
  { value: 2, label: '2 hours before' },
  { value: 4, label: '4 hours before' },
  { value: 12, label: '12 hours before' },
  { value: 24, label: '24 hours before' },
  { value: 48, label: '48 hours before' },
];

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'America/Chicago', label: 'Chicago (CST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const appointmentFormSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Valid email is required'),
  clientPhone: z.string().optional(),
  title: z.string().min(1, 'Appointment title is required'),
  description: z.string().optional(),
  location: z.string().optional(),
  meetingLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  date: z.date({ required_error: 'Date is required' }),
  time: z.string().min(1, 'Time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  timezone: z.string().min(1, 'Timezone is required'),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  emailReminder: z.boolean().default(true),
  emailReminderHours: z.number().default(24),
  smsReminder: z.boolean().default(false),
  smsReminderHours: z.number().default(2),
  whatsappReminder: z.boolean().default(false),
  whatsappReminderHours: z.number().default(1),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface StaffMember {
  id: string;
  name: string;
}

export interface DefaultContactData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
}

interface AppointmentFormProps {
  appointment?: Appointment;
  staffMembers?: StaffMember[];
  defaultContact?: DefaultContactData;
  onSubmit: (data: CreateAppointmentInput | UpdateAppointmentInput) => Promise<void>;
  onCancel: () => void;
}

export function AppointmentForm({
  appointment,
  staffMembers = [],
  defaultContact,
  onSubmit,
  onCancel,
}: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDefaultValues = (): Partial<AppointmentFormValues> => {
    if (appointment) {
      const startDate = new Date(appointment.startTime);
      const emailReminder = appointment.reminderPreferences?.find(
        (r) => r.channel === 'email'
      );
      const smsReminder = appointment.reminderPreferences?.find(
        (r) => r.channel === 'sms'
      );
      const whatsappReminder = appointment.reminderPreferences?.find(
        (r) => r.channel === 'whatsapp'
      );

      return {
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail,
        clientPhone: appointment.clientPhone || '',
        title: appointment.title,
        description: appointment.description || '',
        location: appointment.location || '',
        meetingLink: appointment.meetingLink || '',
        date: startDate,
        time: format(startDate, 'HH:mm'),
        duration: appointment.duration,
        timezone: appointment.timezone,
        assignedTo: appointment.assignedTo || '',
        notes: appointment.notes || '',
        emailReminder: emailReminder?.enabled ?? true,
        emailReminderHours: emailReminder?.hoursBeforeAppointment ?? 24,
        smsReminder: smsReminder?.enabled ?? false,
        smsReminderHours: smsReminder?.hoursBeforeAppointment ?? 2,
        whatsappReminder: whatsappReminder?.enabled ?? false,
        whatsappReminderHours: whatsappReminder?.hoursBeforeAppointment ?? 1,
      };
    }

    return {
      clientName: defaultContact?.name || '',
      clientEmail: defaultContact?.email || '',
      clientPhone: defaultContact?.phone || '',
      title: '',
      description: '',
      location: '',
      meetingLink: '',
      date: undefined,
      time: '09:00',
      duration: 30,
      timezone: 'Asia/Kolkata',
      assignedTo: '',
      notes: '',
      emailReminder: true,
      emailReminderHours: 24,
      smsReminder: false,
      smsReminderHours: 2,
      whatsappReminder: false,
      whatsappReminderHours: 1,
    };
  };

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (appointment) {
      form.reset(getDefaultValues());
    }
  }, [appointment]);

  const handleSubmit = async (values: AppointmentFormValues) => {
    setIsSubmitting(true);
    try {
      const [hours, minutes] = values.time.split(':').map(Number);
      const startTime = new Date(values.date);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + values.duration * 60 * 1000);

      const reminderPreferences: ReminderPreference[] = [];

      if (values.emailReminder) {
        reminderPreferences.push({
          enabled: true,
          channel: 'email' as ReminderChannel,
          hoursBeforeAppointment: values.emailReminderHours,
        });
      }

      if (values.smsReminder) {
        reminderPreferences.push({
          enabled: true,
          channel: 'sms' as ReminderChannel,
          hoursBeforeAppointment: values.smsReminderHours,
        });
      }

      if (values.whatsappReminder) {
        reminderPreferences.push({
          enabled: true,
          channel: 'whatsapp' as ReminderChannel,
          hoursBeforeAppointment: values.whatsappReminderHours,
        });
      }

      const appointmentData: CreateAppointmentInput = {
        clientName: values.clientName,
        clientEmail: values.clientEmail,
        clientPhone: values.clientPhone || undefined,
        title: values.title,
        description: values.description || undefined,
        location: values.location || undefined,
        meetingLink: values.meetingLink || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: values.duration,
        timezone: values.timezone,
        reminderPreferences,
        assignedTo: values.assignedTo || undefined,
        notes: values.notes || undefined,
      };

      await onSubmit(appointmentData);
      form.reset();
    } catch (error) {
      console.error('Error submitting appointment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const label = format(new Date().setHours(hour, minute), 'h:mm a');
        options.push({ value: time, label });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        {/* Client Information Section */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:user-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Client Information</span>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Client Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className="h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="clientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+1 234 567 8900" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Appointment Details Section */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:document-text-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Appointment Details</span>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Consultation Call" className="h-9" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the appointment..."
                      rows={2}
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Office / Online" className="h-9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="meetingLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Meeting Link</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://zoom.us/..."
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="solar:calendar-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Schedule</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs">Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal h-9',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Icon icon="solar:calendar-linear" className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Time *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Duration *</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DURATION_OPTIONS.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Timezone *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {staffMembers.length > 0 && (
              <FormField
                control={form.control}
                name="assignedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Assign to Staff</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffMembers.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>

        {/* Reminder Settings Section */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:bell-linear" className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Reminder Settings</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Choose which channels to use for appointment reminders.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-0">
              <div className="flex items-center gap-2">
                <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="emailReminder" className="text-sm">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="emailReminderHours"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={!form.watch('emailReminder')}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS_BEFORE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emailReminder"
                  render={({ field }) => (
                    <Switch id="emailReminder" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-stone-200 dark:border-stone-700 last:border-0">
              <div className="flex items-center gap-2">
                <Icon icon="solar:phone-linear" className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="smsReminder" className="text-sm">SMS</Label>
              </div>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="smsReminderHours"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={!form.watch('smsReminder')}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS_BEFORE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smsReminder"
                  render={({ field }) => (
                    <Switch id="smsReminder" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <Icon icon="solar:chat-round-linear" className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="whatsappReminder" className="text-sm">WhatsApp</Label>
              </div>
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="whatsappReminderHours"
                  render={({ field }) => (
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString()}
                      disabled={!form.watch('whatsappReminder')}
                    >
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HOURS_BEFORE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappReminder"
                  render={({ field }) => (
                    <Switch id="whatsappReminder" checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes about this appointment..."
                  rows={2}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Footer Actions - Sticky on mobile */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-4 mt-2 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 pb-4 sm:pb-0">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={onCancel} 
            disabled={isSubmitting} 
            className="h-10 sm:h-9 text-sm sm:text-xs w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="sm" 
            disabled={isSubmitting} 
            className="h-10 sm:h-9 text-sm sm:text-xs w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4 sm:h-3.5 sm:w-3.5 animate-spin" />
                {appointment ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              <>
                <Icon icon="solar:calendar-add-linear" className="mr-1.5 h-4 w-4 sm:h-3.5 sm:w-3.5" />
                {appointment ? 'Update Appointment' : 'Schedule Appointment'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
