# WC26 Frontend Deep Research Brief

**Date:** 2026-05-26  
**Scope:** Frontend product features, missing architecture, database/API contract implications, and comparable analytics products for the WC26 Performance Dashboard.

## Executive Summary
The current WC26 documents already define the main product surface: Live, Teams, Players, Match Detail, and Bracket. The most important research-backed additions are not more pages; they are clearer data contracts, model transparency, and DARKO-style exploratory tools. DARKO's public surface is built around a sortable player leaderboard, daily projection updates, player comparison, trajectories, lineup views, and scatterplots [1]. FotMob shows that mainstream fans now expect real-time scores, xG, shot maps, momentum, predicted lineups, H2H, and squad context in a clean mobile-first interface [3]. SkillCorner shows the professional frontier: standardized physical metrics, tracking data, game intelligence, off-ball movement, pressure, and threat creation [4]. The frontend plan should therefore build a progressive disclosure UI where simple live state is first-class, while deeper player impact views are available as structured drill-downs.

The missing frontend architecture is a domain contract layer between UI components and provider-shaped data. Sportmonks supports fixture includes, field selection, nested relationships, statistics, events, lineups, scores, xG, pressure, predictions, ball coordinates, and AI overviews [5]. API-Football provides fixtures, fixture events, fixture statistics, standings, lineups, players, predictions, and coverage metadata, with live updates advertised at 15-second intervals [6]. Those providers are useful but inconsistent. The frontend should consume canonical application DTOs rather than direct provider responses. This keeps UI code stable when the backend changes providers, when the mock dataset changes, or when some advanced metrics are unavailable.

For football-specific analytics, StatsBomb Open Data confirms that event data should be treated as nested JSON with match, lineup, event, and 360 files rather than a flat CSV assumption [7]. VAEP research shows a useful next-level metric: value each on-ball action by its effect on scoring and conceding probabilities over subsequent actions [8]. This supports a future "player impact" narrative beyond goals, xG, and assists, but it should be added as an explainable optional metric, not a required v1 blocking dependency.

The 2026 tournament format is a frontend architecture constraint. FIFA confirms 48 teams, 12 groups of four, top two in each group, and the eight best third-placed teams progressing to the Round of 32 [9]. The UI needs a central third-place ranking table, explicit tiebreaker explanations, and bracket projection states that can handle unresolved third-place combinations without layout churn.

## Introduction
This research was conducted to turn the existing WC26 product and technical documents into an implementation-ready frontend plan. The investigation focused on comparable sports analytics products, provider API behavior, event-data modeling, real-time frontend patterns, tournament rules, and compliance constraints that materially affect the React and Next.js implementation.

The research did not attempt to redesign the product from scratch. The current documents already define the five core views and visual direction. The goal was to identify missing architecture and high-value feature gaps before frontend execution begins.

The main assumption is that the first implementation should be frontend-complete with deterministic mock data before connecting to live provider credentials. This keeps the UI testable, allows API contracts to stabilize, and avoids baking third-party response shapes into reusable components.

## Main Analysis
### 1. DARKO suggests the Players view should be more than a table
DARKO describes itself as a daily updated machine-learning projection system for NBA players and exposes "DPM", offensive/defensive splits, box-score projections, comparison, trajectories, lineups, scatterplot, and CSV export [1]. The WC26 Players page currently specifies a leaderboard, radar chart, and comparison. The missing features worth planning are:

- A projection freshness label: `Updated 2026-06-15 08:00 UTC`.
- A confidence/explainability row for projections, not just point estimates.
- A trajectory panel for player performance across tournament matches.
- A scatterplot explorer for two selected metrics, such as `xG per 90` vs `VAEP per 90`.
- CSV export for journalist and analyst personas.

These should be v1.1-ready extension points, with the v1 codebase shaped to accept them.

### 2. Comparable football apps define the baseline fan expectation
FotMob pages advertise real-time extensive stats powered by Opta, including possession, shots, corners, big chances, xG, momentum, and shot maps [3]. FotMob also includes predicted lineups, formations, H2H, squad information, and match event timelines [3]. Squawka's editorial analysis uses contextual facts such as shot volume, attacking side distribution, set-piece attempt share, and possession splits to tell match stories [3]. SkillCorner goes deeper by combining physical data, XY tracking data, and game intelligence such as space creation, defensive structures, off-ball runs, pressure, and threat creation [4].

