"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface User {
  name: string;
  rfid_uid: string;
}

interface AttendanceRecord {
  id: number;
  created_at: string;
  status: string;
  users: User;
}

export default function AdminDashboard() {
  const [newUid, setNewUid] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // State Baru untuk Fitur UI
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [doorDuration, setDoorDuration] = useState<number>(5);

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchTodayAttendance = async () => {
    setIsLoading(true);
    const today = new Date()
      .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
      .split(" ")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select(`id, created_at, status, users (name, rfid_uid)`)
      .gte("created_at", `${today}T00:00:00+07:00`)
      .order("created_at", { ascending: false });

    if (!error && data) setAttendances(data as unknown as AttendanceRecord[]);
    setIsLoading(false);
  };

  const toggleRegisterMode = async () => {
    const targetMode = !isRegisterMode;
    const action = targetMode ? "register_mode" : "normal_mode";

    setIsRegisterMode(targetMode);

    await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    if (!targetMode) setNewUid(null); // Tutup form jika mode dimatikan
    showToast(targetMode ? "Mode Daftar Aktif" : "Kembali ke Mode Normal");
  };

  const openDoorCustom = async () => {
    await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open_door", duration: doorDuration }),
    });
    showToast(`Pintu dibuka selama ${doorDuration} detik`);
  };

  const saveNewUser = async () => {
    if (!inputName.trim() || !newUid)
      return showToast("Nama tidak boleh kosong!", true);
    setIsRegistering(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfid_uid: newUid, name: inputName }),
    });

    setIsRegistering(false);

    if (!res.ok) {
      showToast("Gagal menyimpan data.", true);
    } else {
      showToast(`Berhasil mendaftarkan: ${inputName}`);
      setNewUid(null);
      setIsRegisterMode(false); // Matikan toggle UI

      // UBAH DISINI: Kirim MQTT register_success ke ESP32 + Nama
      await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register_success",
          name: inputName, // Nama akan muncul di LCD ESP32
        }),
      });

      setInputName("");
    }
  };

  const showToast = (msg: string, isError = false) => {
    setToastMessage(`${isError ? "❌" : "✅"} ${msg}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    fetchTodayAttendance();

    // Pastikan Realtime diaktifkan di dashboard Supabase untuk tabel ini!
    const scanChannel = supabase
      .channel("listen_scans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temp_scans" },
        (payload: any) => {
          if (payload.new && payload.new.uid) {
            setNewUid(payload.new.uid);
          }
        },
      )
      .subscribe();

    const attendanceChannel = supabase
      .channel("listen_attendance")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        () => fetchTodayAttendance(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scanChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans relative">
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50">
          {toastMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              TapVern Console
            </h1>
            <p className="text-gray-500 text-sm mt-1">Kontrol Akses Terpusat</p>
          </div>

          <div className="flex gap-6 items-center">
            {/* Toggle Switch Register Mode */}
            <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-lg">
              <span
                className={`text-sm font-medium ${isRegisterMode ? "text-blue-600" : "text-gray-500"}`}
              >
                {isRegisterMode ? "Mode Pendaftaran Aktif" : "Mode Normal"}
              </span>
              <button
                onClick={toggleRegisterMode}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isRegisterMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isRegisterMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Custom Door Controller */}
            <div className="flex items-center gap-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
              <input
                type="number"
                value={doorDuration}
                onChange={(e) => setDoorDuration(Number(e.target.value))}
                className="w-16 px-2 py-1.5 border border-emerald-300 rounded text-center"
                min="1"
                max="60"
              />
              <span className="text-sm text-emerald-800 font-medium mr-2">
                Detik
              </span>
              <button
                onClick={openDoorCustom}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-md font-medium shadow-sm transition-colors"
              >
                🚪 Buka
              </button>
            </div>
          </div>
        </header>

        {newUid && isRegisterMode && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm flex items-start gap-6 animate-pulse">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-900 mb-4">
                Mendaftarkan Kartu Baru
              </h2>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-blue-700 font-medium">
                  UID Terdeteksi:
                </span>
                <span className="font-mono bg-blue-200 px-3 py-1 rounded-md text-blue-900 tracking-widest">
                  {newUid}
                </span>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Masukkan Nama Lengkap..."
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={saveNewUser}
                  disabled={isRegistering}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-2 rounded-lg font-medium transition-colors"
                >
                  {isRegistering ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABEL ABSENSI HARI INI (Sama seperti sebelumnya) */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Log Absensi Hari Ini
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-4 font-medium rounded-tl-lg">Waktu</th>
                  <th className="p-4 font-medium">Nama</th>
                  <th className="p-4 font-medium">UID Kartu</th>
                  <th className="p-4 font-medium rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      Memuat data...
                    </td>
                  </tr>
                ) : (
                  attendances.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="p-4 text-gray-600 text-sm">
                        {new Date(log.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}{" "}
                        WIB
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {log.users?.name || "-"}
                      </td>
                      <td className="p-4 text-sm font-mono text-gray-500">
                        {log.users?.rfid_uid || "-"}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
