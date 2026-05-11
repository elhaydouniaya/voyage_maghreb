"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function BookingCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (token) {
      setIsConfirming(true);
    }
  }, [token]);

  const handleCancel = async () => {
    setIsLoading(true);
    // Simulate API call to /api/bookings/cancel?token=...
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-8">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto">
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tight">Annulation Confirmée</h1>
            <p className="text-gray-500 font-medium">Votre réservation a été annulée avec succès. L&apos;agence a été notifiée.</p>
          </div>
          <div className="pt-4">
            <Link href="/" className="bg-[#0F172A] text-white px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2">
              <ArrowLeft size={20} /> Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-10">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mx-auto">
            <AlertTriangle size={48} strokeWidth={3} />
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Annuler ma réservation ?</h1>
            <p className="text-gray-500 font-medium leading-relaxed">
              Êtes-vous sûr de vouloir annuler votre voyage ? Cette action libérera vos places pour d&apos;autres voyageurs.
            </p>
          </div>
          <div className="space-y-4 pt-6">
            <button 
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full bg-red-600 text-white py-5 rounded-full font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {isLoading ? "ANNULATION..." : "OUI, ANNULER"}
            </button>
            <Link href="/" className="block w-full py-5 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-[#0F172A] transition-colors">
              Non, conserver ma place
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100 text-center space-y-8">
        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
          <XCircle size={48} strokeWidth={3} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tight">Paiement Annulé</h1>
          <p className="text-gray-500 font-medium">Le processus de réservation a été interrompu. Aucun montant n&apos;a été débité.</p>
        </div>
        <div className="pt-4">
          <Link href="/voyages" className="bg-[#0F172A] text-white px-10 py-4 rounded-full font-black shadow-xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2">
            <ArrowLeft size={20} /> Réessayer
          </Link>
        </div>
      </div>
    </div>
  );
}