The WC26 frontend should therefore distinguish baseline v1 metrics from deeper aspirational metrics. Baseline v1 should include live score, possession, shots, xG, cards, standings, top performers, event timeline, shot map, and xG flow. Stretch metrics should include pressure index, pass networks, player trajectories, physical outputs, off-ball runs, and VAEP.

### 3. Provider APIs require canonical frontend DTOs
Sportmonks fixture endpoints return IDs by default and rely on `include`, `select`, and `filters` parameters for related data such as `scores`, `participants`, `events`, `lineups`, and `statistics.type` [5]. Sportmonks also lists richer includes such as `ballCoordinates`, `pressure`, `trends`, `xGFixture`, `predictions`, `matchfacts`, and `AIOverviews` [5]. API-Football exposes a different shape, with endpoints such as `/fixtures`, `/fixtures/events`, `/fixtures/statistics`, and `/standings`, plus coverage flags that indicate whether a competition supports events, lineups, fixture statistics, player statistics, standings, players, predictions, and odds [6].

The frontend should never import provider-shaped records into components. It should consume canonical DTOs:

- `TournamentSnapshotDto`
- `LiveMatchDto`
- `GroupStandingDto`
- `ThirdPlaceStandingDto`
- `TeamSummaryDto`
- `TeamDetailDto`
- `PlayerLeaderboardRowDto`
- `PlayerDetailDto`
- `MatchDetailDto`
- `SseMatchEventDto`

Every DTO should include `lastUpdated`, `source`, and `availability` metadata so the UI can display stale, partial, or unavailable states without breaking.

### 4. Advanced player impact should be explainable and optional
VAEP values on-ball actions by how they change the probability of scoring or conceding in future actions [8]. The socceraction documentation notes that VAEP trains scoring and conceding probability models separately and computes an action value from offensive and defensive changes [8]. This is a strong direction for the "DARKO for football" story, but it depends on reliable event-level data and model support. The frontend should include a generic `impactScore` slot and explanatory copy, while the initial implementation can rely on xG, xA, key passes, duels, saves, and per-90 metrics.

### 5. Real-time UX needs explicit reconnection and freshness states
Next.js SSE examples use route handlers that return `text/event-stream`, keep connections open, and fan out events through Redis Pub/Sub across server instances [10]. Production-oriented examples warn against in-memory arrays for serverless fan-out and recommend heartbeats, cleanup on close, and signed webhook endpoints [10]. The frontend should use a small `useMatchEventStream(matchId)` hook that reports `status: "connecting" | "open" | "reconnecting" | "closed"` and applies live updates through reducer functions. Components should show the last successful update time, not just a binary online/offline state.

### 6. The 2026 bracket is not a simple static knockout tree
FIFA confirms the 2026 competition includes a group stage followed by Round of 32, Round of 16, quarter-finals, semi-finals, third-place match, and final [9]. The top two in each group and eight best third-placed teams qualify for the Round of 32 [9]. FIFA's tiebreakers for third-place teams include points, goal difference, goals scored, team conduct score, and FIFA ranking [9]. This means the frontend needs:

- A "third-place race" module visible during group stage.
- Tiebreaker explanations directly in the standings UI.
- Bracket nodes with `projected`, `confirmed`, and `locked` states.
- Stable node dimensions so live updates do not reflow the bracket.

### 7. Compliance affects frontend product choices
Project Red Card sources argue that player performance data can be personal data, and in some cases special category data when medical, biometric, or physiological information is involved [11]. The frontend should avoid presenting raw health, injury prediction, or biometric inference in v1. Physical metrics such as distance and sprints should be displayed only when licensed and sourced from approved providers. UI copy should avoid betting language and present predictions as informational probabilities with clear model limitations.

## Synthesis & Insights
The current scaffold contains generic shadcn dashboard samples. Before building the five views, add a frontend domain layer with deterministic mocks and DTOs. The minimum architecture should be:

- `lib/domain/wc26.ts`: shared TypeScript interfaces, enums, and constants.
- `lib/domain/mock-data.ts`: deterministic tournament data for 48 teams, groups, players, matches, and events.
- `lib/domain/standings.ts`: group standings, third-place table, form strings, and qualification states.
- `lib/domain/projections.ts`: probability formatting, confidence bands, and explainability labels.
- `lib/api/client.ts`: typed fetch helpers returning canonical DTO envelopes.
- `app/api/*/route.ts`: mock-backed route handlers matching the frontend contract.
- `hooks/use-match-event-stream.ts`: SSE hook with connection status and cleanup.
- `components/wc26/*`: domain components separate from generic `components/ui`.

