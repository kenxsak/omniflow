import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-6 w-[120px]" />
        <Skeleton className="h-4 w-[250px]" />
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block w-52 space-y-6">
          {[...Array(4)].map((_, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <Skeleton className="h-3 w-[60px] ml-3" />
              <div className="space-y-1">
                {[...Array(groupIdx === 0 ? 3 : 2)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl space-y-6">
          {/* Section Header */}
          <div className="space-y-1">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>

          {/* Card */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[200px]" />
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[180px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-[80px]" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Another Card */}
          <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-3 w-[180px]" />
              </div>
            </div>
            <div className="p-5 space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                  <Skeleton className="h-8 w-[100px] rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
