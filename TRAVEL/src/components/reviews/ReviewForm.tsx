"use client";

import { useState } from "react";
import { Star, MapPin, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReviewForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rating: 5,
    title: "",
    content: "",
    destination: "",
    tripDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rating" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Validation
      if (!formData.name.trim()) {
        setError("Le nom est requis");
        setIsSubmitting(false);
        return;
      }
      if (!formData.email.trim()) {
        setError("L'email est requis");
        setIsSubmitting(false);
        return;
      }
      if (!formData.title.trim()) {
        setError("Le titre de l'avis est requis");
        setIsSubmitting(false);
        return;
      }
      if (!formData.content.trim()) {
        setError("Le contenu de l'avis est requis");
        setIsSubmitting(false);
        return;
      }
      if (!formData.destination.trim()) {
        setError("La destination est requise");
        setIsSubmitting(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Store in localStorage for demo
      const reviews = JSON.parse(localStorage.getItem("userReviews") || "[]");
      reviews.push({
        ...formData,
        id: Date.now().toString(),
        date: new Date().toLocaleDateString("fr-FR"),
      });
      localStorage.setItem("userReviews", JSON.stringify(reviews));

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        rating: 5,
        title: "",
        content: "",
        destination: "",
        tripDate: "",
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/reviews");
      }, 2000);
    } catch (err) {
      setError("Erreur lors de la submission de l'avis. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8">
      {success ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Merci pour votre avis!
          </h2>
          <p className="text-gray-600 mb-6">
            Votre avis a été soumis avec succès et sera publié après modération.
          </p>
          <button
            onClick={() => router.push("/reviews")}
            className="px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Retour aux avis
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold">
              {error}
            </div>
          )}

          {/* Personal Info Section */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Vos informations
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Votre nom"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Trip Info Section */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Informations sur votre voyage
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} className="text-orange-500" />
                  Destination *
                </label>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Ex: Marrakech, Agadir, Désert du Sahara..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-orange-500" />
                  Date du voyage
                </label>
                <input
                  type="text"
                  name="tripDate"
                  value={formData.tripDate}
                  onChange={handleChange}
                  placeholder="Ex: Avril 2026"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Votre évaluation *
            </h3>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`${
                        star <= formData.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formData.rating}/5
              </span>
            </div>
          </div>

          {/* Review Content Section */}
          <div className="bg-white rounded-xl p-6 md:p-8 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Votre avis
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Titre de l'avis *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Une expérience magique à Marrakech!"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Votre avis détaillé *
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  placeholder="Partagez votre expérience en détail... Qu'avez-vous aimé? Qu'aureriez-vous amélioré?"
                  rows={6}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.content.length}/1000 caractères
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Envoi en cours..." : "Publier mon avis"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            * Les champs marqués d'un astérisque sont obligatoires.
            <br />
            Votre avis sera modérés avant publication.
          </p>
        </form>
      )}
    </div>
  );
}
