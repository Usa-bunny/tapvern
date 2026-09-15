import { useState, useMemo } from "react";
import {
  AttendanceRecord,
  DeviceCommand,
  TempScan,
  ParentProfile,
} from "@/types/admin";

interface Props {
  attendances: AttendanceRecord[];
  commands: DeviceCommand[];
  scans: TempScan[];
  parents: ParentProfile[];
}

export const ActivityTabs = ({
  attendances,
  commands,
  scans,
  parents,
}: Props) => {
  const [activeTab, setActiveTab] = useState<
    "attendance" | "parents" | "commands"
  >("attendance");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAttendances = useMemo(() => {
    return attendances.filter((a) =>
      a.students?.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [attendances, searchQuery]);

  const filteredParents = useMemo(() => {
    return parents.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [parents, searchQuery]);

  return (
    <div className="bg-white rounded-4xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-150">
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "attendance" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Absensi Masuk
        </button>
        <button
          onClick={() => setActiveTab("parents")}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "parents" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Data Akun Wali
        </button>
        <button
          onClick={() => setActiveTab("commands")}
          className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === "commands" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          Log Perangkat
        </button>
      </div>

      {(activeTab === "attendance" || activeTab === "parents") && (
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <input
            type="text"
            placeholder={`Cari data ${activeTab === "attendance" ? "absensi" : "wali"}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-2 border-gray-300 p-2.5 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-blue-600 placeholder:text-gray-500"
          />
        </div>
      )}

      <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
        {activeTab === "attendance" && (
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-50">
              {filteredAttendances.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/80">
                  <td className="p-3 text-sm text-gray-500 font-medium">
                    {new Date(log.created_at).toLocaleTimeString("id-ID")}
                  </td>
                  <td className="p-3 font-bold text-gray-900">
                    {log.students?.name || "Unknown"}
                  </td>
                  <td className="p-3">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-100">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "parents" && (
          <div className="space-y-3">
            {filteredParents.map((parent) => (
              <div
                key={parent.id}
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1"
              >
                <span className="font-bold text-gray-900">{parent.name}</span>
                <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                  {parent.email.split("@")[0]}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === "commands" && (
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-50">
              {commands.map((cmd) => (
                <tr key={cmd.id} className="hover:bg-gray-50/80">
                  <td className="p-3 text-sm text-gray-500 font-medium">
                    {new Date(cmd.created_at).toLocaleTimeString("id-ID")}
                  </td>
                  <td className="p-3 font-bold text-gray-900 uppercase text-xs">
                    {cmd.action}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold border ${cmd.status === "executed" || cmd.status === "executed_via_mqtt" ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-yellow-50 text-yellow-700 border-yellow-100"}`}
                    >
                      {cmd.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
