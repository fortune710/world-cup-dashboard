# WC26 PERFORMANCE DASHBOARD
## Product Requirements Document + Technical Requirements Document

> Version 1.0 · May 2026 · Combined PRD/TRD  
> Tournament context: 48 teams · 104 matches · June 11 – July 19, 2026  
> UI DNA: DARKO DPM data density · Vapi.ai dark precision · Decide AI editorial structure

---

## DOCUMENT MAP

| Section | Type | Pages |
|---|---|---|
| 01 — Executive Summary | PRD | — |
| 02 — Product Vision & Scope | PRD | — |
| 03 — User Personas & Jobs-to-Be-Done | PRD | — |
| 04 — Feature Specification (All Views) | PRD | — |
| 05 — UI/UX System | PRD/TRD | — |
| 06 — System Architecture | TRD | — |
| 07 — Data Sources & API Integration | TRD | — |
| 08 — Database Design & Normalization | TRD | — |
| 09 — Data Pipeline (ETL/ELT) | TRD | — |
| 10 — Real-Time Architecture | TRD | — |
| 11 — Projection & Prediction Modelling | TRD | — |
| 12 — API Layer Design | TRD | — |
| 13 — Caching Strategy | TRD | — |
| 14 — Error Handling | TRD | — |
| 15 — Security | TRD | — |
| 16 — Privacy & Data Protection | PRD/TRD | — |
| 17 — Terms of Service Framework | PRD | — |
| 18 — Performance & SLAs | TRD | — |
| 19 — Testing Strategy | TRD | — |
| 20 — Deployment & Infrastructure | TRD | — |
| 21 — Roadmap & Release Phases | PRD | — |

---

# 01 — EXECUTIVE SUMMARY

The WC26 Performance Dashboard is a web-first analytics platform designed to serve football fans, journalists, and analysts during the 2026 FIFA World Cup — the largest tournament in the competition's history, spanning 48 teams, 104 matches, 16 stadiums, and 39 days across the United States, Canada, and Mexico. It is the first edition to introduce a Round of 32, creating a new knockout arc that demands richer bracket visualisation than any previous tool has delivered at consumer scale.

The core design bet is that no dashboard currently occupies the gap between casual fan and full analyst. Squawka and FotMob are data-rich but visually cluttered. Tableau builds are analyst-grade but opaque. Dribbble concepts look beautiful but carry shallow data relationships. WC26 Dashboard bridges this gap through **narrative-first progressive disclosure**: every screen surfaces the signal fans need at a glance, with analyst depth one interaction away.

Technically the platform ingests live match event streams from a primary sports data provider (Sportmonks or API-Football), normalises them into a purpose-built PostgreSQL schema, enriches them through a Python-based ETL pipeline, caches hot paths in Redis, and delivers updates to the browser via Server-Sent Events (SSE) and a REST/JSON API served by a Next.js 15 App Router backend. A Python-based prediction engine generates pre-match outcome probabilities using an XGBoost model trained on historical World Cup and qualifying match data, with features including rolling xG differentials, ELO ratings, and tournament-stage fatigue proxies.

The UI is monochromatic by default — near-black ink on white canvas — with semantic accent colour appearing only when it carries meaning: green for live states and positive deltas, red for losses and alerts, amber for draws, blue for xG and probability bars. Typography pairs Syne (display) with IBM Plex Mono (statistics) and Inter (body), directly mirroring the terminal-precision aesthetic of Vapi.ai and the editorial numbered-section structure of Decide AI, filtered through DARKO DPM's leaderboard-first information hierarchy.

---

# 02 — PRODUCT VISION & SCOPE

## Vision Statement

A single dashboard that any football fan — from first-time viewer to xG-fluent analyst — can open during a World Cup match and immediately understand what is happening, what it means, and what is likely to happen next.

## Scope: In

- Tournament overview: all 104 matches, 48 teams, 12 groups, full knockout bracket through to Final
- Live match data: scores, minute-by-minute events, in-match statistics
- Team profiles: squad, form, key metrics, pitch heatmaps
- Player profiles: per-90 stats, radar charts, match timeline, head-to-head comparison
- Match detail: interactive pitch SVG, xG flow chart, event timeline, shot map
- Prediction engine: pre-match win probabilities, tournament progression simulation
- Group standings with tiebreaker logic
- Bracket / tournament structure view

## Scope: Out (v1.0)

- Fantasy football integration
- Betting odds (deferred to v1.1 for licensing compliance)
- User-generated content (ratings, comments)
- Video highlights (rights issues)
- Push notifications (deferred; SSE-based in-page alerting ships in v1.0)
- Native iOS / Android apps (responsive PWA covers mobile v1.0)

## Tournament Context

- Dates: 11 June – 19 July 2026 (39 days)
- Matches: 104 total (72 group stage, 32 knockout)
- Teams: 48 across 12 groups of 4
- Progression: top 2 from each group + 8 best 3rd-placed → Round of 32
- Venues: 16 stadiums across USA (11), Mexico (3), Canada (2)
- Opening match: Mexico vs South Africa, Estadio Azteca, Mexico City
- Final: MetLife Stadium, East Rutherford, New Jersey

---

# 03 — USER PERSONAS & JOBS-TO-BE-DONE

## Persona 1: The Casual Fan — "Maya"

**Profile:** 28, watches football during major tournaments only, follows it for the spectacle and national team narrative. Uses mobile 70% of the time.  
**Goals:** Know the score instantly, understand who is winning the group, find out who the tournament's breakout player is.  
**Pain points:** FotMob is too dense, BBC scores are too thin. Gets lost in stats she doesn't understand.  
**JTBD:** "When I check the dashboard between meetings, I need to know the score and who is through to the next round in under 10 seconds."

## Persona 2: The Engaged Fan — "Kwame"

**Profile:** 34, watches every match of his preferred teams, debates on social media, follows Premier League closely. Desktop and mobile equally.  
**Goals:** Track his teams' xG and form arc across the tournament, compare players, share interesting stats on social.  
**Pain points:** Has to switch between multiple tabs (FotMob for scores, Opta for stats, Wikipedia for standings).  
**JTBD:** "When I'm watching a match, I want the dashboard open on a second screen showing live xG flow and shot map without having to hunt across five sites."

