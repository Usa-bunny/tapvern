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
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-350 mx-auto space-y-8">
        <header className="relative bg-linear-to-br from-indigo-600 to-violet-800 rounded-4xl p-8 sm:p-10 text-white shadow-xl overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Halo, {parentName}</h1>
            <p className="text-indigo-100 mt-2 font-medium text-lg">Pantau laporan kehadiran putra-putri Anda.</p>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }}
            className="relative z-10 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors font-bold backdrop-blur-md border border-white/20 w-full md:w-auto"
          >
            Keluar
          </button>
        </header>

        {children.length === 0 ? (
          <div className="bg-white p-12 rounded-4xl text-center shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">Belum Ada Data Siswa</h3>
            <p className="text-gray-500 mt-2">Belum ada profil siswa aktif yang ditautkan ke akun Anda oleh pihak sekolah.</p>
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
      </div>

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