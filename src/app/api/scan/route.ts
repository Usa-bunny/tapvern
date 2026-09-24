import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();
    if (!uid) {
      return NextResponse.json({ action: "attendance_failed", message: "UID Tidak Valid" }, { status: 400 });
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("rfid_uid", uid)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ action: "attendance_failed", message: "Database Error" }, { status: 500 });
    }

    if (!student) {
      const { error: insertDraftError } = await supabase.from("students").insert([
        { rfid_uid: uid, name: "Kartu Baru", is_draft: true }
      ]).select().single();

      if (insertDraftError) {
        return NextResponse.json({ action: "attendance_failed", message: "Gagal Simpan Draft" }, { status: 500 });
      }

      const shortUid = uid.substring(0, 6).toUpperCase();
      return NextResponse.json({ action: "waiting_registration", message: `KODE: ${shortUid}` }, { status: 200 });
    }

    if (student.is_draft) {
      const shortUid = uid.substring(0, 6).toUpperCase();
      return NextResponse.json({ action: "waiting_registration", message: `KODE: ${shortUid}` }, { status: 200 });
    }

    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    const dayOfWeek = now.getDay();
    let isHoliday = dayOfWeek === 0 || dayOfWeek === 6;

    if (!isHoliday) {
      const { data: holidayData } = await supabase.from("holidays").select("id").eq("date", todayStr).maybeSingle();
      if (holidayData) isHoliday = true;
    }

    if (isHoliday) {
      return NextResponse.json({ action: "attendance_success", name: student.name, duration: 5 }, { status: 200 });
    }

    const { data: attendanceData, error: attError } = await supabase
      .from("attendance")
      .select("id, status")
      .eq("student_id", student.id)
      .gte("created_at", `${todayStr}T00:00:00+07:00`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (attError) {
      return NextResponse.json({ action: "attendance_failed", message: "Error Cek Absen" }, { status: 500 });
    }

    const attendance = attendanceData?.[0];

    if (attendance) {
      if (attendance.status === "Sakit") {
        return NextResponse.json({ action: "attendance_failed", message: "Status: SAKIT" }, { status: 200 });
      } else if (attendance.status === "Izin") {
        return NextResponse.json({ action: "attendance_failed", message: "Status: IZIN" }, { status: 200 });
      } else {
        return NextResponse.json({ action: "already_attended", name: student.name, duration: 3, open_door: true }, { status: 200 });
      }
    }

    const { error: insertError } = await supabase.from("attendance").insert([
      { student_id: student.id, status: "Hadir" }
    ]);

    if (insertError) {
      return NextResponse.json({ action: "attendance_failed", message: "Gagal Absen" }, { status: 500 });
    }

    return NextResponse.json({ action: "attendance_success", name: student.name, duration: 5 }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ action: "attendance_failed", message: "Server Error" }, { status: 500 });
  }
}