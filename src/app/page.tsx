"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Student, Attendance, ProcessedStudent, SortConfig } from "@/types";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { StudentTable } from "@/components/StudentTable";
import { LoadingState, ErrorState } from "@/components/ui/States";
import { ExportModal } from "@/components/ExportModal";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublicDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterDomicile, setFilterDomicile] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];

      const [studentsRes, attendanceRes, holidaysRes] = await Promise.all([
        supabase.from("students").select("*").eq("is_draft", false),
        supabase.from("attendance").select("student_id, created_at, status").gte("created_at", `${today}T00:00:00+07:00`),
        supabase.from("holidays").select("date").eq("date", today).maybeSingle()
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setStudents(studentsRes.data || []);
      setAttendances(attendanceRes.data || []);
      if (holidaysRes.data) setHolidays([holidaysRes.data]);
    } catch (err: any) {
      setError(err.message || "Gagal terhubung ke database. Silakan periksa koneksi Anda.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const attendanceChannel = supabase
      .channel("public_attendance")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "attendance" }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(attendanceChannel);
    };
  }, [fetchData]);

  const handleSort = (key: keyof ProcessedStudent) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilterClass("");
    setFilterDomicile("");
    setFilterGender("");
    setSortConfig(null);
  };

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name).filter(Boolean))) as string[];
  const uniqueDomiciles = Array.from(new Set(students.map(s => s.domicile).filter(Boolean))) as string[];

  const processedData = useMemo(() => {
    const todayStr = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];
    const todayDate = new Date(`${todayStr}T00:00:00+07:00`);
    const dayOfWeek = todayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = isWeekend || holidays.length > 0;

    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (filterGender) {
      filtered = filtered.filter(s => s.gender === filterGender);
    }
    if (filterClass) {
      filtered = filtered.filter(s => s.class_name === filterClass);
    }
    if (filterDomicile) {
      filtered = filtered.filter(s => s.domicile === filterDomicile);
    }

    let mappedData: ProcessedStudent[] = filtered.map((student) => {
      const todayRecord = attendances.find((a) => a.student_id === student.id);
      
      let computedStatus = todayRecord ? todayRecord.status : null;
      if (!todayRecord && isHoliday) {
        computedStatus = "Libur";
      }

      return {
        ...student,
        isPresent: !!todayRecord,
        status: computedStatus,
        time: todayRecord ? new Date(todayRecord.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-",
        rawTime: todayRecord ? new Date(todayRecord.created_at).getTime() : 0,
      };
    });

    if (sortConfig) {
      mappedData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (aValue === bValue) return 0;

        const isAsc = sortConfig.direction === "asc";
        return aValue < bValue ? (isAsc ? -1 : 1) : (isAsc ? 1 : -1);
      });
    }

    return mappedData;
  }, [students, attendances, holidays, searchQuery, filterGender, filterClass, filterDomicile, sortConfig]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10 font-sans selection:bg-blue-200">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Header />
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 border border-emerald-500 w-full sm:w-auto justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export Laporan
          </button>
        </div>
        
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            <FilterBar 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filterClass={filterClass} setFilterClass={setFilterClass}
              filterDomicile={filterDomicile} setFilterDomicile={setFilterDomicile}
              filterGender={filterGender} setFilterGender={setFilterGender}
              uniqueClasses={uniqueClasses} uniqueDomiciles={uniqueDomiciles}
              onReset={handleResetFilters}
            />
            
            {isLoading ? (
              <LoadingState />
            ) : (
              <StudentTable 
                data={processedData} 
                sortConfig={sortConfig} 
                onSort={handleSort} 
              />
            )}
          </>
        )}
      </div>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        uniqueClasses={uniqueClasses} 
      />
    </div>
  );
}