import { Skeleton } from "@/components/ui/skeleton";

export default function AIChatLoading() {
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-3 w-[200px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-[100px] rounded-lg" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 py-6 space-y-4 overflow-hidden">
        {/* AI Message */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 max-w-[80%]">
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>

        {/* User Message */}
        <div className="flex gap-3 justify-end">
          <div className="space-y-2 max-w-[80%]">
            <Skeleton className="h-10 w-[200px] rounded-xl ml-auto" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        </div>

        {/* AI Message */}
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="space-y-2 max-w-[80%]">
            <Skeleton className="h-4 w-[350px]" />
            <Skeleton className="h-4 w-[280px]" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="pt-4 border-t border-stone-200 dark:border-stone-800">
        <div className="flex gap-2">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Skeleton className="h-3 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
