'use client';

import { Icon } from '@iconify/react';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyApiKeys } from '@/hooks/use-company-api-keys';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { getCompanyUsers, getStoredInvitations, deleteInvitation, getCompany } from '@/lib/saas-data';
import { createAndSendInvitation } from '@/app/actions/user-invitation-actions';
import type { AppUser, UserInvitation, Role, UserType } from '@/types/saas';
import { cn } from '@/lib/utils';

// Reusable Settings Card
function SettingsCard({
  title,
  description,
  icon,
  children,
  headerAction,
}: {
  title: string;
  description: string;
  icon: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-stone-100 dark:border-stone-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
            <Icon icon={icon} className="h-4.5 w-4.5 text-stone-500 dark:text-stone-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              {title}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-500">{description}</p>
          </div>
        </div>
        {headerAction}
      </div>
      {children}
    </div>
  );
}

export default function TeamPage() {
  const { appUser, isAdmin, isSuperAdmin } = useAuth();
  const { apiKeys } = useCompanyApiKeys();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [invitations, setInvitations] = useState<UserInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('user');
  const [inviteType, setInviteType] = useState<UserType>('office');

  const loadData = useCallback(async () => {
    if (!appUser?.companyId) return;
    setIsLoading(true);
    try {
      const [usersData, invitationsData] = await Promise.all([
        getCompanyUsers(appUser.companyId),
        getStoredInvitations(),
      ]);
      setUsers(usersData);
      setInvitations(
        invitationsData.filter((inv) => inv.companyId === appUser.companyId)
      );
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [appUser?.companyId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' });
      return;
    }
    if (!appUser?.companyId || !appUser?.uid || !appUser?.email) {
      toast({ title: 'Error', description: 'Please sign in again', variant: 'destructive' });
      return;
    }

    setIsInviting(true);
    try {
      // Get company details for the invitation
      const company = await getCompany(appUser.companyId);
      if (!company) {
        toast({ title: 'Error', description: 'Company not found', variant: 'destructive' });
        return;
      }

      const result = await createAndSendInvitation({
        email: inviteEmail.trim().toLowerCase(),
        companyId: appUser.companyId,
        companyName: company.name,
        inviterId: appUser.uid,
        inviterEmail: appUser.email,
        inviterName: appUser.name,
        role: inviteRole,
        type: inviteType,
        // Use decrypted API keys from hook
        brevoApiKey: apiKeys?.brevo?.apiKey,
        brevoSenderEmail: apiKeys?.brevo?.senderEmail,
        brevoSenderName: apiKeys?.brevo?.senderName,
      });

      if (result.success) {
        toast({ title: 'Success', description: result.message || 'Invitation sent successfully' });
        setInviteEmail('');
        setInviteRole('user');
        setInviteType('office');
        setIsInviteOpen(false);
        loadData();
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await deleteInvitation(invitationId);
      toast({ title: 'Invitation cancelled' });
      loadData();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to cancel invitation',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      manager: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      user: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
    };
    return styles[role] || styles.user;
  };

  const getInitials = (user: AppUser) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.charAt(0).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Team Members
          </h2>
          <p className="text-sm text-stone-500 mt-1">Manage your team</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse bg-stone-100 dark:bg-stone-900 rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  const canInvite = isAdmin || isSuperAdmin;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Team Members
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-500 mt-1">
            Manage your team members and their access levels
          </p>
        </div>
        {canInvite && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9 gap-2">
                <Icon icon="solar:user-plus-linear" className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      Role
                    </label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as Role)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                      Type
                    </label>
                    <Select
                      value={inviteType}
                      onValueChange={(v) => setInviteType(v as UserType)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Office</SelectItem>
                        <SelectItem value="field">Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={isInviting} className="h-9">
                  {isInviting ? (
                    <>
                      <Icon
                        icon="solar:refresh-linear"
                        className="h-4 w-4 mr-2 animate-spin"
                      />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {users.length}
          </p>
          <p className="text-xs text-stone-500">Active Members</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {invitations.length}
          </p>
          <p className="text-xs text-stone-500">Pending Invites</p>
        </div>
        <div className="bg-stone-50 dark:bg-stone-900/50 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {users.filter((u) => u.role === 'admin' || u.role === 'manager').length}
          </p>
          <p className="text-xs text-stone-500">Admins & Managers</p>
        </div>
      </div>

      {/* Active Members */}
      <SettingsCard
        title="Active Members"
        description={`${users.length} member${users.length !== 1 ? 's' : ''} in your organization`}
        icon="solar:users-group-two-rounded-linear"
      >
        <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
          {users.map((user) => (
            <div
              key={user.uid}
              className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-stone-200 dark:border-stone-700">
                  <AvatarFallback className="bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 text-stone-600 dark:text-stone-400 text-sm font-medium">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                    {user.name || 'Unnamed User'}
                    {user.uid === appUser?.uid && (
                      <span className="ml-2 text-[10px] font-normal text-stone-500">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-stone-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md',
                    getRoleBadge(user.role)
                  )}
                >
                  {user.role}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase rounded-md bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-500">
                  {user.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SettingsCard>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <SettingsCard
          title="Pending Invitations"
          description="Invitations waiting to be accepted"
          icon="solar:letter-linear"
        >
          <div className="divide-y divide-stone-100 dark:divide-stone-800/60">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 dark:hover:bg-stone-900/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <Icon
                      icon="solar:hourglass-linear"
                      className="h-5 w-5 text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                      {invitation.email}
                    </p>
                    <p className="text-xs text-stone-500">Invitation pending</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-semibold uppercase rounded-md',
                      getRoleBadge(invitation.role)
                    )}
                  >
                    {invitation.role}
                  </span>
                  {canInvite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>
      )}
    </div>
  );
}
