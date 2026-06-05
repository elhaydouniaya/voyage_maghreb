"use client";

import { useState } from "react";
import { Camera, Loader2, Plus, X } from "lucide-react";

type Props = {
  coverImage: string;
  gallery: string[];
  onCoverChange: (url: string) => void;
  onGalleryChange: (urls: string[]) => void;
};

export default function TripImageUpload({
  coverImage,
  gallery,
  onCoverChange,
  onGalleryChange,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File, folder: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch("/api/upload/image", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload échoué");
    return data.url as string;
  }

  async function handleCoverPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadFile(file, "maghreb-voyage/trips/covers");
      onCoverChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleGalleryPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length || gallery.length >= 8) return;
    setUploading(true);
    setError("");
    try {
      const next = [...gallery];
      for (const file of Array.from(files)) {
        if (next.length >= 8) break;
        const url = await uploadFile(file, "maghreb-voyage/trips/gallery");
        next.push(url);
      }
      onGalleryChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
          Photo principale *
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 bg-orange-600 text-white px-5 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-700">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            {uploading ? "Envoi…" : "Uploader (JPEG/PNG)"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverPick}
              disabled={uploading}
            />
          </label>
          <span className="text-[10px] font-bold text-gray-400 self-center">ou URL :</span>
        </div>
        <input
          type="url"
          value={coverImage}
          onChange={(e) => onCoverChange(e.target.value)}
          required
          placeholder="https://…"
          className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
        />
      </div>

      <div className="aspect-video rounded-[3rem] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center">
        {coverImage ? (
          <img src={coverImage} alt="Aperçu" className="w-full h-full object-cover" />
        ) : (
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            Aperçu couverture
          </p>
        )}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
          Galerie (max 8)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {gallery.map((url, i) => (
            <div key={url} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onGalleryChange(gallery.filter((_, j) => j !== i))}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {gallery.length < 8 && (
            <label className="aspect-square rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-orange-500 text-gray-400">
              <Plus size={20} />
              <span className="text-[9px] font-black uppercase">Ajouter</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleGalleryPick}
                disabled={uploading}
              />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
      <p className="text-[10px] text-gray-400 font-medium">
        En local, les fichiers vont dans <code className="text-gray-500">public/uploads/</code> si
        Cloudinary n&apos;est pas configuré. Sinon, collez une URL d&apos;image.
      </p>
    </div>
  );
}
