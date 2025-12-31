
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PageTitle from '@/components/ui/page-title';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Link as LinkIcon, ExternalLink, Rss, FileCode, Loader2, Eye, EyeOff, Trash, Calendar, AlertTriangle } from 'lucide-react';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import type { SocialMediaPost } from '@/types/social-media';
import { getStoredSocialMediaPostsAction, deleteStoredSocialMediaPostAction, togglePostStatusAction, bulkDeleteSocialPostsAction, deleteAllDraftsAction, deleteOldPostsAction, checkSavedPostsLimitAction } from '@/app/actions/social-media-actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { useAuth } from '@/hooks/use-auth';
import { InlinePublishButton } from '@/components/social-media/quick-publish-buttons';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ContentHubPage() {
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { appUser, isSuperAdmin } = useAuth();
  
  // Bulk selection state
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupDays, setCleanupDays] = useState('30');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Saved posts limit state
  const [limitInfo, setLimitInfo] = useState<{
    canSave: boolean;
    currentCount: number;
    maxAllowed: number | null;
    planName: string;
  } | null>(null);

  const loadPosts = useCallback(async () => {
    if (!appUser?.companyId) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    
    // Load posts and limit info in parallel
    const [postsResult, limitResult] = await Promise.all([
      getStoredSocialMediaPostsAction(appUser.uid, appUser.companyId),
      checkSavedPostsLimitAction(appUser.companyId)
    ]);
    
    if(postsResult.success && postsResult.data){
        setPosts(postsResult.data);
    } else {
        toast({ title: 'Error', description: postsResult.error || 'Failed to load posts.', variant: 'destructive'});
    }
    
    setLimitInfo(limitResult);
    setIsLoading(false);
    setSelectedPosts(new Set()); // Clear selection on reload
    setCurrentPage(1); // Reset to first page on reload
  }, [appUser, toast]);

  // Pagination computed values
  const totalPages = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const paginatedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, posts.length);

  useEffect(() => {
    if (appUser) {
        loadPosts();
    }
  }, [appUser, loadPosts]);

  // Selection handlers
  const toggleSelectAll = () => {
    // Select/deselect only the posts on the current page
    const currentPagePostIds = paginatedPosts.map(p => p.id);
    const allCurrentPageSelected = currentPagePostIds.every(id => selectedPosts.has(id));
    
    if (allCurrentPageSelected) {
      // Deselect all on current page
      const newSelected = new Set(selectedPosts);
      currentPagePostIds.forEach(id => newSelected.delete(id));
      setSelectedPosts(newSelected);
    } else {
      // Select all on current page
      const newSelected = new Set(selectedPosts);
      currentPagePostIds.forEach(id => newSelected.add(id));
      setSelectedPosts(newSelected);
    }
  };
  
  // Check if all posts on current page are selected
  const allCurrentPageSelected = paginatedPosts.length > 0 && 
    paginatedPosts.every(p => selectedPosts.has(p.id));

  const toggleSelectPost = (postId: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else {
      newSelected.add(postId);
    }
    setSelectedPosts(newSelected);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!appUser?.companyId || selectedPosts.size === 0) return;
    
    setIsBulkDeleting(true);
    const result = await bulkDeleteSocialPostsAction(
      appUser.uid, 
      appUser.companyId, 
      Array.from(selectedPosts)
    );
    
    if (result.success) {
      toast({ 
        title: "Posts Deleted", 
        description: `Successfully deleted ${result.data?.deleted || 0} posts.` 
      });
      await loadPosts();
    } else {
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    }
    setIsBulkDeleting(false);
  };

  // Delete all drafts handler
  const handleDeleteAllDrafts = async () => {
    if (!appUser?.companyId) return;
    
    setIsBulkDeleting(true);
    const result = await deleteAllDraftsAction(appUser.uid, appUser.companyId);
    
    if (result.success) {
      toast({ 
        title: "Drafts Deleted", 
        description: `Successfully deleted ${result.data?.deleted || 0} draft posts.` 
      });
      await loadPosts();
    } else {
      toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    }
    setIsBulkDeleting(false);
  };

  // Delete old posts handler
  const handleDeleteOldPosts = async () => {
    if (!appUser?.companyId) return;
    
    setIsBulkDeleting(true);
    const days = parseInt(cleanupDays);
    const result = await deleteOldPostsAction(appUser.uid, appUser.companyId, days);
    
    if (result.success) {
      toast({ 
        title: "Old Posts Cleaned Up", 
        description: `Successfully deleted ${result.data?.deleted || 0} draft posts older than ${days} days.` 
      });
      await loadPosts();
    } else {
      toast({ title: "Cleanup Failed", description: result.error, variant: "destructive" });
    }
    setIsBulkDeleting(false);
    setShowCleanupDialog(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!appUser?.companyId) return;

    const result = await deleteStoredSocialMediaPostAction(appUser.uid, postId);
    if (result.success) {
        toast({ title: "Post Deleted", description: "The saved post has been removed from your content hub." });
        await loadPosts(); // Refresh the list
    } else {
        toast({ title: "Delete Failed", description: result.error, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (post: SocialMediaPost) => {
    if (!appUser?.uid) return;

    const newStatus = post.status === 'Posted' ? 'Draft' : 'Posted';
    const result = await togglePostStatusAction(appUser.uid, post.id, newStatus);
    
    if (result.success) {
        const statusMessage = newStatus === 'Posted' 
            ? "Your content is now live and publicly visible!" 
            : "Your content has been hidden from public view.";
        toast({ 
            title: `Status Changed to ${newStatus}`, 
            description: statusMessage 
        });
        await loadPosts();
    } else {
        toast({ 
            title: "Status Update Failed", 
            description: result.error, 
            variant: "destructive" 
        });
    }
  };

  const getStatusBadgeVariant = (status: SocialMediaPost['status']): "secondary" | "outline" | "default" | "destructive" => {
    switch(status) {
      case 'Draft': return 'secondary';
      case 'Posted': return 'default';
      case 'Scheduled': return 'outline';
      default: return 'secondary';
    }
  }
  
  const getStatusBadgeStyle = (status: SocialMediaPost['status']) => {
    switch(status) {
      case 'Draft': 
        return { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' };
      case 'Posted': 
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'Scheduled': 
        return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' };
      default: 
        return { backgroundColor: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: '1px solid rgba(107, 114, 128, 0.3)' };
    }
  }

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/blog/${postId}`;
    navigator.clipboard.writeText(url).then(() => {
        toast({ title: "Public Page URL Copied!", description: "The public link to your content page has been copied." });
    });
  };

  const getIconForPlatform = (platform: SocialMediaPost['platform']) => {
    switch (platform) {
        case 'BlogPost':
            return <Rss className="h-4 w-4" style={{ color: '#f59e0b' }} />;
        case 'SalesLandingPage':
            return <FileCode className="h-4 w-4" style={{ color: '#10b981' }} />;
        case 'Instagram':
            return <Icon icon="mdi:instagram" className="h-4 w-4" style={{ color: '#e1306c' }} />;
        case 'TwitterX':
            return <Icon icon="ri:twitter-x-fill" className="h-4 w-4" style={{ color: '#1da1f2' }} />;
        case 'LinkedIn':
            return <Icon icon="mdi:linkedin" className="h-4 w-4" style={{ color: '#0077b5' }} />;
        case 'Facebook':
            return <Icon icon="mdi:facebook" className="h-4 w-4" style={{ color: '#1877f2' }} />;
        case 'YouTubeVideoScript':
            return <Icon icon="mdi:youtube" className="h-4 w-4" style={{ color: '#ff0000' }} />;
        default:
            return <Edit3 className="h-4 w-4" style={{ color: '#8b5cf6' }} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Saved Posts Limit Warning */}
      {limitInfo && limitInfo.maxAllowed !== null && !isSuperAdmin && (
        <Alert className={limitInfo.canSave 
          ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30" 
          : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30"
        }>
          {!limitInfo.canSave && <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
          <AlertTitle className={limitInfo.canSave ? "text-blue-800 dark:text-blue-200" : "text-amber-800 dark:text-amber-200"}>
            {limitInfo.canSave 
              ? `📦 ${limitInfo.currentCount} / ${limitInfo.maxAllowed} saved posts used`
              : `📦 Storage Limit Reached`
            }
          </AlertTitle>
          <AlertDescription className={limitInfo.canSave ? "text-blue-700 dark:text-blue-300" : "text-amber-700 dark:text-amber-300"}>
            {limitInfo.canSave ? (
              <p>Your <strong>{limitInfo.planName}</strong> plan allows {limitInfo.maxAllowed} saved posts. {limitInfo.maxAllowed - limitInfo.currentCount} remaining.</p>
            ) : (
              <div className="space-y-2">
                <p>Your <strong>{limitInfo.planName}</strong> plan allows only {limitInfo.maxAllowed} saved posts. Delete some posts or upgrade for unlimited storage.</p>
                <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                  <Link href="/settings?tab=billing">
                    Upgrade Now →
                  </Link>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <PageTitle
          title="Website & Blog Content Hub"
          description="A central library for all your saved content. Blog posts and sales pages are instantly live upon creation."
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Bulk Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800">
                <Trash className="mr-2 h-4 w-4" style={{ color: '#6b7280' }} /> Cleanup
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleDeleteAllDrafts}
                disabled={isBulkDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete All Drafts
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setShowCleanupDialog(true)}
                disabled={isBulkDeleting}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Delete Old Drafts...
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button asChild size="sm" className="flex-1 sm:flex-none text-white" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <Link href="/social-media">
              <Edit3 className="mr-2 h-4 w-4" /> <span className="hidden xs:inline">Go to </span>Content Generator
            </Link>
          </Button>
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedPosts.size > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedPosts.size} post{selectedPosts.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedPosts(new Set())}
              >
                Clear
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    disabled={isBulkDeleting}
                  >
                    {isBulkDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedPosts.size} posts?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the selected posts.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBulkDelete} 
                      className={buttonVariants({ variant: "destructive" })}
                    >
                      Delete Posts
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Old Posts Dialog */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Old Draft Posts</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all draft posts older than the selected number of days. Published posts will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={cleanupDays} onValueChange={setCleanupDays}>
              <SelectTrigger>
                <SelectValue placeholder="Select days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Older than 7 days</SelectItem>
                <SelectItem value="14">Older than 14 days</SelectItem>
                <SelectItem value="30">Older than 30 days</SelectItem>
                <SelectItem value="60">Older than 60 days</SelectItem>
                <SelectItem value="90">Older than 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteOldPosts} 
              className={buttonVariants({ variant: "destructive" })}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Old Drafts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-8 top-0 h-0.5 rounded-b-full bg-purple-500 dark:bg-purple-400" />
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Icon icon="solar:folder-with-files-bold" className="h-5 w-5" style={{ color: '#8b5cf6' }} />
            Saved Content
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            All your saved content is stored in the database. This hub is where you manage content for social media and your public-facing pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {/* Mobile Select All */}
            {paginatedPosts.length > 0 && !isLoading && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={allCurrentPageSelected}
                  onCheckedChange={toggleSelectAll}
                  id="select-all-mobile"
                />
                <label htmlFor="select-all-mobile" className="text-sm text-muted-foreground cursor-pointer">
                  Select All on Page ({paginatedPosts.length})
                </label>
              </div>
            )}
            {isLoading ? (
              <div className="h-24 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin"/></div>
            ) : posts.length === 0 ? (
              <div className="h-24 flex items-center justify-center text-center text-muted-foreground text-sm">
                No saved posts yet. Go to the "Content Generator" to create and save some content.
              </div>
            ) : (
              paginatedPosts.map((post) => (
                <div key={post.id} className={`p-3 border rounded-md space-y-2 ${selectedPosts.has(post.id) ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedPosts.has(post.id)}
                        onCheckedChange={() => toggleSelectPost(post.id)}
                      />
                      {getIconForPlatform(post.platform)}
                      <span className="text-sm font-medium">{post.platform}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]" style={getStatusBadgeStyle(post.status)}>{post.status}</Badge>
                      {(post.platform === 'BlogPost' || post.platform === 'SalesLandingPage') && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => handleToggleStatus(post)}
                        >
                          {post.status === 'Posted' ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{post.textContent.substring(0, 100)}...</p>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-[10px] text-muted-foreground">
                      Created {format(new Date(post.createdAt || Date.now()), 'PP')}
                    </span>
                    <div className="flex items-center gap-1">
                      {/* Quick Publish for social media posts */}
                      {post.platform !== 'BlogPost' && post.platform !== 'SalesLandingPage' && (
                        <InlinePublishButton content={post.textContent} />
                      )}
                      {(post.platform === 'BlogPost' || post.platform === 'SalesLandingPage') && (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild>
                            <Link href={`/blog/${post.id}`} target="_blank"><ExternalLink className="h-3 w-3" style={{ color: '#3b82f6' }} /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-teal-50 dark:hover:bg-teal-900/20" onClick={() => handleCopyLink(post.id)}>
                            <LinkIcon className="h-3 w-3" style={{ color: '#14b8a6' }} />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-purple-50 dark:hover:bg-purple-900/20" asChild>
                        <Link href={`/social-media?editPostId=${post.id}`}><Edit3 className="h-3 w-3" style={{ color: '#8b5cf6' }} /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="h-3 w-3" style={{ color: '#ef4444' }} /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePost(post.id)} className={buttonVariants({ variant: "destructive" })}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allCurrentPageSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[40%]">Content (Start)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto"/></TableCell></TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No saved posts yet. Go to the "Content Generator" to create and save some content.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPosts.map((post) => (
                    <TableRow key={post.id} className={selectedPosts.has(post.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPosts.has(post.id)}
                          onCheckedChange={() => toggleSelectPost(post.id)}
                          aria-label={`Select post ${post.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {getIconForPlatform(post.platform)}
                            <span>{post.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">{post.textContent.substring(0, 120)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" style={getStatusBadgeStyle(post.status)}>{post.status}</Badge>
                          {(post.platform === 'BlogPost' || post.platform === 'SalesLandingPage') && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6"
                                    onClick={() => handleToggleStatus(post)}
                                  >
                                    {post.status === 'Posted' ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{post.status === 'Posted' ? 'Hide from public' : 'Make public'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-xs">
                        {format(new Date(post.createdAt || Date.now()), 'PPp')}
                      </TableCell>
                      <TableCell className="text-right">
                         <TooltipProvider>
                            {/* Quick Publish for social media posts */}
                            {post.platform !== 'BlogPost' && post.platform !== 'SalesLandingPage' && (
                              <InlinePublishButton content={post.textContent} />
                            )}
                            {(post.platform === 'BlogPost' || post.platform === 'SalesLandingPage') && (
                                <>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" asChild className="hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            <Link href={`/blog/${post.id}`} target="_blank">
                                                <ExternalLink className="h-4 w-4" style={{ color: '#3b82f6' }} />
                                            </Link>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>View Public Page</p></TooltipContent>
                                </Tooltip>
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="ghost" size="icon" onClick={() => handleCopyLink(post.id)} className="hover:bg-teal-50 dark:hover:bg-teal-900/20">
                                            <LinkIcon className="h-4 w-4" style={{ color: '#14b8a6' }} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Copy Public Link</p></TooltipContent>
                                </Tooltip>
                                </>
                            )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" asChild className="hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                <Link href={`/social-media?editPostId=${post.id}`}>
                                  <Edit3 className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit in Generator</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this saved post.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeletePost(post.id)} className={buttonVariants({ variant: "destructive" })}>
                                Delete Post
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {posts.length > ITEMS_PER_PAGE && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-4">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-medium">{startIndex}</span> to <span className="font-medium">{endIndex}</span> of <span className="font-medium">{posts.length}</span> posts
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <Icon icon="solar:double-alt-arrow-left-linear" className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
                </Button>
                
                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <Icon icon="solar:double-alt-arrow-right-linear" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
