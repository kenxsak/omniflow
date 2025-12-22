import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-[150px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-[120px] rounded-lg" />
          <Skeleton className="h-9 w-[100px] rounded-lg" />
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-2">
            <Skeleton className="h-3 w-[80px]" />
            <Skeleton className="h-7 w-[100px]" />
            <Skeleton className="h-3 w-[60px]" />
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(5)].map((_, colIdx) => (
          <div key={colIdx} className="flex-shrink-0 w-[300px]">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <Skeleton className="h-6 w-6 rounded" />
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {[...Array(colIdx === 0 ? 3 : colIdx === 1 ? 4 : 2)].map((_, cardIdx) => (
                <div key={cardIdx} className="border border-stone-200 dark:border-stone-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <Skeleton className="h-5 w-[80px] rounded-full" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3 w-[60px]" />
                    </div>
                    <Skeleton className="h-3 w-[50px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
