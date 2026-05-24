import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      <p className="text-sm font-bold text-gray-400">{label}</p>
    </div>
  );
}