## Persona 3: The Journalist / Content Creator — "Priya"

**Profile:** 29, covers football for a digital sports outlet, needs quick stat verification and exportable data for articles.  
**Goals:** Find the stat that tells the story, export CSV data, cite a reliable source for match performance metrics.  
**Pain points:** API-Football widgets are ugly and can't be embedded cleanly. Tableau dashboards require login and don't update live.  
**JTBD:** "When writing a match report, I need a clean, reliable source of real-time stats I can trust and reference by name in my article."

## Persona 4: The Data Analyst — "Felix"

**Profile:** 38, football data enthusiast, comfortable with xG, PPDA, pressing intensity, and passing networks. Desktop-primary.  
**Goals:** Deep dive into match data, compare teams across dimensions, examine prediction model confidence intervals.  
**Pain points:** SkillCorner requires enterprise access. Most public dashboards surface Box Score stats only.  
**JTBD:** "When watching a low-scoring match, I need to see the underlying xG flow and pressing metrics to understand whether the result reflects actual performance."

---

# 04 — FEATURE SPECIFICATION

## 4.1 Global Navigation

**Persistent top bar (64px, pinned):**
- Logo mark (left): WC26 wordmark + football glyph
- Primary nav pills: `Live` · `Teams` · `Players` · `Matches` · `Bracket`
- Stage breadcrumb strip (below nav): `Group Stage ●` · `R32` · `R16` · `QF` · `SF` · `Final`
  - Highlighted = current tournament phase; clickable to jump
- Filter button (right): opens right-side drawer (group, confederation, date range, stat filter)
- Dark/Light mode toggle (top right, icon-only)
- Mobile: bottom tab bar (5 icons); stage strip becomes horizontal scroll

**Behaviour requirements:**
- Nav state persists across browser sessions via `localStorage`
- Stage breadcrumb derives active state from `tournament.current_phase` API field
- Filter drawer applies globally and persists in URL query params (`?group=A&conf=UEFA`)
- All navigation transitions: 200ms fade + 12px y-translate, `ease-out`

## 4.2 View 1: Live Overview (Entry Point)

### Hero Band (dark surface, `#1a1a1a`)
- Displays the currently live match (or most recent match if no live game)
- Content: Minute · Team A Score · Team B Score
- Sub-row: Possession bar · xG bar (dual)
- "LIVE" badge: pulsing green dot + "LIVE" text, `#10b981`, 1500ms pulse loop
- On goal: full hero band flashes green for 800ms, then settles

### KPI Row (4-up grid, light surface)
- Goals today · Matches played/total · Top xG today · Cards today
- Each card: label (Inter 12px all-caps) + value (IBM Plex Mono 28px) + trend delta (↑↓)

### Group Standings Table
- All 12 groups, tab-switched by pill group (`Group A` … `Group L`)
- Columns: Pos · Team (flag + name) · Pld · W · D · L · GF · GA · GD · Pts · Form
- Sortable by any column (click header)
- Row colours: green for qualification zone (top 2 + best 8 3rd), amber for potential 3rd-place qualification, dim for eliminated
- Tap/click row → right-side team profile drawer

### Top Performers Rail
- Tab group: `Goals` · `xG` · `Assists` · `Saves`
- Each tab shows top 5: player avatar (32×32) · name · nationality badge · stat value
- Tab switch: fade + 12px y-translate, 200ms

### Acceptance Criteria
- Live score updates within 3 seconds of match event via SSE
- Group standings recalculate client-side on each score update (no full page reload)
- Goal event triggers hero flash; red card triggers card badge increment

## 4.3 View 2: Teams

### Team Grid
- 6-up card grid (desktop); 3-up (tablet); 1-up (mobile)
- Each card: flag · team name · confederation badge · form string (W/D/L pills, last 5) · 3 key stats (Goals, xG, Possession%)
- Filter bar: Confederation · Group · Stage Reached
- Sort: by Group Position (default) · Goals scored · xG · Possession

### Team Profile Drawer (right-side, 480px)
- Header: flag · name · group · current standing
- Stat bars: Goals · xG · xGA · Possession · Pass accuracy · PPDA
- Pitch zone heatmap (SVG, 3×3 zone grid, colour-weighted by touches)
- Pass network thumbnail (D3 force-directed, top 11 nodes)
- Match history timeline: for each match, badge (W/D/L) + opponent + score
- Squad list: GK / DEF / MID / FWD sections, player name + squad number

### Acceptance Criteria
- Grid renders 48 cards with <200ms hydration on desktop
- Drawer opens within 100ms of card click; data loads within 500ms
- Heatmap redraws on receiving updated match data during live match

## 4.4 View 3: Players

### Player Leaderboard (DARKO DPM table style)
- Stat mode switcher (pill group): `Goals` · `xG` · `Assists` · `Key Passes` · `Duels Won` · `Distance` · `Saves`
- Virtualised table (react-virtual): handles 1,400+ rows, 60fps scroll
- Columns (configurable per mode): `#` · Avatar · Name · Nationality · Position · Mins · [4 stat cols] · Team
- Column header click = sort; shift-click = multi-sort
- Row hover: subtle `#f5f5f5` → `#ebebeb` transition
- Click row → player profile panel (right-side, 560px)

### Player Profile Panel
- Header: headshot (64×64) · name · position · nationality flag · team badge · age · squad number
- 5-axis radar chart (per-90 normalised): Attack · Creativity · Passing · Defending · Physical
  - Comparison mode: overlay a second player's radar (different stroke colour)
- Match-by-match timeline: sparkline bar chart of G+A per match (compact, 48px tall)
- Position heatmap: simplified pitch SVG showing zones occupied
- Full stat table: all metrics switchable between per-90 and tournament totals

### Acceptance Criteria
- Table virtualisation: no jank on scroll through full 1,400+ player list
- Radar chart draws in <400ms; comparison mode overlays without flicker
- "Compare" button opens second player search (type-ahead, debounced 300ms)

## 4.5 View 4: Match Detail

### Match Header
- Teams, score, stage, minute, venue, referee, attendance
- Status badge: `PRE-MATCH` · `LIVE 67'` · `HT` · `FT`

