"use client";

export default function ConfidentialitePage() {
  return (
    <div className="prose prose-orange max-w-none">
      <h1 className="text-4xl font-black text-[#0F172A] mb-8">Politique de Confidentialite</h1>
      <p className="text-gray-500 font-medium">Derniere mise a jour : 03 mai 2026</p>
      
      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-[#0F172A]">1. Collecte des donnees</h2>
        <p className="text-gray-500 leading-relaxed">
          Nous collectons les informations que vous nous fournissez lors de votre inscription et de vos reservations : nom, adresse e-mail, numero de telephone et preferences de voyage.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">2. Utilisation des donnees</h2>
        <p className="text-gray-500 leading-relaxed">
          Vos donnees sont utilisees pour gerer vos reservations, communiquer avec vous et ameliorer nos services via notre assistant IA. Vos informations de contact sont partagees avec l'agence organisatrice uniquement pour les voyages que vous reservez.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">3. Securite des paiements</h2>
        <p className="text-gray-500 leading-relaxed">
          Tous les paiements sont traites par Stripe. MaghrebVoyage ne stocke aucune information de carte bancaire sur ses serveurs.
        </p>
      </section>
    </div>
  );
}
