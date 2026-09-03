import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inisialisasi Supabase menggunakan Service Role Key agar bisa bypass RLS jika diperlukan
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    // 1. Ambil data JSON dari body request ESP32
    const body = await req.json();
    const { event, uid } = body;

    // Validasi dasar
    if (!uid) {
      return NextResponse.json({ action: "attendance_failed", message: "UID Kosong" });
    }

    // =========================================================================
    // SKENARIO 1: MODE ABSENSI NORMAL
    // =========================================================================
    if (event === 'rfid_scan') {
      
      // Cari UID di tabel users
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('rfid_uid', uid)
        .single();

      if (userError || !user) {
        // Balasan ini akan membuat ESP32 menyalakan LED Merah & Beep Error
        return NextResponse.json({ action: 'attendance_failed', message: 'Kartu Tdk Dikenal' });
      }

      // Opsional: Cek apakah sudah absen hari ini (WIB - Asia/Jakarta)
      // Ambil tanggal hari ini di zona waktu Indonesia
      const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(' ')[0];
      
      const { data: history } = await supabase
        .from('attendance')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00+07:00`) // Batas awal hari ini (WIB)
        .limit(1);

      if (history && history.length > 0) {
        // Jika sudah absen, tetap buka pintu tapi statusnya "Sudah Absen"
        return NextResponse.json({ 
          action: 'already_attended', 
          name: user.name, 
          open_door: true, 
          duration: 3 
        });
      }

      // Masukkan data absensi baru ke database
      const { error: insertError } = await supabase
        .from('attendance')
        .insert([{ user_id: user.id, status: 'Hadir' }]);

      if (insertError) throw insertError;

      // Balasan ini akan membuat ESP32 membuka Servo 90 derajat selama 5 detik
      return NextResponse.json({ 
        action: 'attendance_success', 
        name: user.name, 
        duration: 5 
      });
    }

    // =========================================================================
    // SKENARIO 2: MODE PENDAFTARAN KARTU BARU
    // =========================================================================
    else if (event === 'register_card') {
      
      // Cek apakah UID sudah dipakai oleh orang lain
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('rfid_uid', uid)
        .single();
      
      if (existingUser) {
        return NextResponse.json({ action: 'register_failed', message: 'UID Sdh Terpakai' });
      }

      // Simpan/Update UID ke tabel temp_scans untuk dibaca oleh Frontend Web
      // Kita asumsikan hanya pakai baris dengan id=1 agar terus tertimpa (overwrite)
      await supabase
        .from('temp_scans')
        .upsert({ id: 1, uid: uid });

      return NextResponse.json({ 
        action: 'register_success', 
        name: 'UID Tersimpan' 
      });
    }

    // Jika event tidak dikenali
    return NextResponse.json({ action: "attendance_failed", message: "Event Invalid" });

  } catch (error) {
    console.error("API /api/scan Error:", error);
    // ESP32 akan membaca ini, tapi kita kasih fallback default
    return NextResponse.json({ action: "attendance_failed", message: "Server Error" }, { status: 500 });
  }
}