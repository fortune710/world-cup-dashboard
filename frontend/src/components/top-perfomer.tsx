import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
  } from "@/components/ui/item"


  interface TopGoalScorer {
    name: string;
    initials: string;
    nationality: string;
    goals: number;
    avatar: string;
  }
  interface TopAssistScorer {
    name: string;   
    initials: string;
    nationality: string;
    assists: number;
    avatar?: string;
  }
  interface TopSaveScorer {
    name: string;
    initials: string;
    nationality: string;
    saves: number;
    avatar?: string;
  }

  type TopPerformer = [TopGoalScorer[], TopAssistScorer[], TopSaveScorer[]];

  const topPerformers: TopPerformer = [
    [
      { name: "Lionel Messi", initials: "LM", nationality: "Argentina", goals: 5, avatar: "https://via.placeholder.com/150" },
      { name: "Kylian Mbappé", initials: "KM", nationality: "France", goals: 4, avatar: "https://via.placeholder.com/150" },
      { name: "Julián Álvarez", initials: "JA", nationality: "Argentina", goals: 4, avatar: "https://via.placeholder.com/150" },
    ],
    [
      { name: "Antoine Griezmann", initials: "AG", nationality: "France", assists: 5, avatar: "https://via.placeholder.com/150" },
      { name: "Kevin De Bruyne", initials: "KB", nationality: "Belgium", assists: 4, avatar: "https://via.placeholder.com/150" },
      { name: "Pedri", initials: "PD", nationality: "Spain", assists: 4, avatar: "https://via.placeholder.com/150" },
    ],
    [
      { name: "Ederson", initials: "ED", nationality: "Brazil", saves: 5, avatar: "https://via.placeholder.com/150" },
      { name: "Kepa Arrizabalaga", initials: "KA", nationality: "Spain", saves: 4, avatar: "https://via.placeholder.com/150" },
      { name: "Manuel Neuer", initials: "MN", nationality: "Germany", saves: 4, avatar: "https://via.placeholder.com/150" },
    ],
  ]
export default function TopPerformers() {
    return (
        <Card className="gap-3">
            <CardHeader className="pb-0">
                <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <Tabs defaultValue="Goals">
                    <TabsList>
                        <TabsTrigger value="Goals">Goals</TabsTrigger>
                        <TabsTrigger value="Assists">Assists</TabsTrigger>
                        <TabsTrigger value="Saves">Saves</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Goals">
                      <ScrollArea className="h-full">
                        <ItemGroup>
                          {topPerformers[0].map((performer) => (
                            <Item key={performer.name}>
                              <ItemMedia>
                                <Avatar>
                                  <AvatarImage
                                    src={performer.avatar}
                                    alt={performer.name}
                                  />
                                  <AvatarFallback>{performer.initials}</AvatarFallback>
                                </Avatar>
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{performer.name}</ItemTitle>
                                <ItemDescription>{performer.nationality}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <span className="text-sm font-medium tabular-nums">
                                  {performer.goals}
                                </span>
                              </ItemActions>
                            </Item>
                          ))}
                        </ItemGroup>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="Assists">
                      <ScrollArea className="h-full">
                        <ItemGroup>
                          {topPerformers[1].map((performer) => (
                            <Item key={performer.name}>
                              <ItemMedia>
                                <Avatar>
                                  <AvatarImage
                                    src={performer.avatar}
                                    alt={performer.name}
                                  />
                                  <AvatarFallback>{performer.initials}</AvatarFallback>
                                </Avatar>
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{performer.name}</ItemTitle>
                                <ItemDescription>{performer.nationality}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <span className="text-sm font-medium tabular-nums">
                                  {performer.assists}
                                </span>
                              </ItemActions>
                            </Item>
                          ))}
                        </ItemGroup>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent value="Saves">
                      <ScrollArea className="h-full">
                        <ItemGroup>
                          {topPerformers[2].map((performer) => (
                            <Item key={performer.name}>
                              <ItemMedia>
                                <Avatar>
                                  <AvatarImage
                                    src={performer.avatar}
                                    alt={performer.name}
                                  />
                                  <AvatarFallback>{performer.initials}</AvatarFallback>
                                </Avatar>
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{performer.name}</ItemTitle>
                                <ItemDescription>{performer.nationality}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <span className="text-sm font-medium tabular-nums">
                                  {performer.saves}
                                </span>
                              </ItemActions>
                            </Item>
                          ))}
                        </ItemGroup>
                      </ScrollArea>
                    </TabsContent>
    </Tabs>
  </CardContent>
</Card>
);
}