import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

interface ActivityTabsProps {
  attendances: any[];
  parents: any[];
  students: any[];
  holidays: any[];
  refreshData: () => void;
}

export const ActivityTabs = ({ attendances, parents, students, holidays, refreshData }: ActivityTabsProps) => {
  const [activeTab, setActiveTab] = useState<"attendance" | "parents" | "holidays">("attendance");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");
  const [isAddingHoliday, setIsAddingHoliday] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  
  const [holidaySearchQuery, setHolidaySearchQuery] = useState("");
  const [holidayFilterMonth, setHolidayFilterMonth] = useState("all");

  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [editParentName, setEditParentName] = useState("");
  const [editParentUsername, setEditParentUsername] = useState("");
  const [editParentPassword, setEditParentPassword] = useState("");

  const filteredAttendances = useMemo(() => {
    if (!searchQuery) return attendances;
    return attendances.filter((a) => a.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [attendances, searchQuery]);

  const filteredParents = useMemo(() => {
    if (!searchQuery) return parents;
    return parents.filter((p) => p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.email?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [parents, searchQuery]);

  const filteredHolidays = useMemo(() => {
    let res = holidays;
    if (holidaySearchQuery) res = res.filter(h => h.description.toLowerCase().includes(holidaySearchQuery.toLowerCase()));
    if (holidayFilterMonth !== "all") res = res.filter(h => h.date.startsWith(holidayFilterMonth));
    return res;
  }, [holidays, holidaySearchQuery, holidayFilterMonth]);

  const uniqueHolidayMonths = useMemo(() => {
    return Array.from(new Set(holidays.map(h => h.date.substring(0, 7)))).sort().reverse();
  }, [holidays]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingHoliday(true);
    const { error } = await supabase.from("holidays").insert([{ date: holidayDate, description: holidayDesc }]);
    setIsAddingHoliday(false);
    if (error) alert(error.message);
    else { setHolidayDate(""); setHolidayDesc(""); refreshData(); }
  };

  const handleUpdateHoliday = async (id: string) => {
    const { error } = await supabase.from("holidays").update({ date: holidayDate, description: holidayDesc }).eq("id", id);
    if (error) alert(error.message);
    else { setEditingHolidayId(null); setHolidayDate(""); setHolidayDesc(""); refreshData(); }
  };

  const handleDeleteHoliday = async (id: string) => {
    const { error } = await supabase.from("holidays").delete().eq("id", id);
    if (error) alert(error.message);
    else refreshData();
  };

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/parents", {
      method: "PUT",
      body: JSON.stringify({
        parent_id: editingParentId,
        parent_name: editParentName,
        parent_username: editParentUsername,
        new_password: editParentPassword,
      }),
    });
    if (res.ok) { setEditingParentId(null); refreshData(); } 
    else alert("Gagal mengubah data wali");
  };

  const handleDeleteParent = async (id: string) => {
    if (!confirm("Peringatan: Hapus akun wali ini beserta seluruh tautannya?")) return;
    const res = await fetch("/api/parents", {
      method: "DELETE",
      body: JSON.stringify({ parent_id: id }),
    });
    if (res.ok) refreshData();
    else alert("Gagal menghapus akun wali");
  };

  return (
    <div className="bg-white rounded-4xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-gray-100 px-4 pt-4 shrink-0 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => { setActiveTab("attendance"); setSearchQuery(""); }}
          className={`px-4 pb-4 text-sm font-extrabold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "attendance" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Absensi Masuk
        </button>
        <button
          onClick={() => { setActiveTab("parents"); setSearchQuery(""); }}
          className={`px-4 pb-4 text-sm font-extrabold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "parents" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Akun Wali
        </button>
        <button
          onClick={() => { setActiveTab("holidays"); setSearchQuery(""); }}
          className={`px-4 pb-4 text-sm font-extrabold transition-colors border-b-2 whitespace-nowrap ${
            activeTab === "holidays" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Kalender Libur
        </button>
      </div>

      <div className="p-6 flex flex-col h-full overflow-hidden">
        {activeTab !== "holidays" && (
          <div className="mb-6 shrink-0">
            <input
              type="text"
              placeholder={activeTab === "attendance" ? "Cari nama siswa di absensi..." : "Cari nama atau username wali..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-xl text-sm font-bold outline-none focus:border-blue-600 focus:bg-white transition-colors placeholder:text-gray-400"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
          {activeTab === "attendance" && (
            <>
              {filteredAttendances.length === 0 ? (
                <div className="text-center py-10"><p className="text-gray-400 font-bold">Belum ada data absensi.</p></div>
              ) : (
                filteredAttendances.map((record) => (
                  <div key={record.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                        {new Date(record.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                      </div>
                      <p className="font-extrabold text-gray-900">{record.students?.name}</p>
                    </div>
                    <div>
                      {record.status === "Hadir" && <span className="bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-200">Hadir</span>}
                      {record.status === "Sakit" && <span className="bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">Sakit</span>}
                      {record.status === "Izin" && <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200">Izin</span>}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "parents" && (
            <>
              {filteredParents.length === 0 ? (
                <div className="text-center py-10"><p className="text-gray-400 font-bold">Belum ada data akun wali.</p></div>
              ) : (
                filteredParents.map((parent) => {
                  const children = students.filter(s => s.parent_id === parent.id);
                  const isEditing = editingParentId === parent.id;

                  return (
                    <div key={parent.id} className="bg-white p-5 rounded-2xl border-2 border-indigo-50 shadow-sm">
                      {isEditing ? (
                        <form onSubmit={handleUpdateParent} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input type="text" required value={editParentName} onChange={e => setEditParentName(e.target.value)} placeholder="Nama Wali" className="bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-600" />
                            <input type="text" required value={editParentUsername} onChange={e => setEditParentUsername(e.target.value)} placeholder="Username" className="bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-600" />
                            <input type="password" value={editParentPassword} onChange={e => setEditParentPassword(e.target.value)} placeholder="Kosongkan jika tak diubah" className="bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-indigo-600" />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditingParentId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">Simpan Perubahan</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-black text-lg text-gray-900">{parent.name}</h3>
                              <p className="text-sm font-bold text-gray-500 font-mono mt-0.5">@{parent.email.split('@')[0]}</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingParentId(parent.id); setEditParentName(parent.name); setEditParentUsername(parent.email.split('@')[0]); setEditParentPassword(""); }} className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">Edit</button>
                              <button onClick={() => handleDeleteParent(parent.id)} className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors">Hapus</button>
                            </div>
                          </div>
                          <div className="space-y-2 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {children.length === 0 ? (
                              <p className="text-sm text-gray-500 font-medium italic">Belum ada siswa tertaut.</p>
                            ) : (
                              children.map(child => (
                                <div key={child.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                  <div>
                                    <p className="font-bold text-gray-800 text-sm">{child.name}</p>
                                    <p className="text-xs text-gray-500 font-mono mt-0.5">NISN: {child.nisn || "-"}</p>
                                  </div>
                                  <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{child.class_name || "Tanpa Kelas"}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}

          {activeTab === "holidays" && (
            <div className="flex flex-col h-full space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <input type="text" placeholder="Cari libur..." value={holidaySearchQuery} onChange={e => setHolidaySearchQuery(e.target.value)} className="flex-1 bg-white border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-blue-600" />
                <select value={holidayFilterMonth} onChange={e => setHolidayFilterMonth(e.target.value)} className="bg-white border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold outline-none focus:border-blue-600 cursor-pointer">
                  <option value="all">Semua Bulan</option>
                  {uniqueHolidayMonths.map(m => (
                    <option key={m} value={m}>{new Date(m + "-01").toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 overflow-y-auto">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-bold text-blue-900 mb-3">Tambah Hari Libur</h4>
                  <form onSubmit={handleAddHoliday} className="flex flex-col sm:flex-row gap-3 items-end">
                    <input type="date" required value={editingHolidayId ? "" : holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full bg-white border-2 border-blue-300 p-2.5 rounded-xl font-bold outline-none focus:border-blue-600 text-sm" />
                    <input type="text" required value={editingHolidayId ? "" : holidayDesc} onChange={e => setHolidayDesc(e.target.value)} placeholder="Contoh: Idul Fitri" className="w-full bg-white border-2 border-blue-300 p-2.5 rounded-xl font-bold outline-none focus:border-blue-600 text-sm" />
                    <button type="submit" disabled={isAddingHoliday || !!editingHolidayId} className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm">
                      {isAddingHoliday ? "Loading..." : "Tambah"}
                    </button>
                  </form>
                </div>

                {filteredHolidays.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada data hari libur pada pencarian ini.</p>
                ) : (
                  filteredHolidays.map(h => (
                    <div key={h.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      {editingHolidayId === h.id ? (
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <input type="date" required value={holidayDate} onChange={e => setHolidayDate(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl font-bold outline-none focus:border-blue-600 text-sm" />
                          <input type="text" required value={holidayDesc} onChange={e => setHolidayDesc(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl font-bold outline-none focus:border-blue-600 text-sm" />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setEditingHolidayId(null)} className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 text-sm">Batal</button>
                            <button onClick={() => handleUpdateHoliday(h.id)} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 text-sm">Simpan</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-extrabold text-gray-900">{new Date(h.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                            <p className="text-sm text-gray-500 mt-0.5 font-medium">{h.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingHolidayId(h.id); setHolidayDate(h.date); setHolidayDesc(h.description); }} className="bg-gray-100 text-gray-600 p-2.5 rounded-lg hover:bg-gray-200 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteHoliday(h.id)} className="bg-rose-50 text-rose-600 p-2.5 rounded-lg hover:bg-rose-100 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};