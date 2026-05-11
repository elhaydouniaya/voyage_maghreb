"use client";

export default function CGUPage() {
  return (
    <div className="prose prose-orange max-w-none">
      <h1 className="text-4xl font-black text-[#0F172A] mb-8">Conditions Generales d'Utilisation</h1>
      <p className="text-gray-500 font-medium">Derniere mise a jour : 03 mai 2026</p>
      
      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-[#0F172A]">1. Objet de la Plateforme</h2>
        <p className="text-gray-500 leading-relaxed">
          MaghrebVoyage est une plateforme technologique mettant en relation des agences de voyage locales situees au Maghreb et des voyageurs souhaitant reserver des voyages de groupe. 
          Nous agissons en tant qu'intermediaire facilitateur de paiement.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">2. Processus de Reservation</h2>
        <p className="text-gray-500 leading-relaxed">
          Toute reservation sur la plateforme entraine le paiement d'un acompte via Stripe. Cet acompte confirme votre place dans le voyage de groupe choisi. 
          Le solde du voyage est a regler directement apres de l'agence organisatrice selon les modalites precisees sur la fiche du voyage.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">3. Responsabilites</h2>
        <p className="text-gray-500 leading-relaxed">
          L'agence de voyage est seule responsable de la bonne execution des prestations vendues. MaghrebVoyage ne saurait etre tenu responsable en cas de modification d'itineraire, d'annulation par l'agence ou de litige sur place.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">4. Donnees Personnelles</h2>
        <p className="text-gray-500 leading-relaxed">
          En utilisant nos services, vous acceptez que vos coordonnees (nom, email, telephone) soient transmises a l'agence organisatrice du voyage reserve afin de permettre la finalisation de votre dossier.
        </p>
      </section>
    </div>
  );
}
