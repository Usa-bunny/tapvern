import { Download } from "lucide-react";

interface HeaderProps {
  onExportClick: () => void;
}

export const Header = ({ onExportClick }: HeaderProps) => {
  const todayFormatted = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div className="bg-primary text-cream rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden w-full">
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 space-y-2 flex-1">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          TapVern
        </h1>
        <p className="text-emerald-100/80 font-medium text-sm sm:text-base max-w-xl">
          Pantau kehadiran siswa secara real-time dan terintegrasi penuh dengan
          perangkat IoT.
        </p>
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto shrink-0">
        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-5 py-3.5 rounded-2xl flex flex-col items-start md:items-end">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-200">
            TANGGAL
          </span>
          <span className="text-sm sm:text-base font-black text-white mt-0.5">
            {todayFormatted}
          </span>
        </div>

        <button
          onClick={onExportClick}
          className="bg-white hover:bg-emerald-50 text-primary px-6 py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm tracking-wide shrink-0"
        >
          <Download className="w-5 h-5 text-emerald-600" />
          Export Laporan
        </button>
      </div>
    </div>
  );
};
