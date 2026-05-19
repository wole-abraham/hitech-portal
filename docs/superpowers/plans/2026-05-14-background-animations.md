# Background & Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add diagonal shooting-star background animation and consistent micro-interactions across the Hitech Portal.

**Architecture:** CSS keyframes define all motion; a tiny JS spawner in `AmbientBackground.tsx` creates and auto-removes star elements every 2–3s. Micro-interactions use a shared CSS class `.htcard` for list rows and React state for buttons already in PageShell. `prefers-reduced-motion` disables all motion at the OS level.

**Tech Stack:** React (Next.js App Router), CSS custom properties, TypeScript

---

## File Map

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `.shooting-star`, `@keyframes shootingStar`, `.htcard` hover, `@keyframes shellIn`, `prefers-reduced-motion` block |
| `src/components/AmbientBackground.tsx` | Replace static component with JS star spawner |
| `src/components/PageShell.tsx` | Add `translateY` to page entrance animation |
| `src/app/employees/page.tsx` | Add `className="htcard"` to list card divs |
| `src/app/equipment/page.tsx` | Add `className="htcard"` to list card divs |
| `src/app/reports/page.tsx` | Add `className="htcard"` to list card divs |
| `src/app/history/page.tsx` | Add `className="htcard"` to list card divs |
| `src/app/worker/machines/page.tsx` | Add `className="htcard"` to list card divs |

---

## Task 1: Add CSS keyframes and classes to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add shooting-star keyframe and class**

Open `src/app/globals.css`. After the existing `@keyframes amberPulse` block, add:

```css
/* ── Shooting star ───────────────────────────────────────────── */
.shooting-star {
  position: fixed;
  pointer-events: none;
  z-index: 1;
  height: 1.5px;
  width: var(--star-length, 100px);
  border-radius: 1px;
  transform-origin: left center;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(227, 28, 61, 0.45) 35%,
    rgba(255, 255, 255, 0.88) 100%
  );
  animation: shootingStar var(--star-duration, 0.65s) ease-in forwards;
}

@keyframes shootingStar {
  0%   { opacity: 0;   transform: rotate(var(--star-angle, 35deg)) translateX(0); }
  15%  { opacity: 0.9; }
  80%  { opacity: 0.5; }
  100% { opacity: 0;   transform: rotate(var(--star-angle, 35deg)) translateX(var(--star-travel, 500px)); }
}
```

- [ ] **Step 2: Add htcard hover class**

After the `.shooting-star` block, add:

```css
/* ── List card hover ─────────────────────────────────────────── */
.htcard {
  transition: background 0.15s ease, box-shadow 0.15s ease !important;
  cursor: pointer;
}
.htcard:hover {
  background: #191512 !important;
  box-shadow: inset 3px 0 0 rgba(227, 28, 61, 0.45), 0 2px 12px rgba(0, 0, 0, 0.25) !important;
}
```

- [ ] **Step 3: Add page entrance keyframe**

Add after the `.htcard` block:

```css
/* ── Page entrance ───────────────────────────────────────────── */
@keyframes shellIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 4: Add filter chip press feedback**

Add after the `.htcard` block:

```css
/* ── Filter chip press feedback ──────────────────────────────── */
.htchip {
  transition: transform 0.1s ease, box-shadow 0.15s ease !important;
}
.htchip:active {
  transform: scale(0.93) !important;
}
```

- [ ] **Step 5: Add prefers-reduced-motion overrides**

Add at the very end of `globals.css`:

```css
/* ── Reduced motion ──────────────────────────────────────────── */
@media (prefers-reduced-motion: reduce) {
  .shooting-star { display: none; }
  .shell-content { animation: none !important; opacity: 1 !important; transform: none !important; }
}
```

- [ ] **Step 5: Verify CSS is valid**

Run: `npx tsc --noEmit`
Expected: no errors (TypeScript won't catch CSS issues but confirms the build pipeline is healthy)

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "Add shooting-star, htcard hover, shellIn, reduced-motion CSS"
```

---

## Task 2: Replace AmbientBackground with shooting-star spawner

**Files:**
- Modify: `src/components/AmbientBackground.tsx`

- [ ] **Step 1: Rewrite AmbientBackground.tsx**

Replace the entire file content with:

