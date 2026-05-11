# 📘 DOCUMENTATION TECHNIQUE & VISION – MVP MAGHREB TRAVEL

Ce document résume l'architecture, la logique métier et la conformité du MVP par rapport au cahier des charges.

## 1. Vision & Positionnement (Section 1-4)
L'application n'est pas une simple agence de voyage en ligne (OTA), mais une **plateforme de qualification intelligente**. Elle transforme une intention humaine floue en une demande structurée exploitable par des experts locaux.

## 2. Architecture Technique (Module 8)
- **Framework** : Next.js 14 (App Router) pour une performance optimale et un SEO natif.
- **Base de données** : PostgreSQL avec Prisma ORM pour une gestion robuste des relations (Voyageur ↔ Demande ↔ Agence ↔ Offre).
- **Authentification** : NextAuth.js avec rôles (ADMIN, AGENCY) et middleware de protection des routes.
- **Paiements** : Intégration Stripe Checkout pour les acomptes/frais de service (Module 8.9).

## 3. Le Moteur IA (Module 3 & 8.3)
Situé dans `src/modules/ai/service.ts`, il utilise des modèles de langage pour :
1. **Structurer** : Extraire destination, durée, budget et type de voyage.
2. **Résumer** : Créer un "Résumé Commercial" pour l'agence.
3. **Taguer** : Générer des catégories (Famille, Culturel, etc.) pour le matching.

## 4. Logique de Matching (Module 5 & 8.5)
Le matching est **semi-automatique**. 
- Le système calcule un score de compatibilité basé sur les zones de couverture et les spécialités des agences.
- L'administrateur valide ou modifie les suggestions avant l'envoi final aux agences.

## 5. Dashboards & Fonctionnalités (Modules 4, 6, 10)
- **Admin** : Pilotage complet, gestion des leads, assignation manuelle et analytics avancés (conversion, top destinations).
- **Agence** : Espace sécurisé pour accepter/refuser des leads et envoyer des offres structurées.
- **Client** : Page dédiée pour consulter les offres reçues et procéder au paiement.

## 6. Sécurité & Audit (Section 7 & 21)
- **Middleware** : Protection automatique des routes `/admin` et `/agency`.
- **Logs d'Audit** : Traçabilité complète des actions critiques (assignation, création d'offre, changement de statut) via la table `AuditLog`.
- **Hachage** : Sécurisation des mots de passe agences via Bcrypt.

## 7. Conformité MVP (Section 13)
Ce projet respecte strictement la discipline de scope : 
- ✅ Qualification intelligente.
- ✅ Matching contrôlé.
- ✅ Paiement simple.
- ❌ Pas de réservation temps réel (hors scope MVP).
- ❌ Pas de moteur de pricing complexe (manuel pour l'agence).

---
*Livrable réalisé par l'équipe de développement pour le Maghreb Travel MVP.*
