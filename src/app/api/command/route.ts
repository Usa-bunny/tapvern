import { NextRequest, NextResponse } from "next/server";
import mqtt from "mqtt";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const MQTT_BROKER = process.env.MQTT_BROKER!;
const MQTT_USER = process.env.MQTT_USER!;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD!;
const MQTT_TOPIC = "iot/absensi/command";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, duration, name, message } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 },
      );
    }

    await supabase.from("device_commands").insert([
      {
        action,
        duration: duration || 5,
        status: "executed_via_mqtt",
      },
    ]);

    const payload = JSON.stringify({
      action,
      duration: duration || 5,
      name,
      message,
    });

    const client = mqtt.connect(MQTT_BROKER, {
      username: MQTT_USER,
      password: MQTT_PASSWORD,
    });

    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => {
        client.publish(MQTT_TOPIC, payload, (err) => {
          client.end();
          if (err) reject(err);
          else resolve();
        });
      });

      client.on("error", (err) => {
        client.end();
        reject(err);
      });
    });

    return NextResponse.json({
      success: true,
      message: "Command sent via MQTT",
    });
  } catch (error) {
    console.error("MQTT Publish Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
