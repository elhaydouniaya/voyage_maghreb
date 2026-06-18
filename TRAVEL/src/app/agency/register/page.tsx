"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, Shield, Globe, FileText, AlertCircle, Eye, EyeOff } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

const inputCls =
  "flex h-9 w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow";

export default function AgencyRegisterPage() {
  const router = useRouter();

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
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.cguAccepted || !formData.rgpdAccepted) { setError("Vous devez accepter les conditions pour continuer."); setIsLoading(false); return; }
    if (formData.agencyName.trim().length < 3) { setError("Le nom de l'agence doit contenir au moins 3 caractères."); setIsLoading(false); return; }
    if (formData.description.trim().length < 100) { setError("La description doit contenir au moins 100 caractères."); setIsLoading(false); return; }
    if (formData.coverage.length < 1) { setError("Sélectionnez au moins une zone géographique."); setIsLoading(false); return; }
    if (formData.specialties.length < 1) { setError("Sélectionnez au moins un type de voyage."); setIsLoading(false); return; }
    if (formData.password.length < 8 || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      setError("Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.");
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
      if (!res.ok) { setError(data.error || "Inscription impossible."); setIsLoading(false); return; }

      const loginOutcome = await loginWithFreshSession(formData.email.trim(), formData.password, { requiredRole: "AGENCY" });
      if (!loginOutcome.ok) { setError(loginOutcome.error); setSuccess(true); }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─── Page succès ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen w-full relative overflow-hidden bg-[#fef3e2] font-outfit" onClick={() => router.push("/")}>
        <AnimatedBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-2xl shadow-2xl p-10 max-w-lg w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-orange-900 mb-3">Compte agence créé !</h2>
            <p className="text-orange-700 text-sm leading-relaxed mb-6">
              Votre compte est actif. La validation de votre dossier est en cours de revue par notre équipe.
              Envoyez votre justificatif officiel à{" "}
              <strong className="text-orange-900">contact@maghrebvoyage.com</strong>.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 mb-6 text-left">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest mb-2">Prochaine étape</p>
              <p className="text-sm text-orange-900">
                Notre administrateur vérifie votre numéro de licence :{" "}
                <span className="font-bold text-orange-600">{formData.registrationNumber}</span>.
                Une fois validé, vous pourrez publier vos premiers voyages.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                const outcome = await loginWithFreshSession(formData.email.trim(), formData.password, { requiredRole: "AGENCY" });
                if (!outcome.ok) router.push("/agency/login");
              }}
              className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-orange-600 text-sm font-medium text-white shadow-lg shadow-orange-900/30 hover:bg-orange-700 transition-colors"
            >
              Accéder à mon espace agence
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulaire principal ────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen w-full relative overflow-hidden bg-[#fef3e2] font-outfit"
      onClick={() => router.push("/")}
    >
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-10">
        <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

            {/* Sidebar */}
            <div className="md:w-72 bg-orange-600 p-8 text-white flex flex-col shrink-0">
              <Link href="/" className="flex items-center gap-2.5 mb-10">
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-lg font-bold">MaghrebVoyage</span>
              </Link>

              <h2 className="text-2xl font-bold mb-3">Devenez partenaire.</h2>
              <p className="text-orange-100 text-sm leading-relaxed mb-8">
                Publiez vos voyages et profitez de notre technologie IA pour toucher plus de voyageurs.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Shield, label: "Agences vérifiées" },
                  { icon: Globe, label: "Visibilité Maghreb" },
                  { icon: FileText, label: "Paiement sécurisé" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-orange-100">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-8">
                <p className="text-xs text-orange-200">Expertise locale · Sécurité Stripe · Support IA</p>
              </div>
            </div>

            {/* Formulaire */}
            <div className="flex-1 p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-xl font-bold text-orange-900">Inscription Agence</h1>
                  <p className="text-sm text-orange-600">Créez votre compte professionnel</p>
                </div>
                <Link href="/agency/login" className="text-sm text-orange-600 hover:text-orange-800 font-medium hover:underline">
                  Connexion →
                </Link>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Noms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="agencyName" className="text-sm font-medium text-orange-900">Nom de l'agence *</label>
                    <input id="agencyName" type="text" name="agencyName" value={formData.agencyName} onChange={handleChange} className={inputCls} required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="managerName" className="text-sm font-medium text-orange-900">Nom du gérant *</label>
                    <input id="managerName" type="text" name="managerName" value={formData.managerName} onChange={handleChange} className={inputCls} required />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-orange-900">Email professionnel *</label>
                    <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="contact@agence.com" className={inputCls} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-orange-900">Téléphone *</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+212 6 00 00 00 00" className={inputCls} required />
                  </div>
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="country" className="text-sm font-medium text-orange-900">Pays *</label>
                    <select id="country" name="country" value={formData.country} onChange={handleChange} className={inputCls} required>
                      <option value="">Sélectionner</option>
                      <option value="Maroc">Maroc</option>
                      <option value="Algérie">Algérie</option>
                      <option value="Tunisie">Tunisie</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="city" className="text-sm font-medium text-orange-900">Ville principale *</label>
                    <input id="city" type="text" name="city" value={formData.city} onChange={handleChange} className={inputCls} required />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-sm font-medium text-orange-900">Description agence * <span className="text-xs text-orange-400 font-normal">(min. 100 caractères)</span></label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Décrivez votre expertise, destinations, services…" className="flex w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow resize-none" required />
                  <p className="text-xs text-orange-400">{formData.description.length}/100 min.</p>
                </div>

                {/* Zones & Spécialités */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-900">Zones de couverture *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Sahara", "Atlas", "Côtier", "Villes Impériales"].map((zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => {
                            const next = formData.coverage.includes(zone)
                              ? formData.coverage.filter((z) => z !== zone)
                              : [...formData.coverage, zone];
                            setFormData((f) => ({ ...f, coverage: next }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            formData.coverage.includes(zone)
                              ? "bg-orange-600 text-white shadow-md"
                              : "bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100"
                          }`}
                        >
                          {zone}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-900">Spécialités *</label>
                    <div className="flex flex-wrap gap-2">
                      {["Aventure", "Culturel", "Luxe", "Famille"].map((spec) => (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => {
                            const next = formData.specialties.includes(spec)
                              ? formData.specialties.filter((s) => s !== spec)
                              : [...formData.specialties, spec];
                            setFormData((f) => ({ ...f, specialties: next }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            formData.specialties.includes(spec)
                              ? "bg-orange-900 text-white shadow-md"
                              : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                          }`}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Licence + Mot de passe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="registrationNumber" className="text-sm font-medium text-orange-900">N° Licence / SIRET *</label>
                    <input id="registrationNumber" type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} className={inputCls} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-orange-900">Mot de passe *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 8 car., 1 maj., 1 chiffre"
                        className={`${inputCls} pr-10`}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-5 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="cguAccepted" checked={formData.cguAccepted} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm text-orange-800">
                      J'accepte les{" "}
                      <Link href="/legal/cgu" className="text-orange-600 font-semibold hover:underline">CGU</Link>{" "}
                      et certifie l'exactitude des informations.
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" name="rgpdAccepted" checked={formData.rgpdAccepted} onChange={handleChange} className="mt-0.5 w-4 h-4 rounded border-orange-300 text-orange-600 focus:ring-orange-500" />
                    <span className="text-sm text-orange-800">
                      J'accepte la{" "}
                      <Link href="/legal/confidentialite" className="text-orange-600 font-semibold hover:underline">Politique de confidentialité</Link>.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-orange-600 text-sm font-medium text-white shadow-lg shadow-orange-900/30 hover:bg-orange-700 transition-colors disabled:pointer-events-none disabled:opacity-50"
                >
                  {isLoading ? "Envoi du dossier…" : "Soumettre mon dossier"}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-orange-500">Protégé par un système de sécurité professionnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}
