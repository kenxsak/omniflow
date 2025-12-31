"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, AttendanceRecord } from '@/types/saas';
import { getCompanyUsers, logAttendance, getLastAttendanceRecord } from '@/lib/saas-data';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { ContextualHelpButton } from '@/components/help/contextual-help-button';

export default function TeamManagementPage() {
  const { appUser, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  
  const [teamUsers, setTeamUsers] = useState<AppUser[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isClocking, setIsClocking] = useState(false);

  const loadData = useCallback(async () => {
    if (appUser?.companyId) {
      setIsLoading(true);
      const users = await getCompanyUsers(appUser.companyId);
      setTeamUsers(users);
      
      const records: Record<string, AttendanceRecord | null> = {};
      for (const user of users) {
        records[user.uid] = await getLastAttendanceRecord(user.uid);
      }
      setAttendanceRecords(records);
      setIsLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    loadData();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'omniFlowSaasUsers' || event.key === 'omniFlowAttendance') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadData]);
  
  const handleClockInOut = async () => {
    if (!appUser) return;
    setIsClocking(true);

    const lastRecord = attendanceRecords[appUser.uid];
    const newStatus = lastRecord?.status === 'in' ? 'out' : 'in';
    
    await logAttendance(appUser.uid, newStatus);
    toast({
      title: `Successfully Clocked ${newStatus === 'in' ? 'In' : 'Out'}`,
      description: `Your status has been updated.`,
    });
    
    await loadData();
    setIsClocking(false);
  };
  
  const userLastRecord = appUser ? attendanceRecords[appUser.uid] : null;
  const isClockedIn = userLastRecord?.status === 'in';
  const canViewTeam = isAdmin || isManager;

  const renderUserView = () => (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden max-w-md mx-auto">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)' }} />
      
      <div className="p-6 text-center border-b border-stone-200 dark:border-stone-800">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
          <Icon icon="solar:clock-circle-linear" className="w-6 h-6" style={{ color: '#8b5cf6' }} />
        </div>
        <h3 className="text-base font-semibold text-foreground">Your Attendance</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Update your work status below</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 text-center">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">Your Current Status</p>
          <Badge 
            variant={isClockedIn ? "default" : "secondary"} 
            className="text-sm px-4 py-1.5"
            style={isClockedIn 
              ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }
              : { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' }
            }
          >
            {isClockedIn ? (
              <><Icon icon="solar:check-circle-linear" className="w-4 h-4 mr-1.5" /> Clocked In</>
            ) : (
              'Clocked Out'
            )}
          </Badge>
        </div>
        
        {userLastRecord && (
          <p className="text-[10px] text-muted-foreground text-center">
            Last activity: {userLastRecord.timestamp?.toDate ? format(userLastRecord.timestamp.toDate(), 'PPpp') : 'N/A'}
          </p>
        )}
        
        <Button 
          onClick={handleClockInOut} 
          disabled={isClocking} 
          variant={isClockedIn ? "outline" : "default"}
          className="w-full h-10 text-sm text-white"
          style={isClockedIn 
            ? { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }
            : { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }
          }
        >
          {isClocking ? (
            <Icon icon="solar:refresh-linear" className="mr-2 h-4 w-4 animate-spin" />
          ) : isClockedIn ? (
            <Icon icon="solar:logout-2-linear" className="mr-2 h-4 w-4" />
          ) : (
            <Icon icon="solar:login-2-linear" className="mr-2 h-4 w-4" />
          )}
          {isClocking ? 'Updating...' : (isClockedIn ? 'Clock Out' : 'Clock In')}
        </Button>
      </div>
    </div>
  );

  const renderAdminView = () => (
    <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
      <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full" style={{ background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)' }} />
      
      <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <Icon icon="solar:users-group-rounded-linear" className="h-4 w-4" style={{ color: '#10b981' }} />
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Team Attendance Status
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">View the current clock-in/out status of all users</p>
      </div>
      
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Icon icon="solar:refresh-linear" className="h-8 w-8 text-muted-foreground/30 animate-spin mb-3" />
            <p className="text-sm text-muted-foreground">Loading team data...</p>
          </div>
        ) : teamUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Icon icon="solar:users-group-rounded-linear" className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">No Team Members</p>
            <p className="text-xs text-muted-foreground mt-1">Invite team members to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-3">
              {teamUsers.map(user => {
                const record = attendanceRecords[user.uid];
                return (
                  <div key={user.uid} className="p-3 rounded-lg bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                          <Icon icon="solar:user-linear" className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        </div>
                        <span className="font-medium text-sm truncate max-w-[150px]">{user.name || user.email}</span>
                      </div>
                      <Badge 
                        variant={record?.status === 'in' ? "default" : "secondary"} 
                        className="text-[10px]"
                        style={record?.status === 'in' 
                          ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }
                          : { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' }
                        }
                      >
                        {record?.status === 'in' ? 'Clocked In' : 'Clocked Out'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <Badge 
                        variant="outline" 
                        className="capitalize text-[10px]"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                      >
                        {user.type || 'office'}
                      </Badge>
                      <span>{record?.timestamp?.toDate ? formatDistanceToNow(record.timestamp.toDate(), { addSuffix: true }) : 'No activity'}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block border border-stone-200 dark:border-stone-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-stone-50 dark:bg-stone-900">
                    <TableHead className="text-[10px] uppercase tracking-wider">User</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Type</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider">Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamUsers.map(user => {
                    const record = attendanceRecords[user.uid];
                    return (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium text-sm">{user.name || user.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="capitalize text-[10px]"
                            style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                          >
                            {user.type || 'office'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={record?.status === 'in' ? "default" : "secondary"} 
                            className="text-[10px]"
                            style={record?.status === 'in' 
                              ? { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }
                              : { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' }
                            }
                          >
                            {record?.status === 'in' ? 'Clocked In' : 'Clocked Out'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {record?.timestamp?.toDate ? formatDistanceToNow(record.timestamp.toDate(), { addSuffix: true }) : 'No activity yet'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">Team Management</h1>
            <Badge 
              variant="secondary" 
              className="text-[10px]"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)' }}
            >
              <Icon icon="solar:users-group-rounded-linear" className="w-3 h-3 mr-1" />
              {teamUsers.length}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Manage team attendance and view user activity</p>
        </div>
      </header>
      
      {canViewTeam ? (
        <div className="space-y-6">
          {renderUserView()}
          {renderAdminView()}
        </div>
      ) : (
        renderUserView()
      )}

      {/* Help Button - Fixed Bottom Right */}
      <ContextualHelpButton pageId="team-management" />
    </div>
  );
}
