"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// 1. KONFIGURASI SUPABASE
// ============================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// 2. DEFINISI TYPESCRIPT INTERFACES
// ============================================================================
interface User {
  name: string;
  rfid_uid: string;
}

interface AttendanceRecord {
  id: number;
  created_at: string;
  status: string;
  users: User; // Hasil relasi JOIN ke tabel users
}

// ============================================================================
// 3. KOMPONEN UTAMA DASHBOARD
// ============================================================================
export default function AdminDashboard() {
  // State untuk Registrasi Kartu Baru
  const [newUid, setNewUid] = useState<string | null>(null);
  const [inputName, setInputName] = useState<string>("");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  // State untuk Data Absensi Hari Ini
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // State untuk Notifikasi UI
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ==========================================================================
  // FUNGSI: Mengambil Data Absensi Hari Ini
  // ==========================================================================
  const fetchTodayAttendance = async () => {
    setIsLoading(true);
    const today = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" }).split(" ")[0];

    const { data, error } = await supabase
      .from("attendance")
      .select(`
        id, created_at, status,
        users (name, rfid_uid)
      `)
      .gte("created_at", `${today}T00:00:00+07:00`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Cast data ke tipe AttendanceRecord[]
      setAttendances(data as unknown as AttendanceRecord[]);
    }
    setIsLoading(false);
  };

  // ==========================================================================
  // FUNGSI: Mengirim Perintah ke ESP32 (API Route)
  // ==========================================================================
  const sendDeviceCommand = async (action: "register_mode" | "open_door") => {
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (res.ok) {
        showToast(action === "register_mode" ? "Mode Daftar diaktifkan. Silakan tap kartu!" : "Pintu berhasil dibuka!");
      } else {
        showToast("Gagal mengirim perintah ke alat.", true);
      }
    } catch (error) {
      showToast("Terjadi kesalahan jaringan.", true);
    }
  };

  // ==========================================================================
  // FUNGSI: Menyimpan User Baru ke Database
  // ==========================================================================
  const saveNewUser = async () => {
    if (!inputName.trim() || !newUid) return showToast("Nama tidak boleh kosong!", true);
    
    setIsRegistering(true);
    const { error } = await supabase
      .from("users")
      .insert([{ rfid_uid: newUid, name: inputName }]);

    setIsRegistering(false);

    if (error) {
      showToast("Gagal menyimpan data. Mungkin UID sudah ada.", true);
    } else {
      showToast(`Berhasil mendaftarkan: ${inputName}`);
      setNewUid(null); // Tutup popup
      setInputName("");
    }
  };

  // Helper untuk Toast Notification
  const showToast = (msg: string, isError = false) => {
    setToastMessage(`${isError ? "❌" : "✅"} ${msg}`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // ==========================================================================
  // EFEK: Realtime Listener (WebSockets)
  // ==========================================================================
// ==========================================================================
  // EFEK: Realtime Listener (WebSockets)
  // ==========================================================================
  useEffect(() => {
    fetchTodayAttendance();

    // 1. Listener untuk Kartu Baru (Saat Mode Register)
    // Menggunakan event "*" karena Upsert memicu INSERT atau UPDATE
    const scanChannel = supabase
      .channel("listen_scans")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "temp_scans" },
        (payload: any) => { // Tipe payload ditambahkan secara eksplisit
          // Pastikan properti 'new' dan 'uid' ada (mencegah error saat event DELETE)
          if (payload.new && payload.new.uid) {
            setNewUid(payload.new.uid);
          }
        }
      )
      .subscribe();

    // 2. Listener untuk Absensi Masuk (Auto-Update Tabel)
    const attendanceChannel = supabase
      .channel("listen_attendance")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance" },
        (payload: any) => { // Tipe payload ditambahkan secara eksplisit
          // Refresh tabel absensi saat ada absen masuk
          fetchTodayAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(scanChannel);
      supabase.removeChannel(attendanceChannel);
    };
  }, []);

  // ==========================================================================
  // RENDER UI TAMPILAN
  // ==========================================================================
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-bounce">
          {toastMessage}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TapVern Console</h1>
            <p className="text-gray-500 text-sm mt-1">Sistem Absensi & Kontrol Akses Cerdas</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => sendDeviceCommand("register_mode")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
            >
              ➕ Mode Daftar Kartu
            </button>
            <button 
              onClick={() => sendDeviceCommand("open_door")}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
            >
              🚪 Buka Pintu
            </button>
          </div>
        </header>

        {/* POPUP REGISTRASI CARD (Muncul otomatis saat ESP32 kirim UID baru) */}
        {newUid && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-sm flex items-start gap-6 animate-pulse">
            <div className="bg-blue-600 text-white p-4 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-900">Kartu Baru Terdeteksi!</h2>
              <p className="text-blue-700 text-sm mb-4">
                UID Kartu: <span className="font-mono bg-blue-200 px-2 py-0.5 rounded text-blue-900">{newUid}</span>
              </p>
              
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Masukkan Nama Lengkap Siswa" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="flex-1 border border-blue-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  onClick={saveNewUser}
                  disabled={isRegistering}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
                >
                  {isRegistering ? "Menyimpan..." : "Simpan Data"}
                </button>
                <button 
                  onClick={() => setNewUid(null)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TABEL ABSENSI HARI INI */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Log Absensi Hari Ini</h2>
            <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
              Real-time Terhubung 🟢
            </span>
          </div>

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
                    <td colSpan={4} className="p-8 text-center text-gray-400">Memuat data...</td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">Belum ada data absensi hari ini.</td>
                  </tr>
                ) : (
                  attendances.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-gray-600 text-sm">
                        {new Date(log.created_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })} WIB
                      </td>
                      <td className="p-4 font-medium text-gray-900">{log.users?.name || "Tidak Diketahui"}</td>
                      <td className="p-4 text-sm font-mono text-gray-500">{log.users?.rfid_uid || "-"}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
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