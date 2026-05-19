#!/usr/bin/env node
/**
 * API endpoint integration tests.
 * Requires the dev server to be running: npm run dev
 *
 * Usage:
 *   node scripts/test-endpoints.mjs
 *
 * To test authenticated endpoints, set in .env.local or as env vars:
 *   TEST_EMAIL=you@example.com
 *   TEST_PASSWORD=yourpassword
 *   TEST_ROLE=admin          (or worker)
 *
 * Architecture note (Next.js 16 / proxy.ts):
 *   - proxy.ts is the middleware that protects all routes EXCEPT /api/auth/*.
 *   - Unauthenticated requests get 307 → /login (not 401) from middleware.
 *   - Only /api/auth/* routes handle their own auth and return 401.
 */

import { readFileSync } from 'fs'

// Parse .env.local
let env = {}
try {
  const content = readFileSync('.env.local', 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 0) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    env[k] = v
  }
} catch {}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const EMAIL    = process.env.TEST_EMAIL    || env.TEST_EMAIL    || ''
const PASSWORD = process.env.TEST_PASSWORD || env.TEST_PASSWORD || ''
const ROLE     = process.env.TEST_ROLE     || env.TEST_ROLE     || 'admin'

let passed = 0, failed = 0
let sessionCookie = ''

// redirect:'manual' so we see actual status codes (307 etc.) instead of following them
async function req(method, path, body, useCookie = true) {
  const headers = { 'Content-Type': 'application/json' }
  if (useCookie && sessionCookie) headers['Cookie'] = sessionCookie
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  const setCookie = res.headers.get('set-cookie')
  if (setCookie) sessionCookie = setCookie.split(';')[0]
  let data = null
  try { data = await res.json() } catch {}
  return { status: res.status, data, headers: Object.fromEntries(res.headers.entries()) }
}

async function check(name, fn) {
  try {
    await fn()
    console.log(`  ✓  ${name}`)
    passed++
  } catch (err) {
    console.log(`  ✗  ${name}: ${err.message}`)
    failed++
  }
}

console.log('\n══════════════════════════════════════════════')
console.log('  Hi-Tech Portal — API Endpoint Tests')
console.log(`  Base URL: ${BASE_URL}`)
console.log('══════════════════════════════════════════════\n')

// ── Connectivity ─────────────────────────────────────────────────────────────
console.log('▸ Server connectivity')
await check('server is running', async () => {
  const res = await fetch(BASE_URL, { redirect: 'manual' }).catch(e => { throw new Error(`Cannot connect: ${e.message}`) })
  if (res.status >= 500) throw new Error(`Server error ${res.status}`)
})

