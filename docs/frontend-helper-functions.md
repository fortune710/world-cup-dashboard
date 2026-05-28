# WC26 Frontend Helper Function Catalog

This file lists frontend-only helper functions suggested by the PRD/TRD, UX plan, research brief, frontend plan, and current backend structure.

Scope rules:

- These helpers must not fetch provider data, call backend APIs, write to storage, upsert records, or normalize upstream provider payloads.
- These helpers should work on canonical frontend DTOs or already-normalized mock data.
- Backend-owned names and responsibilities to avoid: `get_teams`, `get_matches`, `get_players`, `get_player_stats`, `get_teams_details`, `transform_team_data`, `transform_team_details`, `transform_match_data`, `transform_player_info`, `transform_squad_player`, `load_*`, `upsert_*`, `extract_*`, `mark_team_as_indexed`, `get_next_team_to_index`.

## Backend Overlap Check
The backend currently owns ETL and persistence:

- `backend/pipeline/sources/*`: provider extraction from `api.wc2026api.com` and Sofascore wrappers.
- `backend/pipeline/transformations/*`: raw provider-to-database transformation.
- `backend/pipeline/load/*`: loading transformed records into Postgres.
- `backend/pipeline/orchestration/*`: Airflow extract/transform/load DAGs.
- `backend/db/controllers/*`: database reads, upserts, and indexing flags.
- `backend/db/models/*`: SQLAlchemy database models.
- `backend/server/main.py`: FastAPI health/root endpoints.

Frontend helpers should therefore stay in UI, formatting, tournament logic, derived display state, client-side sorting, and mock DTO presentation.

## Recommended Type And Interface Files

These files should define frontend TypeScript shapes only. They can mirror backend fields for read/display boundaries, but they should not contain SQLAlchemy concepts, upsert payloads, provider payloads, or ETL transformation logic.

### `frontend/lib/types/wc26-core.types.ts`
Core unions, enums, and shared primitive aliases used by helpers and components.

```ts
export const GROUP_CODES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const

export type GroupCode = (typeof GROUP_CODES)[number]
export type SortDirection = "asc" | "desc"
export type SemanticTone = "default" | "muted" | "live" | "positive" | "warning" | "danger" | "accent" | "done"
export type AvailabilityState = "available" | "partial" | "unavailable" | "stale"
export type FreshnessState = "live" | "recent" | "stale" | "static"
export type StreamStatus = "connecting" | "open" | "reconnecting" | "closed"
export type ConfederationCode = "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA"

export type TournamentStage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third-place"
  | "final"

export type KnockoutStage = Exclude<TournamentStage, "group">
```

### `frontend/lib/types/backend-read.types.ts`
Read-only boundary types aligned to current backend SQLAlchemy models. Use these only when documenting or typing backend-shaped responses before converting to frontend DTOs. Do not use these as component props unless the backend route returns exactly this shape.

```ts
export interface BackendTeamRecord {
  id: number
  name: string | null
  code: string | null
  logo_url: string | null
  group: string | null
  fifa_ranking: number | null
  sofascore_id: number | null
  goals_for: number
  goals_against: number
  position: number
  points: number
  matches_played: number
  matches_won: number
  matches_drawn: number
  matches_lost: number
  players_indexed: boolean
}

export interface BackendMatchRecord {
  id: number
  round: string | null
  group: string | null
  home_team_code: string | null
  away_team_code: string | null
  stadium: string | null
  kickoff_utc: string | null
  status: string | null
  phase: string | null
  home_score: number
  away_score: number
  home_pen: number | null
  away_pen: number | null
}

export type BackendPlayerClassification = "G" | "D" | "M" | "F"
export type BackendPlayerFoot = "Left" | "Right" | "Both"

export interface BackendPlayerRecord {
  id: number
  name: string | null
  date_of_birth: string | null
  classification: BackendPlayerClassification | null
  club_name: string | null
  positions: string | null
  weight_kg: number | null
  height_cm: number | null
  foot: BackendPlayerFoot | null
  country_code: string | null
  market_value: number | null
  rating: number | null
}
```

