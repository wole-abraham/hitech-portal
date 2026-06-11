// Fire-and-forget notifications — failures are logged but never block the report submission

const RESEND_KEY    = process.env.RESEND_API_KEY        || ''
const RESEND_FROM   = process.env.RESEND_FROM_EMAIL     || 'noreply@hitech.datatodecisions.org'
const NOTIFY_EMAIL  = process.env.NOTIFY_EMAIL          || ''
const WA_PHONE      = process.env.NOTIFY_WHATSAPP_PHONE || ''
const WA_APIKEY     = process.env.NOTIFY_WHATSAPP_APIKEY|| ''
const APP_NAME      = process.env.NEXT_PUBLIC_APP_NAME  || 'Portal'

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

export async function notifyReportSubmitted(r: ReportSummary) {
  const tasks: Promise<void>[] = []
  if (NOTIFY_EMAIL && RESEND_KEY) tasks.push(sendEmail(r))
  if (WA_PHONE && WA_APIKEY)     tasks.push(sendWhatsApp(r))
  await Promise.allSettled(tasks)
}

async function sendEmail(r: ReportSummary) {
  const subject = `[${APP_NAME}] New Report — ${r.activity_category} by ${r.reporter_name}`
  const html = `
    <div style="font-family:sans-serif;max-width:520px">
      <h2 style="color:#b45309;margin-bottom:4px">${APP_NAME} — New Activity Report</h2>
      <p style="color:#555;margin-top:0">Report <strong>#${r.id}</strong> has been submitted.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row('Reporter',  r.reporter_name)}
        ${row('Date',      r.date_of_activity)}
        ${row('Project',   r.project_name)}
        ${row('Section',   r.section_name)}
        ${row('Activity',  `${r.activity_category} — ${r.activity_type}`)}
        ${row('Status',    r.activity_status)}
      </table>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_KEY}` },
    body: JSON.stringify({ from: RESEND_FROM, to: [NOTIFY_EMAIL], subject, html }),
  })
  if (!res.ok) console.error('[notify] email failed:', await res.text())
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 10px 6px 0;color:#888;white-space:nowrap">${label}</td>
    <td style="padding:6px 0;color:#1a1610;font-weight:600">${value || '—'}</td>
  </tr>`
}

async function sendWhatsApp(r: ReportSummary) {
  const text = [
    `📋 *${APP_NAME} — New Report #${r.id}*`,
    `Reporter: ${r.reporter_name}`,
    `Date: ${r.date_of_activity}`,
    `Project: ${r.project_name}${r.section_name ? ' / ' + r.section_name : ''}`,
    `Activity: ${r.activity_category} — ${r.activity_type}`,
    `Status: ${r.activity_status}`,
  ].join('\n')

  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(WA_PHONE)}&text=${encodeURIComponent(text)}&apikey=${WA_APIKEY}`
  const res = await fetch(url)
  if (!res.ok) console.error('[notify] whatsapp failed:', await res.text())
}
