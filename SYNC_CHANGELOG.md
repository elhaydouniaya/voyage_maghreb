# Synchronisation — branche `feature/enhanced-platform-sync`

Fusion de la version locale enrichie avec les **3 derniers commits** déjà sur `main` du dépôt [voyage_maghreb](https://github.com/elhaydouniaya/voyage_maghreb).

**PR :** https://github.com/elhaydouniaya/voyage_maghreb/pull/new/feature/enhanced-platform-sync

---

## Intégré depuis leur version (`main` — commits `ca7b23f` → `a4da9ea`)

Ces changements étaient sur GitHub mais pas en local ; ils ont été **fusionnés et conservés** :

### Trips par saison (commit `ca7b23f`)

| Fichier | Changement |
|---------|------------|
| `TRAVEL/src/lib/seasons.ts` | Utilitaires saison (SPRING/SUMMER/AUTUMN/WINTER), tri et groupement |
| `TRAVEL/src/components/trips/TripsGroupedBySeason.tsx` | Affichage des voyages groupés par saison |
| `TRAVEL/src/app/(public)/page.tsx` | Sélecteur de saison + voyages à la une par saison |
| `TRAVEL/src/app/(public)/destinations/page.tsx` | Ajustements destinations (régions, compteurs) |
| `TRAVEL/src/components/public/DestinationsSection.tsx` | Section destinations homepage |
| `TRAVEL/src/services/trips.service.ts` | Tri des voyages par saison |
| `TRAVEL/scratch/check-db.mjs`, `create-agency.mjs` | Scripts scratch dev |

### Correction page voyages (commit `67ecc23`)

| Fichier | Changement |
|---------|------------|
| `TRAVEL/scripts/seed-trips-by-season.ts` | Seed voyages répartis par saison |

### UI, auth, typings (commit `a4da9ea`)

| Fichier | Changement |
|---------|------------|
| `TRAVEL/src/app/(auth)/login/page.tsx` | Logo cliquable → retour accueil |
| `TRAVEL/src/app/(auth)/register/page.tsx` | Logo cliquable → retour accueil |
| `TRAVEL/src/app/admin/login/page.tsx` | Lien accueil sur le logo |
| `TRAVEL/src/app/agency/login/page.tsx` | Lien accueil sur le logo |
| `TRAVEL/src/app/(public)/trip/[slug]/page.tsx` | Boutons partage (WhatsApp, Facebook, Instagram, TikTok) |
| `TRAVEL/src/lib/auth-options.ts` | Corrections typage NextAuth |
| `TRAVEL/src/types/next-auth-extended.d.ts` | Extensions de types session JWT |
| `TRAVEL/src/lib/trip-format.ts` | Petit fix format voyage |
| `TRAVEL/src/components/layout/AdminPortalLayout.tsx` | Ajustements layout admin |
| `TRAVEL/src/components/admin/AdminCharts.tsx` | Fix affichage graphiques (hauteur conteneur) |
| `TRAVEL/scripts/check-admin-user.js` | Vérification compte admin |
| `TRAVEL/scripts/create-admin.ts` | Création admin CLI |
| `TRAVEL/scripts/test-admin-login.js` | Smoke test login admin |
| `TRAVEL/scripts/test-match.js` | Test payload matching IA |
| `TRAVEL/scripts/match-payload.json` | Exemple payload match |
| `TRAVEL/scripts/seed-trips-by-season.ts` | Seed saisonnier (MAJ) |

### Résolution des conflits (merge)

Lors de la fusion, les deux versions ont été combinées :

| Zone | Choix |
|------|-------|
| Homepage hero, IA, newsletter, TrustStrip | **Version locale** (enrichie) |
| Voyages à la une par saison | **Leur version** (`TripsGroupedBySeason`) |
| Page destinations (images pays) | **Version locale** (`COUNTRY_IMAGES` — leurs chemins `/rabat.jpg` etc. supprimés du repo) |
| Partage réseaux sur fiche voyage | **Leur version** (4 boutons sociaux) |
| Graphiques admin | **Version locale** (`ChartContainer` + fix responsive) |

---

## Ajouté depuis notre version locale (commit `fb4b4c3`)

Non présent sur `main` avant sync ; apport principal de la branche :

### Paiements & agences

- Stripe Connect (Express) — onboarding agence, `transfer_data`, commission plateforme 12 %
- Webhook Stripe enrichi (Connect, remboursements admin)
- Champs `payoutMode`, `platformFeeCents`, `agencyNetCents` sur `Payment`
- Emails récap paiement agence

### IA & matching

- Pipeline matching structuré (score /18, seuil 6 pts, fallback « prochains départs »)
- Groq + fallback OpenAI (`src/lib/llm.ts`)
- Guide personnel connecté (`/profile`, chat flottant)
- Prospects IA agence (`/agency/leads`)
- VAPI webhook (optionnel)

### Admin & analytics

- Tableau décisionnel (`/admin/decision-dashboard`)
- Événements comportementaux (`BehaviorEvent`, funnel, alertes)
- Notifications admin + newsletter partenaires agences
- Migration `20250603120000_behavior_analytics`

### Catalogue & UX

- Slugs agence (`/agence/[slug]` au lieu de `/agence/[id]`)
- Upload images local (`public/uploads/`) + Cloudinary optionnel
- Newsletter inscription, WhatsApp share helper
- Composants : `HomeAiLauncher`, `ProductPaths`, `TrustStrip`, `AiMatchPipeline`

### Qualité & ops

- Scripts : `audit:all`, `auth-smoke`, `prod:ready`, `setup:full`, `functional-audit`
- Tests unitaires (`src/lib/__tests__/`)
- `PRODUCTION_CHECKLIST.md`, `LOCAL.md`
- Export catalogue RAG (`data/maghreb-catalog.json`)
- Suppression backend Python legacy (`TRAVEL/backend/`)

### Migrations Prisma ajoutées

- `20250531120000_newsletter`
- `20250531140000_agency_leads`
- `20250531160000_stripe_connect`
- `20250531180000_payment_payout_agency_notify`
- `20250604120000_agency_slug`
- `20250604140000_confirmation_email_sent`

---

## Après merge sur `main`

```bash
cd TRAVEL
npm install
npx prisma migrate deploy
npm run seed
npm run dev
```

Puis avec le serveur actif :

```bash
npm run audit:all
```
