import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event, uid } = body;

    if (!uid) {
      return NextResponse.json({ action: "attendance_failed", message: "UID Kosong" });
    }

    // --- SKENARIO ABSEN ---
    if (event === "rfid_scan") {
      // 1. Cari di tabel 'students' (bukan 'users' lagi)
      const { data: student, error: studentError } = await supabase
        .from("students") 
        .select("*")
        .eq("rfid_uid", uid)
        .single();

      if (studentError || !student) {
        return NextResponse.json({ action: "attendance_failed", message: "Tdk Terdaftar" });
      }

      const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];

      // 2. Cek apakah sudah absen hari ini
      const { data: history } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", student.id) // Ubah user_id jadi student_id
        .gte("created_at", `${today}T00:00:00+07:00`)
        .limit(1);

      if (history && history.length > 0) {
        return NextResponse.json({ action: "already_attended", name: student.name, open_door: true, duration: 3 });
      }

      // 3. Masukkan data absen
      await supabase
        .from("attendance")
        .insert([{ student_id: student.id, status: "Hadir" }]); // Ubah user_id jadi student_id

      return NextResponse.json({ action: "attendance_success", name: student.name, duration: 5 });
    } 
    
    // --- SKENARIO PENDAFTARAN KARTU BARU ---
    else if (event === "register_card") {
      // 1. Pastikan kartu belum dipakai siswa lain di tabel 'students'
      const { data: existingUser } = await supabase
        .from("students")
        .select("id")
        .eq("rfid_uid", uid)
        .single();

      if (existingUser) {
        return NextResponse.json({ action: "register_failed", message: "UID Terpakai" });
      }

      // 2. Kirim ke ruang tunggu temp_scans
      await supabase.from("temp_scans").upsert({ id: 1, uid: uid });

      // 3. Suruh ESP32 menunggu admin isi form
      return NextResponse.json({ action: "waiting_registration", name: "Silakan isi Web" });
    }

    return NextResponse.json({ action: "attendance_failed", message: "Event Invalid" });
  } catch (error) {
    console.error("API Scan Error:", error);
    return NextResponse.json({ action: "attendance_failed", message: "Server Error" }, { status: 500 });
  }
}