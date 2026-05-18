"use client";

import MainNavbar from "@/components/layout/MainNavbar";
import ReviewsList from "@/components/reviews/ReviewsList";
import { Star, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  return (
    <>
      <MainNavbar />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-16">
        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 mb-16 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-bold">
            ⭐ Avis Vérifiés
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Découvrez ce que nos <span className="text-orange-500">clients</span> disent
          </h1>
          
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-8">
            Lisez les expériences authentiques de nos voyageurs et découvrez pourquoi MaghrebVoyage est leur agence préférée pour explorer le Maghreb.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            <span>Réserver votre voyage</span>
            <span>→</span>
          </Link>
        </div>

        {/* Reviews Section */}
        <ReviewsList />

        {/* Call to Action */}
        <div className="mt-20 max-w-4xl mx-auto px-4 md:px-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-8 md:p-12 text-white text-center">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">Vous avez vécu une expérience?</h2>
            <p className="text-orange-50 mb-6 text-lg">
              Partagez votre avis et aidez d'autres voyageurs à faire le meilleur choix pour leurs vacances maghrébines.
            </p>
        {/* "Share your experience" CTA button */}
            <Link
              href="/reviews/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 font-bold rounded-lg hover:bg-orange-50 transition-colors"
            >
              Laisser un avis
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
