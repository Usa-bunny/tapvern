"use client";

import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const formatUsernameToEmail = (username: string) => {
  return username.includes("@")
    ? username
    : `${username.toLowerCase().replace(/\s/g, "")}@tapvern.local`;
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkActiveSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin") {
          router.replace("/admin");
        } else if (profile?.role === "parent") {
          router.replace("/parent");
        }
      } else {
        setCheckingAuth(false);
      }
    };
    checkActiveSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const email = formatUsernameToEmail(username);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profil pengguna tidak ditemukan.");
      }

      if (profile.role === "admin") {
        router.push("/admin");
      } else if (profile.role === "parent") {
        router.push("/parent");
      } else {
        throw new Error("Peran akun tidak dikenali.");
      }
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          "Gagal masuk. Periksa kembali username dan password Anda.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-md bg-primary text-cream rounded-[2.5rem] p-6 sm:p-10 shadow-2xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white">
              Selamat Datang!
            </h1>
            <p className="text-xs font-bold text-emerald-100/70">
              Silakan login terlebih dahulu untuk mengakses sistem
            </p>
          </div>

          {errorMessage && (
            <div className="bg-rose-500/20 border border-rose-400/30 text-rose-200 p-4 rounded-2xl text-xs font-bold text-center">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-emerald-200 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full bg-white/10 border-2 border-white/15 px-4 py-3.5 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-400 focus:bg-white/15 transition-all placeholder:text-white/30 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-emerald-200 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border-2 border-white/15 px-4 py-3.5 rounded-2xl text-sm font-bold text-white outline-none focus:border-emerald-400 focus:bg-white/15 transition-all placeholder:text-white/30 shadow-inner"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-emerald-50 text-primary py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-black/20 transition-all disabled:opacity-70 disabled:animate-pulse cursor-pointer mt-4"
            >
              {loading ? "Memproses Masuk..." : "Masuk Sistem"}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => router.push("/")}
              className="text-xs font-extrabold text-emerald-300/70 hover:text-white transition-colors cursor-pointer"
            >
              Kembali ke Portal Beranda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
