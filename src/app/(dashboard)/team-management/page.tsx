"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LogIn, LogOut, Loader2, User, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { AppUser, AttendanceRecord } from '@/types/saas';
import { getCompanyUsers, logAttendance, getAttendanceForUser, getLastAttendanceRecord } from '@/lib/saas-data';
import { useAuth } from '@/hooks/use-auth';
import { format, formatDistanceToNow } from 'date-fns';
import { Animated, AnimatedCounter } from '@/components/ui/animated';
import gsap from 'gsap';

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
    // Add a listener to refresh data if it's changed in another tab
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
    
    // Refresh data for the current user and for the admin view
    await loadData();
    setIsClocking(false);
  };
  
  const userLastRecord = appUser ? attendanceRecords[appUser.uid] : null;
  const isClockedIn = userLastRecord?.status === 'in';
  const canViewTeam = isAdmin || isManager;

  const renderAdminView = () => (
    <Animated animation="fadeUp">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 border-b p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg">Team Attendance Status</CardTitle>
              <CardDescription className="text-xs sm:text-sm">View the current clock-in/out status of all users.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="animate-spin h-6 w-6 text-primary"/>
              </div>
              <p className="text-sm text-muted-foreground">Loading team data...</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden p-4 space-y-3">
                {teamUsers.map(user => {
                  const record = attendanceRecords[user.uid];
                  return (
                    <Card key={user.uid} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm truncate max-w-[150px]">{user.name || user.email}</span>
                          </div>
                          {record?.status === 'in' ? (
                            <Badge className="bg-green-100 text-green-800 text-xs">In</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Out</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <Badge variant="outline" className="capitalize text-[10px]">{user.type || 'office'}</Badge>
                          <span>{record?.timestamp?.toDate ? formatDistanceToNow(record.timestamp.toDate(), { addSuffix: true }) : 'No activity'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamUsers.map(user => {
                      const record = attendanceRecords[user.uid];
                      return (
                        <TableRow key={user.uid} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{user.name || user.email}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{user.type || 'office'}</Badge></TableCell>
                          <TableCell>
                            {record?.status === 'in' ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100/80">Clocked In</Badge>
                            ) : (
                              <Badge variant="secondary">Clocked Out</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </Animated>
  );
  
  const renderUserView = () => (
    <Animated animation="fadeUp">
      <Card className="max-w-md mx-auto overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-accent/5 border-b p-4 sm:p-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
          </div>
          <CardTitle className="text-lg sm:text-xl">Your Attendance</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Update your work status below.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 p-4 sm:p-6">
          <div className="p-4 rounded-xl bg-muted/50">
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Your current status:</p>
            <Badge className={`text-base sm:text-lg px-4 py-1.5 ${isClockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {isClockedIn ? (
                <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Clocked In</>
              ) : (
                'Clocked Out'
              )}
            </Badge>
          </div>
          {userLastRecord && (
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Last activity: {userLastRecord.timestamp?.toDate ? format(userLastRecord.timestamp.toDate(), 'PPpp') : 'N/A'}
            </p>
          )}
          <Button 
            onClick={handleClockInOut} 
            disabled={isClocking} 
            size="lg" 
            className={`w-full text-sm sm:text-base ${isClockedIn ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            {isClocking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isClockedIn ? <LogOut className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />)}
            {isClocking ? 'Updating...' : (isClockedIn ? 'Clock Out' : 'Clock In')}
          </Button>
        </CardContent>
      </Card>
    </Animated>
  );

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 py-4 sm:py-6">
      <Animated animation="fadeUp">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Team Management
          </h1>
          <Badge variant="secondary" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            {teamUsers.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage team attendance and view user activity.
        </p>
      </Animated>
      
      {canViewTeam ? (
        <>
          {renderUserView()}
          {renderAdminView()}
        </>
      ) : (
        renderUserView()
      )}
    </div>
  );
}
