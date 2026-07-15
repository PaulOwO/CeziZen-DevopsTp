# Plan de sécurisation — CESIZen

> Application de santé mentale portée (fiction) par le Ministère de la Santé et de
> la Prévention, à destination du grand public. À ce titre elle traite des données
> personnelles et est susceptible d'être ciblée. Ce document décrit l'analyse des
> vulnérabilités et risques, les actions préventives et correctives, les solutions
> de chiffrement, la structuration sécurisée des développements, et l'organisation
> de gestion de crise. La conformité RGPD est détaillée dans
> [RGPD_COMPLIANCE.md](RGPD_COMPLIANCE.md).

---

## 1. Périmètre et surface d'attaque

| Composant                  | Technologie                         | Exposition                        |
| -------------------------- | ----------------------------------- | --------------------------------- |
| Front-Office / Back-Office | Nuxt 4 (SSR) / Vue 3 + DSFR         | Public (HTTP/S)                   |
| API applicative            | Nitro server routes (`server/api`)  | Public + routes protégées         |
| Authentification           | nuxt-auth-utils (cookies scellés)   | Publique (`/api/auth/*`)          |
| Base de données            | PostgreSQL 16 (Docker)              | Réseau interne Compose uniquement |
| Accès données              | Prisma ORM 5                        | Interne                           |
| Registre d'images          | GHCR (ghcr.io)                      | Privé (auth GITHUB_TOKEN)         |
| CI/CD                      | GitHub Actions (runner self-hosted) | GitHub + machine locale           |

**Points d'entrée principaux** : formulaires d'inscription/connexion, changement de
mot de passe, API publiques de lecture (pages d'info, exercices), interface
d'administration (gestion des comptes, pages, exercices).

---

## 2. Analyse des vulnérabilités et matrice des risques

### 2.1 Méthode

Chaque risque est coté selon **Probabilité (P)** × **Impact (I)** sur une échelle de
1 (faible) à 4 (critique). La **criticité** = P × I ; elle fixe la priorité de
traitement. Référentiel : OWASP Top 10 (2021) et bonnes pratiques ANSSI.

| Criticité (P×I) | Niveau   | Traitement                       |
| --------------- | -------- | -------------------------------- |
| 12 – 16         | Critique | Correction immédiate / bloquante |
| 6 – 11          | Élevé    | Correction planifiée court terme |
| 3 – 5           | Modéré   | Backlog priorisé                 |
| 1 – 2           | Faible   | Surveillance                     |

### 2.2 Matrice des risques

| #   | Risque / Vulnérabilité (OWASP)                          | P   | I   | P×I | Niveau | État                         |
| --- | ------------------------------------------------------- | --- | --- | --- | ------ | ---------------------------- |
| R1  | Injection SQL (A03)                                     | 1   | 4   | 4   | Modéré | ✅ Couvert                   |
| R2  | Vol de session / cookie (A07)                           | 2   | 4   | 8   | Élevé  | ✅ Couvert                   |
| R3  | Brute-force / credential stuffing sur `/api/auth` (A07) | 3   | 3   | 9   | Élevé  | ⚠️ Partiel                   |
| R4  | XSS stocké via contenu admin (`content`/`title`) (A03)  | 2   | 3   | 6   | Élevé  | ⚠️ À traiter                 |
| R5  | Clickjacking / framing (A05)                            | 2   | 2   | 4   | Modéré | ✅ Couvert                   |
| R6  | Élévation de privilège (accès admin) (A01)              | 2   | 4   | 8   | Élevé  | ✅ Couvert                   |
| R7  | Exposition de secrets (dépôt / image) (A05)             | 2   | 4   | 8   | Élevé  | ✅ Couvert                   |
| R8  | Dépendances vulnérables (A06)                           | 3   | 3   | 9   | Élevé  | ✅ Couvert                   |
| R9  | Compromission chaîne CI/CD (supply chain) (A08)         | 2   | 4   | 8   | Élevé  | ✅ Couvert                   |
| R10 | Données personnelles en clair / non conformité RGPD     | 2   | 3   | 6   | Élevé  | ⚠️ Partiel                   |
| R11 | Interruption de service (perte volume, machine éteinte) | 3   | 3   | 9   | Élevé  | ⚠️ Partiel                   |
| R12 | Validation d'entrée insuffisante (données corrompues)   | 3   | 2   | 6   | Élevé  | ⚠️ À traiter                 |
| R13 | Absence de journalisation / détection d'incident (A09)  | 3   | 2   | 6   | Élevé  | ⚠️ À traiter                 |
| R14 | Man-in-the-middle (transport non chiffré) (A02)         | 2   | 4   | 8   | Élevé  | ✅ Prévu (reverse proxy TLS) |

Légende état : ✅ mesure en place — ⚠️ partiellement couvert / action planifiée.

---

## 3. Actions préventives et correctives par risque

### R1 — Injection SQL ✅

- **Préventif** : accès aux données **exclusivement** via Prisma ORM (requêtes
  paramétrées). Aucun `$queryRaw`/`$executeRawUnsafe` dans le code (audité). Un
  point d'accès Prisma unique (`server/api/utils/prisma.ts`).
- **Correctif** : toute future requête brute devra utiliser `Prisma.sql` (tagged
  template) ; règle SonarCloud active sur les injections.

### R2 — Vol de session ✅

- **Préventif** : sessions **scellées et chiffrées** dans un cookie par
  nuxt-auth-utils (secret `NUXT_SESSION_PASSWORD` ≥ 32 caractères, injecté par
  secret, jamais versionné). Cookie `httpOnly` (inaccessible au JS → anti-XSS-vol),
  `secure` en production (HTTPS only), `sameSite=lax` (anti-CSRF de base).
  Expiration explicite fixée à **7 jours** (`nuxt.config.ts` → `runtimeConfig.session.maxAge`).
- **Correctif** : rotation du secret de session + invalidation en cas de fuite ;
  réduction du `maxAge` si besoin.

### R3 — Brute-force / credential stuffing ⚠️

- **Préventif en place** : message d'erreur **générique** au login (« Email ou mot
  de passe incorrect ») → pas d'énumération de comptes ; blocage des comptes
  désactivés (`isActive`) ; hachage bcrypt **coût 12** (OWASP) qui ralentit
  volontairement chaque essai.
