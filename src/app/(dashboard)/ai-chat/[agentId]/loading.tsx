import { Icon } from '@iconify/react';

export default function AgentLoading() {
  return (
    <div className="h-[calc(100vh-80px)] flex">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:block w-80 flex-shrink-0 border-r border-stone-200 dark:border-stone-800 p-4">
        <div className="h-9 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Skeleton */}
        <div className="border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-4">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-stone-100 dark:bg-stone-800 rounded-xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-4 w-32 bg-stone-100 dark:bg-stone-800 rounded animate-pulse mb-1"></div>
              <div className="h-3 w-48 bg-stone-100 dark:bg-stone-800 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Chat Area Skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Icon icon="solar:loading-bold" className="h-8 w-8 text-muted-foreground animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading agent...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
