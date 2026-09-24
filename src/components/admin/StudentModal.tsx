"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Student, ParentProfile } from "@/types/admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Props {
  student: Student;
  parents: ParentProfile[];
  onClose: () => void;
  onSubmit: (studentData: any, parentAction: any) => Promise<void>;
}

export const StudentModal = ({
  student,
  parents,
  onClose,
  onSubmit,
}: Props) => {
  const [formData, setFormData] = useState({
    id: student.id,
    rfid_uid: student.rfid_uid,
    name: student.name === "Kartu Baru" ? "" : student.name,
    nisn: student.nisn || "",
    gender: student.gender || "",
    class_name: student.class_name || "",
    domicile: student.domicile || "",
  });

  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [parentMode, setParentMode] = useState<
    "none" | "new" | "link" | "edit" | "unlink"
  >(student.parent_id ? "edit" : "none");
  const [parentUsername, setParentUsername] = useState(
    student.profiles?.email?.split("@")[0] || "",
  );
  const [parentName, setParentName] = useState(student.profiles?.name || "");
  const [parentPassword, setParentPassword] = useState("");
  const [selectedParentId, setSelectedParentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .order("name", { ascending: true });
      if (data) setClasses(data);
    };
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isComplete = Boolean(
      formData.name &&
      formData.nisn &&
      formData.gender &&
      formData.class_name &&
      formData.domicile,
    );

    let parentAction = null;
    if (parentMode === "new")
      parentAction = {
        type: "create",
        name: parentName,
        username: parentUsername,
        password: parentPassword,
      };
    else if (parentMode === "link")
      parentAction = { type: "link", id: selectedParentId };
    else if (parentMode === "edit")
      parentAction = {
        type: "update",
        id: student.parent_id,
        name: parentName,
        username: parentUsername,
        password: parentPassword,
      };
    else if (parentMode === "unlink") parentAction = { type: "unlink" };

    await onSubmit({ ...formData, is_draft: !isComplete }, parentAction);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex sm:items-center sm:justify-center z-50 overflow-y-auto">
      <div className="bg-cream-card min-h-screen sm:min-h-0 sm:rounded-[2.5rem] p-6 sm:p-8 w-full sm:max-w-3xl shadow-2xl overflow-y-auto max-h-none sm:max-h-[90vh] flex flex-col gap-6 custom-scrollbar border border-white/20 pb-36 sm:pb-8">
        <div className="flex justify-between items-start pb-4 border-b border-gray-200 sticky top-0 bg-cream-card z-10 pt-2 sm:pt-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              Data Siswa
            </h2>
            <div className="mt-2 text-xs bg-emerald-50 text-primary px-3.5 py-1.5 rounded-xl font-mono font-black border border-emerald-200 w-fit">
              UID: {formData.rfid_uid}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-full transition-colors font-bold cursor-pointer"
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
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded-3xl border border-gray-200/60 shadow-xs">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-primary">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] font-bold text-primary text-sm shadow-sm"
                placeholder="Nama lengkap siswa..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-primary">
                NISN
              </label>
              <input
                type="text"
                required
                value={formData.nisn}
                onChange={(e) =>
                  setFormData({ ...formData, nisn: e.target.value })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] text-primary font-bold text-sm shadow-sm"
                placeholder="Nomor NISN..."
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-primary">
                Jenis Kelamin
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] text-primary font-bold text-sm shadow-sm cursor-pointer"
              >
                <option value="">Pilih Jenis Kelamin...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-primary">
                Kelas
              </label>
              <select
                value={formData.class_name}
                onChange={(e) =>
                  setFormData({ ...formData, class_name: e.target.value })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] text-primary font-bold text-sm shadow-sm cursor-pointer"
              >
                <option value="">Pilih Kelas...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-primary">
                Domisili / Alamat
              </label>
              <input
                type="text"
                required
                value={formData.domicile}
                onChange={(e) =>
                  setFormData({ ...formData, domicile: e.target.value })
                }
                className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] text-primary font-bold text-sm shadow-sm"
                placeholder="Kota / Domisili..."
              />
            </div>
          </div>

          <div className="border-2 border-emerald-900/10 rounded-3xl overflow-hidden shadow-xs bg-white">
            <div className="bg-primary p-4 sm:p-5 flex flex-wrap justify-between items-center gap-4 text-white">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-xs uppercase tracking-wider mr-2 text-emerald-300">
                  Akun Wali:
                </span>
                {!student.parent_id && (
                  <>
                    <button
                      type="button"
                      onClick={() => setParentMode("none")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${parentMode === "none" ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                      Lewati
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentMode("new")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${parentMode === "new" ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                      Buat Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setParentMode("link")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${parentMode === "link" ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"}`}
                    >
                      Tautkan
                    </button>
                  </>
                )}
                {student.parent_id && parentMode !== "unlink" && (
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-xl text-xs font-black">
                    Terhubung
                  </span>
                )}
                {parentMode === "unlink" && (
                  <span className="bg-rose-500 text-white px-3 py-1 rounded-xl text-xs font-black">
                    Putus Tautan (Pending)
                  </span>
                )}
              </div>

              {student.parent_id && parentMode === "edit" && (
                <button
                  type="button"
                  onClick={() => setParentMode("unlink")}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-400/30 hover:bg-rose-500/30 transition-all cursor-pointer"
                >
                  Putus Tautan
                </button>
              )}
              {student.parent_id && parentMode === "unlink" && (
                <button
                  type="button"
                  onClick={() => setParentMode("edit")}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  Batal Putus
                </button>
              )}
            </div>

            <div className="p-5 bg-white">
              {parentMode === "none" && (
                <p className="text-sm text-gray-500 font-semibold">
                  Tidak ada aksi untuk akun wali.
                </p>
              )}
              {parentMode === "unlink" && (
                <p className="text-sm text-rose-600 font-bold">
                  Akun wali akan diputuskan dari siswa ini setelah Anda menekan
                  tombol simpan.
                </p>
              )}

              {parentMode === "link" && (
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl outline-none focus:border-[#223024] text-primary font-bold text-sm cursor-pointer"
                >
                  <option value="">Pilih Akun Wali Tersedia...</option>
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (@{p.email.split("@")[0]})
                    </option>
                  ))}
                </select>
              )}

              {(parentMode === "new" || parentMode === "edit") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-black text-primary mb-1 uppercase tracking-wider">
                      Nama Lengkap Wali
                    </label>
                    <input
                      type="text"
                      required
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#223024] text-primary shadow-sm"
                      placeholder="Nama Lengkap Wali"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-primary mb-1 uppercase tracking-wider">
                      Username Login
                    </label>
                    <input
                      type="text"
                      required
                      value={parentUsername}
                      onChange={(e) => setParentUsername(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#223024] text-primary shadow-sm"
                      placeholder="Username Wali"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-primary mb-1 uppercase tracking-wider">
                      Password
                    </label>
                    <input
                      type="password"
                      required={parentMode === "new"}
                      minLength={6}
                      value={parentPassword}
                      onChange={(e) => setParentPassword(e.target.value)}
                      className="w-full bg-gray-50 border-2 border-gray-200 p-3.5 rounded-2xl text-sm font-bold outline-none focus:border-[#223024] text-primary shadow-sm"
                      placeholder={
                        parentMode === "edit"
                          ? "Kosongkan jika tak diubah"
                          : "Password (Min 6)"
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm tracking-wide hover:bg-[#172118] transition-all shadow-lg shadow-primary/20 disabled:opacity-70 disabled:animate-pulse cursor-pointer"
          >
            {isSubmitting ? "Menyimpan Data..." : "Simpan Data Siswa"}
          </button>
        </form>
      </div>
    </div>
  );
};
