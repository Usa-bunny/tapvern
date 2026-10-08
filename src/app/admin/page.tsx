"use client";

import { ActivityTabs } from "@/components/admin/ActivityTabs";
import { StudentModal } from "@/components/admin/StudentModal";
import { AttendanceRecord, ParentProfile, Student } from "@/types/admin";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdminAuth, setIsAdminAuth] = useState(false);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [draftStudents, setDraftStudents] = useState<Student[]>([]);
  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const fetchData = useCallback(async () => {
    const today = new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
      .split(" ")[0];

    const [attData, studentData, parentData, holData] = await Promise.all([
      supabase
        .from("attendance")
        .select(`id, created_at, status, students (name, rfid_uid)`)
        .gte("created_at", `${today}T00:00:00+07:00`)
        .order("created_at", { ascending: false }),
      supabase
        .from("students")
        .select("*, profiles (name, email)")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "parent"),
      supabase.from("holidays").select("*").order("date", { ascending: false }),
    ]);

    if (attData.data) setAttendances(attData.data as any);
    if (parentData.data) setParents(parentData.data);
    if (holData.data) setHolidays(holData.data);
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
      } else {
        router.push("/parent");
      }
    };
    checkUser();
  }, [router, fetchData]);

  useEffect(() => {
    if (!isAdminAuth) return;
    const channel = supabase
      .channel("admin_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance" },
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

  const handleUpdateStudent = async (studentData: any, parentAction: any) => {
    try {
      const { error: stuError } = await supabase
        .from("students")
        .update({
          name: studentData.name || "Siswa Baru",
          nisn: studentData.nisn || null,
          gender: studentData.gender || null,
          class_name: studentData.class_name || null,
          domicile: studentData.domicile || null,
          is_draft: studentData.is_draft,
          updated_at: new Date().toISOString(),
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
        } else if (parentAction.type === "unlink") {
          await supabase
            .from("students")
            .update({ parent_id: null })
            .eq("id", studentData.id);
        }
      }
      setEditingStudent(null);
      fetchData();
    } catch (e: any) {
      alert(e.message || "Gagal menyimpan data");
    }
  };

  if (!isAdminAuth)
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="space-y-8">
      <header className="relative bg-primary rounded-[2.5rem] p-8 sm:p-10 text-cream shadow-xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-black tracking-widest uppercase bg-white/10 text-emerald-300 px-3.5 py-1.5 rounded-full">
            ADMINISTRATOR
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Admin Console
          </h1>
          <p className="text-emerald-100/80 font-medium text-sm sm:text-base">
            Manajemen kartu RFID draft, akun wali, kalender libur, dan log
            kehadiran siswa.
          </p>
        </div>

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
          className="relative z-10 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl transition-colors font-black text-xs backdrop-blur-md border border-white/15 w-full md:w-auto cursor-pointer"
        >
          Keluar Sesi
        </button>
      </header>

      <section className="h-162.5 sm:h-175">
        <ActivityTabs
          attendances={attendances}
          parents={parents}
          students={activeStudents}
          draftStudents={draftStudents}
          holidays={holidays}
          refreshData={fetchData}
          onSelectStudent={(student) => setEditingStudent(student)}
        />
      </section>

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
