"use client";

import React from 'react';
import type { Lead } from '@/lib/mock-data';
import type { AppUser } from '@/types/saas';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Icon } from '@iconify/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TeamPerformanceDashboardProps {
  leads: Lead[];
  teamMembers: AppUser[];
}

interface RepMetrics {
  userId: string;
  userName: string;
  userEmail: string;
  totalLeads: number;
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  lostLeads: number;
  conversionRate: number;
}

export function TeamPerformanceDashboard({ leads, teamMembers }: TeamPerformanceDashboardProps) {
  const repMetrics: RepMetrics[] = teamMembers.map((member) => {
    const repLeads = leads.filter(lead => lead.assignedTo === member.uid || lead.assignedTo === member.email);
    const wonCount = repLeads.filter(l => l.status === 'Won').length;
    const lostCount = repLeads.filter(l => l.status === 'Lost').length;
    const totalClosed = wonCount + lostCount;
    
    return {
      userId: member.uid,
      userName: member.name || member.email?.split('@')[0] || 'Unknown',
      userEmail: member.email || '',
      totalLeads: repLeads.length,
      newLeads: repLeads.filter(l => l.status === 'New').length,
      contactedLeads: repLeads.filter(l => l.status === 'Contacted').length,
      qualifiedLeads: repLeads.filter(l => l.status === 'Qualified').length,
      wonLeads: wonCount,
      lostLeads: lostCount,
      conversionRate: totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0,
    };
  });

  const sortedMetrics = [...repMetrics].sort((a, b) => b.totalLeads - a.totalLeads);
  
  const teamMemberIds = teamMembers.map(m => m.uid);
  const teamMemberEmails = teamMembers.map(m => m.email);
  const unassignedLeads = leads.filter(l => 
    !l.assignedTo || 
    l.assignedTo === '_UNASSIGNED_' || 
    (!teamMemberIds.includes(l.assignedTo) && !teamMemberEmails.includes(l.assignedTo))
  ).length;
  
  const totalAssignedLeads = leads.length - unassignedLeads;
  const avgLeadsPerRep = teamMembers.length > 0 ? Math.round(totalAssignedLeads / teamMembers.length) : 0;
  
  const chartData = sortedMetrics.map(m => ({
    name: m.userName.length > 10 ? m.userName.substring(0, 10) + '...' : m.userName,
    leads: m.totalLeads,
    won: m.wonLeads,
  }));

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.15_250)] dark:bg-[oklch(0.65_0.16_250)]" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Team Members</span>
              <Icon icon="solar:users-group-two-rounded-linear" className="h-4 w-4 text-[oklch(0.55_0.15_250)] dark:text-[oklch(0.65_0.16_250)]" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{teamMembers.length}</p>
          </div>
        </div>
        
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.14_160)] dark:bg-[oklch(0.65_0.15_160)]" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Avg Leads/Rep</span>
              <Icon icon="solar:target-linear" className="h-4 w-4 text-[oklch(0.55_0.14_160)] dark:text-[oklch(0.65_0.15_160)]" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{avgLeadsPerRep}</p>
          </div>
        </div>
        
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-[oklch(0.60_0.16_145)] dark:bg-[oklch(0.68_0.17_145)]" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Won</span>
              <Icon icon="solar:cup-star-linear" className="h-4 w-4 text-[oklch(0.60_0.16_145)] dark:text-[oklch(0.68_0.17_145)]" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{leads.filter(l => l.status === 'Won').length}</p>
          </div>
        </div>
        
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-[oklch(0.70_0.14_70)] dark:bg-[oklch(0.75_0.15_70)]" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Unassigned</span>
              <Icon icon="solar:user-cross-linear" className="h-4 w-4 text-[oklch(0.70_0.14_70)] dark:text-[oklch(0.75_0.15_70)]" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{unassignedLeads}</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Lead Distribution Chart */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.15_250)] dark:bg-[oklch(0.65_0.16_250)]" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Lead Distribution
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">Leads assigned per team member</p>
          </div>
          <div className="p-4 h-[300px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#292524" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={{ stroke: '#292524' }} tickLine={{ stroke: '#292524' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#a8a29e' }} axisLine={{ stroke: '#292524' }} tickLine={{ stroke: '#292524' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0c0a09', 
                      border: '1px solid #292524',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fafaf9'
                    }}
                    labelStyle={{ color: '#a8a29e' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="leads" name="Total Leads" radius={[4, 4, 0, 0]} fill="oklch(0.55 0.15 250)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Icon icon="solar:chart-2-linear" className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm">No team data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Team Leaderboard */}
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-[oklch(0.60_0.16_145)] dark:bg-[oklch(0.68_0.17_145)]" />
          <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Team Leaderboard
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">Performance by team member</p>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {sortedMetrics.slice(0, 5).map((rep, index) => (
                <div key={rep.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-stone-200 dark:hover:border-stone-800">
                  <span className="text-sm font-semibold text-muted-foreground w-5">#{index + 1}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-stone-100 dark:bg-stone-800 text-foreground text-xs">
                      {getInitials(rep.userName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rep.userName}</p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>{rep.totalLeads} leads</span>
                      <span>·</span>
                      <span>{rep.wonLeads} won</span>
                      {rep.conversionRate > 0 && (
                        <>
                          <span>·</span>
                          <span>{rep.conversionRate}%</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {rep.totalLeads > avgLeadsPerRep ? 'High' : 'Normal'}
                  </Badge>
                </div>
              ))}
              {sortedMetrics.length === 0 && (
                <div className="text-center py-6">
                  <Icon icon="solar:users-group-two-rounded-linear" className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No team members found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Details Table */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-[oklch(0.55_0.15_300)] dark:bg-[oklch(0.65_0.16_300)]" />
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Team Performance Details
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">Detailed breakdown by status for each team member</p>
        </div>
        <div className="p-4">
          <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
            <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-100/50 dark:bg-stone-800/50">
                    <th className="text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Team Member</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">New</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Contacted</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Qualified</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Won</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Lost</th>
                    <th className="text-center py-3 px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Conversion</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-stone-950">
                  {sortedMetrics.map((rep) => (
                    <tr key={rep.userId} className="border-t border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-[10px] bg-stone-100 dark:bg-stone-800">{getInitials(rep.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{rep.userName}</p>
                            <p className="text-[10px] text-muted-foreground">{rep.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2 font-medium tabular-nums">{rep.totalLeads}</td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-[10px]">{rep.newLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-[10px]">{rep.contactedLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-[10px]">{rep.qualifiedLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-[10px]">{rep.wonLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="secondary" className="text-[10px]">{rep.lostLeads}</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="h-1.5 w-12 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[oklch(0.60_0.16_145)] dark:bg-[oklch(0.68_0.17_145)] rounded-full transition-all" 
                              style={{ width: `${rep.conversionRate}%` }}
                            />
                          </div>
                          <span className="text-[10px] tabular-nums text-muted-foreground">{rep.conversionRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedMetrics.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        No team members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
