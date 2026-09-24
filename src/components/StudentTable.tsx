import { ProcessedStudent, SortConfig } from "@/types";

interface StudentTableProps {
  data: ProcessedStudent[];
  sortConfig: SortConfig | null;
  onSort: (key: keyof ProcessedStudent) => void;
}

export const StudentTable = ({ data, sortConfig, onSort }: StudentTableProps) => {
  const renderSortIcon = (key: keyof ProcessedStudent) => {
    if (sortConfig?.key !== key) {
      return <span className="ml-2 text-gray-300">↕</span>;
    }
    return sortConfig.direction === "asc" 
      ? <span className="ml-2 text-blue-600 font-bold">↑</span> 
      : <span className="ml-2 text-blue-600 font-bold">↓</span>;
  };

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900">Data Tidak Ditemukan</h3>
        <p className="text-gray-500 mt-1">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
              <th className="p-5 font-bold cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort("name")}>
                Nama Siswa {renderSortIcon("name")}
              </th>
              <th className="p-5 font-bold text-center">Kelas</th>
              <th className="p-5 font-bold text-center">Domisili</th>
              <th className="p-5 font-bold text-center">Status Kehadiran</th>
              <th className="p-5 font-bold text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => onSort("rawTime")}>
                Waktu Masuk {renderSortIcon("rawTime")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((student) => (
              <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group">
                <td className="p-5">
                  <p className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{student.name}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">NISN: {student.nisn || "Belum diisi"}</p>
                </td>
                <td className="p-5 text-center">
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {student.class_name || "-"}
                  </span>
                </td>
                <td className="p-5 text-center text-gray-600 text-sm font-medium">
                  {student.domicile || "-"}
                </td>
                <td className="p-5 text-center">
                  {!student.status ? (
                    <span className="bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full text-sm font-bold border border-rose-100 shadow-sm">
                      Belum Absen
                    </span>
                  ) : student.status === "Hadir" ? (
                    <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-200 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Hadir
                    </span>
                  ) : student.status === "Sakit" ? (
                    <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-bold border border-amber-200 shadow-sm">
                      Sakit
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-200 shadow-sm">
                      Izin
                    </span>
                  )}
                </td>
                <td className="p-5 text-center">
                  <span className={`font-bold ${student.isPresent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {student.time !== "-" ? `${student.time} WIB` : "-"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};