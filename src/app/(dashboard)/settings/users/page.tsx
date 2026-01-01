'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Icon } from '@iconify/react';
import { getAllAdminsAndCompanies } from '@/lib/saas-data';
import type { Company, AppUser } from '@/types/saas';
import { formatDistanceToNow } from 'date-fns';

export default function UsersSettingsPage() {
  const { isSuperAdmin, loading } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<{ admin: AppUser; company: Company }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  if (!loading && !isSuperAdmin) {
    redirect('/settings');
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Load admins from companies for now
      const data = await getAllAdminsAndCompanies();
      setUsers(data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(({ admin, company }) => 
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '—';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getRoleBadge = (role: string) => {
    const r = role?.toLowerCase() || 'user';
    if (r === 'superadmin') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300';
    if (r === 'admin') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300';
    if (r === 'manager') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
    return 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400';
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-48 sm:h-64">
        <Icon icon="solar:refresh-bold" className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-semibold">All Users</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Platform users across all companies
          </p>
        </div>
        <Badge variant="secondary" className="w-fit text-xs sm:text-sm px-2 py-1">
          {users.length} Users
        </Badge>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 sm:h-10 text-sm"
          />
        </div>
        <Button variant="outline" onClick={loadUsers} className="h-9 sm:h-10 px-3">
          <Icon icon="solar:refresh-linear" className="h-4 w-4" />
          <span className="ml-2 sm:inline hidden">Refresh</span>
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-2 sm:space-y-3">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center">
              <Icon icon="solar:users-group-two-rounded-linear" className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'No users match your search' : 'No users found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(({ admin, company }) => (
            <Card key={admin.uid} className="hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* User Info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                        {admin.name?.charAt(0)?.toUpperCase() || admin.email?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm truncate">{admin.name || 'Unnamed User'}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 ${getRoleBadge(admin.role)}`}>
                          {admin.role?.toUpperCase() || 'USER'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{admin.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate max-w-[120px] sm:max-w-none">{company.name || 'No company'}</span>
                        <span>•</span>
                        <span>{formatDate(admin.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                      <Icon icon="solar:eye-linear" className="h-3.5 w-3.5 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
