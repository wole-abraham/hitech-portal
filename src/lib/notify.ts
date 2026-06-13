// Fire-and-forget notifications — failures are logged but never block the caller

const RESEND_KEY   = process.env.RESEND_API_KEY       || ''
const RESEND_FROM  = process.env.RESEND_FROM_EMAIL     || 'noreply@hitech.datatodecisions.org'
const ADMIN_EMAIL  = process.env.NOTIFY_EMAIL          || 'data-to-decisions@datatodecisions.org'
const APP_NAME     = process.env.NEXT_PUBLIC_APP_NAME  || 'Portal'
const APP_COMPANY  = process.env.NEXT_PUBLIC_APP_COMPANY || 'Field Operations Ltd'

// ── Email shell ───────────────────────────────────────────────────────────────

function shell(content: string) {
  return `
    <div style="font-family:monospace;max-width:480px;margin:0 auto;padding:32px;background:#1a1208;color:#f2ede3;border-radius:12px;">
      <div style="font-size:1.4rem;font-weight:800;color:#f2b950;margin-bottom:4px;letter-spacing:-0.02em;">${APP_NAME}</div>
      <div style="font-size:0.65rem;letter-spacing:0.18em;color:#8c7a58;text-transform:uppercase;margin-bottom:28px;">${APP_COMPANY} — Portal</div>
      ${content}
      <hr style="border:none;border-top:1px solid rgba(242,185,80,0.15);margin:24px 0;" />
      <p style="color:#8c7a58;font-size:0.65rem;letter-spacing:0.08em;text-transform:uppercase;margin:0;">${APP_COMPANY}</p>
    </div>`
}

function rows(items: [string, string | undefined | null][]) {
  return `<table style="width:100%;border-collapse:collapse;margin:20px 0;">
    ${items.filter(([, v]) => v != null && v !== '').map(([label, value]) => `
      <tr>
        <td style="padding:5px 12px 5px 0;color:#8c7a58;font-size:0.72rem;letter-spacing:0.08em;text-transform:uppercase;white-space:nowrap;">${label}</td>
        <td style="padding:5px 0;color:#f2ede3;font-size:0.88rem;">${value}</td>
      </tr>`).join('')}
  </table>`
}

function badge(text: string) {
  return `<div style="display:inline-block;padding:5px 12px;background:rgba(242,185,80,0.12);border:1px solid rgba(242,185,80,0.3);border-radius:6px;color:#f2b950;font-size:0.75rem;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:20px;">${text}</div>`
}

async function send(to: string | string[], subject: string, html: string) {
  if (!RESEND_KEY) return
  const toArr = Array.isArray(to) ? to : [to]
  if (!toArr.length) return
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: `${APP_NAME} Portal <${RESEND_FROM}>`, to: toArr, subject, html }),
  })
  if (!res.ok) console.error('[notify] email failed:', await res.text())
}

// ── Activity report submitted ─────────────────────────────────────────────────

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
  const subject = `New Activity Report — ${r.activity_category} · ${r.project_name}`
  const html = shell(`
    ${badge('Activity Report Submitted')}
    <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">Report <span style="color:#f2b950;font-weight:800;">#${r.id}</span> has been submitted.</p>
    ${rows([
      ['Reporter',  r.reporter_name],
      ['Date',      r.date_of_activity],
      ['Project',   r.project_name],
      ['Section',   r.section_name],
      ['Activity',  `${r.activity_category} — ${r.activity_type}`],
      ['Status',    r.activity_status],
    ])}`)
  return send(ADMIN_EMAIL, subject, html).catch(() => {})
}

// ── Machine assigned (admin copy + worker copy) ───────────────────────────────

export interface MachineAssignSummary {
  fleet_number: string
  machine_type: string
  machine_belonging: string
  assigned_to: string
  by_admin: string
  litres?: number | null
  hour_meter?: number | null
  worker_email?: string | null
  worker_first_name?: string | null
}

