import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router"

import "./index.css"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { TooltipProvider } from "@/components/ui/tooltip"
import { router } from "@/router"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TooltipProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </TooltipProvider>
  </StrictMode>
)
