"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Student,
  AttendanceRecord,
  DeviceCommand,
  TempScan,
  ParentProfile,
} from "@/types/admin";
import { ActivityTabs } from "@/components/admin/ActivityTabs";
import { StudentModal } from "@/components/admin/StudentModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [newUid, setNewUid] = useState<string | null>(null);
  const [inputName, setInputName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [doorDuration, setDoorDuration] = useState<number>(5);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [commands, setCommands] = useState<DeviceCommand[]>([]);
  const [scans, setScans] = useState<TempScan[]>([]);
  const [draftStudents, setDraftStudents] = useState<Student[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentProfile[]>([]);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchActive, setSearchActive] = useState("");
  const [filterParent, setFilterParent] = useState("all");

  const fetchData = useCallback(async () => {
    const today = new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
      .split(" ")[0];

    const [attData, cmdData, scanData, studentData, parentData] =
      await Promise.all([
        supabase
          .from("attendance")
          .select(`id, created_at, status, students (name, rfid_uid)`)
          .gte("created_at", `${today}T00:00:00+07:00`)
          .order("created_at", { ascending: false }),
        supabase
          .from("device_commands")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("temp_scans").select("*"),
        supabase
          .from("students")
          .select("*, profiles!students_parent_id_fkey(name, email)")
          .order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").eq("role", "parent"),
      ]);

    if (attData.data) setAttendances(attData.data as any);
    if (cmdData.data) setCommands(cmdData.data);
    if (scanData.data) setScans(scanData.data);
    if (parentData.data) setParents(parentData.data);
    if (studentData.data) {
      setDraftStudents(studentData.data.filter((s: any) => s.is_draft));
      setActiveStudents(studentData.data.filter((s: any) => !s.is_draft));
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (profile?.role === "admin") {
        setIsAdminAuth(true);
        fetchData();
      } else router.push("/parent");
    };
    checkUser();
  }, [router, fetchData]);

  useEffect(() => {
    if (!isAdminAuth) return;
    const channel = supabase
      .channel("admin_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temp_scans" },
        (p: any) => p.new?.uid && setNewUid(p.new.uid),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_commands" },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "students" },
        () => fetchData(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminAuth, fetchData]);

  const filteredActive = useMemo(() => {
    return activeStudents.filter((s) => {
      const matchName = s.name
        .toLowerCase()
        .includes(searchActive.toLowerCase());
      const matchParent =
        filterParent === "all"
          ? true
          : filterParent === "yes"
            ? !!s.parent_id
            : !s.parent_id;
      return matchName && matchParent;
    });
  }, [activeStudents, searchActive, filterParent]);

  const handleCommand = async (action: string, customDuration: number = 5) => {
    await fetch("/api/command", {
      method: "POST",
      body: JSON.stringify({ action, duration: customDuration }),
    });
    if (action === "register_mode") setIsRegisterMode(true);
    if (action === "normal_mode") {
      setIsRegisterMode(false);
      setNewUid(null);
    }
  };

  const handleSaveDraft = async () => {
    if (!inputName || !newUid) return;
    const res = await fetch("/api/students", {
      method: "POST",
      body: JSON.stringify({ rfid_uid: newUid, name: inputName }),
    });
    if (res.ok) {
      setNewUid(null);
      setInputName("");
      setIsRegisterMode(false);
      await fetch("/api/command", {
        method: "POST",
        body: JSON.stringify({ action: "register_success", name: inputName }),
      });
    }
  };

  const handleUpdateStudent = async (studentData: any, parentAction: any) => {
    try {
      const { error: stuError } = await supabase
        .from("students")
        .update({
          name: studentData.name,
          nisn: studentData.nisn,
          gender: studentData.gender,
          class_name: studentData.class_name,
          major: studentData.major,
          domicile: studentData.domicile,
          is_draft: false,
        })
        .eq("id", studentData.id);

      if (stuError) throw stuError;

      if (parentAction) {
        if (parentAction.type === "create") {
          await fetch("/api/parents", {
            method: "POST",
            body: JSON.stringify({
              student_id: studentData.id,
              parent_name: parentAction.name,
              parent_username: parentAction.username,
              parent_password: parentAction.password,
            }),
          });
        } else if (parentAction.type === "link") {
          await supabase
            .from("students")
            .update({ parent_id: parentAction.id })
            .eq("id", studentData.id);
        } else if (parentAction.type === "update") {
          await fetch("/api/parents", {
            method: "PUT",
            body: JSON.stringify({
              parent_id: parentAction.id,
              parent_name: parentAction.name,
              parent_username: parentAction.username,
              new_password: parentAction.password,
            }),
          });
        }
      }
      setEditingStudent(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan");
    }
  };

  if (!isAdminAuth)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-350 mx-auto space-y-6">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 md:p-8 rounded-4xl shadow-sm border border-gray-100 gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Admin Console
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Manajemen Perangkat & Pengguna
            </p>
          </div>
          <div className="flex flex-wrap gap-3 md:gap-4 items-center w-full lg:w-auto">
            <button
              onClick={() =>
                handleCommand(isRegisterMode ? "normal_mode" : "register_mode")
              }
              className={`flex-1 lg:flex-none px-6 py-3.5 rounded-2xl font-extrabold text-white transition-all shadow-sm ${isRegisterMode ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"}`}
            >
              {isRegisterMode ? "Tutup Register" : "Mode Daftar"}
            </button>
            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-2xl border border-emerald-100 w-full lg:w-auto">
              <input
                type="number"
                min="1"
                max="60"
                value={doorDuration}
                onChange={(e) => setDoorDuration(Number(e.target.value))}
                className="w-16 px-2 py-2 rounded-xl border-none text-center font-bold text-emerald-900 outline-none bg-white shadow-sm"
              />
              <span className="text-xs font-bold text-emerald-800 pr-2">
                Detik
              </span>
              <button
                onClick={() => handleCommand("open_door", doorDuration)}
                className="flex-1 lg:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-sm"
              >
                Buka Pintu
              </button>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="bg-gray-100 text-gray-700 px-6 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-colors w-full lg:w-auto"
            >
              Keluar
            </button>
          </div>
        </header>

        {newUid && isRegisterMode && (
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-6 sm:p-8 rounded-4xl text-white flex flex-col md:flex-row gap-6 items-center shadow-lg shadow-blue-500/20 animate-in fade-in slide-in-from-top-4">
            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="text-2xl font-extrabold mb-2">
                Kartu Ditemukan!{" "}
                <span className="font-mono bg-white/20 px-3 py-1 rounded-lg ml-2">
                  {newUid}
                </span>
              </h2>
              <p className="text-blue-100 font-medium">
                Masukkan nama untuk menyimpan ke draft.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3 flex-col sm:flex-row">
              <input
                type="text"
                placeholder="Nama Siswa..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="px-5 py-3.5 rounded-2xl text-gray-900 outline-none w-full sm:w-64 font-bold"
              />
              <button
                onClick={handleSaveDraft}
                className="bg-white text-blue-700 px-8 py-3.5 rounded-2xl font-extrabold hover:bg-blue-50 transition-colors shadow-sm"
              >
                Simpan Draft
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-4 space-y-6 flex flex-col">
            <section className="bg-white p-6 rounded-4xl shadow-sm border border-yellow-200/60 max-h-100 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-extrabold text-gray-900">
                  Draft Register
                </h2>
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg text-xs font-bold">
                  {draftStudents.length} Menunggu
                </span>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {draftStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{student.name}</p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5 font-bold">
                        UID: {student.rfid_uid}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditingStudent(student)}
                      className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors shadow-sm"
                    >
                      Lengkapi
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-100">
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">
                Siswa Aktif
              </h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Cari siswa..."
                  value={searchActive}
                  onChange={(e) => setSearchActive(e.target.value)}
                  className="flex-1 bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-600 placeholder:text-gray-500"
                />
                <select
                  value={filterParent}
                  onChange={(e) => setFilterParent(e.target.value)}
                  className="bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-600 cursor-pointer"
                >
                  <option value="all" className="font-bold">
                    Semua Wali
                  </option>
                  <option value="yes" className="font-bold">
                    Tertaut
                  </option>
                  <option value="no" className="font-bold">
                    Tanpa Wali
                  </option>
                </select>
              </div>
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {filteredActive.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setEditingStudent(student)}
                    className="flex justify-between items-center bg-white hover:bg-blue-50 p-4 rounded-2xl transition-colors cursor-pointer border border-gray-100 hover:border-blue-200 group"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                        {student.name}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 font-bold">
                          {student.class_name || "Tanpa Kelas"}
                        </span>
                        {student.parent_id && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            Wali Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="lg:col-span-8 h-full">
            <ActivityTabs
              attendances={attendances}
              commands={commands}
              scans={scans}
              parents={parents}
            />
          </section>
        </div>
      </div>

      {editingStudent && (
        <StudentModal
          student={editingStudent}
          parents={parents}
          onClose={() => setEditingStudent(null)}
          onSubmit={handleUpdateStudent}
        />
      )}
    </div>
  );
}
