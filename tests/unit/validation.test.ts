import { describe, it, expect } from 'vitest'

// Mirrors the handleSubmit validation in src/app/reports/submit/page.tsx
function validateForm(
  form: { project_name: string; activity_category: string; start_chainage: string; end_chainage: string },
  employees: { name: string; missing_name: string }[],
  supervisors: { name: string; missing_name: string }[],
  engineers: { name: string; missing_name: string }[],
  machines: { machine_name: string }[],
): string | null {
  if (!form.project_name) return 'Please select a project.'
  if (!form.activity_category) return 'Please select an activity category.'
  if (!form.start_chainage) return 'Please provide a starting chainage.'
  if (!form.end_chainage) return 'Please provide an ending chainage.'
  if (employees.every(r => !r.name && !r.missing_name)) return 'Please add at least one employee.'
  if (supervisors.every(r => !r.name && !r.missing_name)) return 'Please add at least one supervisor.'
  if (engineers.every(r => !r.name && !r.missing_name)) return 'Please add at least one engineer.'
  if (machines.every(r => !r.machine_name)) return 'Please add at least one machine.'
  return null
}

const validForm = { project_name: 'ROAD-A', activity_category: 'Construction', start_chainage: '1+000', end_chainage: '2+000' }
const emp  = [{ name: 'John', missing_name: '' }]
const sup  = [{ name: 'Jane', missing_name: '' }]
const eng  = [{ name: 'Bob',  missing_name: '' }]
const mach = [{ machine_name: 'Grader (GR-001)' }]

describe('Form validation', () => {
  it('passes with fully valid data', () => expect(validateForm(validForm, emp, sup, eng, mach)).toBeNull())

  it('rejects missing project', () => {
    expect(validateForm({ ...validForm, project_name: '' }, emp, sup, eng, mach)).toMatch(/project/i)
  })

  it('rejects missing activity category', () => {
    expect(validateForm({ ...validForm, activity_category: '' }, emp, sup, eng, mach)).toMatch(/categor/i)
  })

  it('rejects missing start chainage', () => {
    expect(validateForm({ ...validForm, start_chainage: '' }, emp, sup, eng, mach)).toMatch(/start/i)
  })

  it('rejects missing end chainage', () => {
    expect(validateForm({ ...validForm, end_chainage: '' }, emp, sup, eng, mach)).toMatch(/end/i)
  })

  it('rejects all-empty employees', () => {
    expect(validateForm(validForm, [{ name: '', missing_name: '' }], sup, eng, mach)).toMatch(/employee/i)
  })

  it('accepts employee with missing_name (not-in-list)', () => {
    expect(validateForm(validForm, [{ name: '__other__', missing_name: 'Custom' }], sup, eng, mach)).toBeNull()
  })

  it('rejects all-empty supervisors', () => {
    expect(validateForm(validForm, emp, [{ name: '', missing_name: '' }], eng, mach)).toMatch(/supervisor/i)
  })

  it('rejects all-empty engineers', () => {
    expect(validateForm(validForm, emp, sup, [{ name: '', missing_name: '' }], mach)).toMatch(/engineer/i)
  })

  it('rejects all-empty machines', () => {
    expect(validateForm(validForm, emp, sup, eng, [{ machine_name: '' }])).toMatch(/machine/i)
  })

  it('accepts machine with name even if plate_number is __other__', () => {
    // machine_name is set from the description input when plate_number === '__other__'
    expect(validateForm(validForm, emp, sup, eng, [{ machine_name: 'CAT 320 Excavator' }])).toBeNull()
  })

  it('multiple empty rows — one valid row is enough', () => {
    const mixed = [{ name: '', missing_name: '' }, { name: 'Alice', missing_name: '' }]
    expect(validateForm(validForm, mixed, sup, eng, mach)).toBeNull()
  })
})
