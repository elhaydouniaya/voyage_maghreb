# 📘 DOCUMENTATION TECHNIQUE & VISION – MVP MAGHREB TRAVEL

Ce document résume l'architecture, la logique métier et la conformité du MVP par rapport au cahier des charges.

## 1. Vision & Positionnement (Section 1-4)
L'application n'est pas une simple agence de voyage en ligne (OTA), mais une **plateforme de qualification intelligente** couplée à un **catalogue de voyages publiés**. Elle transforme une intention humaine floue en une demande structurée, puis oriente le voyageur vers des voyages groupés disponibles à la réservation directe.

## 2. Architecture Technique (Module 8)
- **Framework** : Next.js 16 (App Router, Turbopack) pour une performance optimale et un SEO natif.
- **Base de données** : PostgreSQL avec Prisma ORM (Voyageur ↔ Demande ↔ Agence ↔ Voyage groupé ↔ Réservation).
- **Authentification** : NextAuth.js avec rôles (ADMIN, AGENCY, CLIENT) et `src/proxy.ts` (protection des routes).
- **Paiements** : Stripe Checkout (acompte) + Stripe Connect (répartition agence / plateforme).

## 3. Le Moteur IA (Module 3 & 8.3)
Situé dans `src/services/ai.service.ts` (Groq / OpenAI / fallback offline via `src/lib/llm.ts`). Accueil : lanceur IA + hero vocal multilingue.
1. **Structurer** : Extraire destination, durée, budget et type de voyage.
2. **Résumer** : Créer un "Résumé Commercial" pour l'agence.
3. **Taguer** : Générer des catégories (Famille, Culturel, etc.) pour le matching.
4. **Guide** : Chat conseiller (`/profile` → Guide IA) avec contexte catalogue (RAG léger).

## 4. Logique de Matching (Module 5 & 8.5)
Le matching est **automatique** sur le catalogue publié :
- Score de compatibilité (seuil configurable) entre la demande IA et les voyages `GroupTrip` publiés.
- Les agences concernées reçoivent un email lorsqu'un prospect qualifié correspond à leur offre.
- Pas de modèle `Offer` ni d'assignation manuelle admin dans cette version : le voyageur réserve directement le voyage proposé.

## 5. Parcours utilisateur
- **Recherche IA** (`/recherche`) : chat public de matching ; sauvegarde automatique de `TravelRequest` si connecté.
- **Catalogue** (`/voyages`, `/trip/[slug]`) : fiches voyages publiées par les agences.
- **Réservation** : acompte Stripe ; la demande liée passe en statut paiement / confirmé.
- **Agence** : gestion des voyages, leads IA, réservations, Stripe Connect.
- **Admin** : agences, voyages, paiements, remboursements Connect-aware.

## 6. Dashboards & Fonctionnalités (Modules 4, 6, 10)
- **Admin** : Pilotage complet, analytics, remboursements, vue Stripe Connect.
- **Agence** : Publication de voyages, leads qualifiés, notifications email réservation / matching.
- **Client** : Profil, historique recherches IA, réservations, guide IA.

## 7. Sécurité & Audit (Section 7 & 21)
- **Proxy** (`src/proxy.ts`) : Protection automatique des routes `/admin`, `/agency` et `/profile`.
- **Logs d'Audit** : Traçabilité des actions critiques via la table `AuditLog`.
- **Rate limiting** : Endpoints IA et avis protégés contre les abus.

## 8. Conformité CDC vFinal (Avril 2026)
- ✅ Chemin A (formulaire IA) + Chemin B (lien magique `/trip/[slug]`).
- ✅ Matching /18, seuil 6, fallback « Nos prochaines dates disponibles », timeout IA 5s.
- ✅ Marketplace `/voyages` (filtres, pagination 12, badges complet / presque complet).
- ✅ Booking + Stripe Checkout + annulations token.
- ✅ Dashboards agence / admin + emails E1–E9 (E14 cron si configuré).
- ❌ Hors scope CDC V1 : offres sur-mesure, vols/hôtels temps réel, app native.
- ⚠️ Au-delà du CDC V1 (conservé) : Stripe Connect, tableau décisionnel analytics, guide IA profil.

## 9. Tableau de bord décisionnel (Analytics comportementales)

Module académique aligné sur trois axes :

### 9.1 Parcours utilisateurs (User Journey Analytics)
- **Collecte** : table `BehaviorEvent` + tracker client (`BehaviorTracker`) sur les pages publiques.
- **Funnel** : Visite → Recherche IA → Match → Fiche voyage → Checkout → Réservation.
- **API** : `POST /api/analytics/track` (rate-limited), agrégation admin `GET /api/admin/decision-dashboard`.
- **Visualisation** : `/admin/decision-dashboard` — graphiques funnel, tendances mensuelles, top voyages.

### 9.2 Détection d'anomalies (plateforme collaborative)
Règles métier dans `AnomalyDetectionService` :
- Taux d'annulation anormal, réservations multiples même email, pics paiements échoués.
- Backlog modération avis, agences non vérifiées, pic demandes IA, sessions à activité intensive.
- Panneau **Indicateurs & alertes** avec statuts (bon / à surveiller / alerte).

### 9.3 Optimisation performance
- **KPIs** : CA acomptes, marge plateforme, conversion, nouveaux voyageurs, réservations.
- **Objectifs** : tableau réalisé vs cible (demandes IA, remplissage voyages, score matching).
- **Exploitation** : corrélation événements comportementaux ↔ réservations pour piloter l'UX.
- **Données démo** : `npm run analytics:seed` — remplit `BehaviorEvent` sur 30 jours (funnel réaliste).

---
*Livrable réalisé par l'équipe de développement pour le Maghreb Travel MVP.*
