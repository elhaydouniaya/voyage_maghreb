# Rapport de Projet de Fin d’Études 2025-2026

**5ème année — Ingénierie Informatique et Réseaux**

## Conception d’un tableau de bord décisionnel basé sur les données comportementales — Application à la plateforme MaghrebVoyage

**Réalisé par :** Emad Shahad  
**Classe :** 5iiR15  
**Encadré par :** M. Abderrahim HASBI & M. Hadji Moumane  
**Année universitaire :** 2025-2026

---

## Avant-propos

| | |
|---|---|
| **Nom et prénom** | Emad Shahad |
| **Intitulé du travail** | Conception d’un tableau de bord décisionnel basé sur les données comportementales — Application à la plateforme MaghrebVoyage |
| **Organisme d’accueil** | HADJI — Développement Applications France Monceau, Paris |
| **Établissement** | EMSI — École Marocaine des Sciences de l’Ingénieur |
| **Encadrant professionnel** | M. Hadji Moumane |
| **Encadrant pédagogique** | M. Abderrahim HASBI |
| **Période de stage** | Février — Juin 2026 |

---

## Dédicaces

Je dédie ce travail :

À Allah, le Tout-Puissant, pour m’avoir accordé la force, la patience et la persévérance nécessaires pour mener à bien ce projet.

À ma chère maman, Mme Naima Seriyej, pour son amour, ses sacrifices et son soutien constant tout au long de mon parcours académique.

À mon amie Wajd Bellazrak, avec qui j’ai partagé mes années à l’EMSI, pour sa collaboration et son encouragement.

À mes enseignants, pour leur encadrement, leur rigueur et la qualité de leur transmission du savoir.

Et à toutes les personnes qui m’ont soutenu, de près ou de loin, durant ce parcours.

---

## Remerciements

Je tiens à exprimer ma profonde gratitude à toutes les personnes ayant contribué à la réalisation de ce projet.

Je remercie mon encadrant de stage, M. Hadji Moumane, pour l’opportunité accordée, la confiance placée dans mon travail et les orientations techniques reçues tout au long du développement de MaghrebVoyage.

Je remercie mon encadrant académique, M. Abderrahim HASBI, pour son suivi rigoureux, ses remarques constructives et son aide à structurer ce rapport.

Je remercie également l’entreprise HADJI (Développement Applications France Monceau) pour l’environnement professionnel et la mission confiée en développement full-stack.

Mes remerciements vont enfin à l’ensemble de l’équipe pédagogique de l’EMSI, ainsi qu’à ma famille et mes proches pour leur soutien moral.

---

## Résumé

MaghrebVoyage est une plateforme web dédiée aux voyages de groupe vers les destinations du Maghreb. Développée avec Next.js, PostgreSQL et Prisma, elle met en relation des voyageurs et des agences partenaires autour d’un parcours structuré : recherche, recommandation, réservation et paiement en ligne.

**Le présent rapport porte principalement sur la conception et la réalisation d’un tableau de bord décisionnel.** Chaque action importante sur la plateforme — consultation d’une fiche voyage, soumission d’une demande, début de paiement, confirmation de réservation — produit une trace comportementale persistée dans la table `BehaviorEvent` par le composant `BehaviorTracker`, agrégée par `BehaviorAnalyticsService`, puis restituée à l’administrateur sous forme d’indicateurs (KPIs), de graphiques Recharts, d’entonnoir de conversion en six étapes et d’alertes générées par `AnomalyDetectionService`. L’interface dédiée est accessible via `/admin/decision-dashboard`.

Ma contribution personnelle a porté sur l’ensemble de cette chaîne analytique : modélisation des événements, collecte non bloquante côté client, API d’agrégation, règles d’alerte et interface de restitution interactive. La plateforme métier (matching sur 18 points, Stripe, Resend) constitue le contexte productif qui alimente le dashboard ; elle n’est pas l’objet central du rapport.

**Mots-clés :** tableau de bord décisionnel, analytics comportementales, BehaviorEvent, MaghrebVoyage, entonnoir de conversion, Next.js, Prisma, Recharts, tourisme.

---

## Abstract

MaghrebVoyage is a full-stack web platform for group travel booking in the Maghreb region. This report focuses on the design and implementation of a **decision dashboard** fed by behavioral data. User actions are tracked by `BehaviorTracker`, stored in `BehaviorEvent`, aggregated by `BehaviorAnalyticsService`, and rendered as KPIs, conversion funnels, monthly trends, objectives, and alerts produced by `AnomalyDetectionService`. Results are visualized with Recharts at `/admin/decision-dashboard`. The underlying travel platform (18-point matching engine, Stripe payments) provides the business context and data sources for analytics.

**Keywords:** decision dashboard, behavioral analytics, BehaviorEvent, MaghrebVoyage, conversion funnel, Next.js, Prisma, Recharts.

---

## Liste des abréviations

| Abréviation | Signification |
|-------------|---------------|
| ADMIN | Administrateur de la plateforme |
| API | Interface de programmation applicative |
| B2B2C | Business to Business to Consumer |
| CA | Chiffre d’affaires |
| CDC | Cahier des charges |
| EMSI | École Marocaine des Sciences de l’Ingénieur |
| IA | Intelligence artificielle |
| KPI | Indicateur clé de performance |
| LLM | Large Language Model |
| ORM | Object-Relational Mapping |
| PFE | Projet de fin d’études |
| RGPD | Règlement Général sur la Protection des Données |
| TTL | Time To Live (durée de validité) |

---

## Table des matières

