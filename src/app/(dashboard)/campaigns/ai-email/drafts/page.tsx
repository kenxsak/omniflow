'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { getAICampaignDraftsAction, deleteAICampaignDraftAction } from '@/app/actions/ai-campaign-draft-actions';
import type { UnifiedCampaignDraft } from '@/types/ai-campaigns';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export default function AICampaignDraftsPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<UnifiedCampaignDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (appUser?.idToken) {
      loadDrafts();
    }
  }, [appUser?.idToken]);

  const loadDrafts = async () => {
    if (!appUser?.idToken) return;
    
    setIsLoading(true);
    try {
      const result = await getAICampaignDraftsAction({ idToken: appUser.idToken });
      
      if (result.success && result.drafts) {
        setDrafts(result.drafts);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to load drafts',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drafts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (draftId: string) => {
    if (!appUser?.idToken) return;
    if (!confirm('Are you sure you want to delete this draft?')) return;
    
    setDeletingId(draftId);
    try {
      const result = await deleteAICampaignDraftAction({
        idToken: appUser.idToken,
        draftId,
      });
      
      if (result.success) {
        toast({
          title: 'Draft Deleted',
          description: 'The draft has been deleted successfully',
        });
        loadDrafts();
      } else {
        toast({
          title: 'Delete Failed',
          description: result.error || 'Failed to delete draft',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete draft',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(drafts.length / pageSize);
  const paginatedDrafts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return drafts.slice(start, start + pageSize);
  }, [drafts, currentPage, pageSize]);

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Published
          </span>
        );
      case 'ready':
        return <span className="text-xs font-medium text-muted-foreground">Ready</span>;
      case 'draft':
        return (
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Draft
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            Failed
          </span>
        );
      case 'generating':
        return <span className="text-xs font-medium text-muted-foreground">Generating</span>;
      case 'publishing':
        return (
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Publishing
          </span>
        );
      default:
        return <span className="text-xs font-medium text-muted-foreground">{status}</span>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Icon icon="solar:letter-linear" className="h-3.5 w-3.5" />;
      case 'sms':
        return <Icon icon="solar:chat-square-linear" className="h-3.5 w-3.5" />;
      case 'whatsapp':
        return <Icon icon="solar:chat-round-dots-linear" className="h-3.5 w-3.5" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="relative flex w-full flex-col gap-4">
          <div className="flex justify-between gap-x-8 items-center">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h1 className="text-2xl font-semibold text-foreground">AI Campaign Drafts</h1>
              <p className="text-sm text-muted-foreground">View and manage your saved campaign drafts</p>
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
            <h1 className="text-2xl font-semibold text-foreground">AI Campaign Drafts</h1>
            <p className="text-sm text-muted-foreground">View and manage your saved campaign drafts</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadDrafts} variant="outline" size="sm" className="h-8 shadow-sm">
              <Icon icon="solar:refresh-linear" className="mr-1.5 h-4 w-4" />
              Refresh
            </Button>
            <Button asChild size="sm" className="h-8 shadow-sm">
              <Link href="/campaigns/ai-email">
                <Icon icon="solar:add-circle-linear" className="mr-1.5 h-4 w-4" />
                Create New
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Total Drafts</span>
              <Icon icon="solar:document-text-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{drafts.length}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Published</span>
              <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{drafts.filter(d => d.status === 'published').length}</p>
          </div>
        </div>
        <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
          <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">In Progress</span>
              <Icon icon="solar:pen-new-square-linear" className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{drafts.filter(d => d.status === 'draft').length}</p>
          </div>
        </div>
      </div>

      {/* Drafts List */}
      <div className="relative border border-stone-200 dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 overflow-hidden">
        <div className="absolute inset-x-10 top-0 h-0.5 rounded-b-full bg-stone-400 dark:bg-stone-600" />
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Saved Drafts</span>
            <p className="text-xs text-muted-foreground mt-0.5">Your AI-generated campaign drafts</p>
          </div>
          {drafts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Show</span>
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
              <span className="text-xs text-muted-foreground">per page</span>
            </div>
          )}
        </div>

        <div className="p-4">
          {drafts.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="solar:document-text-linear" className="h-10 w-10 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-sm text-muted-foreground mb-1">No drafts found</p>
              <p className="text-xs text-muted-foreground mb-4">
                Drafts will appear here when you generate campaigns in the AI Campaign Studio
              </p>
              <Button asChild size="sm" className="h-8 shadow-sm">
                <Link href="/campaigns/ai-email">
                  <Icon icon="solar:magic-stick-3-linear" className="mr-1.5 h-4 w-4" />
                  Create Your First Campaign
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {paginatedDrafts.map((draft) => {
                  const createdDate = typeof draft.createdAt === 'string'
                    ? new Date(draft.createdAt)
                    : draft.createdAt.toDate();
                  
                  return (
                    <div 
                      key={draft.id} 
                      className="border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900/50 p-3"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {draft.parsedBrief?.campaignGoal || 'No goal specified'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(createdDate, 'MMM dd, HH:mm')}
                            </p>
                          </div>
                          {getStatusBadge(draft.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              {draft.selectedChannels.map((channel) => (
                                <span key={channel}>{getChannelIcon(channel)}</span>
                              ))}
                            </span>
                            <span className="flex items-center gap-1">
                              <Icon icon="solar:star-linear" className="h-3 w-3" />
                              {draft.aiCreditsConsumed || 0}
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                              <Link href={`/campaigns/ai-email?draft=${draft.id}`}>
                                <Icon icon="solar:play-linear" className="h-3 w-3 mr-1" />
                                Use
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleDelete(draft.id)}
                              disabled={deletingId === draft.id}
                            >
                              {deletingId === draft.id ? (
                                <Icon icon="solar:refresh-linear" className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Icon icon="solar:trash-bin-minimalistic-linear" className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <div className="rounded-xl bg-stone-50 dark:bg-stone-900/50 p-1">
                  <div className="rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <table className="w-full text-sm table-fixed">
                      <thead>
                        <tr className="bg-stone-100/50 dark:bg-stone-800/50">
                          <th className="w-[35%] text-left py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Campaign Goal</th>
                          <th className="w-[12%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Channels</th>
                          <th className="w-[12%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Status</th>
                          <th className="w-[12%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">AI Credits</th>
                          <th className="w-[12%] text-center py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Created</th>
                          <th className="w-[17%] text-right py-3 px-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase align-middle">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-stone-950">
                        {paginatedDrafts.map((draft) => {
                          const createdDate = typeof draft.createdAt === 'string'
                            ? new Date(draft.createdAt)
                            : draft.createdAt.toDate();
                          
                          return (
                            <tr key={draft.id} className="border-t border-stone-200 dark:border-stone-800 hover:bg-muted/30 transition-colors group">
                              <td className="py-3 px-3 align-middle">
                                <span className="font-medium text-sm line-clamp-1">
                                  {draft.parsedBrief?.campaignGoal || 'No goal specified'}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3 align-middle">
                                <div className="flex justify-center gap-2 text-muted-foreground">
                                  {draft.selectedChannels.map((channel) => (
                                    <span key={channel}>{getChannelIcon(channel)}</span>
                                  ))}
                                </div>
                              </td>
                              <td className="text-center py-3 px-3 align-middle">{getStatusBadge(draft.status)}</td>
                              <td className="text-center py-3 px-3 align-middle">
                                <span className="text-xs text-muted-foreground tabular-nums">
                                  {draft.aiCreditsConsumed || 0}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3 align-middle text-xs text-muted-foreground">
                                {format(createdDate, 'MMM dd, HH:mm')}
                              </td>
                              <td className="text-right py-3 px-3 align-middle">
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-7 text-xs opacity-60 group-hover:opacity-100"
                                  >
                                    <Link href={`/campaigns/ai-email?draft=${draft.id}`}>
                                      <Icon icon="solar:play-linear" className="h-3.5 w-3.5 mr-1" />
                                      Use Draft
                                    </Link>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-60 group-hover:opacity-100"
                                    onClick={() => handleDelete(draft.id)}
                                    disabled={deletingId === draft.id}
                                  >
                                    {deletingId === draft.id ? (
                                      <Icon icon="solar:refresh-linear" className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Icon icon="solar:trash-bin-minimalistic-linear" className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
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
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, drafts.length)} of {drafts.length} drafts
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