// ── Middleware protection (proxy.ts) ──────────────────────────────────────────
// All routes except /api/auth/* are protected by the middleware.
// Unauthenticated requests get 307 → /login (not 401).
console.log('\n▸ Middleware protection (proxy.ts) — 307 → /login expected')
await check('GET /api/reports → 307 redirect when not logged in', async () => {
  const { status, headers } = await req('GET', '/api/reports', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
  if (!headers.location?.includes('/login')) throw new Error(`Expected redirect to /login, got ${headers.location}`)
})
await check('GET /api/reports/filters → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/reports/filters', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('GET /api/history → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/history', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('GET /api/projects → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/projects', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('GET /api/sections → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/sections', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('GET /api/employees → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/employees', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('GET /api/equipment → 307 when not logged in', async () => {
  const { status } = await req('GET', '/api/equipment', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})
await check('POST /api/reports/submit → 307 when not logged in', async () => {
  const { status } = await req('POST', '/api/reports/submit', {}, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})

// ── /api/auth/* routes bypass middleware — handle own auth ────────────────────
console.log('\n▸ Auth routes (bypass middleware, handle own 401)')
await check('GET /api/auth/me → 401 when no session cookie', async () => {
  const { status } = await req('GET', '/api/auth/me', null, false)
  if (status !== 401) throw new Error(`Expected 401, got ${status}`)
})
await check('POST /api/auth/login rejects bad credentials → 401', async () => {
  const { status, data } = await req('POST', '/api/auth/login', { identifier: 'no@no.com', password: 'wrongpass', role: 'admin' }, false)
  if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  if (!data?.error) throw new Error('Missing error message in body')
})

// ── Chainage (no auth check in route itself — protected only by middleware) ───
console.log('\n▸ Chainage route middleware bypass check')
await check('GET /api/reports/chainage → 307 without session', async () => {
  const { status } = await req('GET', '/api/reports/chainage?project=Test', null, false)
  if (status !== 307) throw new Error(`Expected 307, got ${status}`)
})

// ─────────────────────────────────────────────────────────────────────────────
if (!EMAIL || !PASSWORD) {
  console.log('\n  ⚠  TEST_EMAIL / TEST_PASSWORD not set in .env.local')
  console.log('     Skipping authenticated endpoint tests.')
  console.log('     Add these to .env.local to test all endpoints:\n')
  console.log('       TEST_EMAIL=your@email.com')
  console.log('       TEST_PASSWORD=yourpassword')
  console.log('       TEST_ROLE=admin\n')
} else {
  // ── Login ──────────────────────────────────────────────────────────────────
  console.log('\n▸ Login')
  let loginOk = false
  await check(`POST /api/auth/login with credentials`, async () => {
    const { status, data } = await req('POST', '/api/auth/login', { identifier: EMAIL, password: PASSWORD, role: ROLE }, false)
    if (status !== 200) throw new Error(`Login failed: ${status} — ${data?.error}`)
    if (!data?.ok) throw new Error('Login did not return ok:true')
    loginOk = true
  })

  if (!loginOk) {
    console.log('  ⚠  Login failed — skipping authenticated tests')
  } else {
    await check('GET /api/auth/me → user object after login', async () => {
      const { status, data } = await req('GET', '/api/auth/me')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!data?.user) throw new Error('No user object')
      if (!data.user.email) throw new Error('Missing email')
      if (!('username' in data.user)) throw new Error('Missing username field (session schema updated)')
    })

    // ── Report endpoints ────────────────────────────────────────────────────
    console.log('\n▸ Report endpoints')
    await check('GET /api/reports → reports[] + total', async () => {
      const { status, data } = await req('GET', '/api/reports')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.reports)) throw new Error('Missing reports array')
      if (typeof data.total !== 'number') throw new Error('Missing total')
    })
    await check('GET /api/reports?page=1 → paginated correctly', async () => {
      const { status, data } = await req('GET', '/api/reports?page=1')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.reports)) throw new Error('Missing reports array')
    })
    await check('GET /api/reports?search=a → filtered results', async () => {
      const { status, data } = await req('GET', '/api/reports?search=a&page=0')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.reports)) throw new Error('Missing reports array')
    })
    await check('GET /api/reports/filters → projects[] + categories[]', async () => {
      const { status, data } = await req('GET', '/api/reports/filters')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.projects)) throw new Error('Missing projects array')
      if (!Array.isArray(data?.categories)) throw new Error('Missing categories array')
    })

    await check('GET /api/reports/:id/detail → all sub-arrays present', async () => {
      const { data: list } = await req('GET', '/api/reports?page=0')
      const reports = list?.reports ?? []
      if (reports.length === 0) { console.log('    (no reports — skipped)'); return }
      const id = reports[0].id
      const { status, data } = await req('GET', `/api/reports/${id}/detail`)
      if (status !== 200) throw new Error(`Status ${status}`)
      for (const key of ['photos','employees','supervisors','engineers','machines']) {
        if (!Array.isArray(data?.[key])) throw new Error(`Missing or non-array "${key}"`)
      }
    })

    // ── Chainage ───────────────────────────────────────────────────────────
    console.log('\n▸ Chainage')
    await check('GET /api/reports/chainage without project → empty results', async () => {
      const { status, data } = await req('GET', '/api/reports/chainage')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.results)) throw new Error('Missing results array')
      if (data.results.length !== 0) throw new Error('Expected 0 results for empty project')
    })
    await check('GET /api/reports/chainage with first project → results', async () => {
      const { data: projs } = await req('GET', '/api/projects')
      if (!projs?.length) return
      const proj = encodeURIComponent(projs[0].name)
      const { status, data } = await req('GET', `/api/reports/chainage?project=${proj}`)
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.results)) throw new Error('Missing results array')
      if (typeof data.total !== 'number') throw new Error('Missing total')
    })

    // ── Projects and Sections ─────────────────────────────────────────────
    console.log('\n▸ Projects & Sections (dropdown sources)')
    await check('GET /api/projects → non-empty array with id+name', async () => {
      const { status, data } = await req('GET', '/api/projects')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data)) throw new Error('Expected array')
      if (data.length === 0) throw new Error('No projects — dropdown will be empty')
      if (!data[0].name) throw new Error('Missing name on project')
    })
    await check('GET /api/sections → array with project_name', async () => {
      const { status, data } = await req('GET', '/api/sections')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data)) throw new Error('Expected array')
      if (data.length > 0 && !data[0].project_name) throw new Error('Missing project_name on section')
    })

    // ── Employees & Equipment ─────────────────────────────────────────────
    console.log('\n▸ Employees & Equipment')
    await check('GET /api/employees → array', async () => {
      const { status, data } = await req('GET', '/api/employees')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data)) throw new Error('Expected array')
    })
    await check('GET /api/equipment → array', async () => {
      const { status, data } = await req('GET', '/api/equipment')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data)) throw new Error('Expected array')
    })

    // ── History ───────────────────────────────────────────────────────────
    console.log('\n▸ History')
    await check('GET /api/history → entries + total + fleets + actions', async () => {
      const { status, data } = await req('GET', '/api/history')
      if (status !== 200) throw new Error(`Status ${status}`)
      if (!Array.isArray(data?.entries)) throw new Error('Missing entries')
      if (typeof data.total !== 'number') throw new Error('Missing total')
      if (!Array.isArray(data?.fleets)) throw new Error('Missing fleets')
      if (!Array.isArray(data?.actions)) throw new Error('Missing actions')
    })

    // ── Dashboard ─────────────────────────────────────────────────────────
    console.log('\n▸ Dashboard')
    await check('GET /api/dashboard → 200', async () => {
      const { status } = await req('GET', '/api/dashboard')
      if (status !== 200) throw new Error(`Status ${status}`)
    })

    // ── Upload endpoint (real file upload, tiny 1×1 PNG) ─────────────────
    console.log('\n▸ File upload (survey-media bucket)')
    let uploadedUrl = ''
    await check('POST /api/reports/upload → uploads file, returns public URL', async () => {
      // 1×1 transparent PNG — 67 bytes, no external deps needed
      const png1x1 = Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
        'hex'
      )
      const form = new FormData()
      form.append('file', new Blob([png1x1], { type: 'image/png' }), 'test-ping.png')
      const headers = {}
      if (sessionCookie) headers['Cookie'] = sessionCookie
      const res = await fetch(`${BASE_URL}/api/reports/upload`, { method: 'POST', headers, body: form, redirect: 'manual' })
      if (res.status !== 200) throw new Error(`Status ${res.status}`)
      let data; try { data = await res.json() } catch { throw new Error('Non-JSON response') }
      if (!data.url) throw new Error(`No URL in response: ${JSON.stringify(data)}`)
      uploadedUrl = data.url
      console.log(`    URL: ${uploadedUrl}`)
    })
    await check('Uploaded URL is publicly accessible (GET → 200)', async () => {
      if (!uploadedUrl) throw new Error('No URL from previous test — skipping')
      const res = await fetch(uploadedUrl, { redirect: 'follow' })
      if (res.status !== 200) throw new Error(`Public URL returned ${res.status}`)
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('image')) throw new Error(`Unexpected content-type: ${ct}`)
    })

    // ── Submit: validation only (no actual write) ────────────────────────
    console.log('\n▸ Submit endpoint (authenticated, validation only)')
    await check('POST /api/reports/submit with empty body → 500 or validation error', async () => {
      const { status } = await req('POST', '/api/reports/submit', {})
      // Should fail to insert (missing required fields) → 500 from Supabase, not 200
      if (status === 200) throw new Error('Expected non-200 for completely empty submission')
    })

    // ── Logout ────────────────────────────────────────────────────────────
    console.log('\n▸ Logout')
    await check('POST /api/auth/logout → 200', async () => {
      const { status } = await req('POST', '/api/auth/logout')
      if (status !== 200) throw new Error(`Status ${status}`)
    })
    await check('GET /api/auth/me → 401 after logout', async () => {
      const { status } = await req('GET', '/api/auth/me')
      if (status !== 401) throw new Error(`Expected 401, got ${status}`)
    })
    await check('Middleware protection restored after logout → 307', async () => {
      const { status } = await req('GET', '/api/reports')
      if (status !== 307) throw new Error(`Expected 307, got ${status}`)
    })
  }
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(46))
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('─'.repeat(46) + '\n')
if (failed > 0) process.exit(1)
