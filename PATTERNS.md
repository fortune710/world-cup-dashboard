# UI/UX Design Patterns: Inspiration Research

This document captures the specific design patterns extracted from the four core inspiration websites identified in the World Cup 2026 Dashboard UX Plan.

## 1. Cal.com: Monochrome Confidence & Functional Grouping

**Key Pattern: The "Selection Pill"**
- **Mechanism**: A horizontal button group where the active state is elevated by a slight scale or shadow, and the inactive states are transparent.
- **Application**: Stage breadcrumbs (Groups, R16, QF) and Stat Toggles.
- **Visuals**: Primary background `#ffffff`, borders `#e5e7eb`, active indicator `#0a0a0a` text on white background with subtle shadow.

**Key Pattern: Feature Cards**
- **Mechanism**: High whitespace-to-content ratio. Labels are small, gray, and often all-caps (`text-transform: uppercase`).
- **Application**: KPI Cards (Goals today, xG top today).

## 2. Modal.com: Terminal Precision & Structural Contrast

**Key Pattern: The "Technical Hero"**
- **Mechanism**: Near-black full-width bands (Surface Dark `#1a1a1a`) with technical monospaced readouts and neon accents.
- **Application**: Live Match Hero Section.
- **Visuals**: Font: IBM Plex Mono. Accents: `#10b981` (Live/Success) and `#10b981` glowing borders (1px).

**Key Pattern: Floating Header**
- **Mechanism**: High-radius (9999px) pill-shaped main navigation that detaches from the page edges on scroll.
- **Application**: Main Dashboard Navigation.

## 3. MadeWithGSAP.com: Motion as Meaning

**Key Pattern: Momentum Stagger**
- **Mechanism**: Grid items do not appear all at once. They use a staggered `opacity: 0` to `1` and `translateY: 20px` to `0` with a 40ms delay per item.
- **Application**: Player Card Grid entry.
- **Implementation**: `gsap.from(".player-card", { opacity: 0, y: 20, stagger: 0.04, duration: 0.6, ease: "power2.out" })`.

**Key Pattern: Nested Contrast**
- **Mechanism**: Dark interactive previews nested inside light-colored cards.
- **Application**: Group Table nested inside a larger tournament summary card.

## 4. ParadigmAI.com: Real-Time Disclosure

**Key Pattern: The "Pulsing Status"**
- **Mechanism**: A small animated dot (pulse) next to text that resolves into a semantic tag once a process finishes.
- **Application**: VAR Checks and Live Score events.
- **Visuals**: Pulse `opacity 1 -> 0.4 -> 1` every 1500ms.

**Key Pattern: Editorial vs. Technical Pairing**
- **Mechanism**: Pairing a bold, characterful Display font (Syne) with a highly tabular Monospaced font (IBM Plex Mono) for data.
- **Application**: View Headlines (e.g., "PLAYER ANALYTICS") paired with data columns.