### `frontend/lib/types/wc26-dto.types.ts`
Canonical frontend DTOs used by helpers and components. These are camelCase, UI-ready, and intentionally omit backend-only indexing fields such as `players_indexed`.

```ts
import type {
  AvailabilityState,
  ConfederationCode,
  FreshnessState,
  GroupCode,
  KnockoutStage,
  SemanticTone,
  TournamentStage,
} from "./wc26-core.types"

export interface ApiEnvelope<T> {
  data: T
  meta: ApiMeta
}

export interface ApiMeta {
  generatedAt: string
  source: "mock" | "backend" | "sportmonks" | "api-football" | "statsbomb"
  freshness: FreshnessState
  warnings: string[]
}

export interface TeamDto {
  id: string
  backendId: number | null
  name: string
  fifaCode: string
  logoUrl: string | null
  flagEmoji?: string
  group: GroupCode | null
  confederation: ConfederationCode | null
  fifaRanking: number | null
  points: number
  goalsFor: number
  goalsAgainst: number
  position: number | null
  matchesPlayed: number
  matchesWon: number
  matchesDrawn: number
  matchesLost: number
}

export interface MatchDto {
  id: string
  backendId: number | null
  stage: TournamentStage
  roundLabel: string
  group: GroupCode | null
  homeTeamCode: string
  awayTeamCode: string
  stadium: string | null
  kickoffUtc: string | null
  status: MatchStatus
  phase: MatchPhase | null
  homeScore: number
  awayScore: number
  homePenaltyScore: number | null
  awayPenaltyScore: number | null
  events: MatchEventDto[]
  stats: MatchTeamStatsDto[]
  prediction: MatchPredictionDto | null
}

export type MatchStatus = "scheduled" | "live" | "completed" | "postponed" | "cancelled"
export type MatchPhase = "PRE" | "1H" | "HT" | "2H" | "ET" | "PEN" | "FT"

export interface PlayerDto {
  id: string
  backendId: number | null
  name: string
  dateOfBirth: string | null
  positionGroup: PlayerPositionGroup | null
  positions: string[]
  clubName: string | null
  countryCode: string | null
  heightCm: number | null
  weightKg: number | null
  preferredFoot: "left" | "right" | "both" | null
  marketValue: number | null
  rating: number | null
  tournamentStats: PlayerTournamentStatsDto
}

export type PlayerPositionGroup = "GK" | "DEF" | "MID" | "FWD"

export interface PlayerTournamentStatsDto {
  minutes: number
  goals: number
  assists: number
  xg: number | null
  xa: number | null
  keyPasses: number | null
  duelsWon: number | null
  saves: number | null
  impactScore: number | null
}

export interface MatchTeamStatsDto {
  teamCode: string
  possession: number | null
  shots: number | null
  shotsOnTarget: number | null
  xg: number | null
  corners: number | null
  yellowCards: number
  redCards: number
  passAccuracy: number | null
  ppda: number | null
}

export interface MatchEventDto {
  id: string
  matchId: string
  minute: number
  minuteExtra: number | null
  teamCode: string | null
  playerId: string | null
  type: MatchEventType
  description: string
  location: PitchPoint | null
  xg: number | null
  outcome: string | null
}

export type MatchEventType =
  | "goal"
  | "yellow-card"
  | "red-card"
  | "substitution"
  | "penalty"
  | "shot"
  | "pass"
  | "pressure"
  | "var"

export interface PitchPoint {
  x: number
  y: number
}

export interface MatchPredictionDto {
  homeWin: number
  draw: number
  awayWin: number
  confidence: number | null
  modelVersion: string | null
  generatedAt: string | null
  availability: AvailabilityState
}

export interface GroupStandingRow {
  team: TeamDto
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  form: FormResult[]
  qualificationState: QualificationState
}

export type FormResult = "W" | "D" | "L"
export type QualificationState = "qualified" | "third-place-race" | "projected" | "eliminated"

export interface BracketSlotDto {
  id: string
  stage: KnockoutStage
  seedLabel: string
  team: TeamDto | null
  state: BracketNodeState
}

export type BracketNodeState = "tbd" | "upcoming" | "live" | "completed" | "projected"

export interface BadgePresentation {
  label: string
  tone: SemanticTone
}
```

