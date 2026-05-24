# MaghrebVoyage

Plateforme de réservation de voyages de groupe au Maghreb (Next.js 14, Prisma, Stripe, OpenAI).

## Prérequis

- Node.js 20+
- PostgreSQL (Docker local ou [Neon](https://neon.tech))

## Installation

```bash
cp .env.example .env
npm install
npm run db:setup          # nouveau projet (db push + seed)
# ou, base déjà créée avec db push :
# npm run db:baseline && npm run seed
npm run dev
```

Application : [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

| Variable | Rôle |
|----------|------|
| `DATABASE_URL` | PostgreSQL |
| `NEXTAUTH_URL` | URL publique du site |
| `NEXTAUTH_SECRET` | Secret session (32+ caractères aléatoires) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Paiements |
| `NEXT_PUBLIC_APP_URL` | URL pour liens email et Stripe |
| `RESEND_API_KEY` / `RESEND_FROM` | Emails transactionnels |
| `ADMIN_NOTIFY_EMAIL` | Alertes nouvelles agences |
| `OPENAI_API_KEY` | Matching IA (optionnel, fallback local) |
| `CRON_SECRET` | Sécurisation cron rappel J-7 |

Sans Stripe : réservations en **mode démo** (confirmation immédiate).

## Comptes démo (développement uniquement)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Client | `client@test.com` | `client123` |
| Agence | `agency@test.com` | `agency123` |
| Admin | `admin@maghrebvoyage.com` | `admin123` |

Désactivés automatiquement en `NODE_ENV=production`.

## Parcours principaux

- **Client** : `/` → `/recherche` ou `/voyages` → `/trip/[slug]` → réservation sans compte
- **Agence** : `/agency/register` → validation admin → `/agency/trips`
- **Admin** : `/admin/login` → validation agences, réservations, paiements

## Stripe (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Carte test : `4242 4242 4242 4242`

## Cron rappel pré-voyage (J-7)

```bash
curl -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  http://localhost:3000/api/cron/pre-trip-reminder
```

Sur Vercel : configuré dans `vercel.json` (8h UTC).

## Déploiement (Vercel)

1. Importer le repo, racine `TRAVEL`
2. Renseigner les variables d'environnement (Preview = Stripe test, Production = live)
3. `npm run db:migrate` sur la base de production (`prisma migrate deploy`)
4. Vérifier les pages `/legal/*` avant activation Stripe live
5. Webhook Stripe prod : `https://votre-domaine.com/api/webhooks/stripe`

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:setup` | Schéma + seed (nouveau projet) |
| `npm run db:migrate` | Appliquer les migrations (prod) |
| `npm run db:baseline` | Marquer la migration initiale si la DB existe déjà |
| `npm run seed` | Données de démo |
| `npm run typecheck` | Vérification TypeScript |

## Structure

- `src/app` — pages et routes API
- `src/services` — logique métier
- `prisma/schema.prisma` — modèle de données
