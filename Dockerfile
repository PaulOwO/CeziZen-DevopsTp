# syntax=docker/dockerfile:1

##############################################
# STAGE 1 — builder : on compile l'application
##############################################
FROM node:22-alpine AS builder

# Prisma a besoin d'OpenSSL pour générer/exécuter son moteur de requêtes.
# (alpine est minimaliste : cette lib n'est pas incluse par défaut)
RUN apk add --no-cache openssl

WORKDIR /app

# 1) On copie D'ABORD les manifestes de dépendances (ils changent rarement).
#    Tant qu'ils ne bougent pas, la couche `npm ci` ci-dessous reste en cache.
#    .npmrc contient `legacy-peer-deps=true` : indispensable ici car
#    @gouvminint/vue-dsfr attend @iconify/vue v4 alors qu'on est en v5.
#    Sans lui, npm ci échoue (ERESOLVE) dans le conteneur.
COPY package.json package-lock.json .npmrc ./

# 2) Installation reproductible de TOUTES les dépendances (dev incluses :
#    on a besoin du compilateur Nuxt pour builder).
RUN npm ci

# 3) On copie le reste du code (ça change souvent → placé APRÈS npm ci).
COPY . .

# 4) Génère le client Prisma pour la plateforme du conteneur (linux-musl).
#    Comme on l'exécute DANS alpine, le binaire produit est le bon.
RUN npx prisma generate

# 5) Build Nuxt → produit le dossier autonome .output/
RUN npm run build


##############################################
# STAGE 2 — runner : image finale, légère
##############################################
FROM node:22-alpine AS runner

# OpenSSL nécessaire aussi à l'exécution pour le moteur Prisma.
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production
# Nitro (le serveur Nuxt) écoute sur ce port / cette interface.
ENV PORT=3000
ENV HOST=0.0.0.0

# On ne récupère QUE le résultat du build depuis le stage builder.
# Ni node_modules, ni code source, ni outils : image minimale.
COPY --from=builder /app/.output ./.output

# On garde le schéma + les migrations Prisma : utile pour lancer
# `prisma migrate deploy` au démarrage (déploiement du schéma en prod).
COPY --from=builder /app/prisma ./prisma

# Sécurité : on bascule sur l'utilisateur non-privilégié `node` fourni par
# l'image (au lieu de root). Principe du moindre privilège : si l'app est
# compromise, l'attaquant n'a pas les droits root dans le conteneur.
USER node

EXPOSE 3000

# Démarre le serveur Nuxt compilé.
CMD ["node", ".output/server/index.mjs"]
