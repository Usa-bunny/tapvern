import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Student, ParentProfile } from "@/types/admin"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Props {
  student: Student
  parents: ParentProfile[]
  onClose: () => void
  onSubmit: (studentData: any, parentAction: any) => Promise<void>
}

export const StudentModal = ({ student, parents, onClose, onSubmit }: Props) => {
  const [formData, setFormData] = useState({
    id: student.id,
    rfid_uid: student.rfid_uid,
    name: student.name === "Kartu Baru" ? "" : student.name,
    nisn: student.nisn || "",
    gender: student.gender || "",
    class_name: student.class_name || "",
    domicile: student.domicile || "",
  })

  const [classes, setClasses] = useState<{ id: string, name: string }[]>([])
  
  const [parentMode, setParentMode] = useState<"none" | "new" | "link" | "edit" | "unlink">(student.parent_id ? "edit" : "none")
  const [parentUsername, setParentUsername] = useState(student.profiles?.email?.split('@')[0] || "")
  const [parentName, setParentName] = useState(student.profiles?.name || "")
  const [parentPassword, setParentPassword] = useState("")
  const [selectedParentId, setSelectedParentId] = useState("")
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await supabase.from('classes').select('id, name').order('name', { ascending: true })
      if (data) setClasses(data)
    }
    fetchClasses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const isComplete = Boolean(formData.name && formData.nisn && formData.gender && formData.class_name && formData.domicile)
    
    let parentAction = null
    if (parentMode === "new") parentAction = { type: 'create', name: parentName, username: parentUsername, password: parentPassword }
    else if (parentMode === "link") parentAction = { type: 'link', id: selectedParentId }
    else if (parentMode === "edit") parentAction = { type: 'update', id: student.parent_id, name: parentName, username: parentUsername, password: parentPassword }
    else if (parentMode === "unlink") parentAction = { type: 'unlink' }

    await onSubmit({ ...formData, is_draft: !isComplete }, parentAction)
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col gap-6 custom-scrollbar border border-gray-100">
        
        <div className="flex justify-between items-start pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Data Siswa</h2>
            <div className="mt-2 text-xs bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg font-mono font-bold border border-blue-200 w-fit">
              UID Kartu: {formData.rfid_uid}
            </div>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-full transition-colors font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-5 rounded-2xl border border-gray-200">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Nama Lengkap</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 font-bold text-gray-900 shadow-sm" placeholder="Nama siswa..." />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">NISN</label>
              <input type="text" value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} className="w-full bg-white border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold shadow-sm" placeholder="Masukkan NISN..." />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Jenis Kelamin</label>
              <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-white border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold shadow-sm cursor-pointer">
                <option value="">Pilih...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Kelas</label>
              <select 
                value={formData.class_name} 
                onChange={e => setFormData({...formData, class_name: e.target.value})} 
                className="w-full bg-white border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold shadow-sm cursor-pointer"
              >
                <option value="">Pilih Kelas...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-900">Domisili / Alamat</label>
              <input type="text" value={formData.domicile} onChange={e => setFormData({...formData, domicile: e.target.value})} className="w-full bg-white border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 text-gray-900 font-bold shadow-sm" placeholder="Kota atau Alamat..." />
            </div>
          </div>

          <div className="border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm bg-white">
            <div className="bg-indigo-100/70 p-4 border-b border-indigo-200 flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-indigo-950 mr-2">Akun Wali:</span>
                {!student.parent_id && (
                  <>
                    <button type="button" onClick={() => setParentMode('none')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${parentMode === 'none' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-white text-indigo-900 border border-indigo-300'}`}>Lewati</button>
                    <button type="button" onClick={() => setParentMode('new')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${parentMode === 'new' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-white text-indigo-900 border border-indigo-300'}`}>Buat Baru</button>
                    <button type="button" onClick={() => setParentMode('link')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${parentMode === 'link' ? 'bg-indigo-700 text-white shadow-sm' : 'bg-white text-indigo-900 border border-indigo-300'}`}>Tautkan</button>
                  </>
                )}
                {student.parent_id && parentMode !== "unlink" && (
                  <span className="bg-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg text-xs font-black">Terhubung</span>
                )}
                {parentMode === "unlink" && (
                  <span className="bg-rose-200 text-rose-900 px-3 py-1.5 rounded-lg text-xs font-black">Dihapus (Pending)</span>
                )}
              </div>
              
              {student.parent_id && parentMode === "edit" && (
                <button type="button" onClick={() => setParentMode('unlink')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 transition-colors">
                  Putus Tautan
                </button>
              )}
              {student.parent_id && parentMode === "unlink" && (
                <button type="button" onClick={() => setParentMode('edit')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-colors">
                  Batal Putus
                </button>
              )}
            </div>

            <div className="p-5 bg-white">
              {parentMode === "none" && <p className="text-sm text-gray-600 font-semibold">Tidak ada aksi untuk akun wali.</p>}
              
              {parentMode === "unlink" && <p className="text-sm text-rose-600 font-bold">Akun wali akan diputuskan tautannya dari siswa ini setelah Anda menekan tombol simpan.</p>}

              {parentMode === "link" && (
                <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl outline-none focus:border-indigo-600 text-gray-900 font-bold cursor-pointer">
                  <option value="">Pilih Akun Wali...</option>
                  {parents.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email.split('@')[0]})</option>)}
                </select>
              )}

              {(parentMode === "new" || parentMode === "edit") && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-800 mb-1">Nama Lengkap Wali</label>
                    <input type="text" required value={parentName} onChange={e => setParentName(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-indigo-600 text-gray-900 font-bold shadow-sm" placeholder="Nama Lengkap Wali" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Username Login</label>
                    <input type="text" required value={parentUsername} onChange={e => setParentUsername(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-indigo-600 text-gray-900 font-bold shadow-sm" placeholder="Username Wali" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1">Password</label>
                    <input type="password" required={parentMode === 'new'} minLength={6} value={parentPassword} onChange={e => setParentPassword(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-300 p-3 rounded-xl text-sm outline-none focus:border-indigo-600 text-gray-900 font-bold shadow-sm" placeholder={parentMode === 'edit' ? "Kosongkan jika tak diubah" : "Password (Min 6)"} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:animate-pulse">
            {isSubmitting ? "Menyimpan Data..." : "Simpan Data Siswa"}
          </button>
        </form>
      </div>
    </div>
  )
}