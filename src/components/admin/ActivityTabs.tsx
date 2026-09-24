import { useState, useMemo } from "react";

interface ActivityTabsProps {
  attendances: any[];
  parents: any[];
  students: any[];
}

export const ActivityTabs = ({ attendances, parents, students }: ActivityTabsProps) => {
  const [activeTab, setActiveTab] = useState<"attendance" | "parents">("attendance");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttendances = useMemo(() => {
    if (!searchQuery) return attendances;
    return attendances.filter((a) =>
      a.students?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [attendances, searchQuery]);

  const filteredParents = useMemo(() => {
    if (!searchQuery) return parents;
    return parents.filter((p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parents, searchQuery]);

  return (
    <div className="bg-white rounded-4xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-gray-100 px-4 pt-4 shrink-0">
        <button
          onClick={() => { setActiveTab("attendance"); setSearchQuery(""); }}
          className={`flex-1 pb-4 text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === "attendance" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Absensi Masuk
        </button>
        <button
          onClick={() => { setActiveTab("parents"); setSearchQuery(""); }}
          className={`flex-1 pb-4 text-sm font-extrabold transition-colors border-b-2 ${
            activeTab === "parents" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Data Akun Wali
        </button>
      </div>

      <div className="p-6 flex flex-col h-full overflow-hidden">
        <div className="mb-6 shrink-0">
          <input
            type="text"
            placeholder={activeTab === "attendance" ? "Cari nama siswa di absensi..." : "Cari nama atau username wali..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {activeTab === "attendance" && (
            <>
              {filteredAttendances.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-bold">Belum ada data absensi.</p>
                </div>
              ) : (
                filteredAttendances.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                        {new Date(record.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900">{record.students?.name}</p>
                      </div>
                    </div>
                    <div>
                      {record.status === "Hadir" && (
                        <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200 shadow-sm">Hadir</span>
                      )}
                      {record.status === "Sakit" && (
                        <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 shadow-sm">Sakit</span>
                      )}
                      {record.status === "Izin" && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 shadow-sm">Izin</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "parents" && (
            <>
              {filteredParents.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 font-bold">Belum ada data akun wali.</p>
                </div>
              ) : (
                filteredParents.map((parent) => {
                  const children = students.filter(s => s.parent_id === parent.id);
                  return (
                    <div key={parent.id} className="bg-white p-5 rounded-2xl border-2 border-indigo-50 shadow-sm hover:border-indigo-100 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-black text-lg text-gray-900">{parent.name}</h3>
                          <p className="text-sm font-bold text-gray-500 font-mono mt-0.5">@{parent.email.split('@')[0]}</p>
                        </div>
                        <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-200">
                          {children.length} Anak Tertaut
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Daftar Anak Siswa</p>
                        {children.length === 0 ? (
                          <p className="text-sm text-gray-500 font-medium italic">Belum ada siswa yang ditautkan ke akun ini.</p>
                        ) : (
                          children.map(child => (
                            <div key={child.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{child.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">NISN: {child.nisn || "-"}</p>
                              </div>
                              <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                                {child.class_name || "Tanpa Kelas"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};