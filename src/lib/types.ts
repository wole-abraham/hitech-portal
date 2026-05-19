export interface Category { id: number; name: string }
export interface ActivityType { id: number; name: string; category_id: number }
export interface ActivitySubType { id: number; name: string; activity_type_id: number }
export interface Project { id: number; name: string }
export interface Section { id: number; name: string; project_id: number; project_name?: string }
export interface Employee { id: number; name: string; role: string }
export interface Machine {
  id: number
  fleet_number: string
  machine_type: string
  machine_belonging: string
  project_name: string
  section_name: string
}
export interface Subcontractor { id: number; name: string }
export interface TeamCar { id: number; name: string; plate_number: string }
export interface ChainageResult {
  chainage: string
  name: string
  label: string
  section_name: string
  latitude: number | null
  longitude: number | null
}

export interface PersonRow {
  name: string
  role?: string
  party: string
  subcontractor_name: string
  missing_name: string
}

export interface MachineRow {
  ownership: string
  machine_name: string
  plate_number: string
  driver_name: string
  missing_name: string
}
