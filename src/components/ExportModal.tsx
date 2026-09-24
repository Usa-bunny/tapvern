import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueClasses: string[];
}

export const ExportModal = ({ isOpen, onClose, uniqueClasses }: ExportModalProps) => {
  const [filterClass, setFilterClass] = useState("");
  const [dateType, setDateType] = useState<"single" | "range">("single");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];
    return today;
  });
  const [sortBy, setSortBy] = useState<"name" | "time">("name");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let studentQuery = supabase.from("students").select("id, name, gender, class_name").eq("is_draft", false);
      if (filterClass) {
        studentQuery = studentQuery.eq("class_name", filterClass);
      }
      const { data: students, error: studentErr } = await studentQuery;
      if (studentErr) throw studentErr;
      if (!students || students.length === 0) {
        alert("Tidak ada data siswa untuk kelas ini.");
        setIsExporting(false);
        return;
      }

      const start = new Date(`${startDate}T00:00:00+07:00`);
      const end = dateType === "single" ? new Date(`${startDate}T23:59:59+07:00`) : new Date(`${endDate}T23:59:59+07:00`);

      const { data: attendances, error: attErr } = await supabase
        .from("attendance")
        .select("student_id, status, created_at")
        .in("student_id", students.map(s => s.id))
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());
      if (attErr) throw attErr;

      const { data: holidays } = await supabase
        .from("holidays")
        .select("date, description")
        .gte("date", startDate)
        .lte("date", dateType === "single" ? startDate : endDate);

      const dateArray: string[] = [];
      let curr = new Date(start);
      while (curr <= end) {
        dateArray.push(curr.toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0]);
        curr.setDate(curr.getDate() + 1);
      }

      let exportData = students.map(student => {
        const rowData: any = {
          "Nama Siswa": student.name,
          "Jenis Kelamin": student.gender || "-",
          "Kelas": student.class_name || "-",
        };

        let firstCheckInTime = Infinity;

        dateArray.forEach(dateStr => {
          const d = new Date(dateStr);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          const holiday = holidays?.find(h => h.date === dateStr);
          
          const record = attendances?.find(a => {
            const aDate = new Date(a.created_at).toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];
            return a.student_id === student.id && aDate === dateStr;
          });

          if (record) {
            rowData[dateStr] = record.status;
            if (dateType === "single" && record.status === "Hadir") {
              const checkInTime = new Date(record.created_at).getTime();
              if (checkInTime < firstCheckInTime) firstCheckInTime = checkInTime;
            }
          } else {
            if (holiday) rowData[dateStr] = `Libur (${holiday.description})`;
            else if (isWeekend) rowData[dateStr] = "Libur (Akhir Pekan)";
            else rowData[dateStr] = "Tidak Masuk";
          }
        });

        return { ...rowData, _firstCheckIn: firstCheckInTime, _name: student.name };
      });

      exportData.sort((a, b) => {
        if (sortBy === "time" && dateType === "single") {
          return a._firstCheckIn - b._firstCheckIn;
        }
        return a._name.localeCompare(b._name);
      });

      const finalData = exportData.map(({ _firstCheckIn, _name, ...rest }) => rest);

      const worksheet = XLSX.utils.json_to_sheet(finalData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");

      const fileName = `Laporan_Absensi_${filterClass || "SemuaKelas"}_${startDate}${dateType === "range" ? `_sd_${endDate}` : ""}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      onClose();
    } catch (error: any) {
      alert("Gagal mengekspor data: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-100 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <h2 className="text-xl font-extrabold text-gray-900">Export Laporan Excel</h2>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-900 block mb-1.5">Pilih Kelas</label>
            <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 text-gray-900 font-bold cursor-pointer">
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-900 block mb-1.5">Tipe Tanggal</label>
            <div className="flex gap-2">
              <button onClick={() => setDateType("single")} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${dateType === "single" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600"}`}>1 Hari Saja</button>
              <button onClick={() => setDateType("range")} className={`flex-1 py-2.5 rounded-xl font-bold text-sm border-2 transition-colors ${dateType === "range" ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600"}`}>Rentang Tanggal</button>
            </div>
          </div>

          <div className={`grid ${dateType === "range" ? "grid-cols-2" : "grid-cols-1"} gap-3`}>
            <div>
              <label className="text-sm font-bold text-gray-900 block mb-1.5">{dateType === "range" ? "Dari Tanggal" : "Tanggal"}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 text-gray-900 font-bold" />
            </div>
            {dateType === "range" && (
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-1.5">Sampai Tanggal</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 text-gray-900 font-bold" />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-gray-900 block mb-1.5">Urutkan Berdasarkan</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 text-gray-900 font-bold cursor-pointer">
              <option value="name">Nama (A-Z)</option>
              {dateType === "single" && <option value="time">Waktu Datang Terawal</option>}
            </select>
          </div>
        </div>

        <button onClick={handleExport} disabled={isExporting} className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-black text-base hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:animate-pulse">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          {isExporting ? "Menyiapkan Data..." : "Download Excel (.xlsx)"}
        </button>
      </div>
    </div>
  );
};