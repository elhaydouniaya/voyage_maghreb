"use client";

export default function MentionsPage() {
  return (
    <div className="prose prose-orange max-w-none">
      <h1 className="text-4xl font-black text-[#0F172A] mb-8">Mentions Légales</h1>
      <p className="text-gray-500 font-medium">Conformément à la loi pour la confiance dans l'économie numérique.</p>
      
      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-black text-[#0F172A]">1. Édition du site</h2>
        <p className="text-gray-500 leading-relaxed">
          Le site MaghrebVoyage est édité par l'équipe de développement MVP MaghrebVoyage SAS au capital de 10 000€. Siège social : 12 rue de l'Aventure, 75001 Paris. SIRET : 123 456 789 00012.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">2. Hébergement</h2>
        <p className="text-gray-500 leading-relaxed">
          Le site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #1142 Walnut, CA 91789, USA.
        </p>

        <h2 className="text-xl font-black text-[#0F172A]">3. Propriété intellectuelle</h2>
        <p className="text-gray-500 leading-relaxed">
          Tous les éléments du site MaghrebVoyage sont et restent la propriété intellectuelle exclusive de la SAS MaghrebVoyage. Nul n'est autorisé à reproduire, exploiter, ou utiliser à quelque titre que ce soit, même partiellement, des éléments du site.
        </p>
      </section>
    </div>
  );
}
