import { useState } from "react"

interface Props {
  childId: string
  childName: string
  onClose: () => void
  onSubmit: (childId: string, status: string, date: string, notes: string) => Promise<void>
}

export const LeaveModal = ({ childId, childName, onClose, onSubmit }: Props) => {
  const [status, setStatus] = useState("Sakit")
  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().split("T")[0]
  })
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onSubmit(childId, status, date, notes)
    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white rounded-4xl p-6 sm:p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Pengajuan Izin</h2>
            <p className="text-gray-500 font-medium mt-1">Siswa: <span className="text-indigo-600 font-bold">{childName}</span></p>
          </div>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Jenis Keterangan</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${status === "Sakit" ? "border-amber-500 bg-amber-50 text-amber-700 font-bold" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <input type="radio" name="status" value="Sakit" checked={status === "Sakit"} onChange={(e) => setStatus(e.target.value)} className="hidden" />
                Sakit
              </label>
              <label className={`flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${status === "Izin" ? "border-blue-500 bg-blue-50 text-blue-700 font-bold" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                <input type="radio" name="status" value="Izin" checked={status === "Izin"} onChange={(e) => setStatus(e.target.value)} className="hidden" />
                Izin
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Tanggal Izin</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-gray-900" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-700">Keterangan / Alasan</label>
            <textarea required rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tuliskan alasan izin/sakit secara singkat..." className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium text-gray-900 resize-none"></textarea>
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-extrabold shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70 disabled:animate-pulse mt-4">
            {isSubmitting ? "Mengirim Pengajuan..." : "Kirim Pengajuan"}
          </button>
        </form>
      </div>
    </div>
  )
}