### `frontend/lib/types/wc26-view-model.types.ts`
View models assembled from DTOs for components. These prevent components from knowing backend or provider field names.

```ts
import type {
  BracketSlotDto,
  GroupStandingRow,
  MatchDto,
  PlayerDto,
  TeamDto,
} from "./wc26-dto.types"

export interface TournamentSnapshotViewModel {
  currentStage: string
  teams: TeamDto[]
  matches: MatchDto[]
  players: PlayerDto[]
  featuredMatch: MatchDto | null
  groupStandings: Record<string, GroupStandingRow[]>
  thirdPlaceRace: GroupStandingRow[]
  topPerformers: TopPerformerGroup[]
  bracketSlots: BracketSlotDto[]
}

export interface TopPerformerGroup {
  metric: string
  rows: TopPerformerRow[]
}

export interface TopPerformerRow {
  player: PlayerDto
  team: TeamDto | null
  value: number | null
  displayValue: string
}

export interface DashboardFilters {
  group: string | "all"
  confederation: string | "all"
  stage: string | "all"
  metric: string | "all"
}

export interface FormBadgeDto {
  result: "W" | "D" | "L"
  label: string
  tone: "positive" | "warning" | "danger"
}

export interface RadarAxisValue {
  axis: "Attack" | "Creativity" | "Passing" | "Defending" | "Physical"
  value: number
  rawValue: number | null
}

export interface XgFlowPoint {
  minute: number
  homeXg: number
  awayXg: number
}

export interface EventPeriodGroup {
  label: string
  events: unknown[]
}
```

### `frontend/lib/types/wc26-visualization.types.ts`
Pitch, chart, and visualization support types.

```ts
export type PitchLayer = "shots" | "passes" | "pressures" | "heatmap"
export type PitchTeamFilter = "home" | "away" | "both"
export type ChartSeriesKey = "home" | "away" | "xg" | "probability" | "impact"

export interface PitchZone {
  row: 0 | 1 | 2
  column: 0 | 1 | 2
}

export interface HeatmapCell {
  zone: PitchZone
  value: number
  opacity: number
}

export interface PassNetworkNode {
  id: string
  playerId: string
  label: string
  x: number
  y: number
  size: number
}

export interface PassNetworkEdge {
  fromPlayerId: string
  toPlayerId: string
  weight: number
}
```

### `frontend/lib/types/wc26-export.types.ts`
CSV/export helper types for journalist workflows.

```ts
export interface CsvExport {
  fileName: string
  mimeType: "text/csv"
  content: string
}

export interface CsvColumn<T> {
  header: string
  getValue: (row: T) => string | number | null
}
```

## Recommended Helper Files

### `frontend/lib/helpers/wc26-core.helpers.ts`
General tournament constants, guards, and label helpers.

- `isGroupCode(value: string): value is GroupCode` - Checks whether a string is one of `A` through `L`.
- `isTournamentStage(value: string): value is TournamentStage` - Checks whether a stage value is supported by the UI.
- `getGroupLabel(group: GroupCode): string` - Returns labels like `Group A`.
- `getStageLabel(stage: TournamentStage): string` - Returns display labels like `Group Stage`, `R32`, `Quarter-finals`.
- `getStageShortLabel(stage: TournamentStage): string` - Returns compact labels for nav pills.
- `getStageOrder(stage: TournamentStage): number` - Gives stable stage ordering for nav and bracket layout.
- `isKnockoutStage(stage: TournamentStage): boolean` - Distinguishes knockout rounds from group stage.
- `getStageHash(stage: TournamentStage): string` - Maps stages to route hashes such as `#bracket`.
- `getTournamentProgressLabel(played: number, total: number): string` - Formats progress like `18/104 matches`.

### `frontend/lib/helpers/match-display.helpers.ts`
Match labels, scoreline, clocks, status, and side calculations.