The response envelope should be consistent:

```ts
export interface ApiEnvelope<T> {
  data: T
  meta: {
    generatedAt: string
    source: "mock" | "sportmonks" | "api-football" | "statsbomb"
    freshness: "live" | "recent" | "stale" | "static"
    warnings: string[]
  }
}
```

The product opportunity is not simply "more football statistics." The strongest pattern across DARKO, FotMob, SkillCorner, Sportmonks, and VAEP research is that the dashboard needs a stable ladder from basic state to advanced explanation. Users should first see score, standings, and xG; then choose to drill into trajectories, spatial events, pressure, or action value. That ladder requires normalized DTOs, availability metadata, and UI states for stale or missing metrics.

The frontend architecture should treat the 2026 tournament rules as domain logic. Third-place qualification and tiebreakers are not just display concerns; they affect standings, bracket projection, narrative copy, and live-update confidence. Keeping this logic in `lib/domain` reduces duplicated calculations across views.

## Limitations & Caveats
The research used public web sources and the provided local documents. It did not inspect paid Sportmonks, Opta, SkillCorner, or API-Football authenticated payloads, so provider-specific field names must still be verified during backend integration.

The DARKO comparison is a product and interaction analogy rather than a direct model recommendation. Basketball projection metrics do not transfer directly to football, so the frontend should expose generic projection and impact fields while the backend decides whether those fields come from Elo, VAEP, xT, Kalman filtering, or another model.

The compliance review is product guidance, not legal advice. Before publishing physical, biometric, injury, or player valuation data, the project needs source licensing review and data-protection review.

## Recommendations
1. Replace generic dashboard sample content with a real WC26 shell, domain tokens, stage navigation, and typed mock data.
2. Build the Live Overview as the entry point because it validates navigation, cards, standings, top performers, and live update patterns.
3. Add Teams and team drawer next because this reuses standings, stat bars, form badges, and match history.
4. Add Players leaderboard using table architecture that can later support virtualization and scatterplots.
5. Add Match Detail with pitch SVG, event timeline, and xG flow after live data reducers are stable.
6. Add Bracket and third-place race after standings and match state are reliable.
7. Add API route handlers and SSE mock endpoints early enough for tests and frontend integration, even before real provider integration.

## Bibliography
[1] DARKO DPM. "What is DARKO?" https://www.darko.app/about and "DARKO DPM - NBA Player Projections." https://www.darko.app/  
[2] NBAstuffer. "NBA STATS | DARKO (DPM, Daily Plus-Minus) Explained." https://www.nbastuffer.com/analytics101/darko-daily-plus-minus/  
[3] FotMob and Squawka public match/analysis pages surfaced by search results. https://www.fotmob.com/ and https://www.squawka.com/  
[4] SkillCorner. "Soccer: Tracking Data & AI Powered Analytics." https://skillcorner.com/us/sports/soccer  
[5] Sportmonks. "Fixtures | API 3.0", "GET Fixture by ID", and "Includes | API 3.0." https://docs.sportmonks.com/v3/  
[6] API-Football. "RESTful API for Football data" and beginner guide. https://www.api-football.com/  
[7] StatsBomb. "StatsBomb Open Data." https://github.com/statsbomb/open-data  
[8] socceraction documentation. "VAEP" and "Valuing actions." https://socceraction.readthedocs.io/  
[9] FIFA. "World Cup 2026 groups, qualification rules & tie-breakers explained." https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/groups-how-teams-qualify-tie-breakers  
[10] Boilit / OneUptime / Upstash SSE examples for Next.js and Redis Pub/Sub. https://www.boilit.dev/ and https://oneuptime.com/ and https://upstash.com/  
[11] Irwin Mitchell, EuroCloud Europe, Sports Law and Taxation. Project Red Card and athlete data protection analyses. https://www.irwinmitchell.com/ and https://eurocloud.org/ and https://sportslawandtaxation.com/

## Methodology Appendix
This brief used the attached WC26 PRD/TRD, UI/UX plan, performance platform requirements, the uploaded DARKO page capture, and web searches conducted on 2026-05-26. The research focused on evidence that changes frontend implementation decisions: product features, interface states, DTO contracts, real-time behavior, tournament format constraints, and compliance boundaries.
