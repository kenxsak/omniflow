"use client";

import React from 'react';
import type { Lead } from '@/lib/mock-data';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface LeadTableProps {
  leads: Lead[];
  onDeleteLead: (leadId: string) => void;
  onUpdateLead: (lead: Lead) => void;
  selectedLeadIds: Set<string>;
  onSelectionChange: (leadId: string, isSelected: boolean) => void;
  onSelectAll: (isSelected: boolean) => void;
  onSyncComplete: () => void;
  onEditLead: (lead: Lead) => void;
  onScheduleAppointment?: (lead: Lead) => void;
}

const statusColors: Record<Lead['status'], string> = {
  New: 'text-sky-600 dark:text-sky-400',
  Contacted: 'text-amber-600 dark:text-amber-400',
  Qualified: 'text-emerald-600 dark:text-emerald-400',
  Lost: 'text-red-600 dark:text-red-400',
  Won: 'text-emerald-600 dark:text-emerald-400',
};

export default function LeadTable({
  leads,
  onDeleteLead,
  selectedLeadIds,
  onSelectionChange,
  onSelectAll,
  onEditLead,
  onScheduleAppointment,
}: LeadTableProps) {
  const { isUser } = useAuth();
  const isAllSelectedOnPage = leads.length > 0 && leads.every(lead => selectedLeadIds.has(lead.id));

  const getValidDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (!isNaN(new Date(timestamp).getTime())) return new Date(timestamp);
    return null;
  };

  return (
    <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
      {/* Inner table with border */}
      <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/50">
                <th className="h-10 px-4 text-left align-middle w-[50px]">
                  <Checkbox
                    checked={isAllSelectedOnPage}
                    onCheckedChange={(checked) => onSelectAll(!!checked)}
                    aria-label="Select all contacts"
                    className="h-4 w-4"
                  />
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground w-[35%]">
                  Contact
                </th>
                {!isUser && (
                  <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Owner
                  </th>
                )}
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground hidden sm:table-cell">
                  Status
                </th>
                <th className="h-10 px-4 text-left align-middle text-xs font-medium text-muted-foreground hidden lg:table-cell">
                  <div className="flex items-center gap-1">
                    Last Contact
                    <Icon icon="solar:alt-arrow-down-linear" className="h-3 w-3 opacity-50" />
                  </div>
                </th>
                <th className="h-10 px-4 text-right align-middle w-[50px]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <Icon icon="solar:users-group-two-rounded-linear" className="h-10 w-10 text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No contacts to display</p>
                    </div>
                  </td>
                </tr>
              ) : (
                leads.map((lead, index) => {
                  const isSelected = selectedLeadIds.has(lead.id);
                  const lastContactedDate = getValidDate(lead.lastContacted);
                  const isLast = index === leads.length - 1;

                  return (
                    <tr 
                      key={lead.id} 
                      className={`border-b border-stone-200 dark:border-stone-800 transition-colors hover:bg-stone-50 dark:hover:bg-stone-900/30 cursor-pointer ${isLast ? 'border-b-0' : ''} ${isSelected ? 'bg-primary/[0.03]' : ''}`}
                      onClick={() => {
                        window.location.href = `/crm/leads/${lead.id}`;
                      }}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => onSelectionChange(lead.id, !!checked)}
                          aria-label={`Select ${lead.name}`}
                          className="h-4 w-4"
                        />
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0 ring-1 ring-stone-200 dark:ring-stone-700">
                            <span className="text-xs font-medium text-muted-foreground">
                              {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-foreground">{lead.name}</span>
                            <span className="truncate text-xs text-muted-foreground">{lead.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      {!isUser && (
                        <td className="px-4 py-3 align-middle text-sm text-muted-foreground hidden md:table-cell">
                          {lead.assignedTo || <span className="opacity-50">Unassigned</span>}
                        </td>
                      )}

                      {/* Status */}
                      <td className="px-4 py-3 align-middle hidden sm:table-cell">
                        <span className={`text-xs font-medium ${statusColors[lead.status]}`}>
                          {lead.status}
                        </span>
                      </td>

                      {/* Last Contact */}
                      <td className="px-4 py-3 align-middle text-sm text-muted-foreground hidden lg:table-cell">
                        {lastContactedDate ? (
                          <time dateTime={lastContactedDate.toISOString()}>
                            {format(lastContactedDate, 'MMMM d, yyyy')}
                          </time>
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Icon icon="solar:menu-dots-bold" className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/crm/leads/${lead.id}`} className="cursor-pointer">
                                <Icon icon="solar:eye-linear" className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => onEditLead(lead)} className="cursor-pointer">
                              <Icon icon="solar:pen-linear" className="mr-2 h-4 w-4" /> Edit Contact
                            </DropdownMenuItem>
                            {onScheduleAppointment && (
                              <DropdownMenuItem onSelect={() => onScheduleAppointment(lead)} className="cursor-pointer">
                                <Icon icon="solar:calendar-linear" className="mr-2 h-4 w-4" /> Schedule Appointment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Icon icon="solar:trash-bin-trash-linear" className="mr-2 h-4 w-4" /> Delete Contact
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete "{lead.name}" from your database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDeleteLead(lead.id)} className={buttonVariants({ variant: "destructive" })}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
