// src/components/team/SquadPlayersCard.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSquadPlayers } from "@/hooks/use-squad-players";
import { logger } from "@/lib/logger";

export function SquadPlayersCard({ teamId }: { teamId: string }) {
  const { players, loading, error } = useSquadPlayers(teamId);

  logger.info("Rendering SquadPlayersCard", { teamId });

  if (loading) return <div>Loading squad...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Squad Players</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-2">
        {players.map((p) => (
          <Avatar key={p.id} className="size-12">
            {p.avatarUrl ? (
              <AvatarImage src={p.avatarUrl} alt={p.name} />
            ) : (
              <AvatarFallback>{p.name[0]}</AvatarFallback>
            )}
          </Avatar>
        ))}
      </CardContent>
    </Card>
  );
}
