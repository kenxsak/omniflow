import { Skeleton } from "@/components/ui/skeleton";

export default function TeamManagementLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-7 w-[60px]" />
          </div>
        ))}
      </div>

      {/* Attendance Card */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <Skeleton className="h-5 w-[150px]" />
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-3 w-[80px]" />
              </div>
            </div>
            <Skeleton className="h-9 w-[100px] rounded-lg" />
          </div>
        </div>
      </div>

      {/* Team Table */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800">
          <Skeleton className="h-5 w-[180px]" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Table Header */}
            <div className="bg-stone-50 dark:bg-stone-900 px-4 py-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            </div>
            
            {/* Table Rows */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 border-b border-stone-100 dark:border-stone-800 last:border-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[120px]" />
                      <Skeleton className="h-3 w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-[70px] rounded-full" />
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-5 w-[60px] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
