"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStoredLeads, type Lead } from '@/lib/mock-data';
import { getStoredTasks, type Task } from '@/lib/task-data';
import { format } from 'date-fns';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Link as LinkIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { ContactDeals } from '@/components/crm/contact-deals';
import { AppointmentDialog } from '@/components/appointments/appointment-dialog';
import { LeadQuickActions } from '@/components/crm/lead-quick-actions';

const statusColors: Record<Lead['status'], string> = {
  New: 'bg-info-muted text-info-muted-foreground border border-info-border',
  Contacted: 'bg-warning-muted text-warning-muted-foreground border border-warning-border',
  Qualified: 'bg-success-muted text-success-muted-foreground border border-success-border',
  Lost: 'bg-destructive-muted text-destructive-muted-foreground border border-destructive-border',
  Won: 'bg-success-muted text-success-muted-foreground border border-success-border',
};

const syncStatusColors: Record<NonNullable<Lead['brevoSyncStatus'] | Lead['hubspotSyncStatus']>, string> = {
    synced: 'text-success-muted-foreground',
    pending: 'text-warning-muted-foreground',
    failed: 'text-destructive-muted-foreground',
    unsynced: 'text-muted-foreground',
    syncing: 'text-info-muted-foreground animate-pulse',
};

const syncStatusIcons: Record<NonNullable<Lead['brevoSyncStatus'] | Lead['hubspotSyncStatus']>, React.ElementType> = {
    synced: CheckCircle,
    pending: Loader2,
    failed: AlertTriangle,
    unsynced: LinkIcon,
    syncing: Loader2,
};

const taskPriorityColors: Record<Task['priority'], string> = {
  High: 'bg-destructive-muted text-destructive-muted-foreground border border-destructive-border',
  Medium: 'bg-warning-muted text-warning-muted-foreground border border-warning-border',
  Low: 'bg-info-muted text-info-muted-foreground border border-info-border',
};