1. Introduction générale  
2. Chapitre 1 — Contexte et cadre du projet  
3. Chapitre 2 — Analyse, conception et modélisation  
4. Chapitre 3 — Réalisation et validation  
5. Conclusion générale et perspectives  
6. Références bibliographiques  
7. Annexes  

---

## Liste des figures

- Figure 1 — Organigramme de l’entreprise d’accueil  
- Figure 2 — Architecture globale de MaghrebVoyage  
- Figure 3 — Diagramme de cas d’utilisation global  
- Figure 4 — Diagramme de cas d’utilisation de l’administrateur  
- Figure 5 — Diagramme de classes  
- Figure 6 — Pipeline de collecte des événements comportementaux  
- Figure 7 — Diagramme d’activité (entonnoir de conversion)  
- Figure 8 — Diagramme de séquence : demande de voyage et matching  
- Figure 9 — Diagramme de séquence : réservation et paiement Stripe  
- Figure 10 — Diagramme d’états-transitions d’une réservation  
- Figure 11 — Diagramme d’états-transitions d’un compte agence  
- Figure 12 — Diagramme de composants de l’application  
- Figure 13 — Diagramme de déploiement  
- Figure 14 — Fonctionnement du moteur de scoring (/18)  
- Figure 15 — Architecture du tableau de bord décisionnel  
- Figure 16 — Interface du tableau de bord décisionnel  

---

## Liste des tableaux

- Tableau 1 — Planning prévisionnel du stage  
- Tableau 2 — Correspondance KPI cahier des charges / dashboard  
- Tableau 3 — Objectifs stratégiques du tableau de bord  
- Tableau 4 — Fichiers source du module décisionnel  

---

# INTRODUCTION GÉNÉRALE

Le tourisme au Maghreb s’appuie sur un patrimoine culturel, historique et naturel reconnu. Pourtant, la réservation de voyages de groupe y reste souvent artisanale : échanges par messagerie, mises à jour manuelles des disponibilités, paiements dispersés. Les agences manquent d’outils centralisés ; les voyageurs peinent à comparer l’offre disponible.

Une plateforme web peut répondre à une partie de ces limites en centralisant les offres, en formalisant les demandes et en automatisant le paiement. Elle produit aussi des **données d’usage** : recherches, consultations de fiches, abandons au checkout, réservations confirmées. Ces informations n’ont de valeur que si elles sont collectées proprement et restituées de manière lisible aux responsables de la plateforme.

Ce projet de fin d’études s’inscrit dans cette double perspective. Nous avons contribué au développement de **MaghrebVoyage**, application de mise en relation entre voyageurs et agences, et **plus particulièrement à la conception d’un tableau de bord décisionnel** alimenté par des données comportementales. Ce module constitue le **fil rouge** du présent rapport : il permet à l’administrateur de lire l’activité, d’identifier les points de friction du parcours utilisateur et de suivre des objectifs de performance.

La problématique retenue est la suivante : *comment concevoir une plateforme de voyages de groupe capable de proposer des offres adaptées aux voyageurs, tout en exploitant les traces d’usage pour fournir un outil de pilotage fiable à l’administrateur ?*

Le rapport compte **trois chapitres**. Le premier présente le contexte et le cadre du stage. Le second détaille l’analyse des besoins, la conception UML et l’architecture du module analytique. Le troisième expose la réalisation technique du tableau de bord, les tests et le déploiement. Une conclusion générale clôt l’ensemble.

---

# CHAPITRE 1 — CONTEXTE ET CADRE DU PROJET

## 1.1 Introduction

Ce chapitre situe le projet dans son environnement professionnel et métier. Nous y présentons l’organisme d’accueil, l’état de l’existant, la problématique, les objectifs et la méthodologie adoptée.

## 1.2 Présentation de l’organisme d’accueil

Le stage s’est déroulé au sein de l’entreprise **HADJI**, connue commercialement sous le nom **Développement Applications France Monceau**. Basée à Paris, cette structure intervient dans le développement d’applications web et mobiles, l’intégration de services d’intelligence artificielle et l’accompagnement de projets numériques.

Le travail a été mené à distance. Les échanges avec l’encadrant de stage se faisaient par visioconférence ; le code était versionné sur GitHub. Cette organisation a demandé une autonomie importante, adaptée au profil du projet orienté développement full-stack.

*[Insérer Figure 1 — Organigramme de l’entreprise d’accueil]*

La **Figure 1** présente la structure organisationnelle de l’entreprise d’accueil HADJI (Développement Applications France Monceau). Elle situe la direction, les équipes de développement et le stagiaire au sein de l’organisme. Ce schéma permet de comprendre le cadre professionnel dans lequel le projet MaghrebVoyage a été réalisé.

Notre mission a porté sur **MaghrebVoyage** : développement de la plateforme, intégration du moteur de recommandation, **mise en place du suivi comportemental** et **réalisation du tableau de bord décisionnel** côté administrateur.

## 1.3 Contexte métier

Les voyages de groupe concernent des circuits organisés avec dates fixes et capacité limitée. La disponibilité et la composition du groupe sont aussi importantes que le prix. Or les outils couramment utilisés par les agences — réseaux sociaux, fichiers Excel, messagerie — ne garantissent ni un suivi fiable des demandes, ni une vision consolidée de l’offre pour le voyageur.

## 1.4 Étude de l’existant

Avant le projet, il n’existait pas de plateforme unique couvrant l’ensemble du cycle pour les voyages de groupe vers le Maghreb. Les insuffisances identifiées concernent quatre dimensions :

- **Organisationnelle** : informations dispersées entre agences et canaux informels ;
- **Technique** : absence de base centralisée et de gestion fiable des places ;
- **Fonctionnelle** : recherche d’offres peu personnalisée ;
- **Décisionnelle** : l’administrateur ne dispose pas d’indicateurs pour mesurer la conversion entre une demande et une réservation confirmée.

