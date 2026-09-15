export interface Student {
  id: string;
  name: string;
  nisn: string | null;
  gender: string | null;
  class_name: string | null;
  major: string | null;
  domicile: string | null;
}

export interface Attendance {
  student_id: string;
  created_at: string;
  status: string;
}

export interface ProcessedStudent extends Student {
  isPresent: boolean;
  time: string;
  rawTime: number;
}

export type SortConfig = {
  key: keyof ProcessedStudent;
  direction: "asc" | "desc";
} | null;