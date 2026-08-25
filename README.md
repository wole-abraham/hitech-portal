# Hitech Portal

Field operations platform for **Hitech Construction Ltd**. Site workers submit
daily progress reports with photos and chainage references; office staff manage
employees, equipment and planned activities; and everything is exposed to Power
BI through a dedicated reporting API.

This is the main platform. The sibling **hitech-dashboard** repository is a
read-only analytics view over the same Supabase project.

---

## What it does

- **Daily reporting** — workers start a report, capture activity against a
  chainage range, attach photos and video, and submit. Reports can be reused as
  templates or bulk-imported from spreadsheets.
- **Workforce** — employee records, photos, and status history over time.
- **Equipment** — machine register with assign/receive movements and history.
- **Planned activities** — scheduled work, tracked against what was reported.
- **Biometrics** — fingerprint enrolment and identification endpoints for
  attendance.
- **Power BI feed** — a parallel `/api/powerbi/*` surface serving flattened
  datasets for external BI consumption.
- **Configuration** — admin-managed dropdown vocabularies, chainage definitions
  and project sections, so the data model is tunable without a deploy.
- **White-labelling** — app name, company, tagline, logo and favicon all come
  from environment variables (`src/lib/brand.ts`).

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) — **pinned to a version with breaking changes; see the note below** |
| Language | TypeScript |
| Database / auth | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) |
| Session | `iron-session` encrypted cookie |
| Object storage | Cloudflare R2 via `@aws-sdk/client-s3` (`src/lib/r2.ts`) |
| Email | Resend |
| UI | shadcn/ui, `@base-ui/react`, Tailwind, `lucide-react`, `sonner`, `next-themes` |
| Maps | Leaflet |
| 3D | `three`, `@react-three/fiber`, `@react-three/drei` |
| Spreadsheets | `xlsx` |
| Tests | Vitest |

> **Next.js version note** (from `AGENTS.md`): this is **not** the Next.js most
> references describe. APIs, conventions and file structure differ. Read the
> relevant guide in `node_modules/next/dist/docs/` before writing Next-specific
> code, and heed deprecation notices.

## Architecture

```
src/
  app/
    portal/            Worker landing
    reports/           start - submit - success - import - list
    employees/         Workforce management
    equipment/         Machine register
    planned/           Planned activities
    history/           Audit / change history
    config/            Admin configuration
    worker/machines/   Worker-facing machine view
    profile/           User profile
    login, signup, forgot-password, reset-password, verify-email
    mockup/            Design mockups (admin, report)
    api/               See API reference below
  lib/
    session.ts         iron-session configuration
    supabase.ts        Supabase client wiring
    r2.ts              Cloudflare R2 upload/signing
    brand.ts           Environment-driven white-labelling
    mediaQueue.ts      Media upload queue
    parseChainage.ts   Chainage string parsing
    notify.ts          Resend email dispatch
    types.ts, utils.ts
docs/superpowers/      Design specs and implementation plans
scripts/               test-supabase.mjs, test-endpoints.mjs
```

### Chainage

Reports are positioned along the alignment by **chainage** rather than
coordinates. `src/lib/parseChainage.ts` is the single place that interprets
chainage strings — changes to the accepted format belong there, not in
individual routes.

## Getting started

```bash
npm install
npm run dev            # http://localhost:3000
```