## 1.5 Problématique

La difficulté est double. D’une part, il faut faire correspondre une demande utilisateur à des offres structurées (dates, capacité, prix). D’autre part, il faut transformer l’activité de la plateforme en informations exploitables pour le pilotage.

La problématique peut se formuler ainsi : *comment concevoir une plateforme de voyages de groupe au Maghreb qui recommande des offres pertinentes de manière transparente, tout en collectant et restituant les données comportementales nécessaires à un tableau de bord décisionnel ?*

## 1.6 Objectifs

**Objectifs liés à la plateforme :** permettre la publication de voyages par les agences ; collecter les demandes via un formulaire structuré ; recommander des offres via un moteur de scoring sur 18 points ; assurer la réservation et le paiement en ligne via Stripe ; superviser l’ensemble via un compte administrateur.

**Objectifs liés au tableau de bord décisionnel (contribution centrale) :**

- Tracer le parcours utilisateur aux étapes clés ;
- Persister les événements en base (`BehaviorEvent`) ;
- Calculer des indicateurs (sessions, conversion, chiffre d’affaires, score de matching moyen) ;
- Visualiser entonnoir, tendances et alertes ;
- Exposer le tout dans `/admin/decision-dashboard`.

## 1.7 KPI produit et lien avec le dashboard

Plusieurs indicateurs ont été définis pour piloter MaghrebVoyage ; le tableau de bord décisionnel en est la **matérialisation technique**. Ils couvrent l’**adoption** (sessions, nouveaux voyageurs), l’**engagement** (volume d’événements, parcours funnel), la **conversion** (demandes → réservations), la **performance commerciale** (acomptes, remplissage) et la **qualité** (score de matching, satisfaction, alertes opérationnelles).

## 1.8 Méthodologie et planning

Le projet a été mené selon une approche incrémentale proche d’Agile Scrum. Les fonctionnalités ont été développées par blocs : authentification, voyages, recherche, matching, réservation, **analytics**. Des points réguliers avec l’encadrant ont permis de valider les priorités, notamment la séparation entre l’IA (structuration) et le moteur de matching (scoring déterministe).

*[Insérer Tableau 1 — Planning prévisionnel du stage / Figure Gantt]*

## 1.9 Conclusion du chapitre

Nous avons présenté le cadre du stage, le contexte touristique et les limites de l’existant. MaghrebVoyage répond au besoin de centralisation ; le tableau de bord décisionnel répond au besoin de visibilité sur l’usage réel. Le chapitre suivant formalise les besoins et la conception retenue.

---

# CHAPITRE 2 — ANALYSE, CONCEPTION ET MODÉLISATION

## 2.1 Introduction

Ce chapitre décrit ce que le système doit faire, les acteurs impliqués, la modélisation UML et l’architecture du module analytique. La plateforme métier est présentée comme **contexte** ; le **tableau de bord décisionnel** occupe la place centrale de la conception.

## 2.2 Acteurs du système

MaghrebVoyage distingue quatre profils, modélisés aux Figures 3 et 4.

Le **visiteur** consulte le catalogue, les fiches voyages et le guide IA en mode limité, sans pouvoir réserver. Le **voyageur** (`CLIENT`), authentifié par e-mail/mot de passe ou Google OAuth, soumet des demandes, reçoit des recommandations, réserve et paie ; son accès reste limité à ses propres données. L’**agence partenaire** (`AGENCY`) publie et gère ses voyages et consulte les prospects générés par le matching, sous réserve d’un compte **VERIFIED**. L’**administrateur** (`ADMIN`) supervise la plateforme et accède au **tableau de bord décisionnel** — seul acteur à exploiter directement les traces `BehaviorEvent`.

## 2.3 Besoins fonctionnels

Le système assure l’**authentification et la gestion des rôles** : inscription, connexion, sessions et restriction des routes selon le profil (CLIENT, AGENCY, ADMIN). Les **agences** s’inscrivent avec leurs informations professionnelles ; l’administrateur valide les demandes et suit les statuts PENDING, UNDER_REVIEW, VERIFIED, REJECTED et SUSPENDED. Les agences vérifiées **créent et publient des voyages** (destination, dates, prix, places, description, images) selon un cycle DRAFT, PUBLISHED, FULL, CLOSED, CANCELLED.

Côté voyageur, la **marketplace** permet de consulter, filtrer et ouvrir les fiches détaillées ; le formulaire `/recherche` recueille les préférences. Une **demande** peut être structurée optionnellement par un LLM, puis un **matching heuristique** propose le top 3 avec score /18 et compatibilité en %. La **réservation** vérifie les places disponibles, passe par le statut PENDING_PAYMENT, le paiement Stripe Checkout et la confirmation par webhook, avec protection contre le surbooking. Des **notifications** transactionnelles sont envoyées par e-mail via Resend.

L’**administrateur** dispose d’un **tableau de bord décisionnel** affichant KPIs, entonnoir, tendances, objectifs et alertes, avec filtres par période et par rôle.

## 2.4 Besoins non fonctionnels

En **performance**, les opérations courantes doivent répondre en moins de trois secondes. La **sécurité** repose sur NextAuth, un middleware RBAC, la validation côté serveur, HTTPS et le hachage des IP pour l’analytics. La **disponibilité** vise une haute disponibilité en production via un hébergement cloud.

La **maintenabilité** est assurée par la séparation des services métier, des routes API et des composants UI, avec Prisma pour l’accès aux données. L’**ergonomie** impose une interface responsive et des parcours distincts pour le voyageur, l’agence et l’administrateur.

