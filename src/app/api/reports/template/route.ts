import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions, AppSession } from '@/lib/session'
import * as XLSX from 'xlsx'

const COLUMNS = [
  'date_of_activity',
  'reporter_name',
  'weather',
  'project_name',
  'section_name',
  'activity_category',
  'activity_type',
  'activity_subtype',
  'side',
  'start_chainage',
  'end_chainage',
  'activity_status',
  'party_for_activity',
  'subcontractor_name_activity',
  'comment_activity',
  'not_conforming',
  'not_conforming_issue',
  'not_conforming_correction',
  'car_used',
  'team_car',
]

const EXAMPLE_ROW = {
  date_of_activity: '2026-07-10',
  reporter_name: 'John Doe',
  weather: 'Sunny',
  project_name: 'Coastal Road',
  section_name: 'Section 1-B',
  activity_category: 'Pavement',
  activity_type: 'Patching',
  activity_subtype: '',
  side: 'Left',
  start_chainage: '5+000',
  end_chainage: '5+200',
  activity_status: 'Completed',
  party_for_activity: 'Hitech',
  subcontractor_name_activity: '',
  comment_activity: 'Routine maintenance patch',
  not_conforming: 'No',
  not_conforming_issue: '',
  not_conforming_correction: '',
  car_used: 'No',
  team_car: '',
}

export async function GET(req: NextRequest) {
  const res = NextResponse.json({})
  const session = await getIronSession<AppSession>(req, res, sessionOptions)
  if (!session.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wb = XLSX.utils.book_new()

  // Main data sheet
  const ws = XLSX.utils.json_to_sheet([EXAMPLE_ROW], { header: COLUMNS })

  // Set column widths
  ws['!cols'] = COLUMNS.map(col => ({ wch: Math.max(col.length + 4, 18) }))

  XLSX.utils.book_append_sheet(wb, ws, 'Reports')

  // Notes sheet
  const notes = XLSX.utils.aoa_to_sheet([
    ['Field', 'Required', 'Format / Notes'],
    ['date_of_activity', 'Yes', 'YYYY-MM-DD  e.g. 2026-07-10'],
    ['reporter_name', 'Yes', 'Full name of the person reporting'],
    ['weather', 'No', 'Sunny / Cloudy / Rainy / etc.'],
    ['project_name', 'Yes', 'Must match an existing project name exactly'],
    ['section_name', 'No', 'e.g. Section 1-B'],
    ['activity_category', 'Yes', 'e.g. Pavement, Drainage Channels - Utilities'],
    ['activity_type', 'No', 'e.g. Patching, Inspection'],
    ['activity_subtype', 'No', 'Sub-type if applicable'],
    ['side', 'No', 'Left / Right / Median'],
    ['start_chainage', 'Yes', 'e.g. 5+000'],
    ['end_chainage', 'No', 'e.g. 5+200  (leave blank to match start)'],
    ['activity_status', 'No', 'Planned / In Progress / Completed'],
    ['party_for_activity', 'No', 'Hitech / Subcontractor / etc.'],
    ['subcontractor_name_activity', 'No', 'Only if party is Subcontractor'],
    ['comment_activity', 'No', 'Free text notes'],
    ['not_conforming', 'No', 'Yes / No'],
    ['not_conforming_issue', 'No', 'Describe the issue if Yes'],
    ['not_conforming_correction', 'No', 'Correction applied'],
    ['car_used', 'No', 'Yes / No'],
    ['team_car', 'No', 'Vehicle ID or name if car_used = Yes'],
  ])
  notes['!cols'] = [{ wch: 30 }, { wch: 10 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, notes, 'Notes')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="hitech_report_template.xlsx"',
    },
  })
}