export function notifyMachineAssigned(m: MachineAssignSummary) {
  const sends: Promise<void>[] = []

  // Admin copy
  const adminSubject = `Machine Assigned — ${m.fleet_number} dispatched to ${m.assigned_to}`
  const adminHtml = shell(`
    ${badge('Machine Assigned')}
    <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">A machine has been assigned and is now deployed to site.</p>
    ${rows([
      ['Fleet No.',   m.fleet_number],
      ['Type',        m.machine_type],
      ['Ownership',   m.machine_belonging],
      ['Assigned To', m.assigned_to],
      ['Assigned By', m.by_admin],
      ['Fuel Added',  m.litres != null ? `${m.litres}L` : null],
      ['Hour Meter',  m.hour_meter != null ? `${m.hour_meter}h` : null],
    ])}`)
  sends.push(send(ADMIN_EMAIL, adminSubject, adminHtml).catch(() => {}))

  // Worker copy
  if (m.worker_email) {
    const name = m.worker_first_name || m.assigned_to
    const workerSubject = `Machine ${m.fleet_number} has been assigned to you`
    const workerHtml = shell(`
      ${badge('Machine Assignment')}
      <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">Hi ${name},</p>
      <p style="color:#f2ede3;font-size:0.92rem;margin:4px 0 0;">The following machine has been assigned to you and is ready for deployment.</p>
      ${rows([
        ['Fleet No.',  m.fleet_number],
        ['Type',       m.machine_type],
        ['Ownership',  m.machine_belonging],
        ['Assigned By', m.by_admin],
        ['Fuel',       m.litres != null ? `${m.litres}L` : null],
        ['Hour Meter', m.hour_meter != null ? `${m.hour_meter}h` : null],
      ])}
      <p style="color:#8c7a58;font-size:0.78rem;margin-top:8px;">Please confirm receipt on the portal once the machine arrives on site.</p>`)
    sends.push(send(m.worker_email, workerSubject, workerHtml).catch(() => {}))
  }

  return Promise.all(sends)
}

// ── Machine unassigned ────────────────────────────────────────────────────────

export function notifyMachineUnassigned(fleet_number: string, prev_assignee: string, by_admin: string) {
  const subject = `Machine Unassigned — ${fleet_number} removed from ${prev_assignee}`
  const html = shell(`
    ${badge('Machine Unassigned')}
    <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">A machine assignment has been removed.</p>
    ${rows([
      ['Fleet No.',       fleet_number],
      ['Previously With', prev_assignee],
      ['Unassigned By',   by_admin],
    ])}`)
  return send(ADMIN_EMAIL, subject, html).catch(() => {})
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
  const isReturn = m.action === 'return'
  const actionLabel = isReturn ? 'Returned to Head Office' : 'Received on Site'
  const subject = isReturn
    ? `Machine Returned — ${m.fleet_number} sent back by ${m.worker_name}`
    : `Machine On Site — ${m.fleet_number} confirmed received by ${m.worker_name}`
  const html = shell(`
    ${badge(actionLabel)}
    <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">${m.worker_name} has ${isReturn ? 'returned' : 'confirmed receipt of'} <span style="color:#f2b950;">${m.fleet_number}</span>.</p>
    ${rows([
      ['Fleet No.',   m.fleet_number],
      ['Type',        m.machine_type],
      ['Worker',      m.worker_name],
      ['Action',      actionLabel],
      ['Health',      m.health_status],
      ['Comment',     m.comment],
      ['Fuel',        m.litres != null ? `${m.litres}L` : null],
      ['Hour Meter',  m.hour_meter != null ? `${m.hour_meter}h` : null],
    ])}`)
  return send(ADMIN_EMAIL, subject, html).catch(() => {})
}

// ── Admin confirms machine back at HQ ────────────────────────────────────────

export function notifyMachineReceivedAtHQ(fleet_number: string, machine_type: string, by_admin: string) {
  const subject = `Machine Back at HQ — ${fleet_number} received and stored`
  const html = shell(`
    ${badge('Received at Head Office')}
    <p style="color:#f2ede3;font-size:0.92rem;margin:0 0 4px;">Machine <span style="color:#f2b950;">${fleet_number}</span> has been received at head office and marked as in store.</p>
    ${rows([
      ['Fleet No.',    fleet_number],
      ['Type',         machine_type],
      ['Confirmed By', by_admin],
    ])}`)
  return send(ADMIN_EMAIL, subject, html).catch(() => {})
}