### Two-Column Layout (60/40 split)

**Left — Interactive Pitch SVG**
- Dimensions: 105×68m proportional
- Layer toggles (pill tabs): `Shots` · `Passes` · `Pressures` · `Heatmap`
  - Shots: dots positioned at shot location, sized by xG value (`r = 4 + xG * 8`), colour: green = goal, amber = on target, grey = off
  - Heatmap: thermal gradient overlay per team (toggle A/B)
- Click zone on pitch → filters event timeline to events in that pitch third
- Team selector: filter layer data to Home / Away / Both

**Right — xG Flow Chart**
- Dual-line area chart over 90 minutes (+ET if applicable)
- X-axis: minutes 0–90 (extendable to 120)
- Y-axis: cumulative xG (0 → ~4)
- Goal events: vertical dashed line + goal marker icon at intersection
- Chart library: Recharts (React) or D3 if custom animation required
- Draws on load: line animates left-to-right, 600ms, `ease-in-out`

**Right — Event Timeline**
- Chronological list: minute · icon (⚽ 🟨 🟥 ↔️ corner) · player · description
- Events: Goals · Assists · Yellow cards · Red cards · Substitutions · Penalties
- Substitutions: collapsible → show as compact entry
- Filter by event type (icon pill toggles)

### Acceptance Criteria
- Pitch SVG renders without flicker on layer toggle (<100ms swap)
- xG chart updates in real-time for live matches (SSE push, no full redraw)
- Event timeline appends new events at top with 300ms fade-in

## 4.6 View 5: Tournament Bracket

### Bracket Layout
- Horizontal scroll: R32 (16 matches) → R16 (8) → QF (4) → SF (2) → Final
- Each match node (180×80px min):
  - Two team rows: flag + name (left), score or `TBD` (right)
  - Win probability bar (home % — away %) below teams — hidden pre-tournament confirmation
  - Match date + venue (compact, Inter 11px)
- Border states:
  - Completed: solid `#0a0a0a` border, score inline
  - Live: `#10b981` border, `LIVE` badge
  - Future: `1px dashed #e5e7eb`, probability shading
  - TBD: dimmed team slots with `—` placeholder
- Connector lines between rounds: SVG paths, animated on team progression
- Mobile: rotates to vertical timeline layout

### Acceptance Criteria
- Bracket pre-populates with all confirmed group stage results and projected R32 matchups
- Live match node updates score in real-time without bracket reflowing
- Correct bracket fill logic on team elimination/progression (server-side computed)

---

# 05 — UI/UX SYSTEM

## 5.1 Design Tokens

```css
/* Color */
--color-ink:          #0a0a0a;   /* Text, CTAs */
--color-surface-dark: #1a1a1a;   /* Live hero, footer */
--color-surface:      #f5f5f5;   /* Card backgrounds */
--color-canvas:       #ffffff;   /* Page background */
--color-hairline:     #e5e7eb;   /* Borders, dividers */
--color-live:         #10b981;   /* Live, Win, positive delta */
--color-alert:        #ef4444;   /* Loss, Red card, error */
--color-warning:      #f59e0b;   /* Draw, Yellow card, caution */
--color-accent:       #3b82f6;   /* xG bars, probability, links */
--color-muted:        #6b7280;   /* Captions, secondary text */

/* Typography */
--font-display:  'Syne', sans-serif;       /* Headlines */
--font-mono:     'IBM Plex Mono', monospace; /* Stats */
--font-body:     'Inter', sans-serif;       /* Body, labels */

/* Spacing (4px base) */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;
--space-12: 48px; --space-16: 64px;

/* Border Radius */
--radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 12px;  --radius-pill: 999px;

/* Shadows */
--shadow-card:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
--shadow-drawer: -4px 0 24px rgba(0,0,0,0.12);
```

## 5.2 Typography Scale

| Role | Font | Size | Weight | Letter Spacing |
|---|---|---|---|---|
| Hero display | Syne | 64px / 4rem | 600 | -0.03em |
| Page title | Syne | 48px / 3rem | 600 | -0.025em |
| Section title | Syne | 32px / 2rem | 600 | -0.02em |
| Card title | Syne | 22px | 600 | -0.01em |
| Stat hero | IBM Plex Mono | 32px | 500 | 0 |
| Stat large | IBM Plex Mono | 24px | 500 | 0 |
| Stat medium | IBM Plex Mono | 18px | 500 | 0 |
| Body | Inter | 16px | 400 | 0 |
| Label | Inter | 14px | 500 | 0 |
| Caption | Inter | 12px | 500 | 0.06em (ALL CAPS) |

## 5.3 Component Inventory

| Component | Behaviour | State variants |
|---|---|---|
| `<KPICard>` | Number count-up on mount, trend arrow | default / loading skeleton |
| `<TeamCard>` | Flag + form badges + 3 stats, click → drawer | default / hover / selected |
| `<PlayerRow>` | Virtualised, click → profile panel | default / hover / expanded |
| `<MatchBand>` | Score + live indicator + stat bars | pre / live / finished |
| `<StagePill>` | Pill-in-pill switcher, active state | default / active / disabled |
| `<StatBar>` | Label + proportional fill + value | positive / neutral / negative |
| `<FormBadge>` | W/D/L pill, colour-coded | W=green / D=amber / L=red |
| `<PitchSVG>` | Layered SVG, click regions | shots / passes / pressures / heat |
| `<xGFlowChart>` | Recharts dual-line area, animate on draw | loading / live / finished |
| `<RadarChart>` | 5-axis, per-90, comparison overlay | single / comparison |
| `<BracketNode>` | Match node, border state per status | tbd / upcoming / live / done |
| `<FilterDrawer>` | Right-side slide-in, 480px | closed / open |
| `<Skeleton>` | Shimmer placeholder for async data | — |
| `<ErrorState>` | Illustrated inline error + retry CTA | api-error / no-data / offline |
| `<LiveDot>` | Pulsing green dot, aria-label="Live" | live / inactive |

## 5.4 Animation System

