import { Ban } from "lucide-react";

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
    <p className="mt-4 text-gray-500 font-medium animate-pulse">
      Memuat data absensi...
    </p>
  </div>
);

export const ErrorState = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-100">
    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
      <Ban className="w-8 h-8" />
    </div>
    <h3 className="text-lg font-bold text-red-800">Terjadi Kesalahan</h3>
    <p className="text-red-600 mt-2 mb-6 text-center max-w-md">{message}</p>
    <button
      onClick={onRetry}
      className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors shadow-sm"
    >
      Coba Lagi
    </button>
  </div>
);