- `formatScoreline(match: MatchDto): string` - Returns `Mexico 2 - 0 South Africa`.
- `formatCompactScore(homeScore: number, awayScore: number): string` - Returns `2-0`.
- `formatMatchClock(status: MatchStatus, minute: number | null): string` - Returns `LIVE 67'`, `HT`, `FT`, or `PRE-MATCH`.
- `getMatchStatusLabel(status: MatchStatus): string` - Converts status enums into UI labels.
- `getMatchStatusTone(status: MatchStatus): SemanticTone` - Maps statuses to `live`, `muted`, `warning`, or `done`.
- `getMatchDisplayTitle(match: MatchDto, teams: TeamDto[]): string` - Builds a full title from team names and score.
- `getTeamSide(match: MatchDto, teamId: string): "home" | "away" | null` - Finds whether a team is home or away.
- `getOpponentTeamId(match: MatchDto, teamId: string): string | null` - Returns the opponent id for team profile timelines.
- `getWinnerTeamId(match: MatchDto): string | null` - Returns the winner for completed non-draw matches.
- `hasPenaltyShootout(match: MatchDto): boolean` - Checks if penalty scores should be displayed.
- `formatVenueLine(match: MatchDto): string` - Returns `Estadio Azteca · Mexico City` when venue metadata exists.
- `formatKickoffDateTime(iso: string, locale?: string): string` - Formats kickoff time for display only, not provider normalization.

### `frontend/lib/helpers/standings.helpers.ts`
Client-side standings and qualification display logic.

- `calculateGroupStandings(input: StandingsInput): GroupStandingRow[]` - Calculates display standings from normalized teams and completed matches.
- `sortStandingRows(rows: GroupStandingRow[]): GroupStandingRow[]` - Sorts by points, goal difference, goals scored, conduct score, then rating.
- `calculateThirdPlaceRace(input: StandingsInput): GroupStandingRow[]` - Builds the cross-group third-place ranking table.
- `getQualificationState(position: number, scope: "group" | "third-place"): QualificationState` - Returns `qualified`, `third-place-race`, or `eliminated`.
- `getQualificationLabel(state: QualificationState): string` - Returns user-facing copy for row badges.
- `getQualificationTone(state: QualificationState): SemanticTone` - Maps qualification state to color intent.
- `getGoalDifference(goalsFor: number, goalsAgainst: number): number` - Calculates GD.
- `formatGoalDifference(goalDifference: number): string` - Adds a leading `+` for positive GD.
- `getFormResult(match: MatchDto, teamId: string): "W" | "D" | "L" | null` - Gets a team's result in one match.
- `getFormString(matches: MatchDto[], teamId: string, limit?: number): Array<"W" | "D" | "L">` - Builds last-N form badges.
- `getConductScore(cards: CardSummary): number` - Calculates a display-only fair-play score from card counts.

### `frontend/lib/helpers/bracket.helpers.ts`
Bracket and Round of 32 projection display helpers.

- `getRoundLabel(stage: KnockoutStage): string` - Returns labels like `Round of 32`, `Semi-finals`, `Final`.
- `getRoundShortLabel(stage: KnockoutStage): string` - Returns compact labels like `R32`, `SF`, `F`.
- `getRoundOrder(stage: KnockoutStage): number` - Gives stable horizontal bracket ordering.
- `getBracketNodeState(match: MatchDto): BracketNodeState` - Returns `tbd`, `upcoming`, `live`, `completed`, or `projected`.
- `getBracketNodeTone(state: BracketNodeState): SemanticTone` - Maps node state to border and badge tone.
- `buildProjectedRoundOf32Slots(rows: GroupStandingRow[]): BracketSlotDto[]` - Creates UI slots from qualified and projected teams.
- `getThirdPlaceRaceCutLine(rows: GroupStandingRow[]): number` - Returns the index after the eighth third-place qualifier.
- `isTeamLockedInBracket(match: MatchDto, teamId: string): boolean` - Checks whether a team slot is confirmed rather than projected.
- `formatBracketSeed(row: GroupStandingRow): string` - Returns seed labels like `1A`, `2B`, or `3C`.
- `getConnectorKey(fromMatchId: string, toMatchId: string): string` - Produces stable SVG connector keys.

