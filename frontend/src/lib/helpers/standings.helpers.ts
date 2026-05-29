import type { GroupKey, StandingRow } from "@/datatypes"

export const groupStandings: Record<GroupKey, StandingRow[]> = {
  A: [
    { position: 1, team: "Argentina", played: 3, won: 3, drawn: 0, lost: 0, goalDifference: 7, points: 9 },
    { position: 2, team: "Poland", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 3, team: "Mexico", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: -1, points: 4 },
    { position: 4, team: "Saudi Arabia", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -6, points: 0 },
  ],
  B: [
    { position: 1, team: "England", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 5, points: 7 },
    { position: 2, team: "United States", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 1, points: 5 },
    { position: 3, team: "Iran", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
    { position: 4, team: "Wales", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -4, points: 1 },
  ],
  C: [
    { position: 1, team: "France", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 3, points: 6 },
    { position: 2, team: "Australia", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 1, points: 6 },
    { position: 3, team: "Tunisia", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 4, team: "Denmark", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -4, points: 1 },
  ],
  D: [
    { position: 1, team: "Japan", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 1, points: 6 },
    { position: 2, team: "Spain", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 4, points: 4 },
    { position: 3, team: "Germany", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 1, points: 4 },
    { position: 4, team: "Costa Rica", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -6, points: 3 },
  ],
  E: [
    { position: 1, team: "Morocco", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 3, points: 7 },
    { position: 2, team: "Croatia", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 3, points: 5 },
    { position: 3, team: "Belgium", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 4, team: "Canada", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -6, points: 0 },
  ],
  F: [
    { position: 1, team: "Netherlands", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
    { position: 2, team: "Senegal", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 1, points: 6 },
    { position: 3, team: "Ecuador", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 4, team: "Qatar", played: 3, won: 0, drawn: 0, lost: 3, goalDifference: -5, points: 0 },
  ],
  G: [
    { position: 1, team: "Brazil", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 3, points: 6 },
    { position: 2, team: "Switzerland", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 2, points: 5 },
    { position: 3, team: "Serbia", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
    { position: 4, team: "Cameroon", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -3, points: 3 },
  ],
  H: [
    { position: 1, team: "Portugal", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 2, points: 6 },
    { position: 2, team: "South Korea", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 3, team: "Uruguay", played: 3, won: 1, drawn: 1, lost: 1, goalDifference: 0, points: 4 },
    { position: 4, team: "Ghana", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
  ],
  I: [
    { position: 1, team: "Colombia", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
    { position: 2, team: "Italy", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 2, points: 5 },
    { position: 3, team: "Paraguay", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -1, points: 3 },
    { position: 4, team: "New Zealand", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -5, points: 1 },
  ],
  J: [
    { position: 1, team: "Norway", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 5, points: 7 },
    { position: 2, team: "Egypt", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 2, points: 6 },
    { position: 3, team: "Chile", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
    { position: 4, team: "Panama", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -5, points: 1 },
  ],
  K: [
    { position: 1, team: "Nigeria", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 3, points: 7 },
    { position: 2, team: "Sweden", played: 3, won: 1, drawn: 2, lost: 0, goalDifference: 1, points: 5 },
    { position: 3, team: "Peru", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -1, points: 3 },
    { position: 4, team: "Honduras", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -3, points: 1 },
  ],
  L: [
    { position: 1, team: "Czech Republic", played: 3, won: 2, drawn: 1, lost: 0, goalDifference: 4, points: 7 },
    { position: 2, team: "Austria", played: 3, won: 2, drawn: 0, lost: 1, goalDifference: 2, points: 6 },
    { position: 3, team: "Scotland", played: 3, won: 1, drawn: 0, lost: 2, goalDifference: -2, points: 3 },
    { position: 4, team: "Jamaica", played: 3, won: 0, drawn: 1, lost: 2, goalDifference: -4, points: 1 },
  ],
}

export function formatGoalDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

export function isQualificationZone(position: number): boolean {
  return position <= 2
}
