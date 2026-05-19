# Background & Animations Design
**Date:** 2026-05-14  
**Project:** Hitech Portal  
**Status:** Approved

---

## Goal

Replace the current static background with a dark, modern design featuring subtle shooting-star animations and consistent micro-interactions across all pages — without impacting performance on low-end Android devices used on construction sites.

---

## Section 1: Background & Shooting Stars

### Background
- Base: `#080604` (unchanged)
- Vignette layer: `radial-gradient` from `#0d0608` (centre) to `#080604` (edges) — adds depth, barely perceptible

### Shooting Stars
**Implementation:** Lightweight JS spawn/despawn in `AmbientBackground.tsx`

- A `setInterval` fires every 2–3s (randomised per tick)
- Each tick spawns one `<div>` with class `shooting-star`
- **Appearance:** 1–2px wide, 80–140px long `linear-gradient` (white/red head → transparent tail)
- **Motion:** CSS `@keyframes` — `translateX(+60vw) translateY(+60vh)` over 0.55–0.75s with `ease-in`
- **Opacity:** fades 0 → 1 → 0 within the same keyframe
- **Direction:** upper-left → lower-right, ~35–45° diagonal, ±8° variation per star
- **Cleanup:** element removes itself via `onAnimationEnd` callback — no DOM accumulation
- **GPU:** all motion via CSS transforms only — no layout reflow, no canvas

---

## Section 2: Micro-interactions

### Input Focus
- Border: transitions to `#e31c3d`
- Glow: `box-shadow: 0 0 0 3px rgba(227,28,61,0.18)`
- Applied consistently via shared `inp` style helper in `PageShell.tsx`

### Primary Buttons (CTA)
- Hover: `translateY(-2px)` + `box-shadow: 0 6px 20px rgba(227,28,61,0.35)`
- Active/press: snaps to `translateY(0)` instantly
- Transition: `all 0.15s ease`

### List/Card Rows
- Hover: left border accent `border-left: 2px solid rgba(227,28,61,0.45)`
- Background lightens: `rgba(255,255,255,0.02)`
- Communicates tappability without heavy effects

### Filter Chips (active selection)
- One-shot `box-shadow` expand-and-fade (0.4s) on selection
- Not looping — fires once when chip becomes active

### Page Entrance
- `opacity: 0 → 1` + `translateY(10px → 0)` over `0.3s ease`
- Standardised via `PageShell` content wrapper — applies to all inner pages

### Reduced Motion
- All animations and transitions wrapped with `@media (prefers-reduced-motion: reduce)` — motion fully disabled for users with that OS setting

---

## Files Affected

| File | Change |
|------|--------|
| `src/components/AmbientBackground.tsx` | Add shooting-star spawn logic + CSS keyframes |
| `src/app/globals.css` | Add `.shooting-star` keyframe + `prefers-reduced-motion` rules; vignette layer |
| `src/components/PageShell.tsx` | Standardise page entrance animation; update `inp` shared style |

---

## Constraints

- No `<canvas>` — too heavy for low-end site phones
- No looping ambient animations on UI elements
- Stars must self-clean via `onAnimationEnd`
- All motion CSS-driven (GPU transforms only)