| Trigger | Element | Duration | Easing | Notes |
|---|---|---|---|---|
| Page mount | Cards stagger fade-up | 400ms (40ms delay/card) | `cubic-bezier(0.0,0.0,0.2,1)` | `prefers-reduced-motion`: skip |
| Stat entry | Number count-up 0→value | 600ms | `ease-out` | — |
| Chart draw | Line left-to-right | 600ms | `ease-in-out` | requestAnimationFrame |
| Tab switch | Fade + 12px y-translate | 200ms | `ease-out` | — |
| Goal flash | Hero band green flash | 800ms | `ease-out` | Triggered by SSE goal event |
| Live dot | Opacity 1→0.4→1, infinite | 1500ms | `ease-in-out` | aria-live="polite" |
| Drawer open | Slide in from right | 300ms | `cubic-bezier(0.4,0,0.2,1)` | Overlay `backdrop-filter: blur(4px)` |
| Score update | Number crossfade | 300ms | `ease-out` | No flash if same value |

`prefers-reduced-motion: reduce` disables all animations except instant transitions.

## 5.5 Responsive Breakpoints

| Breakpoint | Width | Nav | KPI | Team Cards | Drawer |
|---|---|---|---|---|---|
| Mobile | <768px | Bottom tab bar | 2-up | 1-up | Full-screen panel |
| Tablet | 768–1024px | Top, compressed | 2×2 | 2-up | 80vw slide |
| Desktop | 1024–1440px | Full | 4-up | 3-up | 480px fixed |
| Wide | >1440px | Full | 4-up | 6-up | 480px fixed |

Max content width: 1200px, centred. Outer padding: 24px (mobile 16px).

## 5.6 Accessibility Requirements

- All interactive elements: `role`, `aria-label`, keyboard navigable
- Focus ring: 2px solid `--color-accent`, 2px offset
- Colour contrast: minimum 4.5:1 for body text, 3:1 for large text (WCAG AA)
- Live score regions: `aria-live="polite"`, `aria-atomic="true"`
- Chart elements: SVG `<title>` + `<desc>`, table fallback for screen readers
- Keyboard shortcuts: `L` = Live view, `T` = Teams, `P` = Players, `M` = Matches, `B` = Bracket


---

# 06 — SYSTEM ARCHITECTURE

## 6.1 Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│  Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS        │
│  SSE client · Recharts · D3.js (pitch) · react-virtual (table)       │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ HTTPS / SSE
┌────────────────────────▼─────────────────────────────────────────────┐
│                      API / BFF LAYER                                 │
│  Next.js Route Handlers (Edge-compatible)                            │
│  REST JSON API · SSE stream endpoint · WebhookReceiver               │
│  Rate Limiting (Upstash Redis) · Auth (NextAuth.js) · CORS           │
└──────┬─────────────────┬───────────────────────────────┬─────────────┘
       │                 │                               │
┌──────▼──────┐  ┌───────▼────────┐  ┌──────────────────▼────────────┐
│  Redis Cache │  │  PostgreSQL DB │  │  Prediction Service (Python)  │
│  (Upstash)   │  │  (Supabase /   │  │  FastAPI · XGBoost · Pandas   │
│  Hot paths   │  │  Neon Postgres)│  │  Runs pre-match & half-time   │
│  Live state  │  │  Normalised    │  │  Results stored in Postgres   │
│  Pub/Sub     │  │  schema 3NF    │  │  Accessed via REST endpoint   │
└──────┬───────┘  └───────┬────────┘  └──────────────────┬────────────┘
       │                  │                               │
┌──────▼──────────────────▼───────────────────────────────▼────────────┐
│                     DATA PIPELINE LAYER                              │
│  Python ETL Service (Celery + Redis broker)                          │
│  Ingestion → Validation → Normalisation → Enrichment → Store         │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ Polling / Webhook
┌──────────────────────────▼───────────────────────────────────────────┐
│                   EXTERNAL DATA SOURCES                              │
│  Primary: Sportmonks Football API (live events, xG, lineups)         │
│  Secondary: API-Football (fallback, fixtures, standings)             │
│  Historical: StatsBomb Open Data (xG model training)                 │
│  Reference: FIFA Official API (squad, teams — read-only)             │
└──────────────────────────────────────────────────────────────────────┘
```

## 6.2 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Server Components, SSE support, edge deployment |
| Language | TypeScript 5.x | Type-safety across API/client boundary |
| Styling | Tailwind CSS 4 + CSS custom properties | Design token system, zero-runtime |
| Charts | Recharts (React), D3.js (pitch SVG) | Recharts for data viz; D3 for custom pitch geometry |
| Table virtualisation | `@tanstack/react-virtual` | 1,400+ player rows at 60fps |
| Animation | CSS transitions + `requestAnimationFrame` | No GSAP dependency in v1; pure CSS covers spec |
| State management | React Server Components + Zustand (client islands) | Minimal client state; server-driven |
| API layer | Next.js Route Handlers (Edge Runtime) | Co-located, serverless, low cold-start |
| Database | PostgreSQL 16 (Supabase managed, or Neon serverless) | Relational, JSONB flexibility, Supabase realtime |
| Cache | Upstash Redis (serverless Redis, global replicas) | Rate limiting + hot-path caching + SSE state |
| Real-time delivery | Server-Sent Events (SSE) via Next.js Route Handler | Simpler than WebSocket for server→client push; HTTP/2 |
| ETL / pipeline | Python 3.12, Celery 5, Redis broker, Pandas, Pydantic | Async task queue; Pydantic for validation schema |
| Prediction service | Python FastAPI + XGBoost + scikit-learn | ML inference, separate service, called via REST |
| Job scheduling | Celery Beat + Redis | Cron-style pipeline triggers |
| Auth | NextAuth.js v5 (Auth.js) | Session management; future OAuth (Google/Apple) |
| Rate limiting | Upstash Ratelimit (@upstash/ratelimit) | Edge-compatible sliding window |
| Deployment | Vercel (frontend + API routes) + Render/Railway (Python services) | Auto-scaling; zero-config CDN |
| CDN | Vercel Edge Network | Global static assets, image optimisation |
| Monitoring | Sentry (errors), Vercel Analytics, Grafana (metrics) | Full observability stack |

---

# 07 — DATA SOURCES & API INTEGRATION

## 7.1 Primary Data Provider: Sportmonks Football API

Sportmonks is the primary data source. The "All-In" plan includes real-time xG, the Pressure Index, AI-powered match predictions, and pre-match/in-play odds from 50+ bookmakers. The World Cup 2026 REST API covers fixtures, live scores, in-game events, squads, player details, statistics, standings, groups, and knockout bracket data — all delivered as structured JSON.

**Endpoints used:**

| Endpoint | Poll / Push | Interval | Usage |
|---|---|---|---|
| `GET /v3/fixtures?league=1&season=2026` | Poll | On startup, then on schedule change | Fixture list |
| `GET /v3/fixtures/{id}` | Poll | Every 20s (live), every 5min (pre/post) | Match detail |
| `GET /v3/fixtures/{id}/statistics` | Poll | Every 20s live | Match stats |
| `GET /v3/fixtures/{id}/events` | Poll | Every 10s live | Goals, cards, subs |
| `GET /v3/fixtures/{id}/lineups` | Poll | Once at kickoff | Starting XI |
| `GET /v3/standings?season=2026` | Poll | Every 60s | Group tables |
| `GET /v3/players/{id}/statistics` | Poll | Post-match | Player stats |
| `GET /v3/stages?season=2026` | Poll | Once, then nightly | Tournament stages |
| Webhook (if available) | Push | On event | Instant goal/card alert |

**API key management:**
- Key stored in `SPORTMONKS_API_KEY` environment variable (Vercel / Doppler secrets manager)
- Key never exposed to client bundle
- Rotation policy: monthly during tournament, stored in Doppler with zero-downtime rotation

## 7.2 Secondary / Fallback: API-Football (RapidAPI)

API-Football provides league_id=1, season=2026 for the World Cup. Used as:
1. Cold fallback if Sportmonks has outage
2. Historical data before Sportmonks coverage begins
3. Fixture seeding (standalone)

**Fallback trigger:** If Sportmonks API returns 3 consecutive errors within a 60-second window, the ETL pipeline switches to API-Football source for the affected match, logs the switch, and alerts on-call via Slack webhook.

## 7.3 Historical Training Data: StatsBomb Open Data

Used exclusively for prediction model training. StatsBomb provides open access to structured event-level data for selected competitions. World Cup data from 1966–2022 editions provides the historical foundation for the xG model and ELO ratings baseline.

**Source:** `https://github.com/statsbomb/open-data` (JSON, served from GitHub)  
**Usage:** Offline, ingested once as training corpus. Not used during live tournament.

