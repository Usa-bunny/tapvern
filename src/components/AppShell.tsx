"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, name")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
          setUserName(profile.name);
        }
      } else {
        setUserRole(null);
        setUserName("");
      }
      setLoading(false);
    };
    checkUser();
  }, [pathname]);

  const handleAccountNavigation = () => {
    if (loading) return;
    if (!userRole) {
      router.push("/login");
    } else if (userRole === "admin") {
      router.push("/admin");
    } else if (userRole === "parent") {
      router.push("/parent");
    }
  };

  const isHome = pathname === "/";
  const isAccountActive =
    pathname === "/login" || pathname === "/admin" || pathname === "/parent";

  return (
    <div className="min-h-screen bg-cream text-primary flex flex-col sm:flex-row font-sans selection:bg-emerald-200">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden sm:flex flex-col w-72 bg-primary text-cream p-6 justify-between shrink-0 sticky top-0 h-screen shadow-xl">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <img src="/icon.png" alt="" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-tight text-white">
                TapVern
              </h1>
              <p className="text-[10px] font-bold text-emerald-300/80 tracking-widest uppercase">
                IoT Attendance
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                isHome
                  ? "bg-white text-primary shadow-md shadow-black/10"
                  : "text-[#D4CDBA] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Portal Beranda
            </button>

            <button
              onClick={handleAccountNavigation}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                isAccountActive
                  ? "bg-white text-primary shadow-md shadow-black/10"
                  : "text-[#D4CDBA] hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              {!userRole
                ? "Masuk / Login"
                : userRole === "admin"
                  ? "Admin Console"
                  : "Dashboard Wali"}
            </button>
          </nav>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
            Status Sesi
          </p>
          <p className="text-xs font-bold text-white truncate">
            {userName || (userRole ? userRole.toUpperCase() : "Tamu / Publik")}
          </p>
        </div>
      </aside>

      {/* ================= MAIN CONTENT CONTAINER ================= */}
      <main className="flex-1 pb-24 sm:pb-0 overflow-x-hidden min-h-screen flex flex-col">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 md:p-10 flex-1 flex flex-col">
          {children}
        </div>
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION (APP STYLE) ================= */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:hidden">
        <div className="bg-primary/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-8 py-3.5 flex justify-around items-center max-w-sm mx-auto text-cream">
          <button
            onClick={() => router.push("/")}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              isHome
                ? "text-white scale-110 font-bold"
                : "text-[#D4CDBA] hover:text-white"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isHome ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] tracking-tight">Beranda</span>
          </button>

          <div className="w-px h-6 bg-white/20"></div>

          <button
            onClick={handleAccountNavigation}
            className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
              isAccountActive
                ? "text-white scale-110 font-bold"
                : "text-[#D4CDBA] hover:text-white"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isAccountActive ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-[10px] tracking-tight">
              {!userRole ? "Masuk" : userRole === "admin" ? "Admin" : "Wali"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