## 2.5 Cas d’utilisation

*[Insérer Figure 3 — Diagramme de cas d’utilisation global]*

La **Figure 3** modélise les interactions entre les acteurs et le système MaghrebVoyage. Le visiteur consulte le catalogue et le guide IA en mode limité. Le voyageur authentifié soumet des demandes, consulte des recommandations, réserve et paie. L’agence publie et gère ses voyages ainsi que les leads générés par le matching. L’administrateur valide les agences et supervise la plateforme, notamment via le tableau de bord décisionnel.

*[Insérer Figure 4 — Diagramme de cas d’utilisation de l’administrateur]*

La **Figure 4** détaille les cas d’utilisation réservés à l’administrateur. Après authentification, il valide ou suspend les agences, supervise réservations et paiements, et consulte les journaux d’audit. Le cas central du projet est la consultation du tableau de bord décisionnel : l’administrateur sélectionne une période, visualise les indicateurs, l’entonnoir et les alertes, puis intervient sur la plateforme selon les résultats observés.

**Scénario nominal — Consulter le tableau de bord décisionnel :** l’administrateur authentifié accède à `/admin/decision-dashboard`, sélectionne une période (mois) et un filtre rôle optionnel. Le système appelle `GET /api/admin/decision-dashboard`. `BehaviorAnalyticsService` agrège KPIs, entonnoir, tendances et objectifs ; `AnomalyDetectionService` génère les alertes. `DecisionDashboardView` restitue les résultats via Recharts. En l’absence de données sur la période, des statistiques nulles s’affichent avec un message informatif.

Les parcours **matching** (Figure 8) et **réservation** (Figures 9 et 10) alimentent le funnel analytique mais ne constituent pas l’objet principal du rapport.

## 2.6 Architecture globale

MaghrebVoyage repose sur une architecture full-stack unifiée autour de **Next.js 16** (App Router). L’interface, les routes API et la logique métier cohabitent dans le même projet. Prisma assure l’accès à PostgreSQL. Les services externes — Stripe, Resend, LLM (Groq/OpenAI), Cloudinary, Google OAuth — sont consommés via HTTPS.

*[Insérer Figure 2 — Architecture globale de MaghrebVoyage]*

La **Figure 2** décrit l’architecture full-stack de MaghrebVoyage. Les acteurs (visiteur, agence, administrateur) accèdent à l’application via le navigateur. Next.js 16 regroupe l’interface React, les routes API et les services métier ; le `BehaviorTracker` alimente le suivi comportemental. Les données sont persistées dans PostgreSQL via Prisma. Les services externes (Stripe, Resend, LLM, Cloudinary, Google OAuth) sont appelés côté serveur en HTTPS.

La stack retenue comprend React 19, TypeScript 5, Tailwind CSS 4, Prisma 5.22, NextAuth.js 4.24, Recharts pour la visualisation analytique, Framer Motion pour les animations UI, Docker Compose pour PostgreSQL en local et Vercel pour le déploiement prévu. Les tests unitaires s’exécutent via `tsx --test`.

## 2.7 Modèle de données

Le schéma Prisma compte **18 modèles**. Les entités centrales du parcours métier sont `User`, `Agency`, `GroupTrip`, `TravelRequest`, `Booking` et `Payment`. Le module analytique s’appuie sur **`BehaviorEvent`**, relié optionnellement à `User`, avec les champs `step` (enum `JourneyStep`), `sessionId`, `path`, `metadata`, `role`, `ipHash`, `durationMs` et `createdAt`.

*[Insérer Figure 5 — Diagramme de classes]*

La **Figure 5** illustre le modèle objet de la plateforme. L’entité `User` est reliée aux réservations, demandes, favoris, avis et événements comportementaux. `GroupTrip`, `Booking` et `Payment` couvrent le cycle de réservation. `BehaviorEvent` centralise les traces exploitées par le tableau de bord. `AgencyLead` relie les demandes aux agences identifiées par le matching.

## 2.8 Moteur de structuration et matching (contexte)

Le module IA intervient en amont pour normaliser la demande (`structureDemand`). S’il est indisponible, une heuristique locale prend le relais. Le matching reste **déterministe** via `AIService.matchTrips()` : score sur **18 points** (destination, dates, budget, type, tags, places), seuil qualifié **≥ 6/18**, top 3 affiché, fallback « prochains départs disponibles » si aucun match qualifié.

*[Insérer Figure 14 — Fonctionnement du moteur de scoring (/18)]*

La **Figure 14** illustre le calcul du score de compatibilité sur 18 points. La destination vaut 5 points, le budget 4, les dates 4, le type de voyage 3 et la taille du groupe 2. Le score obtenu est rapporté à 18 pour produire un pourcentage de compatibilité. Les voyages sont triés par ordre décroissant ; seuls ceux atteignant au moins 6/18 sont qualifiés.

*[Insérer Figure 8 — Diagramme de séquence : demande de voyage et matching]*

Le diagramme de séquence ci-dessus décrit le processus de demande et de matching. Il fait intervenir le voyageur, l’interface `/recherche`, l’API `/api/ai/match`, `AIService`, `TripsService` et PostgreSQL. Le voyageur saisit ses préférences ; l’API sollicite `AIService.structureDemand()` pour normaliser la demande, puis `TripsService` récupère les voyages publiés. `AIService.matchTrips()` calcule le score /18, trie les résultats et renvoie le top 3 à l’interface. Des `AgencyLead` sont créés pour notifier les agences concernées.

Ce score alimente le KPI « score matching moyen » du tableau de bord.

