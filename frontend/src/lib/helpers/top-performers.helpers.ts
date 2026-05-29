import type {
  PerformerRow,
  TopAssistScorer,
  TopGoalScorer,
  TopPerformerTuple,
  TopSaveScorer,
} from "@/datatypes"

export const topPerformers: TopPerformerTuple = [
  [
    {
      name: "Lionel Messi",
      initials: "LM",
      nationality: "Argentina",
      goals: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kylian Mbappé",
      initials: "KM",
      nationality: "France",
      goals: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Julián Álvarez",
      initials: "JA",
      nationality: "Argentina",
      goals: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
  [
    {
      name: "Antoine Griezmann",
      initials: "AG",
      nationality: "France",
      assists: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kevin De Bruyne",
      initials: "KB",
      nationality: "Belgium",
      assists: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Pedri",
      initials: "PD",
      nationality: "Spain",
      assists: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
  [
    {
      name: "Ederson",
      initials: "ED",
      nationality: "Brazil",
      saves: 5,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Kepa Arrizabalaga",
      initials: "KA",
      nationality: "Spain",
      saves: 4,
      avatar: "https://via.placeholder.com/150",
    },
    {
      name: "Manuel Neuer",
      initials: "MN",
      nationality: "Germany",
      saves: 4,
      avatar: "https://via.placeholder.com/150",
    },
  ],
]

export function toGoalPerformerRows(
  performers: TopGoalScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.goals,
    avatar: performer.avatar,
  }))
}

export function toAssistPerformerRows(
  performers: TopAssistScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.assists,
    avatar: performer.avatar,
  }))
}

export function toSavePerformerRows(
  performers: TopSaveScorer[]
): PerformerRow[] {
  return performers.map((performer) => ({
    name: performer.name,
    initials: performer.initials,
    nationality: performer.nationality,
    value: performer.saves,
    avatar: performer.avatar,
  }))
}
