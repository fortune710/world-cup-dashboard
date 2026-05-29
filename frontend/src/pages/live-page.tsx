import { GroupStageStandings } from "@/components/chart-area-interactive"
import { PowerRankingTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"

import { LiveRush } from "@/components/live-rush"
import TopPerformers from "@/components/top-perfomer"

export function LivePage() {
  return (
    <div className="flex flex-col gap-2 py-2 md:gap-4 md:py-4">
      <LiveRush />
      <SectionCards />
      <div className="grid grid-cols-1 items-stretch gap-2 px-4 lg:grid-cols-3 lg:px-6">
        <div className="col-span-1 flex lg:col-span-2">
          <GroupStageStandings className="flex-1" />
        </div>
        <div className="col-span-1 flex">
          <TopPerformers className="flex-1" />
        </div>
      </div>
      <PowerRankingTable />
    </div>
  )
}