## 2.9 Réservation et gestion des places (contexte)

Le système verrouille la ligne `GroupTrip` (`SELECT FOR UPDATE`), incrémente **`reservedSpots`** (et non `bookedSpots`) lors de la création d’une réservation `PENDING_PAYMENT` (TTL **30 minutes**), puis confirme via webhook Stripe : `bookedSpots` augmente et `reservedSpots` diminue. Les réservations expirées libèrent automatiquement les places (cron).

*[Insérer Figures 9, 10 et 11 — Séquence réservation, états réservation et agence]*

Le diagramme de séquence ci-dessus décrit la réservation et le paiement. Il fait intervenir le voyageur, l’API `/api/bookings`, `BookingsService`, `PaymentsService`, Stripe et Resend. Le voyageur remplit le formulaire ; `BookingsService.initiate()` verrouille le voyage, vérifie les places et crée une réservation `PENDING_PAYMENT`. `PaymentsService` ouvre une session Stripe Checkout. Après paiement, le webhook Stripe confirme la réservation, met à jour les places et déclenche l’e-mail de confirmation.

La **Figure 10** modélise le cycle de vie d’une réservation. Elle démarre en `PENDING_PAYMENT` (places bloquées 30 min), puis passe à `CONFIRMED` après paiement Stripe, à `EXPIRED` si le délai est dépassé, ou à `CANCELLED` en cas d’annulation. Une réservation confirmée peut ensuite devenir `REFUNDED` ou `NO_SHOW`.

La **Figure 11** modélise le cycle de vie d’un compte agence. L’inscription place l’agence en `PENDING`, puis l’administrateur la fait passer en `UNDER_REVIEW`. Elle devient `VERIFIED` après approbation ou `REJECTED` après rejet. Une agence vérifiée peut être `SUSPENDED` puis réactivée ; une agence suspendue peut être définitivement exclue (`REJECTED`).

## 2.10 Conception du tableau de bord décisionnel

### 2.10.1 Collecte des événements

Un composant **`BehaviorTracker`**, monté dans les layouts publics (`(public)`, `(auth)`, `booking`), observe les changements de route et envoie des événements vers `POST /api/analytics/track`. L’envoi est **asynchrone et non bloquant** (`keepalive: true`). Des appels explicites à `trackBehaviorEvent()` complètent les étapes critiques : `AI_MATCH_SUBMIT`, `CHECKOUT_START`, `BOOKING_CONFIRMED` (via `ReceiptTracker` sur le reçu).

Le parcours tracé compte **six étapes funnel** : `PAGE_VIEW` (catalogue), `SEARCH_START` (`/recherche`), `AI_MATCH_SUBMIT`, `TRIP_VIEW` (`/trip/[slug]`), `CHECKOUT_START`, `BOOKING_CONFIRMED` (`/booking/receipt/[code]`). Des événements secondaires (`LOGIN`, `REGISTER`, `GUIDE_CHAT`) enrichissent l’analyse hors entonnoir. **Le tracker n’enregistre pas les routes `/admin/*` et `/agency/*`.**

*[Insérer Figure 6 — Pipeline de collecte des événements comportementaux]*

Le diagramme ci-dessus décrit le pipeline de collecte comportementale. Il fait intervenir le navigateur, `BehaviorTracker`, l’API `POST /api/analytics/track` et la table `BehaviorEvent`. À chaque navigation ou action clé (recherche, matching, checkout, confirmation), un événement est envoyé de manière asynchrone puis persisté en base. Ces traces alimentent ensuite le tableau de bord décisionnel.

### 2.10.2 Agrégation et indicateurs

**`BehaviorAnalyticsService.getDecisionDashboard(periodOffset, roleFilter)`** centralise les calculs mensuels avec comparaison au mois précédent :

- Sessions actives (`sessionId` uniques) ;
- Volume d’événements et ratio événements/session ;
- Taux de conversion (réservations confirmées ÷ demandes `TravelRequest`) ;
- Réservations confirmées et CA acomptes (`depositPaid`) ;
- Nouveaux voyageurs (`CLIENT`) ;
- Entonnoir six étapes avec taux d’abandon ;
- Tendances sur six mois (événements + réservations) ;
- Segmentation par rôle, top voyages (`TRIP_VIEW`), score matching moyen ;
- Taux de remplissage et marge plateforme (`platformFeeCents`) ;
- Tableau d’objectifs (demandes, réservations, remplissage, score matching).

**`AnomalyDetectionService.detectAlerts()`** produit les alertes : conversion 7j, annulations, paiements échoués, avis en attente, agences non validées, pic demandes IA, sessions suspectes (>80 événements/24h), satisfaction (note moyenne avis).

*[Insérer Figure 7 — Diagramme d’activité (entonnoir)]*

La **Figure 7** modélise le parcours utilisateur en six étapes : visite du catalogue, recherche, soumission de demande, consultation de fiche, début de checkout et réservation confirmée. Le diagramme met en évidence les abandons entre chaque étape et alimente le calcul du taux de conversion du tableau de bord.

*[Insérer Figure 15 — Architecture du tableau de bord décisionnel]*

Le diagramme ci-dessus décrit l’agrégation des données du tableau de bord décisionnel, contribution centrale de ce projet de fin d’études. Il fait intervenir l’administrateur, `DecisionDashboardView`, la route `GET /api/admin/decision-dashboard`, `BehaviorAnalyticsService`, `AnomalyDetectionService` et PostgreSQL via Prisma. Le processus débute lorsque l’administrateur ouvre `/admin/decision-dashboard` et sélectionne une période. L’interface envoie une requête authentifiée par NextAuth. `BehaviorAnalyticsService` agrège les `BehaviorEvent`, réservations et paiements pour produire KPIs, entonnoir, tendances et objectifs. `AnomalyDetectionService` génère les alertes en parallèle. Le résultat JSON remonte vers l’interface, qui affiche le tableau de bord consolidé via Recharts.

