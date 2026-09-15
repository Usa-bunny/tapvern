export interface ParentProfile {
  id: string;
  name: string;
  email: string;
}

export interface Student {
  id: string;
  name: string;
  rfid_uid: string;
  nisn?: string;
  gender?: string;
  class_name?: string;
  major?: string;
  domicile?: string;
  is_draft: boolean;
  parent_id?: string | null;
  profiles?: ParentProfile | null;
}

export interface AttendanceRecord {
  id: string;
  created_at: string;
  status: string;
  students: { name: string; rfid_uid: string };
}

export interface DeviceCommand {
  id: string;
  action: string;
  status: string;
  created_at: string;
  duration: number;
}

export interface TempScan {
  id: number;
  uid: string;
}