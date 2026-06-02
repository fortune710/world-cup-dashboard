import { cn } from "@/lib/utils"

function Spinner({
  className,
  ...props
}: React.ComponentProps<"div"> & { "aria-label"?: string }) {
  return (
    <div
      role="status"
      aria-label={props["aria-label"] ?? "Loading"}
      className={cn(
        "size-4 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Spinner }

