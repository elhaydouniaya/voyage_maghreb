"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";

type AvatarUploaderProps = {
  /** Display name, used to derive initials when there is no image. */
  name: string;
  /** Current avatar URL, or null. */
  image: string | null;
  /** Called with the new URL after upload, or null after removal. */
  onChange: (image: string | null) => void;
  /** Optional toast hook from the parent. */
  onNotify?: (message: string, type: "success" | "error") => void;
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // reject oversized originals before resizing
const OUTPUT_SIZE = 512;

/**
 * Downscale + center-crop the chosen file to a square WebP before upload.
 * Keeps payloads small (~30-80 kB) and avatars crisp regardless of source size.
 */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas non supporté.");

    const scale = Math.max(OUTPUT_SIZE / bitmap.width, OUTPUT_SIZE / bitmap.height);
    const drawW = bitmap.width * scale;
    const drawH = bitmap.height * scale;
    ctx.drawImage(bitmap, (OUTPUT_SIZE - drawW) / 2, (OUTPUT_SIZE - drawH) / 2, drawW, drawH);

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Conversion impossible."))),
        "image/webp",
        0.9
      )
    );
  } finally {
    bitmap.close();
  }
}

export default function AvatarUploader({
  name,
  image,
  onChange,
  onNotify,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleFile(file: File) {
    if (!ACCEPTED.includes(file.type)) {
      onNotify?.("Format non supporté. Utilisez JPEG, PNG ou WebP.", "error");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      onNotify?.("Image trop volumineuse (max 8 Mo).", "error");
      return;
    }

    setBusy(true);
    try {
      const blob = await toSquareWebp(file);
      const form = new FormData();
      form.append("avatar", blob, "avatar.webp");

      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        onNotify?.(data.error || "Téléversement impossible.", "error");
        return;
      }
      onChange(data.image);
      onNotify?.("Photo de profil mise à jour.", "success");
    } catch {
      onNotify?.("Impossible de traiter cette image.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      const res = await fetch("/api/user/avatar", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        onNotify?.(data.error || "Suppression impossible.", "error");
        return;
      }
      onChange(null);
      onNotify?.("Photo de profil supprimée.", "success");
    } catch {
      onNotify?.("Erreur réseau.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Changer la photo de profil"
        aria-label="Changer la photo de profil"
        className="group relative w-20 h-20 rounded-[2rem] overflow-hidden shadow-xl shadow-orange-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F172A]"
      >
        {image ? (
          // Plain <img>: user uploads are same-origin runtime files, no next/image config needed.
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="w-full h-full bg-orange-600 flex items-center justify-center text-white font-black text-3xl">
            {initials}
          </span>
        )}

        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          {busy ? <Loader2 size={22} className="animate-spin" /> : <Camera size={22} />}
        </span>
      </button>

      {image && !busy && (
        <button
          type="button"
          onClick={handleRemove}
          title="Supprimer la photo"
          aria-label="Supprimer la photo de profil"
          className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-red-600 shadow-md flex items-center justify-center hover:bg-red-50 transition-colors"
        >
          <X size={13} strokeWidth={3} />
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}