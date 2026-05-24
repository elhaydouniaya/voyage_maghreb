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

## Scripts utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run health` | Vérification DB + env |
| `npm run prod:local` | Build + serveur prod local |

## Portails

| Rôle | Connexion |
|------|-----------|
| Voyageur | `/login` |
| Agence | `/agency/login` |
| Admin | `/admin/login` |

Comptes démo (dev) : voir `TRAVEL/README.md`.
