# MaghrebVoyage — Production checklist (best stack)

## 1. Base de données (Neon)

```bash
cd TRAVEL
npx prisma migrate deploy
npm run health
```

Migration analytics comportementales : `20250603120000_behavior_analytics` (table `BehaviorEvent`, enum `JourneyStep`).  
Vérifier le tableau décisionnel : `/admin/decision-dashboard` (admin connecté).

## 2. IA + matching (recommandé : Groq + Llama)

Accueil : lanceur « Matching IA », hero vocal FR/EN/AR.

Le cœur produit : **structuration LLM** → **score /18** → **seuil 6 pts** → sinon fallback « prochains départs ».

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=sk-...          # secours automatique si Groq échoue
OPENAI_MODEL=gpt-4o-mini
OPENAI_DISABLE=false
```

Alternative : `LLM_API_KEY` + `LLM_BASE_URL=https://api.groq.com/openai/v1` (sans `GROQ_API_KEY`).
Seul OpenAI : `OPENAI_API_KEY` sans Groq.

Test : `/recherche` avec email → résultats **% COMPATIBLE** (pas « SUGGESTION ») si vrai match.

## 3. Emails (Resend)

```env
RESEND_API_KEY=re_...
RESEND_FROM="MaghrebVoyage <noreply@votredomaine.com>"
ADMIN_NOTIFY_EMAIL=admin@...
RESEND_DEV_TO=votre@email.com
```

Flux : inscription, réservation, prospect IA agence, newsletter.

## 4. Paiements (Stripe test puis live)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_CONNECT_DEFAULT_COUNTRY=FR
```

Migration : `npx prisma migrate deploy` (champs `stripeConnect*` sur `Agency`).

Agence → **Paramètres → Paiements → Connecter mon compte Stripe** (Express).  
Webhook : activer `account.updated` et `checkout.session.completed` dans le dashboard Stripe.

Quand Connect est actif (`charges_enabled`), les **acomptes checkout** utilisent `transfer_data` + `application_fee_amount` (`PLATFORM_FEE_PERCENT`, défaut 12 %).  
Les agences avec **Paiements reçus** activé reçoivent un email récap (brut / commission / net) après chaque acompte Connect.  
Les champs `payoutMode`, `platformFeeCents`, `agencyNetCents` sont enregistrés sur chaque `Payment`.  
Remboursements admin : `reverse_transfer` + `refund_application_fee` si Connect.

Migration : `20250531180000_payment_payout_agency_notify` (préférences email agence).

## 5. VAPI vocal (optionnel)

Dashboard → assistant FR → webhook `https://votre-domaine.com/api/vapi/webhook`  
Tools : `search_trips`, `save_travel_request`

```env
NEXT_PUBLIC_VAPI_PUBLIC_KEY=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
VAPI_WEBHOOK_SECRET=
```

## 6. Catalogue & RAG léger

Le guide personnel (`/profile` → Guide IA) injecte automatiquement les **voyages publiés** pertinents depuis la base (cache 5 min).

Export JSON optionnel :

```bash
npm run data:export
```

Fichier : `data/maghreb-catalog.json`

## 7. Vérifications

Setup complet local (migrations + seed + analytics + export catalogue) :

```bash
npm run setup:full
```

Rapport de préparation prod (typecheck, tests, env, DB, artefacts) :

```bash
npm run prod:ready
# avec serveur dev : npm run prod:ready -- http://localhost:3000
```

Audit HTTP + auth (serveur dev requis) :

```bash
npm run dev
npm run audit:all
```

```bash
npm run typecheck
npm run test
npm run build
```

Parcours manuel :

1. `/recherche` → match qualifié → `/voyages?matched=true`
2. Agence → **Prospects IA** après match avec email client
3. Admin → réservation confirmée → **Renvoyer email**
4. Admin → **Décisionnel** → funnel, alertes anomalies, objectifs performance  
   Données démo : `npm run analytics:seed` (événements comportementaux sur 30 jours)
5. Admin → **Paramètres → Notifications** → newsletter partenaires (agences opt-in)
6. Voyageur connecté → **Profil → Guide IA** ou bouton chat flottant
