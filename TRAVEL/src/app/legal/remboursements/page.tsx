"use client";

export default function RemboursementsPage() {
  return (
    <div className="prose prose-orange max-w-none">
      <h1 className="text-4xl font-black text-[#0F172A] mb-8">Politique de Remboursement</h1>
      <p className="text-gray-500 font-medium">Derniere mise a jour : 03 mai 2026</p>
      
      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-[#0F172A]">1. Conditions d'annulation par le client</h2>
        <p className="text-gray-500 leading-relaxed">
          L'acompte paye sur MaghrebVoyage est remboursable selon les conditions specifiques de l'agence organisatrice. En regle generale, sauf mention contraire :
          - Annulation &gt; 30 jours : Remboursement a 100% (hors frais Stripe)
          - Annulation &lt; 30 jours : L'acompte est conserve par l'agence.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">2. Annulation par l'agence</h2>
        <p className="text-gray-500 leading-relaxed">
          Si l'agence annule le voyage de groupe, l'acompte vous sera integralement rembourse sans delai.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">3. Processus de remboursement</h2>
        <p className="text-gray-500 leading-relaxed">
          Les remboursements sont traites manuellement par l'administration de MaghrebVoyage apres validation de l'annulation. Le credit peut mettre 5 a 10 jours ouvres a apparaitre sur votre releve bancaire.
        </p>
      </section>
    </div>
  );
}
