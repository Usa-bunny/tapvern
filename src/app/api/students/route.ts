import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: NextRequest) {
  try {
    const { rfid_uid, name } = await req.json();

    if (!rfid_uid || !name) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { error } = await supabase
      .from('students')
      .insert([{ rfid_uid, name }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal simpan siswa:", error);
    return NextResponse.json({ error: "Gagal menyimpan data siswa" }, { status: 500 });
  }
}