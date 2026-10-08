"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface Props {
  childId: string;
  childName: string;
  onClose: () => void;
  onSubmit: (
    childId: string,
    status: string,
    date: string,
    notes: string,
  ) => Promise<void>;
}

export const LeaveModal = ({
  childId,
  childName,
  onClose,
  onSubmit,
}: Props) => {
  const todayStr = new Date()
    .toLocaleString("sv-SE", { timeZone: "Asia/Jakarta" })
    .split(" ")[0];
  const [status, setStatus] = useState("Sakit");
  const [date, setDate] = useState(todayStr);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit(childId, status, date, notes);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-cream-card rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-white/20 flex flex-col gap-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-primary">
              Pengajuan Izin / Sakit
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              Siswa: {childName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-full transition-colors font-bold cursor-pointer"
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-primary mb-2 uppercase tracking-wider">
              Status Ketidakhadiran
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("Sakit")}
                className={`py-3.5 rounded-2xl font-black text-xs border-2 transition-all cursor-pointer ${
                  status === "Sakit"
                    ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                Sakit
              </button>
              <button
                type="button"
                onClick={() => setStatus("Izin")}
                className={`py-3.5 rounded-2xl font-black text-xs border-2 transition-all cursor-pointer ${
                  status === "Izin"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                }`}
              >
                Izin
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-primary mb-2 uppercase tracking-wider">
              Tanggal Ketidakhadiran
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 p-4 rounded-2xl text-sm font-bold text-primary outline-none focus:border-[#223024] transition-all shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-primary mb-2 uppercase tracking-wider">
              Keterangan / Alasan
            </label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tuliskan keterangan secara lengkap..."
              className="w-full bg-white border-2 border-gray-200 p-4 rounded-2xl text-sm font-bold text-primary outline-none focus:border-[#223024] transition-all shadow-sm placeholder:text-gray-400 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-[#172118] text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-lg shadow-primary/30 transition-all disabled:opacity-70 disabled:animate-pulse cursor-pointer mt-2"
          >
            {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
          </button>
        </form>
      </div>
    </div>
  );
};
