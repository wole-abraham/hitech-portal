# Navigation & Shell UX Redesign
**Date:** 2026-05-14
**Project:** Hitech Portal — Sub-project 1 of 4 (Full UX Redesign)
**Status:** Approved

---

## Goal

Replace the current sticky header + "back to Portal" button pattern with a role-aware, responsive navigation shell:
- **Mobile (<768px):** bottom tab bar for workers and admins
- **Desktop (≥768px):** collapsible left sidebar

---

## Architecture

### New component: `src/components/NavShell.tsx`

Replaces `PageShell` as the primary layout wrapper. Responsibilities:
1. Fetch `/api/auth/me` once on mount → store `role` (`'worker' | 'admin'`) in local state
2. Read `usePathname()` to determine the active route
3. Render minimal sticky header (title + subtitle)
4. Render bottom tab bar on mobile OR left sidebar on desktop
5. Render `AmbientBackground`

### Backwards compatibility

`PageShell` becomes a thin re-export of `NavShell` with the same props interface. No page file needs to change its import.

### Nav items

Defined as a typed constant in `NavShell.tsx`:

```ts
const WORKER_NAV = [
  { href: '/portal',          label: 'Home',    icon: 'grid'   },
  { href: '/reports/submit',  label: 'Submit',  icon: 'plus'   },
  { href: '/worker/machines', label: 'Machines',icon: 'wrench' },
  { href: '/history',         label: 'History', icon: 'clock'  },
]

const ADMIN_NAV = [
  { href: '/portal',     label: 'Dashboard', icon: 'grid'     },
  { href: '/reports',    label: 'Reports',   icon: 'doc'      },
  { href: '/employees',  label: 'Employees', icon: 'person'   },
  { href: '/equipment',  label: 'Equipment', icon: 'gear'     },
  { href: '/history',    label: 'History',   icon: 'clock'    },
]
```

Active item determined by `pathname.startsWith(href)`.

---

## Section 1: Shell Architecture

- `NavShell` wraps every authenticated page
- Single auth fetch (`/api/auth/me`) at shell level — result cached in component state
- `usePathname()` drives active nav item — no extra state
- `AmbientBackground` rendered once inside `NavShell`
- `PageShell` re-exports `NavShell` for zero-migration backwards compatibility

**Props interface (unchanged from PageShell):**
```ts
interface NavShellProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode  // NEW: optional header right-side slot
}
```

---

## Section 2: Mobile Bottom Tab Bar (<768px)

**Container:**
- `position: fixed; bottom: 0; left: 0; right: 0; z-index: 100`
- Height: `64px` + `env(safe-area-inset-bottom)`
- Background: `rgba(8,6,4,0.96)` + `backdrop-filter: blur(20px)`
- Top border: `1px solid rgba(237,232,222,0.07)`

**Each tab:**
- Layout: icon (24×24) above label (10px, DM Sans, uppercase, letter-spacing 0.08em)
- Touch target: full tab area — minimum 44×64px
- Inactive: icon + label `#655d53`
- Active: icon + label `#e31c3d`, 2px red pill indicator (24×2px, `border-radius: 1px`) above icon, faint red radial glow `rgba(227,28,61,0.12)` behind icon
- Navigation: `<Link href={...}>` — no imperative router calls

**Content area:**
- `padding-bottom: 72px` on the shell content div to clear the tab bar

**Worker tabs:** Home, Submit, Machines, History (4 tabs)
**Admin tabs:** Dashboard, Reports, Employees, Equipment, History (5 tabs)

---

## Section 3: Desktop Left Sidebar (≥768px)

**Dimensions:**
- Expanded: `220px` wide
- Collapsed: `64px` wide (icon only)
- Full viewport height, `position: sticky; top: 0`

**Visual:**
- Background: `rgba(8,6,4,0.97)`
- Right border: `1px solid rgba(237,232,222,0.07)`
- Collapse toggle: chevron button at sidebar bottom
- Collapse state persisted in `localStorage` key `hitech_sidebar_collapsed`

**Top section:**
- Logo (32×32, `border-radius: 8px`) + "HITECH" wordmark (DM Sans 800) when expanded
- Logo only when collapsed
- Clicking logo navigates to `/portal`

**Each nav item:**
- Height: `48px`, `padding: 0 16px`, `border-radius: 10px`
- Icon (20×20) + label (13px, DM Sans 500) when expanded; icon only when collapsed
- Collapsed: centered icon, tooltip on hover showing label
- Inactive: `#655d53` icon + text, transparent background
- Hover: `rgba(255,255,255,0.04)` background
- Active: `border-left: 3px solid #e31c3d` + `rgba(227,28,61,0.08)` background + red icon + red text
- Smooth `transition: all 0.15s ease`

**Content area shift:**
- `margin-left: 220px` expanded, `margin-left: 64px` collapsed
- `transition: margin-left 0.2s ease`

---

## Section 4: Header

**Both mobile and desktop:**
- Height: `52px`, `position: sticky; top: 0; z-index: 100`
- Background: `rgba(8,6,4,0.92)` + `backdrop-filter: blur(20px)`
- Bottom border: `1px solid rgba(237,232,222,0.07)`
- Left: page `title` (DM Sans 700, 1rem) + `subtitle` below (DM Mono, 0.68rem, muted)
- Right: optional `action` slot (e.g. "+ Add" button) — `undefined` renders nothing

**No back button.** Tabs and sidebar handle all navigation.

---

## Section 5: Responsive Layout & Migration

**Breakpoint:** `768px` — below = mobile tab bar, above = desktop sidebar

**Layout grid (desktop):**
```css
.nav-shell-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width, 220px) 1fr;
  min-height: 100vh;
}
```

**Content max-width:** `900px` centred within the right column (matches existing `.shell-content` behaviour)

**Migration:**
- `PageShell` re-exports `NavShell` — all existing page files work immediately with zero changes
- The `action` prop is additive — pages opt in when they want a header action button
- Pages that currently show "+ Add" buttons can move them to the `action` prop over time

---

## Files Affected

| File | Change |
|------|--------|
| `src/components/NavShell.tsx` | Create — new navigation shell component |
| `src/components/PageShell.tsx` | Change to re-export NavShell |
| `src/app/globals.css` | Add `.nav-shell-layout`, sidebar transition, tab bar styles |

---

## Constraints

- No additional dependencies — SVG icons inlined, no icon library
- `localStorage` for sidebar collapse state — no server storage needed
- Auth fetch in NavShell is the same `/api/auth/me` endpoint already used by pages
- Mobile tab bar must not overlap page content (padding-bottom enforced)
- All nav items use `<Link>` — no `useRouter().push()` calls
