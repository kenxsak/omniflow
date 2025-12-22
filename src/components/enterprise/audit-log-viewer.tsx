'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { getAuditLogsAction, exportAuditLogsAction } from '@/app/actions/enterprise-actions';
import type { AuditLogEntry } from '@/types/enterprise';
import { format, formatDistanceToNow } from 'date-fns';

const actionColors: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  view: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  assign: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  claim: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  release: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  login: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  logout: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  bulk_assign: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  export: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  import: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const severityColors: Record<string, string> = {
  info: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-red-500',
};

// Reusable Settings Card matching the theme
function SettingsCard({
  title,
  description,
  icon,
  headerAction,
  children,
}: {
  title: string;
  description: string;
  icon: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200/60 dark:border-stone-800/60 rounded-2xl bg-white dark:bg-stone-950 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="px-5 py-4 border-b border-stone-200/60 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 dark:bg-stone-800">
            <Icon icon={icon} className="h-4 w-4 text-stone-600 dark:text-stone-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        {headerAction}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    search: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    const result = await getAuditLogsAction({
      entityType: (filters.entityType as 'lead' | 'task' | 'deal' | 'user' | 'company') || undefined,
      action: filters.action || undefined,
      limit: 100,
    });
    setLogs(result.logs);
    setTotal(result.total);
    setIsLoading(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const result = await exportAuditLogsAction(thirtyDaysAgo, now);
    setIsExporting(false);

    if (result.success) {
      const blob = new Blob([JSON.stringify(result.logs, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Export Complete',
        description: `Exported ${result.logs.length} audit log entries`,
      });
    } else {
      toast({
        title: 'Export Failed',
        description: 'Could not export audit logs',
        variant: 'destructive',
      });
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        log.performedByName?.toLowerCase().includes(searchLower) ||
        log.performedByEmail?.toLowerCase().includes(searchLower) ||
        log.entityId.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <SettingsCard
      title="Audit Trail"
      description="Complete history of all actions performed in your CRM"
      icon="solar:shield-check-linear"
      headerAction={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={loadLogs}
            disabled={isLoading}
          >
            <Icon
              icon="solar:refresh-linear"
              className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Icon icon="solar:download-linear" className="h-3.5 w-3.5 mr-1.5" />
            )}
            Export (30 Days)
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Icon
                icon="solar:magnifer-linear"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                placeholder="Search by user, action, or entity..."
                className="pl-9 h-9"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          <Select
            value={filters.entityType || 'all'}
            onValueChange={(v) => setFilters({ ...filters, entityType: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="deal">Deals</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="company">Company</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.action || 'all'}
            onValueChange={(v) => setFilters({ ...filters, action: v === 'all' ? '' : v })}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="assign">Assign</SelectItem>
              <SelectItem value="claim">Claim</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9" onClick={loadLogs}>
            <Icon icon="solar:filter-linear" className="h-3.5 w-3.5 mr-1.5" />
            Apply
          </Button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Icon icon="solar:refresh-linear" className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="h-[400px] rounded-lg border border-stone-200/60 dark:border-stone-800/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50 dark:bg-stone-900/30">
                  <TableHead className="text-xs">Time</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Entity</TableHead>
                  <TableHead className="text-xs">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      className={`border-l-2 ${severityColors[log.severity] || 'border-l-transparent'}`}
                    >
                      <TableCell className="whitespace-nowrap py-2">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Icon icon="solar:clock-circle-linear" className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="solar:user-circle-linear"
                            className="h-4 w-4 text-muted-foreground"
                          />
                          <div>
                            <div className="text-xs font-medium">
                              {log.performedByName || 'Unknown'}
                            </div>
                            {log.performedByEmail && (
                              <div className="text-[10px] text-muted-foreground">
                                {log.performedByEmail}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${actionColors[log.action] || 'bg-stone-100'}`}
                        >
                          {log.action.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs">
                          <Badge variant="outline" className="mr-1 text-[10px]">
                            {log.entityType}
                          </Badge>
                          <span className="text-muted-foreground text-[10px]">
                            {log.entityId.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] py-2">
                        {log.metadata && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {JSON.stringify(log.metadata).substring(0, 40)}...
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      <Icon icon="solar:document-text-linear" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No audit logs found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="text-[10px] text-muted-foreground text-right">
          Showing {filteredLogs.length} of {total} entries
        </div>
      </div>
    </SettingsCard>
  );
}
