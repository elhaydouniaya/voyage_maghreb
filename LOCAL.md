# MaghrebVoyage — setup local complet

Tout se lance depuis la **racine du repo** (`voyage/`), pas depuis `TRAVEL/` seul.

## 1. Installation (une fois)

```powershell
cd C:\Users\shahi\Downloads\voyage
cd TRAVEL
copy .env.example .env
# Éditez .env : DATABASE_URL, NEXTAUTH_SECRET (32+ caractères aléatoires)
cd ..
npm install
cd TRAVEL
npm install
cd ..
npm run local:finish
```

`local:finish` = migrations + seed + analytics démo + export catalogue + lint/tests/santé.

## 2. Lancer l'app

```powershell
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

## 3. Vérifier que tout est OK

Avec le serveur dev lancé :

```powershell
npm run local:verify
# ou audit HTTP complet :
npm run audit:all
```

## Comptes démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Client | `client@test.com` | `client123` |
| Agence | `agency@test.com` | `agency123` |
| Admin | `admin@maghrebvoyage.com` | `admin123` |

## Ce qui fonctionne en local sans config extra

| Fonction | Local |
|----------|-------|
| Catalogue, recherche IA, matching | ✅ (OpenAI ou fallback offline) |
| Réservation | ✅ mode démo sans Stripe, ou Stripe test |
| Emails réservation | ✅ envoyés après paiement (client + agence) — voir ci-dessous |
| Upload images agence | ✅ `public/uploads/` (pas besoin de Cloudinary) |
| Tableau décisionnel admin | ✅ après `npm run analytics:seed` |
| Stripe Connect agence | ⚠️ optionnel — onboarding Stripe test |
| Guide vocal VAPI | ⚠️ optionnel |

### Recevoir l'email de confirmation en local

Dans `TRAVEL/.env` :

```env
RESEND_API_KEY=re_...
RESEND_DEV_TO=votre@email.com   # toutes les confirmations arrivent ici en dev
```

Sans `RESEND_API_KEY` : le contenu s'affiche dans la **console du serveur** (`npm run dev`).

Après réservation, la page succès indique si l'email a été envoyé.

## Parcours à tester (5 min)

1. `/recherche` → décrire un voyage → voir les matchs
2. `/trip/...` → réserver (démo ou carte `4242 4242 4242 4242`)
3. Agence → `/agency/trips/new` → uploader une photo → publier
4. Admin → `/admin/decision-dashboard` → funnel + alertes

## Stripe webhook (optionnel en local)

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Sans webhook : le **mode démo** confirme quand même la réservation.

## Commandes utiles

| Commande | Rôle |
|----------|------|
| `npm run dev` | Serveur |
| `npm run local:finish` | Setup DB + données démo + vérif statique |
| `npm run local:verify` | Lint + tests + health (+ audit si dev actif) |
| `npm run audit:all` | Audit HTTP + auth + health |
| `npm run health` | État DB + comptes démo |
