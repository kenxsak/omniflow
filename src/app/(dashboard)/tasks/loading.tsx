import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[120px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <Skeleton className="h-9 w-[120px] rounded-lg" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-[200px] rounded-lg" />
        <Skeleton className="h-9 w-[120px] rounded-lg" />
        <Skeleton className="h-9 w-[100px] rounded-lg" />
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-[250px]" />
                  <Skeleton className="h-5 w-[80px] rounded-full" />
                </div>
                <Skeleton className="h-4 w-[400px]" />
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                    <Skeleton className="h-3 w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-[70px]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
