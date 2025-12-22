import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-9 w-[120px] rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-[80px]" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-3 w-[60px]" />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4">
          <Skeleton className="h-5 w-[150px]" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-4">
          <Skeleton className="h-5 w-[150px]" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-[60%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
