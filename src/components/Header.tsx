export const Header = () => {
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="relative overflow-hidden bg-linear-to-br from-blue-700 via-indigo-800 to-blue-900 rounded-3xl p-8 md:p-10 text-white shadow-xl">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400 opacity-10 blur-3xl"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold tracking-wider uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sistem Aktif
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Portal Absensi</h1>
          <p className="text-blue-200 text-lg max-w-xl">
            Pantau kehadiran siswa secara real-time dan terintegrasi penuh dengan perangkat IoT.
          </p>
        </div>
        <div className="bg-white/10 px-8 py-4 rounded-2xl border border-white/20 backdrop-blur-md text-center shrink-0">
          <p className="text-xs text-blue-200 uppercase tracking-widest font-bold mb-1">Tanggal Hari Ini</p>
          <p className="text-2xl font-bold">{today}</p>
        </div>
      </div>
    </header>
  );
};