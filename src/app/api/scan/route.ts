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

    // 1. Cek apakah kartu sudah ada di database
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("*")
      .eq("rfid_uid", uid)
      .maybeSingle();

    if (studentError) {
      console.error("DB Error (Select Student):", studentError);
      return NextResponse.json({ action: "attendance_failed", message: "Database Error" }, { status: 500 });
    }

    // 2. JIKA KARTU BELUM ADA SAMA SEKALI DI DATABASE
    if (!student) {
      // Wajib gunakan .select().single() agar error/suksesnya terdeteksi pasti oleh Supabase
      const { error: insertDraftError } = await supabase.from("students").insert([
        { rfid_uid: uid, name: "Kartu Baru", is_draft: true }
      ]).select().single();

      if (insertDraftError) {
        console.error("DB Error (Insert Draft):", insertDraftError);
        return NextResponse.json({ action: "attendance_failed", message: "Gagal Simpan Draft" }, { status: 500 });
      }

      const shortUid = uid.substring(0, 6).toUpperCase();
      return NextResponse.json({ action: "waiting_registration", message: `KODE: ${shortUid}` }, { status: 200 });
    }

    // 3. JIKA KARTU ADA TAPI MASIH STATUS DRAFT
    if (student.is_draft) {
      const shortUid = uid.substring(0, 6).toUpperCase();
      return NextResponse.json({ action: "waiting_registration", message: `KODE: ${shortUid}` }, { status: 200 });
    }

    // 4. JIKA KARTU AKTIF, CEK ABSENSI HARI INI
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];
    
    // PENTING: Gunakan limit(1) dan ambil array index [0] agar tidak error saat ada data kembar
    const { data: attendanceData, error: attError } = await supabase
      .from("attendance")
      .select("id, status")
      .eq("student_id", student.id)
      .gte("created_at", `${today}T00:00:00+07:00`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (attError) {
      console.error("DB Error (Check Attendance):", attError);
      return NextResponse.json({ action: "attendance_failed", message: "Error Cek Absen" }, { status: 500 });
    }

    const attendance = attendanceData?.[0];

    // 5. JIKA SUDAH ADA STATUS HARI INI (HADIR/SAKIT/IZIN)
    if (attendance) {
      if (attendance.status === "Sakit") {
        return NextResponse.json({ action: "attendance_failed", message: "Status: SAKIT" }, { status: 200 });
      } else if (attendance.status === "Izin") {
        return NextResponse.json({ action: "attendance_failed", message: "Status: IZIN" }, { status: 200 });
      } else {
        return NextResponse.json({ action: "already_attended", name: student.name, duration: 3, open_door: true }, { status: 200 });
      }
    }

    // 6. JIKA BELUM ADA ABSENSI SAMA SEKALI HARI INI, BUAT BARU (HADIR)
    const { error: insertError } = await supabase.from("attendance").insert([
      { student_id: student.id, status: "Hadir" }
    ]);

    if (insertError) {
      console.error("DB Error (Insert Attendance):", insertError);
      return NextResponse.json({ action: "attendance_failed", message: "Gagal Absen" }, { status: 500 });
    }

    return NextResponse.json({ action: "attendance_success", name: student.name, duration: 5 }, { status: 200 });

  } catch (error: any) {
    console.error("Server Catch Error:", error);
    return NextResponse.json({ action: "attendance_failed", message: "Server Error" }, { status: 500 });
  }
}