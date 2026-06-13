// Fire-and-forget notifications — failures are logged but never block the caller

const RESEND_KEY   = process.env.RESEND_API_KEY    || ''
const RESEND_FROM  = process.env.RESEND_FROM_EMAIL || 'noreply@hitech.datatodecisions.org'
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL      || 'data-to-decisions@datatodecisions.org'
const APP_NAME     = process.env.NEXT_PUBLIC_APP_NAME || 'Portal'

async function send(subject: string, html: string) {
  if (!RESEND_KEY || !NOTIFY_EMAIL) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: RESEND_FROM, to: [NOTIFY_EMAIL], subject, html }),
  })
  if (!res.ok) console.error('[notify] email failed:', await res.text())
}

function table(rows: [string, string][]) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:6px 10px 6px 0;color:#888;white-space:nowrap">${label}</td>
        <td style="padding:6px 0;color:#1a1610;font-weight:600">${value || '—'}</td>
      </tr>`).join('')}
  </table>`
}

function wrap(title: string, body: string) {
  return `<div style="font-family:sans-serif;max-width:520px">
    <h2 style="color:#b45309;margin-bottom:4px">${APP_NAME} — ${title}</h2>
    ${body}
  </div>`
}

// ── Report submitted ─────────────────────────────────────────────────────────

export interface ReportSummary {
  id: string | number
  reporter_name: string
  date_of_activity: string
  project_name: string
  section_name: string
  activity_category: string
  activity_type: string
  activity_status: string
}

export function notifyReportSubmitted(r: ReportSummary) {
  const subject = `[${APP_NAME}] New Report — ${r.activity_category} by ${r.reporter_name}`
  const html = wrap('New Activity Report', `
    <p style="color:#555;margin-top:0">Report <strong>#${r.id}</strong> has been submitted.</p>
    ${table([
      ['Reporter',  r.reporter_name],
      ['Date',      r.date_of_activity],
      ['Project',   r.project_name],
      ['Section',   r.section_name],
      ['Activity',  `${r.activity_category} — ${r.activity_type}`],
      ['Status',    r.activity_status],
    ])}`)
  return send(subject, html).catch(() => {})
}

// ── Machine assigned ─────────────────────────────────────────────────────────

export interface MachineAssignSummary {
  fleet_number: string
  machine_type: string
  assigned_to: string
  by_admin: string
  litres?: number | null
  hour_meter?: number | null
}

export function notifyMachineAssigned(m: MachineAssignSummary) {
  const subject = `[${APP_NAME}] Machine Assigned — ${m.fleet_number} → ${m.assigned_to}`
  const rows: [string, string][] = [
    ['Fleet No.',   m.fleet_number],
    ['Type',        m.machine_type],
    ['Assigned To', m.assigned_to],
    ['Assigned By', m.by_admin],
  ]
  if (m.litres != null)     rows.push(['Fuel Added',  `${m.litres}L`])
  if (m.hour_meter != null) rows.push(['Hour Meter',  `${m.hour_meter}h`])
  const html = wrap('Machine Assigned', table(rows))
  return send(subject, html).catch(() => {})
}

// ── Machine unassigned ───────────────────────────────────────────────────────

export function notifyMachineUnassigned(fleet_number: string, prev_assignee: string, by_admin: string) {
  const subject = `[${APP_NAME}] Machine Unassigned — ${fleet_number}`
  const html = wrap('Machine Unassigned', table([
    ['Fleet No.',      fleet_number],
    ['Unassigned From', prev_assignee],
    ['By Admin',       by_admin],
  ]))
  return send(subject, html).catch(() => {})
}

// ── Worker confirms receipt / return ─────────────────────────────────────────

export interface MachineActionSummary {
  fleet_number: string
  machine_type: string
  worker_name: string
  action: 'receive' | 'return'
  health_status?: string
  comment?: string
  litres?: number | null
  hour_meter?: number | null
}

export function notifyMachineAction(m: MachineActionSummary) {
  const actionLabel = m.action === 'receive' ? 'Received on Site' : 'Returned to Head Office'
  const subject = `[${APP_NAME}] Machine ${actionLabel} — ${m.fleet_number} by ${m.worker_name}`
  const rows: [string, string][] = [
    ['Fleet No.',  m.fleet_number],
    ['Type',       m.machine_type],
    ['Worker',     m.worker_name],
    ['Action',     actionLabel],
  ]
  if (m.health_status)      rows.push(['Health',     m.health_status])
  if (m.comment)            rows.push(['Comment',    m.comment])
  if (m.litres != null)     rows.push(['Fuel',       `${m.litres}L`])
  if (m.hour_meter != null) rows.push(['Hour Meter', `${m.hour_meter}h`])
  const html = wrap(`Machine ${actionLabel}`, table(rows))
  return send(subject, html).catch(() => {})
}

// ── Admin confirms machine back at HQ ────────────────────────────────────────

export function notifyMachineReceivedAtHQ(fleet_number: string, machine_type: string, by_admin: string) {
  const subject = `[${APP_NAME}] Machine Back at HQ — ${fleet_number}`
  const html = wrap('Machine Received at Head Office', table([
    ['Fleet No.',    fleet_number],
    ['Type',         machine_type],
    ['Confirmed By', by_admin],
  ]))
  return send(subject, html).catch(() => {})
}
