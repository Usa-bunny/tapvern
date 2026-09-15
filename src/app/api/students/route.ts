import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Gunakan Service Role Key di Backend!
);

export async function POST(req: NextRequest) {
  try {
    const { rfid_uid, name } = await req.json();

    if (!rfid_uid || !name) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 },
      );
    }

    // Insert user baru ke database
    const { error } = await supabase.from("students").insert([{ rfid_uid, name }]);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal simpan user:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan data user" },
      { status: 500 },
    );
  }
}
