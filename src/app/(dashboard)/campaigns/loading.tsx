import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[180px]" />
          <Skeleton className="h-4 w-[280px]" />
        </div>
        <Skeleton className="h-9 w-[140px] rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
            <Skeleton className="h-7 w-[80px]" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-px">
        <div className="flex gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-[100px]" />
          ))}
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-[180px]" />
                <Skeleton className="h-3 w-[120px]" />
              </div>
              <Skeleton className="h-5 w-[60px] rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-[60px]" />
                <Skeleton className="h-3 w-[40px]" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
