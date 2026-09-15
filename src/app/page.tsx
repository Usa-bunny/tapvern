"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { Student, Attendance, ProcessedStudent, SortConfig } from "@/types";
import { Header } from "@/components/Header";
import { FilterBar } from "@/components/FilterBar";
import { StudentTable } from "@/components/StudentTable";
import { LoadingState, ErrorState } from "@/components/ui/States";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PublicDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterMajor, setFilterMajor] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];

      const [studentsRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("*").eq("is_draft", false),
        supabase.from("attendance").select("student_id, created_at, status").gte("created_at", `${today}T00:00:00+07:00`)
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (attendanceRes.error) throw attendanceRes.error;

      setStudents(studentsRes.data || []);
      setAttendances(attendanceRes.data || []);
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
    setFilterMajor("");
    setFilterGender("");
    setSortConfig(null);
  };

  const processedData = useMemo(() => {
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
    if (filterMajor) {
      filtered = filtered.filter(s => s.major === filterMajor);
    }

    let mappedData: ProcessedStudent[] = filtered.map((student) => {
      const todayRecord = attendances.find((a) => a.student_id === student.id);
      return {
        ...student,
        isPresent: !!todayRecord,
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
  }, [students, attendances, searchQuery, filterGender, filterClass, filterMajor, sortConfig]);

  const uniqueClasses = Array.from(new Set(students.map(s => s.class_name).filter(Boolean))) as string[];
  const uniqueMajors = Array.from(new Set(students.map(s => s.major).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10 font-sans selection:bg-blue-200">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <Header />
        
        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <>
            <FilterBar 
              searchQuery={searchQuery} setSearchQuery={setSearchQuery}
              filterClass={filterClass} setFilterClass={setFilterClass}
              filterMajor={filterMajor} setFilterMajor={setFilterMajor}
              filterGender={filterGender} setFilterGender={setFilterGender}
              uniqueClasses={uniqueClasses} uniqueMajors={uniqueMajors}
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
    </div>
  );
}