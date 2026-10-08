export interface Child {
  id: string;
  name: string;
  class_name: string;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
}

export interface GeneratedLog {
  dateStr: string;
  displayDate: string;
  status: "Hadir" | "Sakit" | "Izin" | "Tidak Masuk" | "Libur";
  time?: string;
  notes?: string;
}