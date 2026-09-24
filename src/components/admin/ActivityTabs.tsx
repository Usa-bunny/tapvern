import { useState, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Student } from "@/types/admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ActivityTabsProps {
  attendances: any[];
  parents: any[];
  students: Student[];
  draftStudents: Student[];
  holidays: any[];
  refreshData: () => void;
  onSelectStudent: (student: Student) => void;
}

export const ActivityTabs = ({
  attendances,
  parents,
  students,
  draftStudents,
  holidays,
  refreshData,
  onSelectStudent,
}: ActivityTabsProps) => {
  const [activeTab, setActiveTab] = useState<
    "students" | "attendance" | "parents" | "holidays"
  >("students");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterParent, setFilterParent] = useState("all");

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

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchName = s.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchParent =
        filterParent === "all"
          ? true
          : filterParent === "yes"
            ? !!s.parent_id
            : !s.parent_id;
      return matchName && matchParent;
    });
  }, [students, searchQuery, filterParent]);

  const filteredAttendances = useMemo(() => {
    if (!searchQuery) return attendances;
    return attendances.filter((a) =>
      a.students?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [attendances, searchQuery]);

  const filteredParents = useMemo(() => {
    if (!searchQuery) return parents;
    return parents.filter(
      (p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [parents, searchQuery]);

  const filteredHolidays = useMemo(() => {
    let res = holidays;
    if (holidaySearchQuery)
      res = res.filter((h) =>
        h.description.toLowerCase().includes(holidaySearchQuery.toLowerCase()),
      );
    if (holidayFilterMonth !== "all")
      res = res.filter((h) => h.date.startsWith(holidayFilterMonth));
    return res;
  }, [holidays, holidaySearchQuery, holidayFilterMonth]);

  const uniqueHolidayMonths = useMemo(() => {
    return Array.from(new Set(holidays.map((h) => h.date.substring(0, 7))))
      .sort()
      .reverse();
  }, [holidays]);

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingHoliday(true);
    const { error } = await supabase
      .from("holidays")
      .insert([{ date: holidayDate, description: holidayDesc }]);
    setIsAddingHoliday(false);
    if (error) alert(error.message);
    else {
      setHolidayDate("");
      setHolidayDesc("");
      refreshData();
    }
  };

  const handleUpdateHoliday = async (id: string) => {
    const { error } = await supabase
      .from("holidays")
      .update({ date: holidayDate, description: holidayDesc })
      .eq("id", id);
    if (error) alert(error.message);
    else {
      setEditingHolidayId(null);
      setHolidayDate("");
      setHolidayDesc("");
      refreshData();
    }
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
    if (res.ok) {
      setEditingParentId(null);
      refreshData();
    } else alert("Gagal mengubah data wali");
  };

  const handleDeleteParent = async (id: string) => {
    if (!confirm("Peringatan: Hapus akun wali ini beserta seluruh tautannya?"))
      return;
    const res = await fetch("/api/parents", {
      method: "DELETE",
      body: JSON.stringify({ parent_id: id }),
    });
    if (res.ok) refreshData();
    else alert("Gagal menghapus akun wali");
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200/85 flex flex-col h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="flex border-b border-gray-200 px-6 pt-6 shrink-0 overflow-x-auto custom-scrollbar gap-2">
        <button
          onClick={() => {
            setActiveTab("students");
            setSearchQuery("");
          }}
          className={`px-5 pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-4 whitespace-nowrap cursor-pointer ${
            activeTab === "students"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Siswa & Draft ({draftStudents.length + students.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("attendance");
            setSearchQuery("");
          }}
          className={`px-5 pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-4 whitespace-nowrap cursor-pointer ${
            activeTab === "attendance"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Absensi Masuk
        </button>
        <button
          onClick={() => {
            setActiveTab("parents");
            setSearchQuery("");
          }}
          className={`px-5 pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-4 whitespace-nowrap cursor-pointer ${
            activeTab === "parents"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Akun Wali ({parents.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("holidays");
            setSearchQuery("");
          }}
          className={`px-5 pb-4 text-xs font-black uppercase tracking-wider transition-all border-b-4 whitespace-nowrap cursor-pointer ${
            activeTab === "holidays"
              ? "border-primary text-primary"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          Kalender Libur
        </button>
      </div>

      <div className="p-6 sm:p-8 flex flex-col h-full overflow-hidden">
        {activeTab !== "holidays" && activeTab !== "students" && (
          <div className="mb-6 shrink-0">
            <input
              type="text"
              placeholder={
                activeTab === "attendance"
                  ? "Cari nama siswa di absensi..."
                  : "Cari nama atau username wali..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 p-4 rounded-2xl text-sm font-bold text-primary outline-none focus:border-primary focus:bg-white transition-all placeholder:text-gray-400 shadow-sm"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
          {/* TAB SISWA & DRAFT */}
          {activeTab === "students" && (
            <div className="space-y-6">
              {/* Draft Register Section */}
              <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-200/80 shadow-xs">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Draft Register (Kartu Baru Tap)
                  </h3>
                  <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-xl text-xs font-black">
                    {draftStudents.length} Kartu Baru
                  </span>
                </div>
                {draftStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 font-medium italic py-2">
                    Tidak ada kartu baru di draft.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {draftStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex justify-between items-center bg-white p-4 rounded-2xl border border-amber-200 shadow-xs"
                      >
                        <div>
                          <p className="font-extrabold text-xs text-primary">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5 font-bold">
                            UID: {student.rfid_uid}
                          </p>
                        </div>
                        <button
                          onClick={() => onSelectStudent(student)}
                          className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer"
                        >
                          Lengkapi Data
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Students Section */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary"
                  />
                  <select
                    value={filterParent}
                    onChange={(e) => setFilterParent(e.target.value)}
                    className="bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="all">Semua Status Wali</option>
                    <option value="yes">Tertaut Wali</option>
                    <option value="no">Tanpa Wali</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      onClick={() => onSelectStudent(student)}
                      className="flex justify-between items-center bg-white hover:bg-emerald-50/40 p-4 rounded-2xl transition-colors cursor-pointer border border-gray-200/60 shadow-xs group"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-extrabold text-xs text-primary group-hover:text-emerald-800 transition-colors">
                          {student.name}
                        </p>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-gray-100 px-2.5 py-0.5 rounded-md text-gray-600 font-bold">
                            {student.class_name || "Tanpa Kelas"}
                          </span>
                          {student.parent_id && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md font-bold">
                              Wali Aktif
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-black text-primary bg-gray-100 group-hover:bg-primary group-hover:text-white px-3 py-1.5 rounded-xl transition-colors">
                        Edit
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB ABSENSI */}
          {activeTab === "attendance" && (
            <>
              {filteredAttendances.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400 font-bold">
                    Belum ada data absensi hari ini.
                  </p>
                </div>
              ) : (
                filteredAttendances.map((record) => (
                  <div
                    key={record.id}
                    className="flex justify-between items-center p-4 bg-gray-50/70 rounded-2xl border border-gray-200/60 shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-white border border-gray-200 text-primary px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs">
                        {new Date(record.created_at).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" },
                        )}{" "}
                        WIB
                      </div>
                      <p className="font-extrabold text-sm text-primary">
                        {record.students?.name}
                      </p>
                    </div>
                    <div>
                      {record.status === "Hadir" && (
                        <span className="bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-xl text-xs font-black border border-emerald-200">
                          Hadir
                        </span>
                      )}
                      {record.status === "Sakit" && (
                        <span className="bg-amber-100 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-black border border-amber-200">
                          Sakit
                        </span>
                      )}
                      {record.status === "Izin" && (
                        <span className="bg-blue-100 text-blue-800 px-3.5 py-1.5 rounded-xl text-xs font-black border border-blue-200">
                          Izin
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* TAB AKUN WALI */}
          {activeTab === "parents" && (
            <>
              {filteredParents.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-400 font-bold">
                    Belum ada data akun wali.
                  </p>
                </div>
              ) : (
                filteredParents.map((parent) => {
                  const children = students.filter(
                    (s) => s.parent_id === parent.id,
                  );
                  const isEditing = editingParentId === parent.id;

                  return (
                    <div
                      key={parent.id}
                      className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-emerald-900/10 shadow-sm"
                    >
                      {isEditing ? (
                        <form
                          onSubmit={handleUpdateParent}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input
                              type="text"
                              required
                              value={editParentName}
                              onChange={(e) =>
                                setEditParentName(e.target.value)
                              }
                              placeholder="Nama Wali"
                              className="bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary"
                            />
                            <input
                              type="text"
                              required
                              value={editParentUsername}
                              onChange={(e) =>
                                setEditParentUsername(e.target.value)
                              }
                              placeholder="Username"
                              className="bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary"
                            />
                            <input
                              type="password"
                              value={editParentPassword}
                              onChange={(e) =>
                                setEditParentPassword(e.target.value)
                              }
                              placeholder="Password baru (opsional)"
                              className="bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary"
                            />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingParentId(null)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary text-white rounded-xl font-bold text-xs cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-black text-base text-primary">
                                {parent.name}
                              </h3>
                              <p className="text-xs font-bold text-gray-400 font-mono mt-0.5">
                                @{parent.email.split("@")[0]}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingParentId(parent.id);
                                  setEditParentName(parent.name);
                                  setEditParentUsername(
                                    parent.email.split("@")[0],
                                  );
                                  setEditParentPassword("");
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-primary px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteParent(parent.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 mt-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/60">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">
                              Anak Tertaut ({children.length})
                            </p>
                            {children.length === 0 ? (
                              <p className="text-xs text-gray-500 font-medium italic">
                                Belum ada siswa tertaut ke akun ini.
                              </p>
                            ) : (
                              children.map((child) => (
                                <div
                                  key={child.id}
                                  className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-200/60 shadow-xs"
                                >
                                  <div>
                                    <p className="font-bold text-xs text-primary">
                                      {child.name}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                                      NISN: {child.nisn || "-"}
                                    </p>
                                  </div>
                                  <span className="text-[11px] font-black bg-gray-100 text-primary px-2.5 py-1 rounded-lg">
                                    {child.class_name || "Tanpa Kelas"}
                                  </span>
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

          {/* TAB KALENDER LIBUR */}
          {activeTab === "holidays" && (
            <div className="flex flex-col h-full space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 bg-gray-50/80 p-4 rounded-3xl border border-gray-200/60">
                <input
                  type="text"
                  placeholder="Cari keterangan libur..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="flex-1 bg-white border-2 border-gray-200 p-3 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary"
                />
                <select
                  value={holidayFilterMonth}
                  onChange={(e) => setHolidayFilterMonth(e.target.value)}
                  className="bg-white border-2 border-gray-200 p-3 rounded-2xl text-xs font-bold text-primary outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Semua Bulan</option>
                  {uniqueHolidayMonths.map((m) => (
                    <option key={m} value={m}>
                      {new Date(m + "-01").toLocaleDateString("id-ID", {
                        month: "long",
                        year: "numeric",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 shadow-xs">
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-3">
                    Tambah Hari Libur Baru
                  </h4>
                  <form
                    onSubmit={handleAddHoliday}
                    className="flex flex-col sm:flex-row gap-3 items-end"
                  >
                    <input
                      type="date"
                      required
                      value={editingHolidayId ? "" : holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      className="w-full bg-white border-2 border-emerald-200 p-3 rounded-2xl font-bold outline-none focus:border-primary text-xs text-primary"
                    />
                    <input
                      type="text"
                      required
                      value={editingHolidayId ? "" : holidayDesc}
                      onChange={(e) => setHolidayDesc(e.target.value)}
                      placeholder="Contoh: Hari Raya Idul Fitri"
                      className="w-full bg-white border-2 border-emerald-200 p-3 rounded-2xl font-bold outline-none focus:border-primary text-xs text-primary"
                    />
                    <button
                      type="submit"
                      disabled={isAddingHoliday || !!editingHolidayId}
                      className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isAddingHoliday ? "Menambah..." : "Tambah"}
                    </button>
                  </form>
                </div>

                {filteredHolidays.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6 font-bold">
                    Belum ada data hari libur pada filter ini.
                  </p>
                ) : (
                  filteredHolidays.map((h) => (
                    <div
                      key={h.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-200/60 shadow-xs"
                    >
                      {editingHolidayId === h.id ? (
                        <div className="flex flex-col sm:flex-row gap-3 items-end">
                          <input
                            type="date"
                            required
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl font-bold outline-none focus:border-primary text-xs text-primary"
                          />
                          <input
                            type="text"
                            required
                            value={holidayDesc}
                            onChange={(e) => setHolidayDesc(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-gray-200 p-3 rounded-2xl font-bold outline-none focus:border-primary text-xs text-primary"
                          />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setEditingHolidayId(null)}
                              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-2xl font-bold text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => handleUpdateHoliday(h.id)}
                              className="flex-1 bg-primary text-white px-4 py-3 rounded-2xl font-bold text-xs cursor-pointer"
                            >
                              Simpan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-black text-sm text-primary">
                              {new Date(h.date).toLocaleDateString("id-ID", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 font-bold">
                              {h.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingHolidayId(h.id);
                                setHolidayDate(h.date);
                                setHolidayDesc(h.description);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteHoliday(h.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2.5 rounded-xl transition-colors cursor-pointer"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
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
