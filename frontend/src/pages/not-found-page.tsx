import { Link } from "react-router"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        This route does not exist yet.
      </p>
      <Button asChild>
        <Link to="/">Back to Live</Link>
      </Button>
    </div>
  )
}
