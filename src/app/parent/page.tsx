"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Child, Holiday } from "@/types/parent";
import { ChildCard } from "@/components/parent/ChildCard";
import { LeaveModal } from "@/components/parent/LeaveModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function ParentDashboard() {
  const router = useRouter();
  const [parentName, setParentName] = useState("");
  const [children, setChildren] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedChildName, setSelectedChildName] = useState("");

  const fetchParentData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push("/login");

    const parentId = session.user.id;

    const { data: profile } = await supabase.from("profiles").select("name").eq("id", parentId).single();
    if (profile) setParentName(profile.name);

    const { data: studentData } = await supabase.from("students").select("id, name, class_name").eq("parent_id", parentId).eq("is_draft", false);

    if (studentData && studentData.length > 0) {
      setChildren(studentData);
      
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const studentIds = studentData.map((s: any) => s.id);

      const { data: attData } = await supabase.from("attendance").select("*").in("student_id", studentIds).gte("created_at", startOfYear);
      if (attData) setAttendances(attData);

      const { data: holData } = await supabase.from("holidays").select("*").gte("date", `${currentYear}-01-01`);
      if (holData) setHolidays(holData);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchParentData();
  }, [fetchParentData]);

  const handleOpenLeaveModal = (id: string, name: string) => {
    setSelectedChildId(id);
    setSelectedChildName(name);
    setIsLeaveModalOpen(true);
  };

  const handleSubmitLeave = async (childId: string, status: string, date: string, notes: string) => {
    const timestamp = `${date}T07:00:00+07:00`;
    const { error } = await supabase.from("attendance").insert([{ student_id: childId, status, notes, created_at: timestamp }]);

    if (error) alert("Gagal mengirim pengajuan: " + error.message);
    else {
      setIsLeaveModalOpen(false);
      fetchParentData();
    }
  };

  if (loading) return (
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
            WALI SISWA
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Halo, {parentName}</h1>
          <p className="text-emerald-100/80 font-medium text-sm sm:text-base">
            Pantau laporan kehadiran dan ajukan izin putra-putri Anda dengan mudah.
          </p>
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
          className="relative z-10 bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl transition-colors font-black text-xs backdrop-blur-md border border-white/15 w-full md:w-auto cursor-pointer"
        >
          Keluar Sesi
        </button>
      </header>

      {children.length === 0 ? (
        <div className="bg-white p-12 rounded-[2.5rem] text-center shadow-sm border border-gray-200/80">
          <div className="w-20 h-20 bg-emerald-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </div>
          <h3 className="text-xl font-black text-primary">Belum Ada Data Siswa</h3>
          <p className="text-gray-500 text-sm mt-1">Belum ada profil siswa aktif yang ditautkan ke akun Anda oleh pihak sekolah.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {children.map((child) => (
            <ChildCard
              key={child.id}
              child={child}
              rawAttendances={attendances.filter(a => a.student_id === child.id)}
              holidays={holidays}
              onRequestLeave={handleOpenLeaveModal}
            />
          ))}
        </div>
      )}

      {isLeaveModalOpen && (
        <LeaveModal
          childId={selectedChildId}
          childName={selectedChildName}
          onClose={() => setIsLeaveModalOpen(false)}
          onSubmit={handleSubmitLeave}
        />
      )}
    </div>
  );
}