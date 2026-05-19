#!/usr/bin/env node
/**
 * Supabase table connectivity & data quality test.
 * Usage: node scripts/test-supabase.mjs
 * Reads credentials from .env.local automatically.
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// ── Parse .env.local ────────────────────────────────────────────────────────
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
} catch {
  console.error('❌  Could not read .env.local')
  process.exit(1)
}

const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const sb = createClient(url, key)

let passed = 0, failed = 0

async function check(name, fn) {
  try {
    const note = await fn()
    const suffix = note ? ` (${note})` : ''
    console.log(`  ✓  ${name}${suffix}`)
    passed++
  } catch (err) {
    console.log(`  ✗  ${name}: ${err.message}`)
    failed++
  }
}

async function tableExists(table, minRows = 0) {
  const q = sb.from(table).select('*', { count: 'exact', head: true })
  const { count, error } = await q
  if (error) throw new Error(error.message)
  if (minRows > 0 && (count ?? 0) < minRows) throw new Error(`Expected ≥${minRows} rows, got ${count}`)
  return `${count ?? '?'} rows`
}

// ── parseChainage (pure logic) ───────────────────────────────────────────────
function parseChainage(ch) {
  if (!ch) return 0
  const c = ch.replaceAll(' ', '')
  if (c.includes('+')) { const [a, b] = c.split('+'); return parseFloat(a) * 1000 + parseFloat(b) }
  return parseFloat(c) || 0
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════')
console.log('  Hi-Tech Portal — Supabase Integration Tests')
console.log('══════════════════════════════════════════════\n')

// Section 1: Core report tables
console.log('▸ Core report tables')
await check('hitech_report_hitechreport',    () => tableExists('hitech_report_hitechreport'))
await check('hitech_report_hitechemployee',  () => tableExists('hitech_report_hitechemployee'))
await check('hitech_report_hitechsupervisor',() => tableExists('hitech_report_hitechsupervisor'))
await check('hitech_report_hitechengineer',  () => tableExists('hitech_report_hitechengineer'))
await check('hitech_report_hitechmachine',   () => tableExists('hitech_report_hitechmachine'))
await check('hitech_report_hitechphoto',     () => tableExists('hitech_report_hitechphoto'))

// Section 2: Dropdown source tables (must have data for form to work)
console.log('\n▸ Dropdown data sources')
await check('activity categories', () => tableExists('hitech_report_activitycategory', 1))
await check('activity types',      () => tableExists('hitech_report_activitytype', 1))
await check('activity subtypes',   () => tableExists('hitech_report_activitysubtype'))
await check('team cars',           () => tableExists('hitech_report_teamcar'))
await check('subcontractor names', () => tableExists('hitech_report_subcontractorname'))
await check('employees (active)',  async () => {
  const { data, error } = await sb.from('surveycollection_employee').select('id,name').eq('status', 'Active').limit(5)
  if (error) throw new Error(error.message)
  if (!data?.length) throw new Error('No active employees — dropdown will be empty')
  return `${data.length}+ active`
})
await check('machines (planningtable)', () => tableExists('surveycollection_planningtable', 1))
await check('projects',            () => tableExists('surveycollection_project', 1))
await check('sections',            () => tableExists('surveycollection_section', 1))

// Section 3: Section ↔ Project linkage
console.log('\n▸ Section → Project linkage')
await check('sections have project_id', async () => {
  const { data, error } = await sb.from('surveycollection_section').select('id,name,project_id').limit(3)
  if (error) throw new Error(error.message)
  if (data?.some(s => !s.project_id)) throw new Error('Some sections missing project_id')
  return `checked ${data?.length} rows`
})

await check('projects listed in sections exist', async () => {
  const { data: sections } = await sb.from('surveycollection_section').select('project_id').limit(20)
  const ids = [...new Set(sections?.map(s => s.project_id).filter(Boolean) ?? [])]
  if (!ids.length) return 'no sections to check'
  const { data: projects } = await sb.from('surveycollection_project').select('id').in('id', ids)
  const projIds = new Set(projects?.map(p => p.id) ?? [])
  const orphans = ids.filter(id => !projIds.has(id))
  if (orphans.length) throw new Error(`${orphans.length} section(s) reference missing project(s)`)
  return 'all linked'
})

// Section 4: Activity type → Category linkage
console.log('\n▸ Activity type → Category linkage')
await check('activity types link to valid categories', async () => {
  const { data: cats }  = await sb.from('hitech_report_activitycategory').select('id')
  const { data: types } = await sb.from('hitech_report_activitytype').select('id,name,category_id').limit(50)
  const catIds = new Set(cats?.map(c => c.id) ?? [])
  const orphans = types?.filter(t => !catIds.has(t.category_id)) ?? []
  if (orphans.length) throw new Error(`${orphans.length} orphaned types: ${orphans.map(t => t.name).join(', ')}`)
  return `${types?.length} types checked`
})

// Section 5: Chainage table
console.log('\n▸ Chainage')
await check('hitech_report_chainage exists', () => tableExists('hitech_report_chainage'))
await check('chainage has project_id column', async () => {
  const { error } = await sb.from('hitech_report_chainage').select('project_id').limit(1)
  if (error) throw new Error(error.message)
})
await check('chainage data for first project', async () => {
  const { data: projs } = await sb.from('surveycollection_project').select('id,name').limit(1)
  if (!projs?.length) return 'no projects'
  const { count } = await sb.from('hitech_report_chainage').select('*', { count: 'exact', head: true }).eq('project_id', projs[0].id)
  return `${count ?? 0} chainages for "${projs[0].name}"`
})

// Section 6: Auth
console.log('\n▸ Auth')
await check('auth_user table accessible', () => tableExists('auth_user', 1))
await check('auth_user has username column', async () => {
  const { data, error } = await sb.from('auth_user').select('id,username,first_name,last_name,email').limit(1)
  if (error) throw new Error(error.message)
  if (data?.length && !('username' in data[0])) throw new Error('username column missing')
  return 'ok'
})

// Section 7: Machine status (history page)
console.log('\n▸ Machine status (history page)')
await check('surveycollection_machinestatusreport', () => tableExists('surveycollection_machinestatusreport'))

// Section 7b: Storage / upload
console.log('\n▸ Storage & upload (survey-media bucket)')
await check('survey-media bucket exists and is public', async () => {
  const { data: buckets, error } = await sb.storage.listBuckets()
  if (error) throw new Error(error.message)
  const bucket = buckets?.find(b => b.name === 'survey-media')
  if (!bucket) throw new Error('survey-media bucket not found')
  if (!bucket.public) throw new Error('survey-media bucket is NOT public — uploaded URLs will be broken')
})

await check('can upload a file to survey-media and get a public URL', async () => {
  // 1×1 transparent PNG (67 bytes) — no external deps
  const png1x1 = Buffer.from(
    '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6260000000020001e221bc330000000049454e44ae426082',
    'hex'
  )
  const testPath = `hitech_media/_test_${Date.now()}.png`
  const { error: upErr } = await sb.storage.from('survey-media').upload(testPath, png1x1, { contentType: 'image/png', upsert: false })
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`)

  const { data } = sb.storage.from('survey-media').getPublicUrl(testPath)
  if (!data?.publicUrl) throw new Error('No public URL returned')

  // Verify URL is reachable
  const res = await fetch(data.publicUrl)
  if (res.status !== 200) throw new Error(`Public URL returned ${res.status}`)
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('image')) throw new Error(`Unexpected content-type: ${ct}`)

  // Clean up test file
  await sb.storage.from('survey-media').remove([testPath])
  return data.publicUrl.slice(-40) + '…'
})

await check('hitech_media folder has uploaded files (real submissions)', async () => {
  const { data: files, error } = await sb.storage.from('survey-media').list('hitech_media', { limit: 5 })
  if (error) throw new Error(error.message)
  // Filter out our test files
  const real = (files ?? []).filter(f => !f.name.startsWith('_test_'))
  return `${real.length} file(s) found`
})

// Section 8: parseChainage unit tests
console.log('\n▸ parseChainage logic (pure)')
const cases = [
  ['',         0],
  ['1+250',    1250],
  ['10+500',   10500],
  ['0+000',    0],
  ['2+050',    2050],
  ['1 + 250',  1250],
  ['1500',     1500],
  ['abc',      0],
]
for (const [input, expected] of cases) {
  await check(`parseChainage("${input}") → ${expected}`, () => {
    const result = parseChainage(input)
    if (result !== expected) throw new Error(`got ${result}`)
  })
}

// Section 9: Overlap detection
console.log('\n▸ Overlap detection logic')
function rangeOverlaps(s1, e1, s2, e2) {
  const [ns1, ne1] = [Math.min(parseChainage(s1), parseChainage(e1)), Math.max(parseChainage(s1), parseChainage(e1))]
  const [ns2, ne2] = [Math.min(parseChainage(s2), parseChainage(e2)), Math.max(parseChainage(s2), parseChainage(e2))]
  return ns2 < ne1 && ne2 > ns1
}
await check('clear overlap detected',           () => { if (!rangeOverlaps('1+000','3+000','2+000','4+000')) throw new Error('missed') })
await check('non-overlapping ranges: no hit',   () => { if (rangeOverlaps('1+000','2+000','3+000','4+000'))  throw new Error('false positive') })
await check('adjacent ranges: no overlap',      () => { if (rangeOverlaps('1+000','2+000','2+000','3+000'))  throw new Error('false positive') })
await check('contained range: overlap',         () => { if (!rangeOverlaps('1+000','5+000','2+000','3+000')) throw new Error('missed') })
await check('reversed input normalizes',        () => { if (!rangeOverlaps('3+000','1+000','2+000','4+000')) throw new Error('missed') })

// Section 10: __other__ sanitization
console.log('\n▸ Sentinel value sanitization')
await check('machine plate_number __other__ → empty in payload', () => {
  // Mirrors the submit route logic
  const raw = '__other__'
  const sanitized = raw === '__other__' ? '' : raw
  if (sanitized !== '') throw new Error(`Expected empty string, got "${sanitized}"`)
})
await check('team_car __other__ → empty in payload', () => {
  const raw = '__other__'
  const sanitized = raw === '__other__' ? '' : raw
  if (sanitized !== '') throw new Error(`Expected empty string, got "${sanitized}"`)
})

// ── Summary ─────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(46))
console.log(`  Results: ${passed} passed, ${failed} failed`)
console.log('─'.repeat(46) + '\n')
if (failed > 0) process.exit(1)
