import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: command, error } = await supabase
      .from('device_commands')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !command) {
      return NextResponse.json({ has_command: false });
    }

    await supabase
      .from('device_commands')
      .update({ status: 'executed' })
      .eq('id', command.id);

    // Bersihkan antrean yang sudah usang agar ESP32 tidak bingung
    await supabase
      .from('device_commands')
      .update({ status: 'expired' })
      .eq('status', 'pending');

    return NextResponse.json({
      has_command: true,
      command: {
        action: command.action,
        // Kirimkan durasi dari database jika ada, default 5 detik
        duration: command.duration || 5 
      }
    });

  } catch (error) {
    return NextResponse.json({ has_command: false });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, duration } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('device_commands')
      .insert([{ 
        action: action, 
        duration: duration || 5, // Simpan durasi ke tabel
        status: 'pending' 
      }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Command queued" });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}