## 7.4 API Response Format & Contract

All external APIs return JSON. Internal normalisation converts to a canonical intermediate format before database write.

**Canonical event object (internal):**

```json
{
  "event_id": "evt_abc123",
  "match_id": "m_001",
  "event_type": "goal",
  "minute": 67,
  "minute_extra": null,
  "team_id": "t_argentina",
  "player_id": "p_messi",
  "assist_player_id": "p_dybala",
  "location_x": 92.4,
  "location_y": 34.1,
  "xg": 0.43,
  "shot_type": "open_play",
  "body_part": "right_foot",
  "created_at": "2026-06-15T21:12:44Z"
}
```

**Canonical match stats object (internal):**

```json
{
  "match_id": "m_001",
  "team_id": "t_argentina",
  "recorded_at": "2026-06-15T21:20:00Z",
  "possession": 55.2,
  "shots": 14,
  "shots_on_target": 6,
  "xg": 1.83,
  "corners": 5,
  "fouls": 12,
  "yellow_cards": 2,
  "red_cards": 0,
  "passes": 487,
  "pass_accuracy": 86.4,
  "ppda": 9.2
}
```

---

# 08 — DATABASE DESIGN & NORMALIZATION

## 8.1 Design Principles

The schema follows **Third Normal Form (3NF)** for the core transactional tables, with selective denormalisation into materialised views and read-optimised summary tables for dashboard query patterns. The rationale: core data is updated frequently during live matches; consistency and update speed matter more than query convenience. Dashboards query pre-aggregated summaries; analysts query the normalised tables.

Star schema pattern is applied to the analytics layer: `fact_match_events` as the central fact table, surrounded by dimension tables (`dim_player`, `dim_team`, `dim_match`, `dim_tournament`).

## 8.2 Core Schema

