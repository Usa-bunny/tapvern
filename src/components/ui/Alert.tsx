export const Alert = ({ message }: { message: string }) => {
  if (!message) return null

  return (
    <div className="p-4 rounded-xl border bg-red-50 text-red-600 border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  )
}