Interface : `/admin/decision-dashboard` — API : `/api/admin/decision-dashboard`.

### 2.10.3 Correspondance KPI cahier des charges / dashboard

| KPI / besoin CDC | Indicateur dashboard | Source de données |
|------------------|----------------------|-------------------|
| Adoption | Sessions actives, nouveaux voyageurs | `BehaviorEvent`, `User` |
| Engagement | Événements, év. / session | `BehaviorEvent` |
| Parcours utilisateur | Entonnoir 6 étapes | `JourneyStep` |
| Conversion commerciale | Taux conversion, réservations | `Booking`, `TravelRequest` |
| Revenus | CA acomptes, marge plateforme | `Booking`, `Payment` |
| Qualité recommandations | Score matching moyen | Résultats `matchTrips` |
| Pilotage opérationnel | Alertes et objectifs | `AnomalyDetectionService` |

*Tableau 2 — Correspondance KPI cahier des charges / dashboard*

## 2.11 Architecture logicielle et déploiement

*[Insérer Figures 12 et 13 — Composants et déploiement]*

La **Figure 12** présente l’architecture en composants. L’interface React et le `BehaviorTracker` appellent les routes API, protégées par `proxy.ts` (RBAC). Les routes délèguent aux services métier (`BookingsService`, `AIService`, `BehaviorAnalyticsService`, etc.), qui accèdent à PostgreSQL via Prisma et aux services externes (Stripe, Resend, LLM, Cloudinary, Google OAuth).

La **Figure 13** décrit le déploiement en production. L’application Next.js est hébergée sur Vercel ; PostgreSQL est managé en cloud. Stripe, Resend, les LLM et Google OAuth communiquent en HTTPS. Des tâches cron (expiration des réservations, rappel J−7) s’exécutent via `/api/cron/*`. Les secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, clés API) sont stockés en variables d’environnement.

## 2.12 Conclusion du chapitre

L’analyse et la conception formalisent les besoins de MaghrebVoyage et définissent une architecture modulaire. Le tableau de bord s’inscrit comme **couche de lecture** alimentée par `BehaviorEvent`, distincte du dashboard administratif général centré sur l’activité opérationnelle. Le chapitre suivant expose la réalisation concrète.

---

# CHAPITRE 3 — RÉALISATION ET VALIDATION

## 3.1 Introduction

Ce chapitre expose la réalisation de MaghrebVoyage avec un focus sur le **tableau de bord décisionnel**, cœur de ce projet de fin d’études. Après le contexte et la conception (chapitres 1 et 2), il détaille l’implémentation, les interfaces produites, les tests et le déploiement.

## 3.2 Environnement et outils de développement

| Élément | Version / outil |
|---------|-----------------|
| OS | Windows 10/11 |
| Runtime | Node.js 20+, Next.js 16 |
| Langage | TypeScript 5 |
| Base de données | PostgreSQL 15 (Docker Compose) |
| ORM | Prisma 5.22 |
| IDE | Visual Studio Code |
| Versioning | Git, GitHub |
| Tests API | Postman |
| Tests unitaires | `tsx --test` |

L’application est développée dans le monorepo `TRAVEL/` avec les scripts `npm run dev`, `npm test`, `npm run analytics:seed` pour peupler les données de démonstration du dashboard.

## 3.3 Parcours instrumenté pour l’analytics

Le parcours voyageur pertinent pour le funnel analytique se résume ainsi :

1. **Accueil / catalogue** (`/`, `/voyages`) → `PAGE_VIEW`  
2. **Recherche** (`/recherche`) → `SEARCH_START`, puis `AI_MATCH_SUBMIT`  
3. **Fiche voyage** (`/trip/[slug]`) → `TRIP_VIEW`  
4. **Checkout** (`/booking/checkout`) → `CHECKOUT_START`  
5. **Reçu** (`/booking/receipt/[code]`) → `BOOKING_CONFIRMED`  

*[Insérer 3 à 4 captures : recherche, fiche voyage, checkout, Figure 16 ou extrait funnel]*

Ce parcours minimal remplace le catalogue exhaustif de toutes les interfaces ; les espaces agence et admin opérationnel existent mais sont hors périmètre analytics (non trackés par `BehaviorTracker`).

## 3.4 Tableau de bord décisionnel

### 3.4.1 Besoin métier et problème résolu

Avant ce module, l’administrateur disposait du dashboard général (`/admin/dashboard`) centré sur les réservations, agences et revenus, **sans vision consolidée du parcours utilisateur**. Les abandons entre recherche, fiche voyage et checkout restaient difficiles à quantifier.

Le tableau de bord décisionnel unifie les traces `BehaviorEvent` avec `Booking`, `TravelRequest` et `Payment` pour mesurer l’engagement, la conversion, la qualité du matching et les anomalies opérationnelles.

### 3.4.2 Architecture interne

*[Insérer Figure 15 — Architecture du tableau de bord décisionnel]*

Le flux suit le pattern suivant :

1. `DecisionDashboardView.tsx` (React) appelle `GET /api/admin/decision-dashboard` ;
2. La route API vérifie le rôle `ADMIN` (NextAuth) ;
3. `BehaviorAnalyticsService.getDecisionDashboard()` agrège les métriques ;
4. `AnomalyDetectionService.detectAlerts()` calcule les alertes en parallèle ;
5. La réponse JSON alimente les graphiques Recharts côté client.