### `frontend/lib/helpers/player-metrics.helpers.ts`
Player leaderboard, DARKO-style comparison, and metric display helpers.

- `calculatePer90(value: number, minutes: number): number` - Calculates per-90 values from normalized totals.
- `formatPer90(value: number, minutes: number, decimals?: number): string` - Formats per-90 display values.
- `getPlayerMetricValue(player: PlayerDto, metric: PlayerMetricKey): number | null` - Reads a selected leaderboard metric.
- `getPlayerMetricLabel(metric: PlayerMetricKey): string` - Returns labels like `xG`, `Assists`, `Impact`.
- `getPlayerMetricUnit(metric: PlayerMetricKey): string` - Returns `%`, `km`, `per 90`, or an empty unit.
- `sortPlayersByMetric(players: PlayerDto[], metric: PlayerMetricKey, direction: SortDirection): PlayerDto[]` - Sorts leaderboard rows.
- `getPlayerRank(players: PlayerDto[], playerId: string, metric: PlayerMetricKey): number | null` - Finds a player's rank for a selected metric.
- `getComparisonDelta(a: number | null, b: number | null): number | null` - Calculates comparison deltas.
- `formatComparisonDelta(delta: number | null): string` - Returns `+0.23`, `-0.10`, or `N/A`.
- `getRadarAxisValues(player: PlayerDto): RadarAxisValue[]` - Converts player stats into five normalized radar axes.
- `getImpactLabel(impactScore: number | null): string` - Returns impact labels without implying model certainty.
- `getProjectionFreshnessLabel(updatedAt: string | null): string` - Returns `Updated 08:00 UTC` or `Projection unavailable`.

### `frontend/lib/helpers/team-metrics.helpers.ts`
Team card, drawer, form, and stat-bar helpers.

- `getTeamById(teams: TeamDto[], teamId: string): TeamDto | null` - Finds a team from normalized frontend data.
- `getTeamByCode(teams: TeamDto[], fifaCode: string): TeamDto | null` - Finds a team by FIFA code for display joins.
- `getTeamStatValue(team: TeamDetailDto, metric: TeamMetricKey): number | null` - Reads a selected team metric.
- `getTeamMetricLabel(metric: TeamMetricKey): string` - Returns labels like `xG`, `xGA`, `PPDA`, `Pass accuracy`.
- `formatTeamMetric(value: number | null, metric: TeamMetricKey): string` - Formats percentages, decimals, and unavailable values.
- `getTeamFormBadges(matches: MatchDto[], teamId: string): FormBadgeDto[]` - Builds W/D/L badge data for cards.
- `getTeamProfileSummary(team: TeamDetailDto): string` - Returns concise drawer summary copy.
- `getStatBarPercent(value: number | null, max: number): number` - Converts stat values into 0-100 widths.
- `getHeatmapZoneIntensity(value: number, max: number): number` - Converts already-normalized zone totals into UI opacity.
- `getPassNetworkNodeSize(touches: number, maxTouches: number): number` - Scales pass network nodes for display.

### `frontend/lib/helpers/event-timeline.helpers.ts`
Match event display, icon, filtering, and timeline grouping.

- `getEventIcon(type: MatchEventType): string` - Returns the UI icon token for goals, cards, substitutions, shots, and pressure events.
- `getEventTone(type: MatchEventType): SemanticTone` - Maps event types to semantic color intent.
- `formatEventMinute(event: MatchEventDto): string` - Returns `45+2'` when stoppage time exists.
- `formatEventDescription(event: MatchEventDto, players: PlayerDto[], teams: TeamDto[]): string` - Builds display text from normalized event references.
- `filterEventsByType(events: MatchEventDto[], types: MatchEventType[]): MatchEventDto[]` - Filters timeline chips.
- `filterEventsByPitchZone(events: MatchEventDto[], zone: PitchZone | null): MatchEventDto[]` - Filters events using canonical pitch coordinates.
- `groupEventsByPeriod(events: MatchEventDto[]): EventPeriodGroup[]` - Groups first half, second half, extra time, and penalties.
- `sortEventsTimeline(events: MatchEventDto[], direction: "asc" | "desc"): MatchEventDto[]` - Sorts timeline display order.
- `isMajorEvent(event: MatchEventDto): boolean` - Flags goals, red cards, penalties, and VAR decisions.

