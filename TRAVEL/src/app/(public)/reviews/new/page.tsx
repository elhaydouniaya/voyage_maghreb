"use client";

import MainNavbar from "@/components/layout/MainNavbar";
import ReviewForm from "@/components/reviews/ReviewForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewReviewPage() {
  return (
    <>
      <MainNavbar />

      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-32 pb-16">
        {/* Header */}
        <div className="max-w-2xl mx-auto px-4 md:px-8 mb-12">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-orange-500 font-bold hover:text-orange-600 transition-colors mb-6"
          >
            <ArrowLeft size={18} />
            Retour aux avis
          </Link>

          <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Partagez votre <span className="text-orange-500">expérience</span>
          </h1>

          <p className="text-gray-600 text-lg">
            Votre avis nous aide à nous améliorer et aide les autres voyageurs à faire le meilleur choix. Merci de prendre le temps de partagez votre expérience avec nous!
          </p>
        </div>

        {/* Form */}
        <ReviewForm />
      </main>
    </>
  );
}