```sql
-- ─────────────────────────────────────────
-- DIMENSION TABLES
-- ─────────────────────────────────────────

CREATE TABLE dim_tournament (
  tournament_id     SERIAL PRIMARY KEY,
  edition_year      SMALLINT NOT NULL,       -- 2026
  name              VARCHAR(120) NOT NULL,
  host_countries    TEXT[],                  -- ['USA','Canada','Mexico']
  total_teams       SMALLINT DEFAULT 48,
  total_matches     SMALLINT DEFAULT 104,
  start_date        DATE NOT NULL,
  end_date          DATE,
  current_phase     VARCHAR(40),             -- 'group_stage','r32','r16'...
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dim_confederation (
  confederation_id  SERIAL PRIMARY KEY,
  code              CHAR(6) UNIQUE NOT NULL, -- 'UEFA','CONMEBOL','CAF'...
  name              VARCHAR(80) NOT NULL
);

CREATE TABLE dim_team (
  team_id           SERIAL PRIMARY KEY,
  external_id       VARCHAR(40) UNIQUE,      -- provider's ID
  fifa_code         CHAR(3) UNIQUE,          -- 'ARG','BRA','ENG'
  name              VARCHAR(100) NOT NULL,
  name_short        VARCHAR(40),
  flag_url          TEXT,
  confederation_id  INT REFERENCES dim_confederation(confederation_id),
  elo_rating        NUMERIC(7,2),            -- updated post-match
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dim_player (
  player_id         SERIAL PRIMARY KEY,
  external_id       VARCHAR(40) UNIQUE,
  team_id           INT REFERENCES dim_team(team_id),
  name              VARCHAR(120) NOT NULL,
  name_short        VARCHAR(60),
  position          VARCHAR(20),             -- 'GK','DEF','MID','FWD'
  position_detail   VARCHAR(40),             -- 'CB','CAM','ST'
  nationality       CHAR(3),
  date_of_birth     DATE,
  squad_number      SMALLINT,
  photo_url         TEXT,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE dim_venue (
  venue_id          SERIAL PRIMARY KEY,
  name              VARCHAR(120) NOT NULL,
  city              VARCHAR(80),
  country           CHAR(3),
  capacity          INT,
  latitude          NUMERIC(9,6),
  longitude         NUMERIC(9,6)
);

-- ─────────────────────────────────────────
-- TOURNAMENT STRUCTURE TABLES
-- ─────────────────────────────────────────

CREATE TABLE tournament_group (
  group_id          SERIAL PRIMARY KEY,
  tournament_id     INT REFERENCES dim_tournament(tournament_id),
  group_label       CHAR(1) NOT NULL,        -- 'A' ... 'L'
  UNIQUE(tournament_id, group_label)
);

CREATE TABLE group_membership (
  membership_id     SERIAL PRIMARY KEY,
  group_id          INT REFERENCES tournament_group(group_id),
  team_id           INT REFERENCES dim_team(team_id),
  UNIQUE(group_id, team_id)
);

-- ─────────────────────────────────────────
-- MATCH TABLE
-- ─────────────────────────────────────────

CREATE TABLE dim_match (
  match_id          SERIAL PRIMARY KEY,
  external_id       VARCHAR(40) UNIQUE,
  tournament_id     INT REFERENCES dim_tournament(tournament_id),
  venue_id          INT REFERENCES dim_venue(venue_id),
  phase             VARCHAR(20) NOT NULL,    -- 'group','r32','r16','qf','sf','f'
  group_id          INT REFERENCES tournament_group(group_id), -- NULL for KO
  match_day         SMALLINT,
  home_team_id      INT REFERENCES dim_team(team_id),
  away_team_id      INT REFERENCES dim_team(team_id),
  scheduled_at      TIMESTAMPTZ NOT NULL,
  kickoff_at        TIMESTAMPTZ,
  status            VARCHAR(20) DEFAULT 'scheduled', -- scheduled/live/ht/ft/aet/pen
  home_score        SMALLINT DEFAULT 0,
  away_score        SMALLINT DEFAULT 0,
  home_score_aet    SMALLINT,
  away_score_aet    SMALLINT,
  home_pens         SMALLINT,
  away_pens         SMALLINT,
  current_minute    SMALLINT,
  referee           VARCHAR(100),
  attendance        INT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- FACT TABLES
-- ─────────────────────────────────────────

CREATE TABLE fact_match_events (
  event_id          BIGSERIAL PRIMARY KEY,
  external_id       VARCHAR(60) UNIQUE,
  match_id          INT REFERENCES dim_match(match_id),
  team_id           INT REFERENCES dim_team(team_id),
  player_id         INT REFERENCES dim_player(player_id),
  assist_player_id  INT REFERENCES dim_player(player_id),
  event_type        VARCHAR(30) NOT NULL,    -- 'goal','yellow_card','sub_in'...
  minute            SMALLINT NOT NULL,
  minute_extra      SMALLINT,
  location_x        NUMERIC(5,2),            -- 0-100 pitch x
  location_y        NUMERIC(5,2),            -- 0-100 pitch y
  xg                NUMERIC(5,4),            -- 0.0000 - 1.0000
  body_part         VARCHAR(20),             -- 'right_foot','left_foot','head'
  shot_type         VARCHAR(30),             -- 'open_play','free_kick','corner'
  outcome           VARCHAR(20),             -- 'goal','saved','blocked','off_target'
  metadata          JSONB,                   -- provider-specific extras
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- One row per team per match, updated live
CREATE TABLE fact_match_stats (
  stat_id           BIGSERIAL PRIMARY KEY,
  match_id          INT REFERENCES dim_match(match_id),
  team_id           INT REFERENCES dim_team(team_id),
  recorded_at       TIMESTAMPTZ NOT NULL,
  is_final          BOOLEAN DEFAULT FALSE,   -- TRUE when status='ft'
  possession        NUMERIC(5,2),
  shots             SMALLINT,
  shots_on_target   SMALLINT,
  shots_off_target  SMALLINT,
  blocked_shots     SMALLINT,
  xg                NUMERIC(6,4),
  xga               NUMERIC(6,4),           -- expected goals against
  corners           SMALLINT,
  fouls             SMALLINT,
  yellow_cards      SMALLINT,
  red_cards         SMALLINT,
  offsides          SMALLINT,
  passes            INT,
  pass_accuracy     NUMERIC(5,2),
  progressive_passes SMALLINT,
  ppda              NUMERIC(6,3),           -- passes per defensive action
  distance_covered  NUMERIC(7,3),           -- km
  sprints           SMALLINT,
  UNIQUE(match_id, team_id, is_final)
);

-- Aggregated player stats per tournament
CREATE TABLE fact_player_tournament_stats (
  stat_id           BIGSERIAL PRIMARY KEY,
  player_id         INT REFERENCES dim_player(player_id),
  tournament_id     INT REFERENCES dim_tournament(tournament_id),
  matches_played    SMALLINT DEFAULT 0,
  matches_started   SMALLINT DEFAULT 0,
  minutes_played    SMALLINT DEFAULT 0,
  goals             SMALLINT DEFAULT 0,
  assists           SMALLINT DEFAULT 0,
  xg                NUMERIC(7,4) DEFAULT 0,
  xa                NUMERIC(7,4) DEFAULT 0, -- expected assists
  shots             SMALLINT DEFAULT 0,
  shots_on_target   SMALLINT DEFAULT 0,
  key_passes        SMALLINT DEFAULT 0,
  dribbles_completed SMALLINT DEFAULT 0,
  yellow_cards      SMALLINT DEFAULT 0,
  red_cards         SMALLINT DEFAULT 0,
  -- goalkeeper
  saves             SMALLINT,
  goals_conceded    SMALLINT,
  psxg              NUMERIC(7,4),           -- post-shot xG
  -- physical
  distance_covered  NUMERIC(9,3),
  sprints           SMALLINT,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, tournament_id)
);

-- ─────────────────────────────────────────
-- PREDICTION TABLES
-- ─────────────────────────────────────────

CREATE TABLE match_predictions (
  prediction_id     SERIAL PRIMARY KEY,
  match_id          INT REFERENCES dim_match(match_id),
  model_version     VARCHAR(20) NOT NULL,   -- 'xgb_v2.3'
  predicted_at      TIMESTAMPTZ NOT NULL,
  home_win_prob     NUMERIC(6,4) NOT NULL,
  draw_prob         NUMERIC(6,4) NOT NULL,
  away_win_prob     NUMERIC(6,4) NOT NULL,
  home_xg_pred      NUMERIC(5,3),
  away_xg_pred      NUMERIC(5,3),
  confidence        NUMERIC(5,4),           -- model confidence score
  features_snapshot JSONB,                  -- feature vector at prediction time
  UNIQUE(match_id, model_version, predicted_at)
);

CREATE TABLE tournament_simulations (
  simulation_id     BIGSERIAL PRIMARY KEY,
  run_at            TIMESTAMPTZ NOT NULL,
  model_version     VARCHAR(20),
  simulations_n     INT DEFAULT 10000,      -- Monte Carlo runs
  results           JSONB NOT NULL          -- {team_id: {r32:%, r16:%, qf:%, sf:%, w:%}}
);
```

