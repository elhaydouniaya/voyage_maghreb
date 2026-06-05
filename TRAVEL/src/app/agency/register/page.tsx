"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Check, Shield, FileText, X } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";

export default function AgencyRegisterPage() {
  const router = useRouter();

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop container, not on the modal
    const target = e.target as HTMLElement;
    if (target.id === "backdrop-container") {
      router.push("/");
    }
  };
  const [formData, setFormData] = useState({
    agencyName: "",
    managerName: "",
    email: "",
    phone: "",
    country: "Maroc",
    city: "",
    description: "",
    coverage: [] as string[],
    specialties: [] as string[],
    password: "",
    registrationNumber: "",
    cguAccepted: false,
    rgpdAccepted: false,
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.cguAccepted || !formData.rgpdAccepted) {
      setError("Vous devez accepter les conditions pour continuer.");
      setIsLoading(false);
      return;
    }

    if (formData.agencyName.trim().length < 3) {
      setError("Le nom de l'agence doit contenir au moins 3 caractères.");
      setIsLoading(false);
      return;
    }

    if (formData.description.trim().length < 100) {
      setError("La description doit contenir au moins 100 caractères.");
      setIsLoading(false);
      return;
    }

    if (formData.coverage.length < 1) {
      setError("Sélectionnez au moins une zone géographique.");
      setIsLoading(false);
      return;
    }

    if (formData.specialties.length < 1) {
      setError("Sélectionnez au moins un type de voyage.");
      setIsLoading(false);
      return;
    }

    if (
      formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password)
    ) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre."
      );
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Inscription impossible.");
        setIsLoading(false);
        return;
      }

      const loginOutcome = await loginWithFreshSession(
        formData.email.trim(),
        formData.password,
        { requiredRole: "AGENCY" }
      );

      if (!loginOutcome.ok) {
        setError(loginOutcome.error);
        setSuccess(true);
      }
      /* succès : redirection automatique vers /agency/dashboard */
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div
        id="backdrop-container"
        className="fixed inset-0 bg-white flex items-center justify-center p-6 font-outfit overflow-y-auto z-50"
        onClick={handleBackdropClick}
      >
        {/* Animated Blurred Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-white" />

          {/* Animated Blur Shapes */}
          <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-pulse delay-500" />

          {/* Animated Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div 
          className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-xl border border-gray-100 p-16 text-center relative z-10 animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Fermer"
            type="button"
          >
            <X size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
          <div className="w-24 h-24 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-8 shadow-sm">
             <Check size={48} strokeWidth={3} />
          </div>
          <h2 className="text-4xl font-black tracking-tight mb-6 text-[#0F172A]">Compte agence créé !</h2>
          <p className="text-gray-500 mb-10 font-medium leading-relaxed">
            Votre compte est actif. Vous pouvez vous connecter à tout moment.
            La validation de votre dossier est en cours de revue par notre équipe.
            Envoyez votre justificatif officiel (registre de commerce ou licence) à{" "}
            <strong>contact@maghrebvoyage.com</strong> avec votre email en objet.
            Vous recevrez un email de confirmation dès que votre compte sera validé.
          </p>
          <div className="bg-[#F8FAFC] rounded-[2rem] p-8 mb-10 border border-gray-100 text-left">
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Prochaine étape</p>
             <p className="text-sm font-bold text-[#0F172A] leading-relaxed">
                Notre administrateur vérifie votre numéro de licence : <span className="text-orange-600 font-black">{formData.registrationNumber}</span>. 
                Une fois validé, vous pourrez publier vos premiers voyages.
             </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              const outcome = await loginWithFreshSession(
                formData.email.trim(),
                formData.password,
                { requiredRole: "AGENCY" }
              );
              if (!outcome.ok) {
                router.push("/agency/login");
              }
            }}
            className="bg-[#0F172A] text-white font-black py-5 px-12 rounded-full shadow-xl hover:bg-black transition-all text-xs uppercase tracking-widest"
          >
            Accéder à mon espace agence
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      id="backdrop-container"
      className="fixed inset-0 bg-white flex items-center justify-center py-12 px-6 font-outfit overflow-y-auto z-50"
      onClick={handleBackdropClick}
    >
      {/* Animated Blurred Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-white" />

        {/* Animated Blur Shapes */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-pulse delay-500" />

        {/* Animated Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div 
        className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-3xl border border-gray-100 overflow-hidden flex flex-col md:flex-row relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Fermer"
          type="button"
        >
          <X size={24} className="text-gray-400 hover:text-gray-600" />
        </button>
        
        {/* Sidebar Info */}
        <div className="md:w-1/3 bg-[#0F172A] p-12 text-white relative overflow-hidden flex flex-col">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />
           <div className="relative z-10">
              <Link href="/" className="flex items-center gap-2 mb-12">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                   <Globe size={18} />
                </div>
                <span className="text-lg font-bold tracking-tight">MaghrebVoyage</span>
              </Link>
              <h2 className="text-3xl font-black tracking-tight mb-6">Devenez partenaire.</h2>
              <p className="text-gray-400 text-sm font-medium leading-relaxed mb-12">
                 Publiez vos voyages de groupe et profitez de notre technologie IA pour toucher plus de voyageurs.
              </p>
              
              <div className="space-y-6">
                 {[
                   { icon: Shield, text: "Agences vérifiées" },
                   { icon: Globe, text: "Visibilité Maghreb" },
                   { icon: FileText, text: "Paiement sécurisé" }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      <div className="w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center text-orange-500">
                         <item.icon size={16} />
                      </div>
                      {item.text}
                   </div>
                 ))}
              </div>
           </div>
           
           <div className="mt-auto pt-12">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
                 Expertise locale • Sécurité Stripe • Support IA
              </p>
           </div>
        </div>

        {/* Form */}
        <div className="md:w-2/3 p-10 md:p-16">
          <header className="mb-10 flex justify-between items-center">
             <div>
                <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Inscription Agence</h1>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Créez votre compte professionnel</p>
             </div>
             <Link href="/agency/login" className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline">Connexion</Link>
          </header>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-5 mb-8 text-xs font-bold flex items-center gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-600">✕</div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="agencyName" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom de l'agence *</label>
                <input id="agencyName" type="text" name="agencyName" value={formData.agencyName} onChange={handleChange} title="Nom de l'agence" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="managerName" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nom du gérant *</label>
                <input id="managerName" type="text" name="managerName" value={formData.managerName} onChange={handleChange} title="Nom du gérant" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email professionnel *</label>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} title="Email professionnel" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+212..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="country" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pays *</label>
                <select id="country" name="country" value={formData.country} onChange={handleChange} title="Pays de l'agence" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all appearance-none" required>
                  <option value="">Sélectionner</option>
                  <option value="Maroc">Maroc</option>
                  <option value="Algérie">Algérie</option>
                  <option value="Tunisie">Tunisie</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="city" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Ville principale *</label>
                <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} title="Ville principale" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description agence *</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} title="Description de l'agence" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-[#0F172A] transition-all resize-none" placeholder="Décrivez votre expertise..." required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Zones de couverture</label>
                  <div className="flex flex-wrap gap-2">
                     {["Sahara", "Atlas", "Côtier", "Villes Impériales"].map(zone => (
                        <button 
                          key={zone}
                          type="button"
                          onClick={() => {
                             const current = formData.coverage;
                             const next = current.includes(zone) ? current.filter(z => z !== zone) : [...current, zone];
                             setFormData(f => ({ ...f, coverage: next }));
                          }}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                             formData.coverage.includes(zone) ? "bg-orange-600 text-white shadow-lg" : "bg-[#F8FAFC] text-gray-400 border border-gray-50"
                          }`}
                        >{zone}</button>
                     ))}
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Spécialités</label>
                  <div className="flex flex-wrap gap-2">
                     {["Aventure", "Culturel", "Luxe", "Famille"].map(spec => (
                        <button 
                          key={spec}
                          type="button"
                          onClick={() => {
                             const current = formData.specialties;
                             const next = current.includes(spec) ? current.filter(s => s !== spec) : [...current, spec];
                             setFormData(f => ({ ...f, specialties: next }));
                          }}
                          className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                             formData.specialties.includes(spec) ? "bg-[#0F172A] text-white shadow-lg" : "bg-[#F8FAFC] text-gray-400 border border-gray-50"
                          }`}
                        >{spec}</button>
                     ))}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="registrationNumber" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">N° Licence / SIRET *</label>
                <input id="registrationNumber" type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} title="Numéro de licence ou SIRET" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" required />
            </div>

            <div className="bg-[#F8FAFC] p-6 rounded-[2rem] border border-gray-100 mt-6 space-y-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <input type="checkbox" name="cguAccepted" checked={formData.cguAccepted} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-[11px] text-gray-500 font-medium leading-relaxed">J'accepte les <Link href="/legal/cgu" className="text-orange-600 font-black hover:underline">CGU</Link> et je certifie l'exactitude des informations.</span>
              </label>
              <label className="flex items-start gap-4 cursor-pointer group">
                <input type="checkbox" name="rgpdAccepted" checked={formData.rgpdAccepted} onChange={handleChange} className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
                <span className="text-[11px] text-gray-500 font-medium leading-relaxed">J'accepte la <Link href="/legal/confidentialite" className="text-orange-600 font-black hover:underline">Politique de confidentialité</Link>.</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-black py-5 rounded-full shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50 mt-4 text-xs uppercase tracking-widest"
            >
              {isLoading ? "ENVOI DU DOSSIER..." : "SOUMETTRE MON DOSSIER"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