```tsx
'use client'

import { useEffect, useRef } from 'react'

function spawnStar(container: HTMLDivElement) {
  const star = document.createElement('div')
  star.className = 'shooting-star'

  const length   = 80  + Math.random() * 60         // 80–140px
  const duration = 0.55 + Math.random() * 0.2        // 0.55–0.75s
  const angle    = 35  + (Math.random() - 0.5) * 16  // 27–43deg
  const travel   = 350 + Math.random() * 200          // 350–550px

  const useTopEdge = Math.random() > 0.35
  const startX = useTopEdge
    ? Math.random() * window.innerWidth * 0.75
    : -(length + 10)
  const startY = useTopEdge
    ? -(length + 10)
    : Math.random() * window.innerHeight * 0.55

  star.style.cssText = [
    `--star-length: ${length}px`,
    `--star-duration: ${duration}s`,
    `--star-angle: ${angle}deg`,
    `--star-travel: ${travel}px`,
    `left: ${startX}px`,
    `top: ${startY}px`,
  ].join('; ')

  star.addEventListener('animationend', () => star.remove(), { once: true })
  container.appendChild(star)
}

export default function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let timeout: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = 2000 + Math.random() * 1000  // 2–3s
      timeout = setTimeout(() => {
        spawnStar(container!)
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, #0d0608 0%, #080604 70%)',
      }} />
      {/* Red corner glow — top left */}
      <div style={{
        position: 'absolute',
        width: '60vw', height: '60vw',
        background: 'radial-gradient(circle, rgba(227,28,61,0.10) 0%, transparent 70%)',
        top: '-20%', left: '-15%',
        borderRadius: '50%',
      }} />
      {/* Yellow corner glow — bottom right */}
      <div style={{
        position: 'absolute',
        width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(245,200,0,0.07) 0%, transparent 70%)',
        bottom: '-15%', right: '-12%',
        borderRadius: '50%',
      }} />
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/AmbientBackground.tsx
git commit -m "Add shooting-star spawner to AmbientBackground"
```

---

## Task 3: PageShell — add translateY to page entrance animation

**Files:**
- Modify: `src/components/PageShell.tsx` (around line 134)

- [ ] **Step 1: Update shell-content div**

Find this block in `PageShell.tsx`:

```tsx
      <div
        className="shell-content"
        style={{
          overflow: 'hidden',
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
```

Replace with:

```tsx
      <div
        className="shell-content"
        style={{
          overflow: 'hidden',
          animation: vis ? 'shellIn 0.3s ease forwards' : 'none',
          opacity: vis ? undefined : 0,
        }}
      >
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/PageShell.tsx
git commit -m "Use shellIn keyframe for page entrance animation"
```

---

## Task 4: Add htcard class to list card rows

**Files:**
- Modify: `src/app/employees/page.tsx`
- Modify: `src/app/equipment/page.tsx`
- Modify: `src/app/reports/page.tsx`
- Modify: `src/app/history/page.tsx`
- Modify: `src/app/worker/machines/page.tsx`

- [ ] **Step 1: employees/page.tsx**

Find the card div (around line 147). It looks like:
```tsx
            <div key={emp.id} onClick={() => openEdit(emp)} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '15px 16px',
```

Add `className="htcard"`:
```tsx
            <div key={emp.id} className="htcard" onClick={() => openEdit(emp)} style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: '15px 16px',
```

- [ ] **Step 2: equipment/page.tsx**

Find the machine card div (search for `background: T.card, border:` inside the map). Add `className="htcard"` to that div.

- [ ] **Step 3: reports/page.tsx**

Find the report card div inside the `.map(`. Add `className="htcard"`.

- [ ] **Step 4: history/page.tsx**

Find the history entry card div inside the `.map(`. Add `className="htcard"`.

- [ ] **Step 5: worker/machines/page.tsx**

Find the machine card div inside the `.map(`. Add `className="htcard"`.

- [ ] **Step 6: Type-check all pages**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6b: Add htchip to filter chip buttons in each page**

In each of the 5 page files above, find the filter chip `<button>` elements (they use `filterStatus`, `filterProject`, or `filterFleet` state). Add `className="htchip"` to each filter button:

```tsx
// Before
<button key={s} onClick={() => setFilterStatus(s)} style={{ ... }}>

// After
<button key={s} className="htchip" onClick={() => setFilterStatus(s)} style={{ ... }}>
```

- [ ] **Step 7: Commit**

```bash
git add src/app/employees/page.tsx src/app/equipment/page.tsx src/app/reports/page.tsx src/app/history/page.tsx src/app/worker/machines/page.tsx
git commit -m "Add htcard hover and htchip press classes to list pages"
```

---

## Manual Verification Checklist

After all tasks complete, test in browser (mobile viewport):

- [ ] Shooting stars appear diagonally every 2–3s, fade out cleanly, no DOM accumulation (inspect Elements panel — no stale `.shooting-star` divs)
- [ ] Stars travel upper-left → lower-right at ~35–45°
- [ ] Page load: content fades in + rises 10px on every shell page (Reports, Employees, Equipment, History)
- [ ] List cards: left red accent appears on hover/tap
- [ ] Login button, Save button: lift on hover, snap back on click
- [ ] `prefers-reduced-motion: reduce` in OS settings → all motion stops, page is fully usable
