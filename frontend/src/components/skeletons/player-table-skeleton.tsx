import { Skeleton } from "@/components/ui/skeleton";

export function PlayerTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col border rounded-lg bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex gap-4 border-b px-4 py-3 bg-muted/20">
        {[40, 120, 80, 60, 60, 60].map((w, i) => (
          <Skeleton key={i} className="h-3" style={{ width: w }} />
        ))}
      </div>
      {/* Rows */}
      <div className="flex flex-col">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 border-b px-4 py-3 items-center last:border-b-0">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
