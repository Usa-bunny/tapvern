import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// [GET] Dipanggil oleh ESP32 setiap 3 detik
export async function GET() {
  try {
    // 1. Cari 1 perintah tertua yang statusnya masih 'pending'
    const { data: command, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !command) {
      // Tidak ada perintah baru
      return NextResponse.json({ has_command: false });
    }

    // 2. Tandai perintah tersebut sebagai 'executed' agar tidak dieksekusi berulang kali
    await supabase
      .from('device_commands')
      .update({ status: 'executed' })
      .eq('id', command.id);

    // 3. Kirimkan perintah ke ESP32
    // Asumsi di kolom 'action' isinya: "open_door", "register_mode", dsb.
    return NextResponse.json({
      has_command: true,
      command: {
        action: command.action,
        duration: 5
      }
    });

  } catch (error) {
    return NextResponse.json({ has_command: false }, { status: 500 });
  }
}

// [POST] Dipanggil oleh tombol di Frontend Aplikasi (misal tombol "Buka Pintu")
export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Masukkan perintah ke antrean database
    const { error } = await supabase
      .from('device_commands')
      .insert([{ action: action, status: 'pending' }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Command queued" });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}