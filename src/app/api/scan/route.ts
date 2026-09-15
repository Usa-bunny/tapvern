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
      return NextResponse.json({
        action: "attendance_failed",
        message: "UID Kosong",
      });
    }

    if (event === "rfid_scan") {
      const { data: user, error: userError } = await supabase
        .from("students")
        .select("*")
        .eq("rfid_uid", uid)
        .single();

      if (userError || !user) {
        return NextResponse.json({
          action: "attendance_failed",
          message: "Tdk Terdaftar",
        });
      }

      const today = new Date()
        .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
        .split(" ")[0];

      const { data: history } = await supabase
        .from("attendance")
        .select("id")
        .eq("student_id", user.id)
        .gte("created_at", `${today}T00:00:00+07:00`)
        .limit(1);

      if (history && history.length > 0) {
        return NextResponse.json({
          action: "already_attended",
          name: user.name,
          open_door: true,
          duration: 3,
        });
      }

      await supabase
        .from("attendance")
        .insert([{ student_id: user.id, status: "Hadir" }]);

      return NextResponse.json({
        action: "attendance_success",
        name: user.name,
        duration: 5,
      });
    } else if (event === "register_card") {
      const { data: existingUser } = await supabase
        .from("students")
        .select("id")
        .eq("rfid_uid", uid)
        .single();

      if (existingUser) {
        return NextResponse.json({
          action: "register_failed",
          message: "UID Terpakai",
        });
      }

      await supabase.from("temp_scans").upsert({ id: 1, uid: uid });

      // UBAH DISINI: Jangan balasa register_success!
      return NextResponse.json({
        action: "waiting_registration",
        name: "Silakan isi Web",
      });
    }

    return NextResponse.json({
      action: "attendance_failed",
      message: "Event Invalid",
    });
  } catch (error) {
    console.error("API Scan Error:", error);
    return NextResponse.json(
      { action: "attendance_failed", message: "Server Error" },
      { status: 500 },
    );
  }
}
