"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Map, CreditCard, Settings } from "lucide-react";
import TripImageUpload from "@/components/trips/TripImageUpload";
import { splitProgramAndCancelPolicy } from "@/lib/program-days";

enum TripType {
  DESERT = "DESERT",
  CULTURE = "CULTURE",
  AVENTURE = "AVENTURE",
  FAMILLE = "FAMILLE",
  LUXE = "LUXE",
  NATURE = "NATURE",
  RELIGIEUX = "RELIGIEUX",
  HISTORIQUE = "HISTORIQUE",
}

enum PhysicalLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  SPORT = "SPORT",
  EXPERT = "EXPERT",
}

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    tripType: TripType.AVENTURE,
    startDate: "",
    endDate: "",
    totalSpots: 10,
    totalPrice: 1000,
    depositAmount: 300,
    currency: "EUR",
    cancelPolicy: "",
    description: "",
    coverImage: "",
    images: [] as string[],
    inclusionsText: "",
    exclusionsText: "",
    meetingPoint: "",
    programDays: "",
    physicalLevel: PhysicalLevel.MEDIUM,
    guideLanguagesText: "FR, AR",
  });

  useEffect(() => {
    async function load() {
      const tripId = params.id as string;
      try {
        const res = await fetch(`/api/agency/trips/${tripId}`);
        const data = await res.json();
        if (!res.ok || !data.trip) {
          setError(data.error || "Voyage non trouvé.");
          return;
        }
        const trip = data.trip;
        const { programText, cancelPolicy } = splitProgramAndCancelPolicy(trip.programDays);

        setFormData({
          title: trip.title,
          destination: trip.destination,
          tripType: trip.tripType as TripType,
          startDate: trip.startDate,
          endDate: trip.endDate,
          totalSpots: trip.totalSpots,
          totalPrice: trip.totalPrice,
          depositAmount: trip.depositAmount,
          currency: trip.currency || "EUR",
          cancelPolicy,
          description: trip.description,
          coverImage: trip.coverImage || "",
          images: Array.isArray(trip.images) ? trip.images : [],
          inclusionsText: (trip.inclusions || []).join(", "),
          exclusionsText: (trip.exclusions || []).join(", "),
          meetingPoint: trip.meetingPoint || "",
          programDays: programText,
          physicalLevel: (trip.physicalLevel as PhysicalLevel) || PhysicalLevel.MEDIUM,
          guideLanguagesText: (trip.guideLanguages || ["FR", "AR"]).join(", "),
        });
      } catch {
        setError("Impossible de charger le voyage.");
      }
    }
    load();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "totalSpots" || name === "totalPrice" || name === "depositAmount"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const tripId = params.id as string;
      const langs = formData.guideLanguagesText
        .split(/[,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const programWithPolicy = formData.cancelPolicy.trim()
        ? `${formData.programDays}\n\n--- Politique d'annulation ---\n${formData.cancelPolicy.trim()}`
        : formData.programDays;

      const { cancelPolicy: _cp, guideLanguagesText: _gt, ...rest } = formData;

      const res = await fetch(`/api/agency/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          guideLanguages: langs.length ? langs : ["FR"],
          programDays: programWithPolicy,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la modification.");
        return;
      }

      router.push("/agency/trips");
    } catch {
      setError("Une erreur est survenue lors de la modification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !formData.title) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-black text-[#0F172A] mb-4">{error}</h2>
        <Link href="/agency/trips" className="text-primary font-bold hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <div className="flex items-center gap-6">
        <Link
          href="/agency/trips"
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95"
        >
          <ArrowLeft size={24} className="text-[#0F172A]" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Modifier le Voyage</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
            Mettez à jour les détails de votre aventure
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] text-sm font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Map size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0F172A]">Informations Générales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="title" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Titre du voyage *
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="destination" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Destination *
              </label>
              <input
                id="destination"
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label htmlFor="tripType" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Type *
              </label>
              <select
                id="tripType"
                name="tripType"
                value={formData.tripType}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all"
              >
                {Object.values(TripType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label htmlFor="startDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Départ *
              </label>
              <input
                id="startDate"
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="endDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Retour *
              </label>
              <input
                id="endDate"
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="totalSpots" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Nombre de places *
              </label>
              <input
                id="totalSpots"
                type="number"
                name="totalSpots"
                value={formData.totalSpots}
                onChange={handleChange}
                required
                min="1"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Point de rendez-vous
              </label>
              <input
                type="text"
                name="meetingPoint"
                value={formData.meetingPoint}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <CreditCard size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0F172A]">Prix et Paiement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label htmlFor="totalPrice" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Prix Total (€) *
              </label>
              <input
                id="totalPrice"
                type="number"
                name="totalPrice"
                value={formData.totalPrice}
                onChange={handleChange}
                required
                min="1"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="depositAmount" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Acompte Stripe (€) *
              </label>
              <input
                id="depositAmount"
                type="number"
                name="depositAmount"
                value={formData.depositAmount}
                onChange={handleChange}
                required
                min="1"
                max={formData.totalPrice}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-orange-600"
              />
            </div>
            <div className="space-y-3">
              <label htmlFor="currency" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Devise
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              >
                <option value="EUR">EUR (€)</option>
                <option value="DZD">DZD (DA)</option>
                <option value="MAD">MAD (DH)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Conditions d&apos;annulation
            </label>
            <textarea
              name="cancelPolicy"
              value={formData.cancelPolicy}
              onChange={handleChange}
              rows={4}
              className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"
            />
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-black text-[#0F172A]">Description et Programme</h2>
          </div>

          <div className="space-y-3">
            <label htmlFor="description" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Description détaillée *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={6}
              className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Inclus (virgules)
              </label>
              <textarea
                name="inclusionsText"
                value={formData.inclusionsText}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Non inclus (virgules)
              </label>
              <textarea
                name="exclusionsText"
                value={formData.exclusionsText}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
              Programme jour par jour
            </label>
            <textarea
              name="programDays"
              value={formData.programDays}
              onChange={handleChange}
              rows={6}
              placeholder="Jour 1: Arrivée et accueil... Jour 2: ..."
              className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="physicalLevel" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Niveau physique
              </label>
              <select
                id="physicalLevel"
                name="physicalLevel"
                value={formData.physicalLevel}
                onChange={handleChange}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              >
                {Object.values(PhysicalLevel).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                Langues du guide
              </label>
              <input
                type="text"
                name="guideLanguagesText"
                value={formData.guideLanguagesText}
                onChange={handleChange}
                placeholder="FR, AR, EN..."
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]"
              />
            </div>
          </div>

          <TripImageUpload
            coverImage={formData.coverImage}
            gallery={formData.images}
            onCoverChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
            onGalleryChange={(images) => setFormData((prev) => ({ ...prev, images }))}
          />
        </div>

        <div className="flex justify-end gap-6 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-orange-600 hover:bg-orange-600/90 text-white px-10 py-4 rounded-full font-black shadow-xl shadow-orange-600/30 flex items-center gap-3 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Save size={20} />
            {isLoading ? "ENREGISTREMENT..." : "SAUVEGARDER LES MODIFICATIONS"}
          </button>
        </div>
      </form>
    </div>
  );
}
