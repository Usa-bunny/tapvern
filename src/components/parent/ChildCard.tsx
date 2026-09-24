import { Child } from "@/types/parent";

interface Props {
  child: Child;
  onRequestLeave: (id: string, name: string) => void;
}

export const ChildCard = ({ child, onRequestLeave }: Props) => {
  return (
    <div className="bg-white rounded-4xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="p-6 md:p-8 bg-linear-to-b from-indigo-50/50 to-white border-b border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
              <span className="text-3xl">👨‍🎓</span> {child.name}
            </h2>
            <div className="mt-2 text-sm bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg font-bold w-fit">
              {child.class_name}
            </div>
          </div>
          <button
            onClick={() => onRequestLeave(child.id, child.name)}
            className="w-full md:w-auto bg-white border-2 border-indigo-100 hover:border-indigo-200 text-indigo-700 px-5 py-2.5 rounded-xl font-bold shadow-sm transition-colors"
          >
            Ajukan Izin / Sakit
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-1.5">
              Hadir
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">
              {child.stats.hadir}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-1.5">
              Sakit
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-500">
              {child.stats.sakit}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-1.5">
              Izin
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-500">
              {child.stats.izin}
            </span>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
            <span className="text-[10px] sm:text-xs text-gray-500 font-extrabold uppercase tracking-widest mb-1.5">
              Rata Masuk
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-600 mt-1">
              {child.stats.avgTime}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 flex-1">
        <h3 className="text-lg font-extrabold text-gray-900 mb-5">
          Riwayat Absensi Terakhir
        </h3>
        {child.recent_logs.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-2xl text-center border border-gray-100">
            <p className="text-gray-500 font-medium">
              Belum ada catatan absensi bulan ini.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {child.recent_logs.map((log) => (
              <li
                key={log.id}
                className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-50/80 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100 transition-colors gap-3"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">
                    {new Date(log.created_at).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  {log.notes && (
                    <span className="text-sm text-gray-500 font-medium mt-1">
                      Ket: {log.notes}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center ${log.status === "Hadir" ? "bg-emerald-100 text-emerald-800" : log.status === "Sakit" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                  >
                    {log.status}
                  </span>
                  {log.status === "Hadir" && (
                    <span className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm">
                      🕒{" "}
                      {new Date(log.created_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