### 3.4.3 Endpoint API et structure de réponse

**Requête :**

```
GET /api/admin/decision-dashboard?period=0&role=ALL
Authorization: session admin (NextAuth)
```

Paramètres : `period` (décalage en mois, 0 = mois courant), `role` (filtre ALL, CLIENT, etc.).

**Réponse JSON (structure principale) :**

- `period` : `{ label, start, end }`  
- `kpis[]` : `{ id, label, value, change, unit }` — 7 cartes (sessions, événements, ev/session, conversion, réservations, CA, nouveaux voyageurs)  
- `funnel[]` : `{ step, label, count, dropOff }` — 6 étapes  
- `monthlyTrend[]` : `{ label, events, bookings }` — 6 mois  
- `segmentBreakdown[]` : répartition par rôle  
- `topTrips[]` : voyages les plus consultés  
- `objectives[]` : `{ metric, actual, target, unit, achievementRate, status }`  
- `engagement` : métriques complémentaires  
- `alerts[]` : `{ id, title, description, severity, status, metric, value }`  

### 3.4.4 Indicateurs clés et graphiques

Le bandeau KPI affiche sept indicateurs avec **évolution vs mois précédent**. L’entonnoir visualise les six étapes du parcours et le **taux d’abandon** entre chaque phase. La courbe mensuelle croise événements comportementaux et réservations confirmées. Des graphiques en secteurs présentent la segmentation par rôle ; des barres classent les voyages les plus consultés.

*[Insérer Figure 16 — Interface du tableau de bord décisionnel]*

La **Figure 16** illustre l’interface réalisée du tableau de bord décisionnel. Elle affiche les KPIs avec évolution mensuelle, l’entonnoir de conversion en six étapes, les tendances, la segmentation par rôle, les alertes automatiques et le suivi des objectifs. Les filtres par période et par rôle permettent à l’administrateur d’affiner son analyse.

### 3.4.5 Système d’alertes

Le service génère automatiquement :

- **Taux de conversion** (7 jours) — statut bon / à surveiller ;
- **Annulations** — alerte si taux > 20 % ;
- **Paiements échoués** — alerte si ≥ 3 échecs Stripe sur 7 jours ;
- **Modération avis** — backlog si ≥ 5 avis pending ;
- **Agences en attente** — si ≥ 3 comptes non validés ;
- **Pic demandes IA** — variation > 100 % vs semaine précédente ;
- **Sessions suspectes** — > 80 événements en 24 h ;
- **Satisfaction** — note moyenne des avis approuvés.

Les badges vert / orange / rouge traduisent les statuts `good`, `watch`, `alert`.

### 3.4.6 Objectifs stratégiques

| Objectif | Cible (exemple) | Calcul du réalisé |
|----------|-----------------|-------------------|
| Demandes IA qualifiées | max(mois précédent, 10) | `COUNT(TravelRequest)` sur période |
| Réservations confirmées | max(mois précédent, 5) | `Booking` status CONFIRMED |
| Taux de remplissage voyages | 70 % | moyenne `bookedSpots / totalSpots` |
| Score matching moyen | 75 % | moyenne compatibilité `matchTrips` |
| Événements comportementaux | max(mois précédent, 50) | `COUNT(BehaviorEvent)` |

*Tableau 3 — Objectifs stratégiques du tableau de bord*

Le taux d’atteinte est visualisé par une barre de progression et un libellé (« En bonne voie », « À surveiller », « À améliorer »).

### 3.4.7 Fichiers source du module

| Fichier | Rôle |
|---------|------|
| `src/components/analytics/BehaviorTracker.tsx` | Collecte client, `trackBehaviorEvent()` |
| `src/components/analytics/ReceiptTracker.tsx` | Événement `BOOKING_CONFIRMED` |
| `src/lib/behavior-events.ts` | Enum funnel, `inferJourneyStepFromPath`, hash IP |
| `src/app/api/analytics/track/route.ts` | Persistance, rate limit, validation |
| `src/services/behavior-analytics.service.ts` | Agrégation KPIs, funnel, tendances |
| `src/services/anomaly-detection.service.ts` | Règles d’alerte |
| `src/app/api/admin/decision-dashboard/route.ts` | API admin |
| `src/components/admin/DecisionDashboardView.tsx` | UI Recharts |
| `src/app/admin/decision-dashboard/page.tsx` | Page admin |
| `scripts/seed-behavior-analytics.mjs` | Jeu de données démo (30 jours) |

*Tableau 4 — Fichiers source du module décisionnel*

### 3.4.8 Distinction avec le dashboard administratif général

Le dashboard général (`/admin/dashboard`) répond aux besoins **opérationnels** : réservations récentes, agences à valider, remboursements. Le **tableau de bord décisionnel** répond aux besoins **comportementaux** : où les utilisateurs abandonnent, comment évolue la conversion, quelles alertes nécessitent une action. Les deux interfaces coexistent dans la sidebar admin.

## 3.5 Modules techniques complémentaires (contexte)

- **`BookingsService`** : `SELECT FOR UPDATE`, `reservedSpots`, TTL 30 min, webhook Stripe ;
- **`TravelRequestsService`** : soumission et persistance des demandes ;
- **`AIService`** : `structureDemand` + `matchTrips` (/18) ;
- **`PaymentsService`** : Stripe Checkout et Connect.

## 3.6 Tests et validation

**Tests unitaires** (`npm test`) : 23 tests — schémas API, configuration LLM, matching, OAuth, paiements, similarité de destination, labels de statut.

