 # FIFA World Cup 2026 — Performance Dashboard UI/UX Plan

> Deep research synthesis · Design direction · Layout blueprints  
> Inspiration: cal.com, modal.com, madewithgsap.com, paradigmai.com

---

## Phase 1 — Deep Research Findings

### What existing dashboards do (and don't do) well

Platforms reviewed: **Squawka**, **FotMob**, **API-Football widgets**, **Tableau football dashboards**, **SkillCorner analytics**, **Flourish tournament charts**, **Qlik World Cup app**, **Dribbble concepts**, and the **enetpulse 2026 WC data schema**.

| Platform | Strength | Gap |
|---|---|---|
| Squawka / FotMob | Rich real-time data, mobile-first | Cluttered layout, no tournament narrative arc |
| Tableau football | Brilliant pitch heatmaps, passing networks | Too analyst-heavy, no progressive disclosure |
| SkillCorner | xG, sprint efficiency, pitch control | No storytelling layer, designed for pros only |
| API-Football widgets | Fast to embed | Generic Bootstrap look, no design system |
| Flourish templates | Best-in-class chart quality | Editorial-only, no live interactivity |
| Dribbble dark concepts | Beautiful dark-mode aesthetics | Data relationships often cosmetic |

**Core gap identified:** Most dashboards are either beautifully designed but shallow, or analytically deep but visually impenetrable. The opportunity is a **narrative-first** dashboard with progressive disclosure — surface level by default, analyst-depth on demand.

---

## Phase 2 — Aesthetic DNA

### Traits borrowed from inspiration sites

**cal.com**
- Monochrome confidence: near-black primary CTAs, grayscale palette, accent color used for live states only — never decoration
- Product-in-card honesty: no decorative illustration of data; actual live numbers and charts embedded in cards
- Nav pill-group: pill-within-pill stage/mode switcher — signature interactive component

**modal.com**
- Terminal precision: developer-grade information density with generous breathing room between sections; stats are scannable like logs
- Scarce dark surfaces: dark bands used deliberately for live/processing states — light is default, dark is emphasis

**madewithgsap.com**
- Motion as meaning: scroll-triggered stagger reveals, number counters animate on entry, chart bars grow on view — transitions tied to data arriving, never cosmetic
- Playful typographic identity: distinctive display font pairing with a refined mono for numbers

**paradigmai.com**
- Parallel structured output: multiple data streams in a consistent card format — ideal for side-by-side team/player comparisons

---

## Phase 3 — Visual Identity

### Color system

| Token | Hex | Usage |
|---|---|---|
| Ink | `#0a0a0a` | Text, primary CTAs |
| Surface dark | `#1a1a1a` | Live match hero band, dark footer |
| Surface | `#f5f5f5` | Card backgrounds |
| Canvas | `#ffffff` | Page background |
| Hairline | `#e5e7eb` | Borders, dividers |
| Live / Win | `#10b981` | W badge, live indicator, positive delta |
| Loss / Alert | `#ef4444` | L badge, deficit stats |
| Draw / Warning | `#f59e0b` | D badge, caution states |
| xG accent | `#3b82f6` | Expected goals, probability bars |

Color is **semantic, not decorative**. No rainbow data encoding. The accent colors appear only when they carry meaning.

### Typography

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| Display / headlines | Syne | 48–64px | 600 | −1.5px tracking |
| Section titles | Syne | 28–36px | 600 | −0.5px tracking |
| Stat values | IBM Plex Mono | 18–32px | 500 | Monospaced numerals, columns align |
| Body / labels | Inter | 14–16px | 400/500 | No negative tracking |
| Captions / hints | Inter | 11–13px | 500 | All caps for category labels |

---

## Phase 4 — Global Layout

### Navigation (64px pinned top bar)

```
[⚽ WC26]  [Live] [Teams] [Players] [Matches]  ··  [Filters ▼]
───────────────────────────────────────────────────────────────
[Group Stage ●] [R32] [R16] [QF] [SF] [Final]   ← stage breadcrumb
```

- **Pill-group nav**: 4 primary views switchable without full reload
- **Stage breadcrumb**: always visible, highlighted stage = current live phase, one-click jump to any round
- **Filters button**: opens a right-side drawer with group, confederation, date, and stat filters
- **Mobile**: bottom tab bar replaces top nav; stage breadcrumb becomes a horizontal scroll strip

---

## Phase 5 — Five Primary Screen Views

### View 1: Live Overview (entry point)

**Layout (desktop 1440px):**
```
┌─────────────────────────────────────────────────────────────┐
│  LIVE 67'  ·  Argentina 2 — 1 France  ·  [dark hero band]  │
│  Possession ████████░░ 55–45  ·  xG █████░░░ 1.8–1.2       │
├───────────┬───────────┬───────────┬───────────┤
│  7 goals  │ 3/4 played│  xG 2.4   │  5 cards  │  ← KPI row
│  today    │           │  top today│           │
├──────────────────────────────┬──────────────────────────────┤
│  Group standings table       │  Top performers rail         │
│  All 12 groups, pill tabs    │  Goals / xG / Assists tabs   │
│  Sortable · tap → team       │  Player avatar + name + stat │
└──────────────────────────────┴──────────────────────────────┘
```

**Key interactions:**
- Live score updates with 800ms green flash on goal
- Standings table sortable by any column
- Top performers tab switches the ranking metric and badge color

---

### View 2: Teams

**Layout:**
- 6-up card grid (3-up tablet, 1-up mobile) with flag, form badges, 3 key stats
- Filter bar: confederation, group, stage reached
- Click any card → right-side drawer with full team profile:
  - Stat bars (goals, xG, possession, pass accuracy)
  - Pitch zone heatmap
  - Pass network thumbnail
  - Match history timeline with scorelines

