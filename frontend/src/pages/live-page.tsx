import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import data from "@/app/dashboard/data.json"
import { LiveRush } from "@/components/live-rush"
import TopPerfomer from "@/components/top-perfomer"

export function LivePage() {
  return (
    <div className="flex flex-col gap-2 py-2 md:gap-4 md:py-4">
      <LiveRush />
      <SectionCards />
      <div className="px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-3 gap-2">
       <div className="col-span-1 lg:col-span-2 h-full">
          <ChartAreaInteractive />
       </div>
       <div className="col-span-1">
        <TopPerfomer />
       </div>
      </div>
      <DataTable data={data} />
    </div>
  )
}