- **Action planifiée (correctif prioritaire)** : ajout d'un **rate-limiting** sur
  `/api/auth/login`, `/api/auth/register` et `/api/users/password` (limite par IP +
  par compte, ex. 5 tentatives / 15 min), via un middleware Nitro ou `nuxt-security`.
  Compteur d'échecs → verrouillage temporaire. CAPTCHA après N échecs.
- **Résiduel accepté** : la register renvoie 409 si l'email existe (fuite mineure
  d'existence) — à masquer ultérieurement (réponse uniforme + e-mail de
  confirmation).

### R4 — XSS stocké ⚠️

- **Préventif en place** : Vue **échappe par défaut** l'interpolation `{{ }}` ; DSFR
  ne rend pas de HTML brut. En-tête **Content-Security-Policy** restrictif
  (`default-src 'self'`, `object-src 'none'`) qui limite l'exécution de scripts
  injectés.
- **Action planifiée** : **sanitisation** (ex. `sanitize-html`) des champs libres
  administrateur (`Page.content`, `Page.title`, descriptions d'exercices) au moment
  de l'écriture ; interdiction de `v-html` sur ces contenus ; durcissement CSP par
  **nonces** (retrait de `'unsafe-inline'`).

### R5 — Clickjacking ✅

- **Préventif** : en-têtes **`X-Frame-Options: DENY`** et
  **`Content-Security-Policy: frame-ancestors 'none'`** appliqués à toutes les
  routes (`nuxt.config.ts`).

### R6 — Élévation de privilège ✅

- **Préventif** : **contrôle d'autorisation côté serveur** sur **toutes** les routes
  mutantes/admin : `requireUserSession(event)` + `if (user.role !== 'ADMIN') → 403`
  (audité sur les 11 handlers). Le middleware client `admin.ts` n'est qu'un confort
  d'UX — la frontière réelle est l'API. Rôle stocké en base (`Role` enum), non
  modifiable par l'utilisateur.
- **Correctif** : tests de non-régression d'autorisation ; revue de toute nouvelle
  route pour vérifier la présence du garde `requireUserSession`.

### R7 — Exposition de secrets ✅

- **Préventif** : aucun secret en dur (audité). `.env` **ignoré par git ET Docker**
  (`.gitignore`, `.dockerignore`) ; modèle `.env.example` sans valeur réelle.
  Secrets de déploiement en **GitHub Secrets**, `.env` généré à la volée dans le job.
  Login GHCR via `GITHUB_TOKEN` éphémère. SonarCloud détecte les secrets en dur
  (règles S2068/S6698 — déjà traitées, cf. [decisions.md](decisions.md)).
- **Correctif** : rotation immédiate + purge d'historique (`git filter-repo`) en cas
  de fuite ; révocation du token concerné.

### R8 — Dépendances vulnérables ✅

- **Préventif** : **Dependabot** (`.github/dependabot.yml`) sur npm, GitHub Actions
  et Docker → PR de mise à jour hebdomadaires, validées par la CI avant merge.
  **`npm audit`** hebdomadaire (`dependency-check.yml`). Veille documentée
  ([TECH_WATCH_STRATEGY.md](TECH_WATCH_STRATEGY.md)).
- **Correctif** : patch de sécurité déployé sous **24 h** (cf. MAINTENANCE_PLAN).

### R9 — Compromission de la chaîne CI/CD (supply chain) ✅

- **Préventif** : **actions GitHub épinglées à un SHA de commit immuable** (pas de
  tag mutable) sur tous les workflows → on exécute exactement le code audité.
  `permissions:` minimales par workflow. Runner self-hosted isolé.
- **Correctif** : Dependabot (écosystème `github-actions`) bumpe les SHA de façon
  contrôlée ; revue des workflows à chaque PR.

### R10 — Données personnelles / RGPD ⚠️

- Voir [RGPD_COMPLIANCE.md](RGPD_COMPLIANCE.md). Mots de passe **hachés** (jamais en
  clair). Actions planifiées : chiffrement/pseudonymisation, droit à l'effacement,
  portabilité, registre de traitement, minimisation.

### R11 — Interruption de service ⚠️

- **Préventif en place** : `restart: always` sur `db` et `app` ; healthcheck
  PostgreSQL ; volume nommé **persistant** (jamais `down -v`) ; déploiement
  **idempotent et non destructif** ; image versionnée immuable → **rollback**
  possible (`docker pull …:X.Y.Z`).
- **Résiduel assumé (contexte TP)** : déploiement sur poste perso → disponibilité
  liée à l'allumage de la machine et de Docker Desktop. **Cible production** :
  serveur 24/7, sauvegardes régulières de la base (`pg_dump` planifié + rétention),
  supervision uptime.

### R12 — Validation d'entrée ⚠️

- **En place** : contrôles manuels (champs requis, format e-mail, longueur mot de
  passe, types sur `users/modify`).
- **Action planifiée** : schémas de validation **zod** sur tous les `POST`/`PATCH`
  (bornes des durées d'exercice, longueurs max des champs texte, types stricts) →
  rejet **400** avant tout accès base. Empêche données corrompues et réduit la
  surface d'attaque.

### R13 — Journalisation / détection ⚠️

- **Action planifiée** : journalisation structurée des évènements de sécurité
  (échecs d'auth, accès admin, erreurs 5xx) ; agrégation + alerte ; supervision
  (uptime, temps de réponse). Support à la « notification d'incident » demandée par
  le cahier des charges.

### R14 — Transport (MITM) ✅/prévu

- **Cible** : **HTTPS/TLS obligatoire** en production via reverse proxy (Nginx/
  Traefik + Let's Encrypt) devant le conteneur `app`. En-tête **HSTS** déjà émis par
  l'application (`Strict-Transport-Security`, 2 ans, `includeSubDomains`). Redirection
  HTTP→HTTPS au niveau du proxy.

---

## 4. Solutions de chiffrement et cryptage

| Donnée / canal                | Mécanisme                                                      | État                    |
| ----------------------------- | -------------------------------------------------------------- | ----------------------- |
| Mots de passe                 | Hachage **bcrypt** (coût 12, salt intégré) — jamais réversible | ✅ En place             |
| Cookies de session            | Chiffrement/scellement (nuxt-auth-utils, secret ≥32c)          | ✅ En place             |
| Transport navigateur↔serveur  | **TLS 1.2+/HTTPS** (reverse proxy en prod) + HSTS              | ✅ HSTS émis / TLS prod |
| Secrets d'infrastructure      | GitHub Secrets (chiffrés au repos par GitHub)                  | ✅ En place             |
| Données personnelles au repos | Chiffrement disque + pseudonymisation ciblée (roadmap RGPD)    | ⚠️ Planifié             |

> **Principe** : les mots de passe sont **hachés** (fonction à sens unique + salt),
> pas « chiffrés » — on ne doit jamais pouvoir les déchiffrer. Le transport et les
> cookies utilisent du **chiffrement** (réversible avec la clé).

---

## 5. Structuration des développements et bonnes pratiques

- **Flux Git contraint** : `feature/* → develop → master` imposé par status check
  (`enforce-master-source`) ; push direct interdit ; 1 approbation obligatoire ;
  force-push bloqué ; règles appliquées aux admins.
- **Qualité automatisée** : Prettier (pre-commit), ESLint (CI bloquant), Commitlint
  (conventional commits), **SonarCloud** (Quality Gate + Security Hotspots 100 %
  revus sur le nouveau code).
- **Tests** : unitaires **Vitest** + end-to-end/non-régression **Playwright**
  (captures de référence). La CI échoue si un test échoue → aucune publication d'un
  artefact non vérifié.
- **Conteneur durci** : image multi-stage minimale (~266 Mo), utilisateur
  **non-root** (`USER node`), pas de secret embarqué (`.dockerignore`).
- **Moindre privilège** : `permissions:` explicites et minimales dans les workflows ;
  `GITHUB_TOKEN` éphémère.
- **Revue de sécurité** : template d'issue « Security Incident » + politique
  [SECURITY.md](../SECURITY.md) (divulgation privée coordonnée).

---

## 6. Notification d'incident, escalade et gestion de crise

### 6.1 Détection

Monitoring/erreurs en production, alertes de performance, `npm audit`/Dependabot,
Security Hotspots SonarCloud, remontées utilisateurs (issue `security`).

### 6.2 Chaîne d'escalade

```
Détection → Support L1 → Développeur L2 → Tech Lead / Architecte L3 → Direction / DPO
```

| Niveau | Rôle                   | Délai de réponse |
| ------ | ---------------------- | ---------------- |
| L1     | Support utilisateur    | < 2 h            |
| L2     | Développeurs           | < 4 h            |
| L3     | Tech Lead / Architecte | < 8 h            |

### 6.3 Délais de traitement selon la sévérité

| Sévérité | Exemple                            | Prise en compte | Correction |
| -------- | ---------------------------------- | --------------- | ---------- |
| Critique | Faille exploitée, fuite de données | 1 h             | 4 h        |
| Haute    | Vulnérabilité significative        | 4 h             | 1 jour     |
| Moyenne  | Risque modéré, contournable        | 1 jour          | 3 jours    |
| Basse    | Impact mineur                      | 3 jours         | 1 semaine  |

### 6.4 Procédure de gestion de crise (incident avéré)

1. **Qualification** : confirmer l'incident, coter la sévérité, ouvrir un ticket
   `security` privé.
2. **Confinement** : isoler (désactiver la route/compte affecté, révoquer les
   secrets, rollback vers une image saine `:X.Y.Z`).
3. **Éradication** : corriger la cause racine, déployer le correctif (patch < 24 h
   si critique).
4. **Notification** : information interne (escalade) ; **si violation de données
   personnelles → notification CNIL sous 72 h** et information des personnes
   concernées si risque élevé (cf. RGPD_COMPLIANCE §Violations).
5. **Communication** : message utilisateurs / page de statut, factuel et mesuré.
6. **Post-mortem** : analyse cause racine + actions correctives, via
   [incident-postmortem-template.md](incident-postmortem-template.md), sous 24 h.

---

## 7. Feuille de route sécurité (priorisée)

| Priorité | Action                                                     | Risque |
| -------- | ---------------------------------------------------------- | ------ |
| 1        | Rate-limiting sur les routes d'authentification            | R3     |
| 2        | Validation zod + sanitisation des contenus admin           | R4/R12 |
| 3        | Reverse proxy TLS + redirection HTTPS en production        | R14    |
| 4        | Droit à l'effacement / export RGPD (endpoints)             | R10    |
| 5        | Journalisation sécurité + supervision/alertes              | R13    |
| 6        | Durcissement CSP par nonces (retrait `'unsafe-inline'`)    | R4     |
| 7        | Sauvegardes automatisées PostgreSQL + test de restauration | R11    |

---

**Version** : 1.0 — **Dernière révision** : 2026-07-15