**Tests manuels** (Postman) : `POST /api/analytics/track`, `GET /api/admin/decision-dashboard` (accès admin requis).

**Parcours bout en bout** : recherche → match → réservation → paiement test Stripe (`4242 4242 4242 4242`).

**Validation dashboard** : `npm run analytics:seed --prefix TRAVEL` remplit `BehaviorEvent` sur 30 jours avec un funnel réaliste ; vérification visuelle des KPIs, entonnoir et alertes sur `/admin/decision-dashboard`.

**Limites** : pas de tests de charge formalisés ; indicateurs sensibles au volume de trafic en phase de démarrage.

## 3.7 Déploiement

MaghrebVoyage a été développé et validé en environnement local (Next.js, PostgreSQL via Docker Compose). L’architecture de déploiement prévue repose sur Vercel, PostgreSQL cloud, webhook Stripe (`/api/webhooks/stripe`) et tâches cron (expiration réservations, rappel J−7).

À la date de rédaction, le déploiement en production n’est pas encore finalisé ; le tableau de bord et l’ensemble des fonctionnalités ont été validés en local.

## 3.8 Difficultés rencontrées et solutions

- **Concurrence sur les places** : résolu par verrouillage PostgreSQL et distinction `reservedSpots` / `bookedSpots` ;
- **Volume faible en dev** : script `analytics:seed` pour démonstration du funnel ;
- **Collecte non intrusive** : envoi asynchrone avec gestion d’erreur silencieuse côté client ;
- **Fallback funnel** : si `AI_MATCH_SUBMIT` ou `BOOKING_CONFIRMED` absents en `BehaviorEvent`, repli sur comptages `TravelRequest` / `Booking` pour éviter un entonnoir vide.

## 3.9 Conclusion du chapitre

La réalisation couvre la chaîne complète du tableau de bord décisionnel — de la collecte `BehaviorTracker` à la restitution Recharts — ainsi que le contexte plateforme nécessaire à son alimentation. Les tests et le jeu de données de démonstration valident le module en environnement local.

---

# CONCLUSION GÉNÉRALE ET PERSPECTIVES

Ce projet nous a permis de travailler sur un cas concret : digitaliser les voyages de groupe au Maghreb tout en dotant l’administrateur d’un **outil de pilotage basé sur les données comportementales**.

MaghrebVoyage répond à la première partie de la problématique en centralisant l’offre, en structurant la demande et en recommandant des voyages via un moteur explicable sur 18 points. Le **tableau de bord décisionnel** répond à la seconde partie en transformant les événements `BehaviorEvent` en indicateurs actionnables : KPIs, entonnoir, tendances, objectifs et alertes.

**Apports :** maîtrise d’une architecture Next.js full-stack ; conception d’un pipeline analytics bout en bout ; intégration Stripe/Resend/LLM ; compréhension d’une plateforme B2B2C multi-acteurs.

**Limites :** le matching reste fondé sur des règles fixes ; le dashboard dépend du volume de données collectées ; pas de tests de charge ; déploiement production en cours de finalisation.

**Perspectives :** exports CSV et rapports automatiques ; comparaison par agence ; affinage des recommandations via l’historique ; cache distribué en cas de montée en charge ; extension du tracking aux parcours agence si pertinent.

MaghrebVoyage et son tableau de bord décisionnel forment un ensemble cohérent : **la plateforme produit les données, le dashboard les rend lisibles pour la décision.**

---

# RÉFÉRENCES BIBLIOGRAPHIQUES ET NÉTOGRAPHIE

1. Documentation Next.js — https://nextjs.org/docs  
2. Documentation Prisma — https://www.prisma.io/docs  
3. Documentation PostgreSQL — https://www.postgresql.org/docs/  
4. Documentation Stripe — https://docs.stripe.com  
5. Documentation NextAuth.js — https://next-auth.js.org  
6. Documentation Resend — https://resend.com/docs  
7. Documentation Recharts — https://recharts.org  
8. Fowler M., *Patterns of Enterprise Application Architecture*, Addison-Wesley, 2002.  
9. Sommerville I., *Génie logiciel*, 10e éd., Pearson, 2015.  
10. Kaushik A., *Web Analytics 2.0*, Wiley, 2009.  

---

# ANNEXES

## Annexe A — Extrait du moteur de matching (`AIService.matchTrips`)

Phase 1 : filtres éliminatoires (PUBLISHED, places disponibles, date future).  
Phase 2 : scoring sur 18 points (destination, dates, budget, type, tags, places).  
Phase 3 : tri, top 3, seuil 6/18.

*[Insérer captures code du dépôt]*

## Annexe B — Extrait du tracking comportemental

**BehaviorTracker** — envoi asynchrone non bloquant vers `/api/analytics/track`.  
**Route API** — validation `JourneyStep`, rate limit, `hashIp`, persistance via `BehaviorAnalyticsService.recordEvent`.

*[Insérer captures code du dépôt]*

## Annexe C — Schéma Prisma (extrait `BehaviorEvent`)

```prisma
enum JourneyStep {
  PAGE_VIEW
  SEARCH_START
  AI_MATCH_SUBMIT
  TRIP_VIEW
  CHECKOUT_START
  BOOKING_CONFIRMED
  LOGIN
  REGISTER
  GUIDE_CHAT
}

model BehaviorEvent {
  id          String      @id @default(cuid())
  step        JourneyStep
  path        String?
  sessionId   String?
  userId      String?
  role        String?
  metadata    Json?
  ipHash      String?
  durationMs  Int?
  createdAt   DateTime    @default(now())
}
```

---

*Fin du rapport — Emad Shahad, EMSI 5iiR15, 2025-2026*
