import Link from "next/link";

export default function TripNotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-2xl font-black text-[#0F172A]">Voyage introuvable</p>
      <p className="text-gray-500 text-center max-w-md">
        Ce voyage n&apos;existe plus ou n&apos;est pas encore publié.
      </p>
      <Link
        href="/voyages"
        className="bg-[#2563EB] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
      >
        Voir tous les voyages
      </Link>
    </div>
  );
}
