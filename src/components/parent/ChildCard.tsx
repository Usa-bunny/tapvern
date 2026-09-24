import { useState, useMemo } from "react";
import { Child, Holiday, GeneratedLog } from "@/types/parent";

interface Props {
  child: Child;
  rawAttendances: any[];
  holidays: Holiday[];
  onRequestLeave: (id: string, name: string) => void;
}

const getJakartaDateString = (d: Date) =>
  d.toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });

export const ChildCard = ({
  child,
  rawAttendances,
  holidays,
  onRequestLeave,
}: Props) => {
  const [filter, setFilter] = useState<
    "today" | "yesterday" | "this_week" | "this_month" | "this_year"
  >("this_month");

  const generatedData = useMemo(() => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
    );
    const todayStr = getJakartaDateString(now);
    let startDate = new Date(now);
    let endDate = new Date(now);

    if (filter === "today") {
      startDate = new Date(now);
    } else if (filter === "yesterday") {
      startDate.setDate(startDate.getDate() - 1);
      endDate = new Date(startDate);
    } else if (filter === "this_week") {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
    } else if (filter === "this_month") {
      startDate.setDate(1);
    } else if (filter === "this_year") {
      startDate.setMonth(0, 1);
    }

    const logs: GeneratedLog[] = [];
    const stats = {
      hadir: 0,
      sakit: 0,
      izin: 0,
      tidak_masuk: 0,
      total_mins: 0,
    };
    let currDate = new Date(startDate);

    while (currDate <= endDate && getJakartaDateString(currDate) <= todayStr) {
      const dateStr = getJakartaDateString(currDate);
      const dayOfWeek = currDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const customHoliday = holidays.find((h) => h.date === dateStr);
      const isHoliday = isWeekend || !!customHoliday;

      const record = rawAttendances.find(
        (a) => getJakartaDateString(new Date(a.created_at)) === dateStr,
      );

      const displayDate = currDate.toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });

      if (record) {
        let timeStr = "-";
        if (record.status === "Hadir") {
          const d = new Date(record.created_at);
          timeStr =
            d.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            }) + " WIB";
          stats.hadir++;
          stats.total_mins += d.getHours() * 60 + d.getMinutes();
        } else if (record.status === "Sakit") stats.sakit++;
        else if (record.status === "Izin") stats.izin++;

        logs.push({
          dateStr,
          displayDate,
          status: record.status as any,
          time: timeStr,
        });
      } else {
        if (isHoliday) {
          logs.push({
            dateStr,
            displayDate,
            status: "Libur",
            notes: customHoliday ? customHoliday.description : "Akhir Pekan",
          });
        } else {
          stats.tidak_masuk++;
          logs.push({ dateStr, displayDate, status: "Tidak Masuk" });
        }
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    const avgMins =
      stats.hadir > 0 ? Math.floor(stats.total_mins / stats.hadir) : 0;
    const avgTime =
      stats.hadir > 0
        ? `${String(Math.floor(avgMins / 60)).padStart(2, "0")}:${String(avgMins % 60).padStart(2, "0")}`
        : "-";

    return { logs: logs.reverse(), stats: { ...stats, avgTime } };
  }, [filter, rawAttendances, holidays]);

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-200/80 flex flex-col gap-6">
      {/* Header Kartu Anak */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-primary">{child.name}</h2>
            <span className="text-xs bg-emerald-50 text-primary px-3 py-1 rounded-full font-black border border-emerald-200/80">
              {child.class_name || "Tanpa Kelas"}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="bg-gray-50 border-2 border-gray-200 text-primary px-4 py-3 rounded-2xl text-xs font-black outline-none focus:border-[#223024] cursor-pointer w-full sm:w-auto shadow-sm"
          >
            <option value="today">Hari Ini</option>
            <option value="yesterday">Kemarin</option>
            <option value="this_week">Minggu Ini</option>
            <option value="this_month">Bulan Ini</option>
            <option value="this_year">Tahun Ini</option>
          </select>
          <button
            onClick={() => onRequestLeave(child.id, child.name)}
            className="bg-primary hover:bg-[#172118] text-white px-5 py-3 rounded-2xl font-black transition-colors text-xs tracking-wide whitespace-nowrap w-full sm:w-auto cursor-pointer shadow-md shadow-primary/10"
          >
            Ajukan Izin / Sakit
          </button>
        </div>
      </div>

      {/* Kartu Statistik Kehadiran (Di Atas) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-xs">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
            Hadir
          </p>
          <p className="text-2xl font-black text-emerald-700">
            {generatedData.stats.hadir}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-xs">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
            Sakit
          </p>
          <p className="text-2xl font-black text-amber-600">
            {generatedData.stats.sakit}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-xs">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
            Izin
          </p>
          <p className="text-2xl font-black text-blue-600">
            {generatedData.stats.izin}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-xs">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 leading-tight">
            Tidak Masuk
          </p>
          <p className="text-2xl font-black text-rose-600">
            {generatedData.stats.tidak_masuk}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/60 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">
            Avg Waktu
          </p>
          <p className="text-xl font-black text-primary">
            {generatedData.stats.avgTime}
          </p>
        </div>
      </div>

      {/* Riwayat Harian (Di Bawah Statistik) */}
      <div className="bg-gray-50 rounded-3xl p-5 border border-gray-200/60 shadow-xs flex flex-col">
        <h3 className="text-xs font-black uppercase tracking-wider text-primary mb-4">
          Riwayat Harian
        </h3>
        <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1 custom-scrollbar">
          {generatedData.logs.length === 0 ? (
            <p className="text-xs text-gray-500 italic py-4 text-center">
              Belum ada riwayat pada periode ini.
            </p>
          ) : (
            generatedData.logs.map((log, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-white p-3.5 rounded-2xl shadow-xs border border-gray-100"
              >
                <div>
                  <p className="text-xs font-black text-primary">
                    {log.displayDate}
                  </p>
                  <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                    {log.time || log.notes || "-"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-[10px] tracking-wider font-black ${
                    log.status === "Hadir"
                      ? "bg-emerald-100 text-emerald-800"
                      : log.status === "Sakit"
                        ? "bg-amber-100 text-amber-800"
                        : log.status === "Izin"
                          ? "bg-blue-100 text-blue-800"
                          : log.status === "Libur"
                            ? "bg-gray-200 text-gray-700"
                            : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