### `frontend/lib/helpers/pitch.helpers.ts`
SVG pitch geometry and coordinate helpers. These are display helpers, not tracking-data normalization.

- `scalePitchX(x: number, width: number): number` - Converts canonical 0-100 x to SVG width.
- `scalePitchY(y: number, height: number): number` - Converts canonical 0-100 y to SVG height.
- `getShotDotRadius(xg: number | null): number` - Sizes shot dots from xG.
- `getShotDotTone(event: MatchEventDto): SemanticTone` - Sets goal, on-target, blocked, or off-target color intent.
- `getPitchZoneFromPoint(x: number, y: number): PitchZone` - Maps a canonical coordinate to a 3x3 zone.
- `getPitchZoneLabel(zone: PitchZone): string` - Returns labels like `Left attacking third`.
- `getPitchLayerLabel(layer: PitchLayer): string` - Returns labels for `Shots`, `Passes`, `Pressures`, and `Heatmap`.
- `getHeatmapCellOpacity(value: number, max: number): number` - Converts normalized heatmap values into CSS opacity.

### `frontend/lib/helpers/chart.helpers.ts`
Chart data shaping and accessible labels for Recharts/SVG components.

- `buildXgFlowSeries(events: MatchEventDto[], homeTeamId: string, awayTeamId: string): XgFlowPoint[]` - Builds cumulative xG chart points from normalized events.
- `getMaxXgDomain(points: XgFlowPoint[]): number` - Chooses a readable y-axis max.
- `formatChartMinute(minute: number): string` - Returns `67'`.
- `formatXgValue(value: number): string` - Formats xG to two decimals.
- `getChartSeriesTone(series: ChartSeriesKey): string` - Maps home/away/accent series to CSS variables.
- `buildRadarAxes(player: PlayerDto): RadarAxisValue[]` - Prepares radar axes from already-normalized player values.
- `getChartAccessibilityLabel(title: string, description: string): string` - Produces concise screen-reader labels.
- `shouldAnimateChart(prefersReducedMotion: boolean, pointCount: number): boolean` - Disables animations for reduced motion or large datasets.

### `frontend/lib/helpers/projection.helpers.ts`
Prediction and model-explainability display helpers.

- `formatProbability(value: number | null): string` - Formats `0.584` as `58%` or returns `N/A`.
- `validatePredictionTotal(prediction: MatchPredictionDto): boolean` - Checks home/draw/away totals are approximately 100%.
- `getConfidenceLabel(confidence: number | null): string` - Returns `High confidence`, `Medium confidence`, `Low confidence`, or `Unavailable`.
- `getConfidenceTone(confidence: number | null): SemanticTone` - Maps confidence to a semantic UI tone.
- `formatModelVersion(version: string | null): string` - Returns `Model mock-v1` or `Model unavailable`.
- `getPredictionDisclaimer(source: ProjectionSource): string` - Returns informational copy that avoids betting language.
- `getPredictionAvailability(prediction: MatchPredictionDto | null): AvailabilityState` - Determines if predictions should render, show stale state, or show unavailable state.

### `frontend/lib/helpers/freshness.helpers.ts`
Data freshness, stale-state, and live connection display helpers.

