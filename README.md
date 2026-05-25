# MaghrebVoyage (voyage_maghreb)

Plateforme de réservation de voyages au Maghreb — Next.js 14, Prisma, Stripe, Resend, OpenAI.

## Structure

- **`TRAVEL/`** — application Next.js (code principal)

## Démarrage rapide

```bash
cd TRAVEL
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Depuis la racine `voyage/` :

```bash
npm run dev
```

Application : [http://localhost:3000](http://localhost:3000)

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run health` | Vérification DB + env |
| `npm run prod:local` | Build + serveur prod local |

## Stripe webhooks (local)

Dans un **second terminal** (Stripe CLI requis) :

```bash
cd TRAVEL
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Carte test : `4242 4242 4242 4242`

## Portails

| Rôle | Connexion |
|------|-----------|
| Voyageur | `/login` |
| Agence | `/agency/login` |
| Admin | `/admin/login` |

Comptes démo (dev) : voir `TRAVEL/README.md`.
