export interface AttendanceLog {
  id: string
  created_at: string
  status: string
  notes?: string
}

export interface ChildStats {
  hadir: number
  sakit: number
  izin: number
  avgTime: string
}

export interface Child {
  id: string
  name: string
  class_name: string
  major: string
  stats: ChildStats
  recent_logs: AttendanceLog[]
}