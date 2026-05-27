// One-time setup: creates the drainage components table and imports the CSV.
// Run with: node scripts/setup-components.js

const fs   = require('fs')
const path = require('path')
const https = require('https')

const SUPABASE_URL      = 'https://cwqfyhapaycabynqwczx.supabase.co'
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3cWZ5aGFwYXljYWJ5bnF3Y3p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjgwMzQzMywiZXhwIjoyMDc4Mzc5NDMzfQ.3h33CQjswz-z5Gx2VdvJelqVe2WPpUkKTI_j_MDHMws'
const PROJECT_REF       = 'cwqfyhapaycabynqwczx'
const CSV_PATH          = path.join('C:\\Users\\wole1\\Downloads\\activity_report (1)\\6322e6259ed947b19f5f940a432769b5\\media\\components.csv')

// ── HTTP helpers ──────────────────────────────────────────────────────────────

function request(method, url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      }
    }
    const req = https.request(opts, res => {
      let out = ''
      res.on('data', c => out += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(out) }) }
        catch { resolve({ status: res.statusCode, body: out }) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

// ── Run SQL via Supabase Management API ───────────────────────────────────────

async function runSQL(sql) {
  const res = await request(
    'POST',
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    { query: sql },
    { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}` }
  )
  return res
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line) {
  const result = []
  let current = '', inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text) {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.split('\n')
  // Header spans 2 lines due to "Total Length\nto order" column
  let dataStart = 2
  const rows = []
  for (let i = dataStart; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = parseCSVLine(line)
    const projectName = cols[0]
    const sectionName = cols[1]
    const chainage    = cols[10] || cols[3]
    const item        = cols[7]
    const side        = cols[8]
    if (!projectName || !chainage || !item || !side) continue
    const toNum = v => { const n = parseFloat(v); return isNaN(n) ? null : n }
    rows.push({
      project_name:          projectName,
      section_name:          sectionName,
      chainage,
      chainage_m:            toNum(cols[5]),
      item,
      side,
      measurements:          cols[11] || null,
      nbr_cell:              cols[15] || null,
      length:                toNum(cols[16]),
      status:                cols[17] || null,
      total_length_to_order: toNum(cols[18]),
      consideration_status:  cols[19] || null,
      comment:               cols[20] || null,
      low_point_elevation:   cols[21] || null,
      northing:              toNum(cols[13]),
      easting:               toNum(cols[14]),
    })
  }
  return rows
}

// ── Insert rows via Supabase REST API ─────────────────────────────────────────

async function upsertBatch(rows) {
  const res = await request(
    'POST',
    `${SUPABASE_URL}/rest/v1/hitech_report_component`,
    rows,
    {
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    }
  )
  return res
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Hitech Drainage Components Setup ===\n')

  // 1. Create table
  console.log('Step 1: Creating table hitech_report_component…')
  const createSQL = `
    CREATE TABLE IF NOT EXISTS hitech_report_component (
      id                     SERIAL PRIMARY KEY,
      project_name           TEXT NOT NULL,
      section_name           TEXT NOT NULL,
      chainage               TEXT NOT NULL,
      chainage_m             NUMERIC,
      item                   TEXT NOT NULL,
      side                   TEXT NOT NULL,
      measurements           TEXT,
      nbr_cell               TEXT,
      length                 NUMERIC,
      status                 TEXT,
      total_length_to_order  NUMERIC,
      consideration_status   TEXT,
      comment                TEXT,
      low_point_elevation    TEXT,
      northing               NUMERIC,
      easting                NUMERIC,
      created_at             TIMESTAMPTZ DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_component_unique
      ON hitech_report_component (project_name, section_name, chainage, item, side);
    CREATE INDEX IF NOT EXISTS idx_component_lookup
      ON hitech_report_component (project_name, section_name, chainage, item, side);
    ALTER TABLE hitech_report_component ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated read components" ON hitech_report_component;
    CREATE POLICY "Authenticated read components"
      ON hitech_report_component FOR SELECT USING (auth.role() = 'authenticated');
  `
  const createRes = await runSQL(createSQL)
  if (createRes.status === 200 || createRes.status === 201) {
    console.log('  ✓ Table created / already exists\n')
  } else {
    console.log(`  ✗ DDL failed (status ${createRes.status}):`, JSON.stringify(createRes.body))
    console.log('\n  ⚠  Run the SQL block in schema-updates.sql manually in Supabase SQL Editor, then re-run this script to import data.\n')
    // Don't exit — still try the import in case table already exists
  }

  // 2. Parse CSV
  console.log('Step 2: Parsing CSV…')
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`  ✗ CSV not found at:\n  ${CSV_PATH}`)
    process.exit(1)
  }
  const text = fs.readFileSync(CSV_PATH, 'utf8')
  const rows = parseCSV(text)
  console.log(`  ✓ Parsed ${rows.length} rows\n`)

  // 3. Upsert in batches of 200
  console.log('Step 3: Importing into Supabase…')
  const BATCH = 200
  let inserted = 0, failed = 0
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const res = await upsertBatch(batch)
    if (res.status >= 200 && res.status < 300) {
      inserted += batch.length
      process.stdout.write(`  ${inserted}/${rows.length} rows...\r`)
    } else {
      failed += batch.length
      console.error(`\n  ✗ Batch ${Math.floor(i/BATCH)+1} failed (${res.status}):`, JSON.stringify(res.body).slice(0, 200))
    }
  }

  console.log(`\n\n  ✓ Done — ${inserted} rows imported, ${failed} failed`)
  if (failed === 0) console.log('\n  🎉 All good! The auto-fill will now work in the activity report form.')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
