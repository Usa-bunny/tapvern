import { ProcessedStudent, SortConfig } from "@/types";
import { Ban } from "lucide-react";

interface StudentTableProps {
  data: ProcessedStudent[];
  sortConfig: SortConfig | null;
  onSort: (key: keyof ProcessedStudent) => void;
}

export const StudentTable = ({
  data,
  sortConfig,
  onSort,
}: StudentTableProps) => {
  const renderSortIcon = (key: keyof ProcessedStudent) => {
    if (sortConfig?.key !== key)
      return <span className="ml-1 text-gray-300">↕</span>;
    return sortConfig.direction === "asc" ? (
      <span className="ml-1 text-primary font-black">↑</span>
    ) : (
      <span className="ml-1 text-primary font-black">↓</span>
    );
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-200/80 p-16 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
          <Ban className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-primary">
          Data Tidak Ditemukan
        </h3>
        <p className="text-gray-500 text-xs mt-1">
          Coba sesuaikan kata kunci atau filter pencarian Anda.
        </p>
      </div>
    );
  }

  const renderStatusBadge = (status: string | null, isPresent: boolean) => {
    if (!status) {
      return (
        <span className="inline-block bg-rose-50 text-rose-700 px-3 py-1 rounded-xl text-[10px] font-black border border-rose-200">
          Belum Absen
        </span>
      );
    }
    if (status === "Hadir") {
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-xl text-[10px] font-black border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
          Hadir
        </span>
      );
    }
    if (status === "Sakit")
      return (
        <span className="inline-block bg-amber-50 text-amber-800 px-3 py-1 rounded-xl text-[10px] font-black border border-amber-200">
          Sakit
        </span>
      );
    if (status === "Libur")
      return (
        <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-[10px] font-black border border-gray-200">
          Libur
        </span>
      );
    return (
      <span className="inline-block bg-blue-50 text-blue-800 px-3 py-1 rounded-xl text-[10px] font-black border border-blue-200">
        Izin
      </span>
    );
  };

  return (
    <>
      {/* MOBILE CARD VIEW (Tampil di layar kecil agar tidak berantakan) */}
      <div className="block sm:hidden space-y-3">
        {data.map((student) => (
          <div
            key={student.id}
            className="bg-white p-4 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col gap-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-black text-sm text-primary">
                  {student.name}
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  NISN: {student.nisn || "-"}
                </p>
              </div>
              {renderStatusBadge(student.status, student.isPresent)}
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
              <div className="flex gap-2">
                <span className="bg-gray-100 text-primary px-2.5 py-1 rounded-lg font-bold">
                  {student.class_name || "-"}
                </span>
                <span className="text-gray-500 font-semibold self-center">
                  {student.domicile || "-"}
                </span>
              </div>
              <span
                className={`font-black ${student.isPresent ? "text-primary" : "text-gray-300"}`}
              >
                {student.time !== "-" ? `${student.time} WIB` : "-"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden sm:block bg-white rounded-[2.5rem] shadow-sm border border-gray-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <th
                  className="p-5 font-black cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onSort("name")}
                >
                  Nama Siswa {renderSortIcon("name")}
                </th>
                <th className="p-5 font-black text-center">Kelas</th>
                <th className="p-5 font-black text-center">Domisili</th>
                <th className="p-5 font-black text-center">Status Kehadiran</th>
                <th
                  className="p-5 font-black text-center cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => onSort("rawTime")}
                >
                  Waktu Masuk {renderSortIcon("rawTime")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-emerald-50/30 transition-colors group"
                >
                  <td className="p-5">
                    <p className="font-bold text-primary group-hover:text-emerald-800 transition-colors">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      NISN: {student.nisn || "Belum diisi"}
                    </p>
                  </td>
                  <td className="p-5 text-center">
                    <span className="bg-gray-100 text-primary px-3.5 py-1.5 rounded-full text-xs font-extrabold">
                      {student.class_name || "-"}
                    </span>
                  </td>
                  <td className="p-5 text-center text-gray-600 text-sm font-bold">
                    {student.domicile || "-"}
                  </td>
                  <td className="p-5 text-center">
                    {renderStatusBadge(student.status, student.isPresent)}
                  </td>
                  <td className="p-5 text-center">
                    <span
                      className={`font-black text-sm ${student.isPresent ? "text-primary" : "text-gray-300"}`}
                    >
                      {student.time !== "-" ? `${student.time} WIB` : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