export default function LeadDossierPage() {
    const params = useParams();
    const router = useRouter();
    const { appUser } = useAuth();
    const leadId = typeof params.leadId === 'string' ? params.leadId : '';

    const [lead, setLead] = useState<Lead | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);

    const loadData = useCallback(async () => {
        if (!appUser?.companyId || !appUser?.idToken) {
            return;
        }
        
        setIsLoading(true);
        try {
            const allLeads = await getStoredLeads(appUser.companyId);
            const foundLead = allLeads.find(l => l.id === leadId);
            setLead(foundLead || null);

            if (foundLead) {
                const allTasks = await getStoredTasks(foundLead.companyId);
                const leadTasks = allTasks.filter(t => t.leadId === leadId);
                setTasks(leadTasks);

                try {
                    const appointmentsResponse = await fetch('/api/appointments/contact', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${appUser.idToken}`
                        },
                        body: JSON.stringify({ 
                            contactId: foundLead.id,
                            contactEmail: foundLead.email 
                        })
                    });
                    if (appointmentsResponse.ok) {
                        const result = await appointmentsResponse.json();
                        setAppointments(result.appointments || []);
                    }
                } catch (e) {
                    console.error("Error loading appointments", e);
                    setAppointments([]);
                }
            }
        } catch(e) {
            console.error("Error loading lead data", e);
            setLead(null);
        }
        setIsLoading(false);
    }, [leadId, appUser?.companyId, appUser?.idToken]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Icon icon="solar:refresh-linear" className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden p-6">
                <h2 className="text-lg font-semibold mb-2">Lead Not Found</h2>
                <p className="text-muted-foreground mb-4">The lead with ID "{leadId}" could not be found.</p>
                <Button asChild>
                    <Link href="/crm"><ArrowLeft className="mr-2 h-4 w-4" />Back to All Leads</Link>
                </Button>
            </div>
        );
    }
    
    const getValidDate = (timestamp: any): Date | null => {
        if (!timestamp) return null;
        if (timestamp.toDate) return timestamp.toDate();
        if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp);
        return null;
    };
    
    const createdAtDate = getValidDate(lead.createdAt);
    const lastContactedDate = getValidDate(lead.lastContacted);
    
    const brevoSyncStatus = lead.brevoSyncStatus || 'unsynced';
    const hubspotSyncStatus = lead.hubspotSyncStatus || 'unsynced';
    const BrevoIcon = syncStatusIcons[brevoSyncStatus];
    const HubspotIcon = syncStatusIcons[hubspotSyncStatus];
    const brevoColor = syncStatusColors[brevoSyncStatus];
    const hubspotColor = syncStatusColors[hubspotSyncStatus];

    // Format phone for WhatsApp
    const formatPhoneForWhatsApp = (phone: string) => {
        return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
    };

    // Quick action handlers for mobile sticky bar
    const handleQuickWhatsApp = () => {
        if (!lead.phone) return;
        const phone = formatPhoneForWhatsApp(lead.phone);
        // Use api.whatsapp.com/send for proper emoji support (FREE - not Business API)
        const message = `Hi ${lead.name} 👋,\n\n`.normalize('NFC');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
        
        // Use anchor element to reliably open in new tab
        const link = document.createElement('a');
        link.href = whatsappUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleQuickEmail = () => {
        if (!lead.email) return;
        window.location.href = `mailto:${lead.email}?subject=Following up&body=Hi ${lead.name},%0D%0A%0D%0A`;
    };

    const handleQuickCall = () => {
        if (!lead.phone) return;
        window.location.href = `tel:${lead.phone}`;
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center gap-3 sm:gap-4">
                <Button variant="outline" size="icon" asChild className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg">
                    <Link href="/crm"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg sm:text-xl font-semibold truncate">{lead.name}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">Lead Dossier - A complete overview.</p>
                </div>
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                    <Link href={`/crm?editLeadId=${lead.id}`}>
                        <Icon icon="solar:pen-linear" className="mr-2 h-4 w-4"/>
                        Edit Lead
                    </Link>
                </Button>
                <Button variant="outline" size="icon" asChild className="sm:hidden h-8 w-8">
                    <Link href={`/crm?editLeadId=${lead.id}`}>
                        <Icon icon="solar:pen-linear" className="h-4 w-4"/>
                    </Link>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                    {/* Lead Information Card */}
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                        <div className="absolute inset-x-8 sm:inset-x-12 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #3b82f6, #6366f1)' }} />
                        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(59, 130, 246, 0.05), rgba(99, 102, 241, 0.05))' }}>
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:user-id-linear" className="h-4 w-4" style={{ color: '#3b82f6' }} />
                                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Lead Information
                                </span>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5">
                            {/* Mobile: Stacked layout with better spacing */}
                            <div className="space-y-3 sm:hidden">
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:user-circle-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Assigned To</span>
                                    </div>
                                    <span className="text-sm text-foreground">{lead.assignedTo || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:letter-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Email</span>
                                    </div>
                                    <span className="text-sm text-foreground truncate max-w-[180px]">{lead.email}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:phone-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Phone</span>
                                    </div>
                                    <span className="text-sm text-foreground">{lead.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:buildings-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Company</span>
                                    </div>
                                    <span className="text-sm text-foreground truncate max-w-[180px]">{lead.attributes?.COMPANY_NAME || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:case-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Role</span>
                                    </div>
                                    <span className="text-sm text-foreground">{lead.attributes?.ROLE || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:link-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Source</span>
                                    </div>
                                    <span className="text-sm text-foreground">{lead.source}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:calendar-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Created</span>
                                    </div>
                                    <span className="text-xs text-foreground">{createdAtDate ? format(createdAtDate, 'PP') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-stone-100 dark:border-stone-800">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:calendar-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Last Contact</span>
                                    </div>
                                    <span className="text-xs text-foreground">{lastContactedDate ? format(lastContactedDate, 'PP') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Icon icon="solar:clipboard-check-linear" className="h-4 w-4 flex-shrink-0"/>
                                        <span className="text-xs font-medium">Status</span>
                                    </div>
                                    <Badge className={`${statusColors[lead.status]} text-xs`}>{lead.status}</Badge>
                                </div>
                            </div>
                            
                            {/* Desktop: Grid layout */}
                            <div className="hidden sm:grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:user-circle-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Assigned To:</span>
                                    <span className="text-foreground truncate">{lead.assignedTo || 'Unassigned'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:letter-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Email:</span>
                                    <span className="text-foreground truncate">{lead.email}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:phone-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Phone:</span>
                                    <span className="text-foreground">{lead.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:buildings-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Company:</span>
                                    <span className="text-foreground truncate">{lead.attributes?.COMPANY_NAME || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:case-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Role:</span>
                                    <span className="text-foreground">{lead.attributes?.ROLE || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:link-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Source:</span>
                                    <span className="text-foreground">{lead.source}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:calendar-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Created:</span>
                                    <span className="text-foreground text-xs">{createdAtDate ? format(createdAtDate, 'PPp') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Icon icon="solar:calendar-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Last Contact:</span>
                                    <span className="text-foreground text-xs">{lastContactedDate ? format(lastContactedDate, 'PPp') : 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-2 col-span-2">
                                    <Icon icon="solar:clipboard-check-linear" className="h-4 w-4 text-muted-foreground flex-shrink-0"/>
                                    <span className="font-medium text-muted-foreground">Status:</span>
                                    <Badge className={`${statusColors[lead.status]} text-xs`}>{lead.status}</Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <Tabs defaultValue="activity" className="w-full">
                        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                            <TabsList className="w-full h-auto p-0 bg-transparent border-b border-stone-200 dark:border-stone-800 rounded-none grid grid-cols-4">
                                <TabsTrigger 
                                    value="activity" 
                                    className="flex flex-col items-center gap-1 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-indigo-50/50 dark:data-[state=active]:bg-indigo-950/30 text-[10px] sm:text-sm data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400"
                                >
                                    <Icon icon="solar:chart-2-linear" className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Activity</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="deals" 
                                    className="flex flex-col items-center gap-1 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-50/50 dark:data-[state=active]:bg-emerald-950/30 text-[10px] sm:text-sm data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
                                >
                                    <Icon icon="solar:dollar-linear" className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Deals</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="tasks" 
                                    className="flex flex-col items-center gap-1 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-amber-50/50 dark:data-[state=active]:bg-amber-950/30 text-[10px] sm:text-sm data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
                                >
                                    <Icon icon="solar:checklist-linear" className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Tasks</span>
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="appointments" 
                                    className="flex flex-col items-center gap-1 py-3 sm:py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50/50 dark:data-[state=active]:bg-blue-950/30 text-[10px] sm:text-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
                                >
                                    <Icon icon="solar:calendar-linear" className="h-5 w-5 sm:h-4 sm:w-4" />
                                    <span className="font-medium">Appts</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        
                        <TabsContent value="activity" className="mt-4">
                            <ActivityTimeline 
                                contactId={lead.id} 
                                companyId={lead.companyId} 
                            />
                        </TabsContent>
                        <TabsContent value="deals" className="mt-4">
                            <ContactDeals 
                                contactId={lead.id} 
                                contactName={lead.name}
                                companyId={lead.companyId} 
                            />
                        </TabsContent>
                        <TabsContent value="tasks" className="mt-4">
                            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                                <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
                                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800">
                                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Associated Tasks
                                    </span>
                                </div>
                                <div className="p-4 sm:p-5">
                                    {tasks.length > 0 ? (
                                        <div className="divide-y divide-stone-200 dark:divide-stone-800">
                                            {tasks.map((task) => (
                                                <div key={task.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{task.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {task.dueDate ? format(new Date(task.dueDate), 'PP') : 'No due date'}
                                                        </p>
                                                    </div>
                                                    <Badge className={`${taskPriorityColors[task.priority]} text-xs`}>
                                                        {task.priority}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Icon icon="solar:checklist-linear" className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-sm text-muted-foreground">No tasks associated with this lead.</p>
                                        </div>
                                    )}
                                </div>
                                <div className="px-4 sm:px-5 py-3 border-t border-stone-200 dark:border-stone-800">
                                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                                        <Link href="/tasks" className="inline-flex items-center gap-1">
                                            VIEW ALL TASKS
                                            <Icon icon="solar:arrow-right-linear" className="h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="appointments" className="mt-4">
                            <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                                <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full bg-primary" />
                                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
                                    <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                        Appointments
                                    </span>
                                    <Button size="sm" onClick={() => setShowAppointmentDialog(true)} className="h-7 text-xs">
                                        <Plus className="mr-1 h-3 w-3" />
                                        Schedule
                                    </Button>
                                </div>
                                <div className="p-4 sm:p-5">
                                    {appointments.length > 0 ? (
                                        <div className="divide-y divide-stone-200 dark:divide-stone-800">
                                            {appointments.map((appointment: any) => (
                                                <div key={appointment.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                                    <div className="flex-shrink-0 w-12 text-center">
                                                        <div className="text-sm font-semibold tabular-nums">
                                                            {appointment.startTime 
                                                                ? format(new Date(appointment.startTime), 'HH:mm')
                                                                : '--:--'
                                                            }
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {appointment.duration || '30'}m
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{appointment.title}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {appointment.startTime 
                                                                ? format(new Date(appointment.startTime), 'MMM d, yyyy')
                                                                : 'N/A'
                                                            }
                                                        </p>
                                                    </div>
                                                    <Badge variant={
                                                        appointment.status === 'completed' ? 'default' :
                                                        appointment.status === 'cancelled' ? 'destructive' :
                                                        'outline'
                                                    } className="text-xs">
                                                        {appointment.status || 'scheduled'}
                                                    </Badge>
                                                    <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                                                        <Link href={`/appointments?id=${appointment.id}`}>View</Link>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <Icon icon="solar:calendar-linear" className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                                            <p className="text-sm text-muted-foreground mb-3">No appointments scheduled.</p>
                                            <Button variant="outline" size="sm" onClick={() => setShowAppointmentDialog(true)} className="h-8 text-xs">
                                                <Plus className="mr-1 h-3 w-3" />
                                                Schedule First Appointment
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Quick Actions */}
                    <LeadQuickActions 
                        lead={{
                            id: lead.id,
                            name: lead.name,
                            email: lead.email,
                            phone: lead.phone,
                            companyId: lead.companyId,
                        }}
                        onActivityLogged={loadData}
                    />

                    {/* Sync Status Card */}
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #14b8a6, #10b981)' }} />
                        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(20, 184, 166, 0.05), rgba(16, 185, 129, 0.05))' }}>
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:refresh-circle-linear" className="h-4 w-4" style={{ color: '#14b8a6' }} />
                                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Sync Status
                                </span>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5 space-y-3">
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                                brevoSyncStatus === 'synced' ? 'border-success-border bg-success-muted' : 
                                brevoSyncStatus === 'failed' ? 'border-destructive-border bg-destructive-muted' : 
                                'border-stone-200 dark:border-stone-700 bg-muted/50'
                            }`}>
                                <BrevoIcon className={`h-5 w-5 ${brevoColor}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">Brevo</p>
                                    <p className={`text-xs capitalize ${brevoColor}`}>{brevoSyncStatus}</p>
                                    {brevoSyncStatus === 'failed' && lead.brevoErrorMessage && (
                                        <p className="text-xs text-destructive-muted-foreground mt-1 truncate">{lead.brevoErrorMessage}</p>
                                    )}
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
                                hubspotSyncStatus === 'synced' ? 'border-success-border bg-success-muted' : 
                                hubspotSyncStatus === 'failed' ? 'border-destructive-border bg-destructive-muted' : 
                                'border-stone-200 dark:border-stone-700 bg-muted/50'
                            }`}>
                                <HubspotIcon className={`h-5 w-5 ${hubspotColor}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">HubSpot</p>
                                    <p className={`text-xs capitalize ${hubspotColor}`}>{hubspotSyncStatus}</p>
                                    {hubspotSyncStatus === 'failed' && lead.hubspotErrorMessage && (
                                        <p className="text-xs text-destructive-muted-foreground mt-1 truncate">{lead.hubspotErrorMessage}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl sm:rounded-2xl bg-white dark:bg-stone-950 overflow-hidden">
                        <div className="absolute inset-x-10 sm:inset-x-14 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)' }} />
                        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-stone-200 dark:border-stone-800" style={{ background: 'linear-gradient(to right, rgba(245, 158, 11, 0.05), rgba(249, 115, 22, 0.05))' }}>
                            <div className="flex items-center gap-2">
                                <Icon icon="solar:notes-linear" className="h-4 w-4" style={{ color: '#f59e0b' }} />
                                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                    Notes
                                </span>
                            </div>
                        </div>
                        <div className="p-4 sm:p-5">
                            <div className="p-3 bg-muted/50 rounded-lg border border-stone-200 dark:border-stone-700 max-h-40 overflow-y-auto">
                                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{lead.notes || 'No notes yet.'}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AppointmentDialog
                open={showAppointmentDialog}
                onOpenChange={setShowAppointmentDialog}
                contact={lead ? {
                    id: lead.id,
                    name: lead.name,
                    email: lead.email,
                    phone: lead.phone
                } : undefined}
                onSuccess={() => {
                    setShowAppointmentDialog(false);
                    loadData();
                }}
            />

            {/* Mobile Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-white dark:bg-stone-950 border-t border-stone-200 dark:border-stone-800 px-4 py-3 safe-area-inset-bottom">
                <div className="flex gap-2 max-w-lg mx-auto">
                    <Button
                        variant="outline"
                        className="flex-1 h-11 gap-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
                        onClick={handleQuickWhatsApp}
                        disabled={!lead.phone}
                    >
                        <Icon icon="logos:whatsapp-icon" className="h-5 w-5" />
                        <span className="text-sm font-medium">WhatsApp</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 h-11 gap-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        onClick={handleQuickEmail}
                        disabled={!lead.email}
                    >
                        <Icon icon="solar:letter-linear" className="h-5 w-5" />
                        <span className="text-sm font-medium">Email</span>
                    </Button>
                    <Button
                        variant="outline"
                        className="flex-1 h-11 gap-2 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                        onClick={handleQuickCall}
                        disabled={!lead.phone}
                    >
                        <Icon icon="solar:phone-linear" className="h-5 w-5" />
                        <span className="text-sm font-medium">Call</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
