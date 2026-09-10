import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET: Dipanggil oleh ESP32 setiap 3 detik
export async function GET() {
  try {
    // Hanya ambil perintah yang dibuat maksimal 1 menit yang lalu
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();

    const { data: command, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', oneMinuteAgo) 
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !command) {
      return NextResponse.json({ has_command: false });
    }

    await supabase
      .from('device_commands')
      .update({ status: 'executed' })
      .eq('id', command.id);

    return NextResponse.json({
      has_command: true,
      command: {
        action: command.action, // contoh: "open_door" atau "register_mode"
        duration: 5
      }
    });

  } catch (error) {
    return NextResponse.json({ has_command: false });
  }
}

// POST: Dipanggil dari tombol Dashboard Web (contoh: onClick Buka Pintu)
export async function POST(req) {
  try {
    const { action } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('device_commands')
      .insert([{ action: action, status: 'pending' }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Command queued" });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}