## 8.3 Indexes

```sql
-- Hot query paths
CREATE INDEX idx_match_events_match   ON fact_match_events(match_id);
CREATE INDEX idx_match_events_player  ON fact_match_events(player_id);
CREATE INDEX idx_match_events_type    ON fact_match_events(event_type);
CREATE INDEX idx_match_stats_match    ON fact_match_stats(match_id);
CREATE INDEX idx_player_stats_player  ON fact_player_tournament_stats(player_id);
CREATE INDEX idx_match_status         ON dim_match(status);
CREATE INDEX idx_match_scheduled      ON dim_match(scheduled_at);
CREATE INDEX idx_predictions_match    ON match_predictions(match_id);
CREATE INDEX idx_events_xg            ON fact_match_events(xg) WHERE xg IS NOT NULL;

-- GIN index for JSONB metadata queries
CREATE INDEX idx_events_metadata  ON fact_match_events USING GIN(metadata);
CREATE INDEX idx_sim_results      ON tournament_simulations USING GIN(results);
```

## 8.4 Materialised Views (Read-Optimised)

```sql
-- Refreshed every 60s during live matches; every 5min otherwise
CREATE MATERIALIZED VIEW mv_group_standings AS
SELECT
  tg.group_label,
  dt.team_id,
  dt.fifa_code,
  dt.name        AS team_name,
  dt.flag_url,
  COUNT(CASE WHEN dm.status IN ('ft','aet','pen') THEN 1 END) AS played,
  COUNT(CASE WHEN
    (dm.home_team_id = dt.team_id AND dm.home_score > dm.away_score) OR
    (dm.away_team_id = dt.team_id AND dm.away_score > dm.home_score) THEN 1 END) AS wins,
  COUNT(CASE WHEN dm.home_score = dm.away_score AND dm.status IN ('ft','aet','pen') THEN 1 END) AS draws,
  COUNT(CASE WHEN
    (dm.home_team_id = dt.team_id AND dm.home_score < dm.away_score) OR
    (dm.away_team_id = dt.team_id AND dm.away_score < dm.home_score) THEN 1 END) AS losses,
  SUM(CASE WHEN dm.home_team_id = dt.team_id THEN dm.home_score
           ELSE dm.away_score END) AS gf,
  SUM(CASE WHEN dm.home_team_id = dt.team_id THEN dm.away_score
           ELSE dm.home_score END) AS ga,
  SUM(CASE WHEN
    (dm.home_team_id = dt.team_id AND dm.home_score > dm.away_score) OR
    (dm.away_team_id = dt.team_id AND dm.away_score > dm.home_score) THEN 3
    WHEN dm.home_score = dm.away_score AND dm.status IN ('ft','aet','pen') THEN 1
    ELSE 0 END) AS points
FROM tournament_group tg
JOIN group_membership gm ON gm.group_id = tg.group_id
JOIN dim_team dt ON dt.team_id = gm.team_id
LEFT JOIN dim_match dm ON
  (dm.home_team_id = dt.team_id OR dm.away_team_id = dt.team_id)
  AND dm.phase = 'group'
GROUP BY tg.group_label, dt.team_id, dt.fifa_code, dt.name, dt.flag_url
ORDER BY tg.group_label, points DESC, (gf - ga) DESC, gf DESC;

-- Refresh trigger (called by ETL on each goal event)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_group_standings;
```

## 8.5 Key Queries

**Top players by xG (tournament):**
```sql
SELECT
  dp.name, dp.nationality, dt.fifa_code,
  fpts.xg, fpts.goals, fpts.minutes_played,
  ROUND(fpts.xg / NULLIF(fpts.minutes_played, 0) * 90, 3) AS xg_per90
FROM fact_player_tournament_stats fpts
JOIN dim_player dp ON dp.player_id = fpts.player_id
JOIN dim_team dt ON dt.team_id = dp.team_id
WHERE fpts.tournament_id = 1 AND fpts.minutes_played >= 45
ORDER BY fpts.xg DESC
LIMIT 25;
```

**xG flow for a match (for chart):**
```sql
SELECT
  minute,
  team_id,
  SUM(xg) OVER (PARTITION BY team_id ORDER BY minute) AS cumulative_xg,
  event_type
FROM fact_match_events
WHERE match_id = $1 AND xg IS NOT NULL
ORDER BY minute;
```

**Live match state (for SSE):**
```sql
SELECT
  dm.match_id, dm.status, dm.current_minute,
  dm.home_score, dm.away_score,
  ht.fifa_code AS home_code, at.fifa_code AS away_code,
  fms_h.possession AS home_poss, fms_a.possession AS away_poss,
  fms_h.xg AS home_xg, fms_a.xg AS away_xg
FROM dim_match dm
JOIN dim_team ht ON ht.team_id = dm.home_team_id
JOIN dim_team at ON at.team_id = dm.away_team_id
LEFT JOIN fact_match_stats fms_h ON fms_h.match_id = dm.match_id
  AND fms_h.team_id = dm.home_team_id AND fms_h.is_final = FALSE
LEFT JOIN fact_match_stats fms_a ON fms_a.match_id = dm.match_id
  AND fms_a.team_id = dm.away_team_id AND fms_a.is_final = FALSE
WHERE dm.status = 'live';
```

