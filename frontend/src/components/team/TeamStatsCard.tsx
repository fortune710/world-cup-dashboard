// src/components/team/TeamStatsCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTeamStats } from "@/hooks/use-team-stats";
import { logger } from "@/lib/logger";

export function TeamStatsCard({ teamId }: { teamId: string }) {
  const { data, loading, error } = useTeamStats(teamId);

  logger.info("Rendering TeamStatsCard", { teamId });

  if (loading) return <div>Loading team stats...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!data) return null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Team Stats</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Badge variant="secondary" className="gap-1">
          Best: {data.bestAttribute} ({data.bestValue})
        </Badge>
        <Badge variant="destructive" className="gap-1">
          Worst: {data.worstAttribute} ({data.worstValue})
        </Badge>
      </CardContent>
    </Card>
  );
}
