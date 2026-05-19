# Dropdown Seeding & Cascading Report Form

**Date:** 2026-05-18
**Status:** Approved

## Goal

Seed all activity-report dropdown tables from the existing XLSForm data, create three new lookup tables (site supervisors, site engineers, machinery types), wire them into the Config page for ongoing management, and update the report submission form so supervisor, engineer, and machinery dropdowns are database-driven with correct cascade behaviour.

---

## 1. Database

### 1a. Seed existing tables (upsert — safe to re-run)

| Table | Rows | Notes |
|---|---|---|
| `hitech_report_activitycategory` | 13 | insert by name, skip if exists |
| `hitech_report_activitytype` | ~100 | `category_id` resolved by category name |
| `hitech_report_activitysubtype` | ~80 | `activity_type_id` resolved by type name |
| `hitech_report_teamcar` | 3 | NISSAN + 2 TOYOTA RENTALs |
| `hitech_report_subcontractorname` | 3 | Zenith, SPG, Multi road |

### 1b. New tables

```sql
hitech_report_sitesupervisor (
  id     serial primary key,
  name   text not null,
  party  text not null,   -- 'Hitech employees' | 'Sub-contactor'
  order  int  default 0
)

hitech_report_siteengineer (
  id     serial primary key,
  name   text not null,
  party  text not null,   -- 'Hitech employees' | 'Sub-contactor'
  order  int  default 0
)

hitech_report_machinerytype (
  id     serial primary key,
  name   text not null,
  order  int  default 0
)
```

All three get RLS enabled; service role bypasses it.

Seeded rows:
- **Site supervisors (11):** Nabih (Hitech), Ziad (Hitech), Elie (Hitech), Dory (Hitech), Thens (Hitech), Antonios - Abou Nadim (Hitech), Ali Ismail (Hitech), Tony (Sub-contactor), Ahmad (Sub-contactor), Boutros (Sub-contactor), Nadim (Sub-contactor)
- **Site engineers (8):** Believe, TONY, BUKOLA, ADERONKE, SODIQ, TONY, Mohammad, Ekene — all Hitech employees
- **Machinery types (30):** CRCP paver, Asphalt paver, Dozer, Grader, Excavator, Swamp buggy, Smooth Roller, Impact roller, Padfoot Roller, Water Tanker, Diesel Tanker, Hillux Pickup, Level Instruments, Total Stations, GPS, Batymetric survey machine, Drone, Canoe, Vehicules, Containers, Tipper, Payloader, Mechanical broom, Mobile crane, Plate compactor, Manitou, Crane, Dumper, Concrete mixer, Flat bed

---

## 2. Config API

File: `src/app/api/config/[resource]/route.ts`

Add to `TABLE_MAP`:

```typescript
supervisors:    { table: 'hitech_report_sitesupervisor', order: 'order' },
engineers:      { table: 'hitech_report_siteengineer',   order: 'order' },
machinerytypes: { table: 'hitech_report_machinerytype',  order: 'order' },
```

No new route file needed — the generic CRUD handler covers all operations.

---

## 3. Config Page

File: `src/app/config/page.tsx`

Add three new `Section` entries (above Sign-in History):

| Icon | Title | Resource | Fields |
|---|---|---|---|
| 👷 | Site Supervisors | supervisors | name (text, required), party (select: Hitech employees / Sub-contactor) |
| 🧑‍💼 | Site Engineers | engineers | name (text, required), party (select: Hitech employees / Sub-contactor) |
| 🚧 | Machinery Types | machinerytypes | name (text, required) |

`party` uses a `select` field type with hardcoded options `['Hitech employees', 'Sub-contactor']`.

---

## 4. Report Form

File: `src/app/reports/submit/page.tsx`

### 4a. Data fetching (initialisation)

Add three fetches alongside existing ones:

```typescript
fetch supabase hitech_report_sitesupervisor  → supervisorOptions[]
fetch supabase hitech_report_siteengineer    → engineerOptions[]
fetch supabase hitech_report_machinerytype   → machineryTypeOptions[]
```

### 4b. Supervisor repeat group (Card 5)

- Name dropdown: filter `supervisorOptions` by selected `party` for that row. Show all when party is blank.
- "Not in list" free-text option stays.

### 4c. Engineer repeat group (Card 6)

- Name dropdown: filter `engineerOptions` by selected `party` for that row. Show all when party is blank.
- "Not in list" free-text option stays.

### 4d. Machinery repeat group (Card 8)

- Machine type dropdown: replace `surveycollection_planningtable`-derived types with `machineryTypeOptions`.
- Ownership field stays independent (Hitech / Renting / Subcontractor).
- Driver dropdown stays from `surveycollection_employee`.
- Fleet number lookup stays unchanged.

### 4e. Reporter name

No change — stays auto-filled from session user.

---

## 5. Error handling

- All new Supabase fetches are non-blocking; form renders with empty dropdowns if a fetch fails.
- Seeding migration uses `ON CONFLICT DO NOTHING` so re-runs are safe.
- Config CRUD returns `{ error }` on failure; UI surfaces it inline (existing pattern).

---

## Out of scope

- `reporter_name` dropdown (stays as session auto-fill)
- `weather`, `side`, `status` (stay hardcoded)
- Chainage table (no changes)
- Any changes to report storage schema