---

### View 3: Players

**Layout:**
- Stat mode switcher (Goals · xG · Assists · Key passes · Duels · Distance · Saves) — changes sort column and badge color
- Virtualised table: avatar · name · nationality · 4 stat columns · mins played
- 1,400+ player rows loaded on scroll
- Click row → profile panel:
  - 5-axis radar chart (per-90 normalised)
  - Match-by-match timeline (G + A per match)
  - Heatmap of positions occupied
  - Compare button: overlay two players' radars

---

### View 4: Match Detail (deepest analytical view)

**Layout:**
```
┌──────────────────────────┬──────────────────────────────────┐
│  Interactive pitch SVG   │  xG flow chart (dual-line area)  │
│                          │  ────────────────────────────────│
│  Layer toggles:          │  Event timeline                  │
│  ● Shots  ○ Passes       │  12' ⚽ Mbappé – low drive       │
│  ○ Pressures ○ Heatmap   │  38' ⚽ Messi – header           │
│                          │  67' 🟨 Camavinga – tactical foul│
└──────────────────────────┴──────────────────────────────────┘
```

**Key interactions:**
- Click pitch zone → filter event timeline to that area
- Toggle shot layer → dots sized by xG value
- Heatmap layer → thermal overlay per team
- Substitution log collapses into timeline

---

### View 5: Tournament Bracket

**Layout:**
- Horizontal scroll: R32 → R16 → QF → SF → Final
- Each match node: two team rows with score (or TBD with dashed border)
- Below each node: win probability bar (home % — away %)
- Completed matches: solid border, score inline
- Live match: highlighted border, LIVE badge
- Future matches: dashed border, probability-derived shading
- Mobile: vertical timeline layout

---

## Phase 6 — Data Model

### Metrics surfaced

**Attacking:** Goals · xG · Assists · xA · Shots · Shots on target · Shot accuracy · Key passes · Chances created · Dribble success %

**Team:** Possession % · Pass accuracy % · Progressive passes · PPDA (pressing intensity) · Corners · Fouls

**Defensive:** Interceptions · Tackles won % · Clearances · Blocks · xG conceded · Defensive errors

**Goalkeeper:** Saves · PSxG (post-shot xG) · Clean sheets · xGOT saved

**Physical:** Distance covered (km) · Sprints · Top speed

**Discipline:** Yellow cards · Red cards · Fouls committed · Fouls won

**Tournament:** Minutes played · Matches started · Form (last 5 results) · Win probability

All stats available per-90 for player comparison. Tournament totals and per-game averages switchable via toggle.

---

## Phase 7 — Motion & Interaction Principles

### Animation rules (GSAP-inspired)

| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Scroll into view | Stagger fade-up (40ms delay per card) | 400ms | ease-out cubic |
| Stat number entry | Count-up from 0 | 600ms | ease-out |
| Chart draw-on | Line draws left-to-right | 600ms | ease-in-out |
| Tab switch | Fade + 12px y-translate | 200ms | ease-out |
| Live score update | Green flash → settle | 800ms | ease-out |
| Live dot | Pulse opacity 1→0.4→1 | 1500ms | ease-in-out, infinite |
| Pitch zone hover | 100ms opacity shift | 100ms | linear |

**Rules:**
- Animations tied to data arriving, never cosmetic
- Reduced motion: all animations disabled via `prefers-reduced-motion`
- No looping animations except the live pulse dot

---

## Phase 8 — Component Library

| Component | Description | Design reference |
|---|---|---|
| KPI card | Label + monospaced number + trend arrow | cal.com feature-card |
| Team card | Flag + name + form badges + 3 stats | cal.com feature-icon-card |
| Player row | Avatar + name + nationality + stat columns | Virtualised list item |
| Match band | 2 teams + score + live indicator + stat bars | cal.com product-mockup-card |
| Stage pill-group | Tournament stage switcher, pill-in-pill | cal.com nav-pill-group |
| Stat bar | Label + proportional bar + value | Custom |
| Form badge | W/D/L pill green/amber/red, 5-badge string | cal.com badge-pill |
| Pitch overlay | SVG pitch with zone click regions, layer toggle | Custom |
| xG flow chart | Dual-line area over 90 mins, goal markers | Custom |
| Player radar | 5-axis spider, per-90 normalised, comparison mode | Custom |
| Bracket node | 2-team slot, score/TBD, win probability bar | Custom |

---

## Phase 9 — Responsive Behaviour

| Breakpoint | Key layout changes |
|---|---|
| Mobile &lt;768px | Bottom tab bar; KPI 2-up; team cards 1-up; match detail stacked; bracket = vertical scroll |
| Tablet 768–1024px | Top nav compresses; KPI 2×2; team cards 2-up; left rail hidden behind toggle |
| Desktop 1024–1440px | Full layout; KPI 4-up; team cards 3-up; left rail always visible; max content 1200px |
| Wide &gt;1440px | Same as desktop with more breathing room; content capped at 1200px |

---

## Design Principles Summary

1. **Narrative first** — surface-level by default, analyst depth on demand
2. **Monochrome confidence** — near-black CTAs, accent colors are semantic not decorative
3. **Product honesty** — actual data in cards, no decorative illustration of stats
4. **Motion as meaning** — animations always tied to data state changes
5. **Parallel comparison** — consistent card format enables instant team/player comparison
6. **Progressive disclosure** — fans see goals and results; analysts drill into xG and pitch control
7. **Dark surfaces are scarce** — live match hero band and footer only; light is the default

---

*Plan version 1.0 · May 2026 · Based on deep research across existing World Cup dashboards and design system analysis of cal.com, modal.com, madewithgsap.com, and paradigmai.com*
