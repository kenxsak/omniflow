'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import type { CampaignJob } from '@/types/campaign-jobs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function CampaignDeliveryPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CampaignJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (appUser?.companyId) {
      loadCampaignJobs();
    }
  }, [appUser?.companyId]);

  const loadCampaignJobs = async () => {
    if (!appUser?.companyId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/campaign-jobs?companyId=${appUser.companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load campaign jobs',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading campaign jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaign jobs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(jobs.length / pageSize);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return jobs.slice(start, start + pageSize);
  }, [jobs, currentPage, pageSize]);

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  // Stats
  const stats = useMemo(() => ({
    total: jobs.length,
    completed: jobs.filter(j => j.status === 'completed').length,
    processing: jobs.filter(j => j.status === 'processing').length,
    failed: jobs.filter(j => j.status === 'failed').length,
  }), [jobs]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</span>;
      case 'processing':
        return <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Processing</span>;
      case 'failed':
        return <span className="text-xs font-medium text-red-600 dark:text-red-400">Failed</span>;
      case 'retrying':
        return <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Retrying</span>;
      case 'pending':
        return <span className="text-xs font-medium text-muted-foreground">Pending</span>;
      default:
        return <span className="text-xs font-medium text-muted-foreground">{status}</span>;
    }
  };

  const getChannelIcon = (jobType: string) => {
    switch (jobType) {
      case 'email':
        return <Icon icon="solar:letter-linear" className="h-4 w-4" />;
      case 'sms':
        return <Icon icon="solar:chat-square-linear" className="h-4 w-4" />;
      case 'whatsapp':
        return <Icon icon="solar:chat-round-dots-linear" className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getProviderLabel = (job: CampaignJob) => {
    const provider = job.emailData?.provider;
    if (!provider) return null;
    const providerMap: Record<string, string> = {
      'brevo': 'Brevo',
      'sender': 'Sender.net',
      'smtp': 'SMTP'
    };
    return providerMap[provider] || provider;
  };

  const getProgressPercentage = (job: CampaignJob) => {
    if (!job.progress || job.progress.total === 0) return 0;
    return Math.round((job.progress.sent / job.progress.total) * 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="relative flex w-full flex-col gap-4">
          <div className="flex justify-between gap-x-8 items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-2xl font-semibold text-foreground">Campaign Jobs</h1>
              <p className="text-sm text-muted-foreground">Track delivery status of your campaigns</p>
            </div>
          </div>
        </header>
        <div className="flex justify-center py-12">
          <Icon icon="solar:refresh-linear" className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="relative flex w-full flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="text-2xl font-semibold text-foreground">Campaign Jobs</h1>
            <p className="text-sm text-muted-foreground">Track delivery status of Email, SMS, and WhatsApp campaigns</p>
          </div>
          <Button onClick={loadCampaignJobs} variant="outline" size="sm" className="h-8 shadow-sm">
            <Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-blue-500 dark:bg-blue-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Jobs</span>
              <Icon icon="solar:layers-linear" className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stats.total}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-emerald-500 dark:bg-emerald-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Completed</span>
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stats.completed}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-amber-500 dark:bg-amber-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Processing</span>
              <Icon icon="solar:refresh-linear" className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stats.processing}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-rose-500 dark:bg-rose-400" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Failed</span>
              <Icon icon="solar:close-circle-linear" className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{stats.failed}</p>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Active Campaign Jobs</span>
            <p className="text-xs text-muted-foreground mt-0.5">Monitor the progress of your campaign delivery</p>
          </div>
          {jobs.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">Show</span>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="h-7 w-[70px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground hidden sm:inline">per page</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:inbox-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">No campaign jobs found</p>
              <p className="text-xs text-muted-foreground mb-4">
                Campaign jobs will appear here after you publish campaigns from the AI Campaign Studio
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block lg:hidden space-y-3">
                {paginatedJobs.map((job) => {
                  const createdAt = job.createdAt as { toDate?: () => Date } | string | undefined;
                  const createdDate = createdAt && typeof createdAt === 'object' && createdAt.toDate
                    ? createdAt.toDate()
                    : new Date((createdAt as string) || Date.now());
                  const progressPercent = getProgressPercentage(job);
                  const provider = getProviderLabel(job);
                  const lastError = (job as { lastError?: string }).lastError;
                  
                  return (
                    <div 
                      key={job.id} 
                      className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="text-muted-foreground">
                              {getChannelIcon(job.jobType)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{job.campaignName}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="capitalize">{job.jobType}</span>
                                {provider && <span className="font-mono">• {provider}</span>}
                              </div>
                            </div>
                          </div>
                          {getStatusText(job.status)}
                        </div>
                        
                        <div className="space-y-1.5">
                          <Progress value={progressPercent} className="h-1.5" />
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {job.progress?.sent || 0}/{job.progress?.total || 0} sent
                              {job.progress && job.progress.failed > 0 && (
                                <span className="text-red-600 dark:text-red-400 ml-1">
                                  ({job.progress.failed} failed)
                                </span>
                              )}
                            </span>
                            <span>{format(createdDate, 'MMM dd, HH:mm')}</span>
                          </div>
                        </div>
                        
                        {lastError && (
                          <p className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                            {lastError}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="bg-stone-100/50 dark:bg-stone-800/50">
                          <th className="w-[10%] text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Channel</th>
                          <th className="w-[12%] text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Provider</th>
                          <th className="w-[28%] text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Campaign Name</th>
                          <th className="w-[10%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Status</th>
                          <th className="w-[18%] text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Progress</th>
                          <th className="w-[10%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Created</th>
                          <th className="w-[12%] text-right py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Details</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-stone-950">
                        {paginatedJobs.map((job) => {
                          const createdAt = job.createdAt as { toDate?: () => Date } | string | undefined;
                          const createdDate = createdAt && typeof createdAt === 'object' && createdAt.toDate
                            ? createdAt.toDate()
                            : new Date((createdAt as string) || Date.now());
                          const progressPercent = getProgressPercentage(job);
                          const provider = getProviderLabel(job);
                          const lastError = (job as { lastError?: string }).lastError;
                          
                          return (
                            <tr key={job.id} className="border-t border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors group">
                              <td className="py-3 px-3 align-middle">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  {getChannelIcon(job.jobType)}
                                  <span className="capitalize text-xs">{job.jobType}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 align-middle">
                                {provider ? (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {provider}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 align-middle">
                                <span className="font-medium text-sm line-clamp-1">{job.campaignName}</span>
                              </td>
                              <td className="text-center py-3 px-3 align-middle">
                                {getStatusText(job.status)}
                              </td>
                              <td className="py-3 px-3 align-middle">
                                <div className="space-y-1">
                                  <Progress value={progressPercent} className="h-1.5" />
                                  <p className="text-[10px] text-muted-foreground">
                                    {job.progress?.sent || 0}/{job.progress?.total || 0} sent
                                    {job.progress && job.progress.failed > 0 && (
                                      <span className="text-red-600 dark:text-red-400 ml-1">
                                        ({job.progress.failed} failed)
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </td>
                              <td className="text-center py-3 px-3 align-middle text-xs text-muted-foreground">
                                {format(createdDate, 'MMM dd, HH:mm')}
                              </td>
                              <td className="text-right py-3 px-3 align-middle">
                                {lastError && (
                                  <p className="text-[10px] text-red-600 dark:text-red-400 truncate max-w-[100px] ml-auto">
                                    {lastError}
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800 mt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, jobs.length)} of {jobs.length} jobs
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      <Icon icon="solar:alt-arrow-left-linear" className="h-3.5 w-3.5" />
                      <Icon icon="solar:alt-arrow-left-linear" className="h-3.5 w-3.5 -ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <Icon icon="solar:alt-arrow-left-linear" className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-3 text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
                      <Icon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5 -ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
