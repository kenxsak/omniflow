
import { AppIcon } from "@/components/ui/app-icon";

export default function PerformanceChartPlaceholder() {
  return (
    <div className="h-[350px] w-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg bg-muted/30 p-6">
      <div className="h-16 w-16 rounded-xl bg-muted/80 dark:bg-muted flex items-center justify-center mb-4">
        <AppIcon name="trending-up" size={32} className="text-foreground" />
      </div>
      <p className="text-lg font-semibold text-foreground">Performance Chart</p>
      <p className="text-sm text-muted-foreground text-center">
        Your monthly leads and email engagement trends will be displayed here.
      </p>
      <p className="text-xs text-muted-foreground mt-2">(Chart component to be integrated)</p>
    </div>
  );
}
