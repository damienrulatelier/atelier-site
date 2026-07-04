# Marée Haute — Atelier (ton site de vente d'œuvres)

Bonjour ! Voici ton site : une boutique pour vendre tes prints et ta bande
dessinée dédicacée, avec un espace admin pour gérer ton catalogue toi-même,
et un vrai système de paiement (carte via Stripe, PayPal).

## Ce que contient le site

- **Boutique publique** (`/`) : grille de prints + bloc bande dessinée, panier,
  champ dédicace personnalisable produit par produit.
- **Page de commande** (`/commande`) : choix Mondial Relay ou envoi postal,
  paiement par carte (Stripe) ou PayPal.
- **Espace admin** (`/admin`) : protégé par mot de passe, pour ajouter, modifier,
  masquer ou supprimer tes produits, avec plusieurs photos par produit et
  une case "proposer une dédicace" à activer produit par produit.

## Démarrer le site sur ton ordinateur (pour tester)

Il te faut [Node.js](https://nodejs.org) installé (version 20 ou plus récente).

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:3000 dans ton navigateur.
Pour l'espace admin : http://localhost:3000/admin/login

## Avant de mettre le site en ligne pour de vrai

### 1. Change le mot de passe admin

Ouvre le fichier `.env.local` et change cette ligne avec un mot de passe que
tu choisis :

```
ADMIN_PASSWORD=monatelier2026
```

Change aussi `SESSION_SECRET` par une longue phrase aléatoire (n'importe quoi,
tant que c'est long et que tu ne le partages à personne).

### 2. Connecte Stripe (paiement par carte)

1. Va sur https://dashboard.stripe.com/apikeys (connecte-toi à ton compte existant)
2. Copie ta **clé secrète** (elle commence par `sk_live_` une fois ton compte
   activé, ou `sk_test_` pour tester sans vrai argent)
3. Colle-la dans `.env.local` :
   ```
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
   ```

C'est tout — pas besoin de la clé publique pour le moment, le code actuel
n'en a pas besoin (Stripe héberge lui-même la page de paiement).

### 3. Connecte PayPal

1. Va sur https://developer.paypal.com/dashboard/applications et connecte-toi
   avec ton compte PayPal Business
2. Crée une "App" si tu n'en as pas déjà une, et récupère le **Client ID**
   et le **Secret**
3. Colle-les dans `.env.local` :
   ```
   PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
   PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxx
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=xxxxxxxxxxxxx
   PAYPAL_ENV=live
   ```
   (Les deux premières lignes ont la même valeur de Client ID — c'est normal,
   l'une est utilisée par le serveur, l'autre par le navigateur.)

Tant que `PAYPAL_ENV` n'est pas sur `live`, PayPal utilise un environnement
de test (sandbox) où aucun vrai argent ne bouge — utile pour essayer sans risque
avant de passer en vrai.

### 4. Mettre le site en ligne (hébergement)

Ce site doit être hébergé sur un service qui fait tourner du code serveur
(pas un simple hébergement de fichiers). Les options les plus simples et
gratuites pour démarrer :

- **Vercel** (https://vercel.com) — créé par les auteurs de Next.js, le plus
  simple : tu connectes ton compte GitHub, et il déploie automatiquement.
- **Railway** (https://railway.app) — alternative simple, avec un essai gratuit.

Dans les deux cas, il faudra :
1. Mettre ce projet sur GitHub (je peux t'aider si besoin)
2. Connecter le dépôt GitHub à Vercel ou Railway
3. Renseigner les mêmes variables que dans `.env.local` (mot de passe admin,
   clés Stripe/PayPal) dans les réglages du site sur la plateforme choisie —
   jamais en les écrivant dans le code lui-même.

Demande-moi de t'accompagner sur cette étape quand tu seras prêt·e, je peux
te guider clic par clic.

## Pour ajouter tes vrais produits

Connecte-toi sur `/admin/login`, puis "Ajouter un produit". Remplis le titre,
le prix, ajoute tes photos, et active la case dédicace si c'est un produit
personnalisé à la main (comme ta BD).

Les deux produits actuellement dans le catalogue ("Lumière du matin" et
"Le titre de ta bande dessinée") sont des exemples de démonstration —
modifie-les ou supprime-les pour les remplacer par tes vraies œuvres.
