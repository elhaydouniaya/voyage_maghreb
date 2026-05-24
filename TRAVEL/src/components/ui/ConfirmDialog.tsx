"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: "danger" | "default";
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  loading = false,
  variant = "default",
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
      : "bg-orange-600 hover:bg-orange-700 shadow-orange-600/20";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Fermer"
      />
      <div className="relative bg-white rounded-[2rem] border border-gray-100 shadow-2xl max-w-md w-full p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-xl font-black text-[#0F172A] tracking-tight">{title}</h3>
          <p className="text-sm text-gray-500 font-medium mt-3 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? "Traitement..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