---

# 09 — DATA PIPELINE (ETL/ELT)

## 9.1 Pipeline Overview

The pipeline is event-driven during live matches and schedule-driven pre/post tournament. All pipeline tasks run as Celery workers with Redis as the broker, deployed on Railway or Render.

```
External API
    │
    ▼
[Ingestion Worker]  ← polls Sportmonks every 10-20s for live matches
    │
    ▼ raw JSON
[Validation Layer]  ← Pydantic schemas enforce data types and required fields
    │
    ▼ validated dict
[Transformation Layer]  ← normalises to canonical schema, resolves IDs, computes derived fields
    │
    ▼ canonical objects
[Enrichment Layer]  ← appends xG from xG model (if not provided by API), ELO delta
    │
    ▼ enriched records
[Database Writer]  ← upserts into PostgreSQL; invalidates Redis cache keys
    │
    ├── [Redis Pub/Sub]  ← publishes goal/card/score events to SSE subscribers
    │
    └── [Materialised View Refresh]  ← REFRESH CONCURRENTLY for standings
```

## 9.2 Ingestion

**Live match polling loop:**

```python
# celery_tasks/ingestion.py
from celery import shared_task
import httpx, time

POLL_INTERVAL_LIVE = 10        # seconds
POLL_INTERVAL_PRE  = 300       # 5 minutes
POLL_INTERVAL_POST = 3600      # 1 hour

@shared_task(name='ingest.live_match')
def ingest_live_match(match_id: str):
    """Poll live match data; reschedule self based on match status."""
    data = fetch_sportmonks_fixture(match_id)
    if data is None:
        # Fallback to API-Football
        data = fetch_apifootball_fixture(match_id)
    process_match_data.delay(data)
    status = data.get('status', 'unknown')
    interval = POLL_INTERVAL_LIVE if status == 'live' else POLL_INTERVAL_PRE
    ingest_live_match.apply_async(args=[match_id], countdown=interval)
```

**Webhook receiver (if provider supports):**

```python
# app/api/webhooks/sportmonks/route.ts (Next.js)
export async function POST(req: Request) {
  const sig = req.headers.get('x-sportmonks-signature');
  if (!verifySignature(sig, await req.text(), process.env.SPORTMONKS_WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const payload = await req.json();
  await redis.publish('match_events', JSON.stringify(payload));
  return new Response('OK');
}
```

## 9.3 Validation

All incoming data is validated through Pydantic v2 models before any database write. Invalid records are logged to a `pipeline_errors` table, never silently dropped.

```python
# pipeline/schemas.py
from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal

class RawMatchEvent(BaseModel):
    external_id: str
    match_external_id: str
    event_type: str
    minute: int
    player_external_id: Optional[str] = None
    xg: Optional[Decimal] = None
    location_x: Optional[float] = None
    location_y: Optional[float] = None

    @field_validator('event_type')
    @classmethod
    def validate_event_type(cls, v):
        allowed = {'goal','yellow_card','red_card','sub_in','sub_out',
                   'penalty_scored','penalty_missed','own_goal','var_review'}
        if v not in allowed:
            raise ValueError(f'Unknown event type: {v}')
        return v

    @field_validator('xg')
    @classmethod
    def validate_xg(cls, v):
        if v is not None and not (0 <= v <= 1):
            raise ValueError(f'xG out of range: {v}')
        return v
```

## 9.4 Transformation & ID Resolution

Provider IDs are mapped to internal IDs via a `provider_id_map` lookup table. If a player's internal ID is not found, the pipeline:
1. Attempts to fetch from `GET /v3/players/{external_id}` and creates a new `dim_player` record
2. Falls back to a placeholder `player_id = -1` (Unknown), flagged for manual review

```sql
CREATE TABLE provider_id_map (
  map_id          SERIAL PRIMARY KEY,
  provider        VARCHAR(30) NOT NULL,   -- 'sportmonks','api_football'
  entity_type     VARCHAR(20) NOT NULL,   -- 'match','team','player','venue'
  external_id     VARCHAR(60) NOT NULL,
  internal_id     INT NOT NULL,
  UNIQUE(provider, entity_type, external_id)
);
```

## 9.5 Enrichment

- **xG enrichment:** If the provider does not supply xG for a shot event, the internal xG model (logistic regression on shot distance, angle, body part, play type) computes an estimate.
- **ELO update:** After each match result, both teams' ELO ratings are updated using the standard ELO formula with K=32 and a tournament weight multiplier.
- **Per-90 stats:** Computed and stored in `fact_player_tournament_stats` as part of post-match enrichment.
- **PPDA (Passes Per Defensive Action):** Computed from pass events in the opponent's defensive third: `PPDA = allowed_passes / (tackles + interceptions)` in the pressing zone.

## 9.6 Data Quality Rules

| Rule | Check | Action on failure |
|---|---|---|
| xG in range | `0.0 ≤ xg ≤ 1.0` | Log error, set to NULL |
| Minute range | `0 ≤ minute ≤ 130` | Clamp to 130, log warning |
| Duplicate event | unique on `(match_id, external_id)` | Upsert, log |
| Score consistency | `home_score ≥ 0 AND away_score ≥ 0` | Reject, alert |
| Player existence | player_id in dim_player | Auto-create or use placeholder |
| Match timing | `kickoff_at` not in future for live events | Reject, log |
| Possession sum | `home_poss + away_poss ≈ 100` | Allow ±2%, otherwise flag |

## 9.7 Pipeline Monitoring & Error Handling

```sql
CREATE TABLE pipeline_errors (
  error_id      BIGSERIAL PRIMARY KEY,
  task_name     VARCHAR(80),
  match_id      VARCHAR(40),
  error_type    VARCHAR(60),     -- 'validation','network','transform','db_write'
  error_message TEXT,
  raw_payload   JSONB,
  occurred_at   TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);
```

Pipeline metrics emitted to Grafana via Prometheus:
- `pipeline_events_processed_total` (counter)
- `pipeline_events_failed_total` (counter, labelled by `error_type`)
- `pipeline_poll_latency_seconds` (histogram)
- `pipeline_db_write_latency_seconds` (histogram)