- `getFreshnessState(generatedAt: string, now: Date): FreshnessState` - Returns `live`, `recent`, `stale`, or `static` based on age thresholds.
- `formatLastUpdated(generatedAt: string | null): string` - Returns `Updated 12:00 UTC` or `No update time`.
- `getFreshnessLabel(state: FreshnessState): string` - Returns readable labels for badges.
- `getFreshnessTone(state: FreshnessState): SemanticTone` - Maps freshness to badge color intent.
- `isSseHeartbeatStale(lastHeartbeatAt: string | null, now: Date): boolean` - Checks whether live connection health is stale.
- `getStreamStatusLabel(status: StreamStatus): string` - Returns `Connecting`, `Live`, `Reconnecting`, or `Offline`.
- `getStreamStatusTone(status: StreamStatus): SemanticTone` - Maps stream state to live warning badges.
- `mergeWarnings(apiWarnings: string[], localWarnings: string[]): string[]` - Combines warning messages without duplicates.

### `frontend/lib/helpers/filter.helpers.ts`
URL/query, global filters, and local filter display helpers.

- `parseGroupFilter(value: string | null): GroupCode | "all"` - Parses URL group filters.
- `parseConfederationFilter(value: string | null): ConfederationCode | "all"` - Parses confederation filters.
- `parseStageFilter(value: string | null): TournamentStage | "all"` - Parses stage filters.
- `serializeDashboardFilters(filters: DashboardFilters): URLSearchParams` - Converts UI filters to query params.
- `getActiveFilterCount(filters: DashboardFilters): number` - Counts active non-default filters.
- `filterTeams(teams: TeamDto[], filters: DashboardFilters): TeamDto[]` - Applies client-side team filters.
- `filterMatches(matches: MatchDto[], filters: DashboardFilters): MatchDto[]` - Applies client-side match filters.
- `filterPlayers(players: PlayerDto[], filters: DashboardFilters): PlayerDto[]` - Applies client-side player filters.
- `getFilterSummary(filters: DashboardFilters): string` - Returns summary copy for the filter drawer trigger.

### `frontend/lib/helpers/export.helpers.ts`
Client-side export formatting for journalist and analyst workflows.

- `toCsvCell(value: string | number | null): string` - Escapes values for CSV cells.
- `buildPlayersCsvRows(players: PlayerDto[], teams: TeamDto[]): string[][]` - Builds player leaderboard CSV rows from current view data.
- `buildStandingsCsvRows(rows: GroupStandingRow[]): string[][]` - Builds standings CSV rows.
- `buildMatchEventsCsvRows(events: MatchEventDto[]): string[][]` - Builds event timeline CSV rows.
- `buildCsv(headers: string[], rows: string[][]): string` - Creates a CSV string from already-derived rows.
- `getExportFileName(prefix: string, generatedAt: string): string` - Returns stable filenames like `wc26-players-2026-06-15.csv`.

## Suggested Organization
Prefer focused files instead of a single large helper module:

- `frontend/lib/types/wc26-core.types.ts` for shared unions, constants, and primitive aliases.
- `frontend/lib/types/backend-read.types.ts` for read-only backend-shaped records aligned to current SQLAlchemy models.
- `frontend/lib/types/wc26-dto.types.ts` for canonical frontend DTOs used by components and helpers.
- `frontend/lib/types/wc26-view-model.types.ts` for component-ready assembled data.
- `frontend/lib/types/wc26-visualization.types.ts` for pitch, chart, radar, and pass-network types.
- `frontend/lib/types/wc26-export.types.ts` for CSV export helper contracts.
- `wc26-core.helpers.ts` for constants and guards.
- `match-display.helpers.ts` for match labels and scoreline display.
- `standings.helpers.ts` for group and third-place calculations.
- `bracket.helpers.ts` for knockout projection display.
- `player-metrics.helpers.ts` and `team-metrics.helpers.ts` for stat presentation.
- `event-timeline.helpers.ts`, `pitch.helpers.ts`, and `chart.helpers.ts` for visualization support.
- `projection.helpers.ts` and `freshness.helpers.ts` for trust, confidence, and live-state UI.
- `filter.helpers.ts` and `export.helpers.ts` for dashboard workflow utilities.

The current `frontend/lib/helpers/wc26.ts` contains `isGroupCode()`. It can either remain as a tiny compatibility file that re-exports from `wc26-core.helpers.ts`, or be renamed during implementation once imports are stable.
