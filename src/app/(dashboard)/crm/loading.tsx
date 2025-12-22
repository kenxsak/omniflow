import { Skeleton } from "@/components/ui/skeleton";

export default function CRMLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[100px] rounded-lg" />
          <Skeleton className="h-9 w-[120px] rounded-lg" />
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm rounded-lg" />
        <Skeleton className="h-9 w-[120px] rounded-lg" />
        <Skeleton className="h-9 w-[100px] rounded-lg" />
      </div>

      {/* Table */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="bg-stone-50 dark:bg-stone-900 px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-[150px]" />
            <Skeleton className="h-4 w-[120px]" />
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-[80px]" />
            <Skeleton className="h-4 w-[100px]" />
          </div>
        </div>
        
        {/* Table Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-4 rounded" />
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-[140px]" />
                  <Skeleton className="h-3 w-[180px]" />
                </div>
              </div>
              <Skeleton className="h-5 w-[80px] rounded-full" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-[150px]" />
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
