import { Ban } from "lucide-react";

export const Alert = ({ message }: { message: string }) => {
  if (!message) return null;

  return (
    <div className="p-4 rounded-xl border bg-red-50 text-red-600 border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <Ban className="w-5 h-5" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
};