| Script | Does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:supabase` | Connectivity check against Supabase |
| `npm run test:endpoints` | Smoke-test the API surface |

## Configuration

Create `.env.local`:

### Supabase and session

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only — bypasses RLS |
| `SESSION_SECRET` | iron-session encryption key (32+ chars) |
| `SECURE_COOKIE` | Set truthy in production to force `Secure` cookies |

### Cloudflare R2

| Variable | Purpose |
|---|---|
| `R2_ENDPOINT` | Account-scoped S3 endpoint |
| `R2_ACCESS_KEY_ID` | Access key |
| `R2_SECRET_ACCESS_KEY` | Secret key |
| `R2_BUCKET_NAME` | Media bucket |
| `R2_PUBLIC_URL` | Public base URL for stored media |

### Email

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Resend key |
| `RESEND_FROM_EMAIL` | Verified sender |
| `NOTIFY_EMAIL` | Destination for system notifications |

### Branding

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | Application name |
| `NEXT_PUBLIC_APP_COMPANY` | Company name |
| `NEXT_PUBLIC_APP_TAGLINE` | Tagline |
| `NEXT_PUBLIC_LOGO_URL` | Logo |
| `NEXT_PUBLIC_FAVICON_URL` | Favicon |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (used in email links) |

## API reference

Routes require a valid session cookie unless noted. `401` = unauthenticated,
`403` = authenticated but wrong role. Roles are `admin` and `worker`.

### Auth

`POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`,
`POST /api/auth/signup`, `POST /api/auth/verify-email`,
`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`

`login` verifies Django-style `pbkdf2_sha256` hashes from the Supabase
`auth_user` table and sets the `hitech-session` cookie.

### Reports

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/reports` | List reports |
| `POST` | `/api/reports/submit` | Submit a report |
| `GET` | `/api/reports/[id]` | Report detail |
| `GET` | `/api/reports/[id]/detail` | Expanded detail |
| `GET` | `/api/reports/[id]/media` | Attached media |
| `POST` | `/api/reports/upload` | Upload media to R2 |
| `GET` | `/api/reports/filters` | Available filter values |
| `GET` | `/api/reports/chainage` | Chainage lookups |
| `POST` | `/api/reports/import` | Bulk import from spreadsheet |
| `GET` | `/api/reports/template` | Import template |
| `POST` | `/api/reports/reuse` | Clone a previous report |

### Workforce and equipment

| Method | Path | Purpose |
|---|---|---|
| `GET`/`POST` | `/api/employees` | List / create employees |
| `GET`/`PATCH`/`DELETE` | `/api/employees/[id]` | Single employee |
| `POST` | `/api/employees/upload` | Bulk employee import |
| `POST` | `/api/employees/upload-photo` | Employee photo |
| `GET` | `/api/employees/status-history` | Status changes over time |
| `GET`/`POST` | `/api/equipment` | List / create equipment |
| `GET`/`PATCH` | `/api/equipment/[id]` | Single machine |
| `POST` | `/api/equipment/[id]/assign` | Assign to a site |
| `POST` | `/api/equipment/[id]/receive` | Receive back |
| `GET`/`POST` | `/api/worker/machines` | Worker machine view |
| `POST` | `/api/worker/machines/update` | Worker machine update |

### Planning, config and misc

| Method | Path | Purpose |
|---|---|---|
| `GET`/`POST` | `/api/planned` | Planned activities |
| `GET`/`PATCH`/`DELETE` | `/api/planned/[id]` | Single activity |
| `GET` | `/api/dashboard` | Aggregated dashboard data |
| `GET` | `/api/history` | Change history |
| `GET` | `/api/projects` | Projects |
| `GET` | `/api/sections` | Project sections |
| `GET` | `/api/users` | User list |
| `GET`/`PUT` | `/api/profile` | Current user profile |
| `GET`/`PUT` | `/api/config/[resource]` | Admin-managed vocabularies |
| `GET`/`PUT` | `/api/config/chainages` | Chainage definitions |
| `GET` | `/api/drainage-components` | Drainage component register |
| `POST` | `/api/components/import` | Import components |
| `GET` | `/api/components/lookup` | Component lookup |
| `POST` | `/api/fingerprint/enroll` | Enrol a fingerprint |
| `POST` | `/api/fingerprint/identify` | Identify by fingerprint |

### Power BI feed

Flattened, BI-friendly datasets under `/api/powerbi/*`, consumed by Power BI:
`reports`, `progress`, `media`, `employees`, `employee-history`,
`employee-status-history`, `equipment`, `machine-history`,
`planned-activities`, `planned-activity-history`, `report-employees`,
`report-engineers`, `report-machines`, `report-supervisors`.

Keep this surface stable — changing a field name breaks published Power BI
reports downstream.

## Design docs

`docs/superpowers/` holds the specs and plans behind the larger features —
navigation shell, background animations, the config admin page, and dropdown
seeding.

## Deployment

Deploys to Vercel. Set every variable above in the Vercel project. Media goes to
R2 rather than the filesystem, so the deployment is stateless.

## Related

- **hitech-dashboard** — analytics dashboard reading the same Supabase project.
- **automate_survey_save** — ArcGIS to Google Drive sync feeding survey data in.
