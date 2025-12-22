import { Skeleton } from "@/components/ui/skeleton";

export default function DigitalCardLoading() {
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

      {/* Card Preview & Editor */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-6">
          <Skeleton className="h-5 w-[100px] mb-4" />
          <div className="aspect-[9/16] max-w-[300px] mx-auto">
            <Skeleton className="h-full w-full rounded-2xl" />
          </div>
        </div>

        {/* Editor */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6">
          <Skeleton className="h-5 w-[120px]" />
          
          {/* Form Fields */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-[80px]" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Skeleton className="h-3 w-[100px]" />
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-8 rounded-full" />
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
