# Dockerisation, Orchestration & Release versionnée

Ce document décrit la conteneurisation de l'application, son orchestration avec
Docker Compose, l'intégration Docker dans la CI, et le versioning sémantique des
images publiées. Il couvre les quatre parties du TP « Conteneurisation & Release ».

Voir aussi [CICD_OVERVIEW.md](CICD_OVERVIEW.md) (pipeline complet) et
[decisions.md](decisions.md) (justification des choix).

---

## 1. Dockerisation de l'application (`Dockerfile`)

L'application (Nuxt 4 + Prisma + PostgreSQL) est packagée dans une image Docker
**multi-stage** afin de produire une image finale légère et sûre.

### Structure multi-stage

| Stage         | Base             | Rôle                                                                    |
| ------------- | ---------------- | ----------------------------------------------------------------------- |
| **`builder`** | `node:22-alpine` | Installe toutes les dépendances, génère le client Prisma, `nuxt build`. |
| **`runner`**  | `node:22-alpine` | Repart d'une image vierge, ne récupère que `.output/` + `prisma/`.      |

Le stage `builder` est **jeté** à la fin : les devDependencies, le code source et
les outils de compilation ne finissent pas dans l'image publiée.

### Optimisation du cache par couches

Les manifestes de dépendances sont copiés **avant** le code source :

```dockerfile
COPY package.json package-lock.json .npmrc ./
RUN npm ci          # couche mise en cache tant que les deps ne changent pas
COPY . .            # le code (qui change souvent) vient après
```

Résultat : modifier un composant Vue ne relance pas l'installation complète des
dépendances (`npm ci`, l'étape la plus lente).

### Points spécifiques à la stack

| Élément                  | Traitement                                                                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`.npmrc` copié**       | Contient `legacy-peer-deps=true` — indispensable car `@gouvminint/vue-dsfr` attend `@iconify/vue` v4 alors que le projet est en v5. Sans lui, `npm ci` échoue (ERESOLVE) dans le conteneur. |
| **OpenSSL**              | `apk add --no-cache openssl` dans les deux stages : requis par le moteur Prisma, absent d'alpine par défaut.                                                                                |
| **Client Prisma**        | `npx prisma generate` exécuté **dans** alpine → binaire `linux-musl` correct.                                                                                                               |
| **Utilisateur non-root** | `USER node` avant le `CMD` : l'app ne tourne pas en root (moindre privilège).                                                                                                               |
| **Port**                 | `EXPOSE 3000`, serveur lancé via `node .output/server/index.mjs`.                                                                                                                           |

### `.dockerignore`

Empêche de copier dans l'image : `node_modules` (binaires compilés pour Windows,
incompatibles Linux — `bcrypt`, moteur Prisma), les artefacts de build, `.git`,
et surtout les fichiers `.env` (aucun secret ne doit être embarqué dans une image).

### Construire et tester en local

```powershell
docker build -t cesizen:dev .
docker run --rm -p 3000:3000 cesizen:dev   # http://localhost:3000
```

Image finale obtenue : **~266 MB** (vs ~800 MB–1 GB sans multi-stage).

---

## 2. Orchestration avec Docker Compose (`docker-compose.yml`)

Trois services, démarrés et reliés par **une seule commande** (`docker compose up`).

| Service       | Rôle                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------- |
| **`db`**      | PostgreSQL 16, avec un `healthcheck` (`pg_isready`) : « démarré » ≠ « prêt à accepter des connexions ». |
| **`migrate`** | Job éphémère qui déploie le schéma (`npx prisma migrate deploy`) puis s'arrête.                         |
| **`app`**     | L'application Nuxt, construite depuis le `Dockerfile`.                                                  |

### Ordre de démarrage garanti

```
db (service_healthy) → migrate (service_completed_successfully) → app
```

- `app` et `migrate` attendent que `db` soit **saine** (`condition: service_healthy`).
- `app` attend en plus que `migrate` se soit **terminé avec succès**
  (`condition: service_completed_successfully`) → le schéma est déployé avant le démarrage.

### Réseau interne & DNS

Compose crée un réseau privé où chaque service est joignable **par son nom**.
L'app se connecte donc à la base via l'hôte `db`, pas `localhost` :

```
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

### Le job de migration séparé — pourquoi

L'image finale (`runner`) est volontairement dépourvue de la CLI Prisma. Le service
`migrate` réutilise donc le **stage `builder`** (`build.target: builder`), qui possède
la CLI + le schéma. C'est le pattern « init container » : la migration est un **job
distinct** de l'application, exécuté une fois avant le démarrage.

### Vérification

```powershell
docker compose up -d --build
docker compose ps          # db healthy, migrate exited(0), app up
docker compose logs -f app
docker compose down        # arrêt (conserve les données)
docker compose down -v     # arrêt + suppression du volume de données
```

Test de validation : la route `GET /api/pages/all` répond **HTTP 401** (route protégée,
la base répond) au lieu de **HTTP 500** (Prisma ne pouvait pas se connecter) — preuve que
l'app parle bien à la base.

### Variables d'environnement & secrets

Aucun secret n'est écrit en dur dans `docker-compose.yml` : les valeurs sont
injectées via un fichier **`.env`** (non versionné) que Compose charge automatiquement.
Un modèle **`.env.example`** (versionné, sans secret réel) sert de point de départ :

```powershell
cp .env.example .env   # puis renseigner des valeurs
docker compose up -d --build
```

| Variable                | Rôle                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `POSTGRES_USER`         | Utilisateur PostgreSQL (service `db`).                                                |
| `POSTGRES_PASSWORD`     | Mot de passe PostgreSQL — jamais en dur, uniquement dans `.env`.                      |
| `POSTGRES_DB`           | Nom de la base.                                                                       |
| `DATABASE_URL`          | Chaîne de connexion Prisma, composée à partir des variables ci-dessus → service `db`. |
| `NUXT_SESSION_PASSWORD` | Secret de chiffrement des cookies (nuxt-auth-utils, ≥ 32 caractères).                 |

> Le fichier `.env` est ignoré par git (`.gitignore`) **et** par Docker (`.dockerignore`) :
> aucun secret ne part ni dans le dépôt, ni dans l'image.

---

## 3. Intégration Docker dans la CI (`.github/workflows/ci.yml`)

Après les étapes de qualité existantes (lint, build, tests, garde-fou migrations),
le pipeline construit, vérifie et publie l'image. Il s'exécute sur le **runner local**
(`runs-on: self-hosted`).

| Étape (n°)                  | Rôle                                                                        |
| --------------------------- | --------------------------------------------------------------------------- |
| 12. Set image name          | Calcule `ghcr.io/<owner>/<repo>` en minuscules (exigence GHCR).             |
| 13. Build Docker image      | `docker build` → image « candidate » taguée `:<sha>`.                       |
| 14. Smoke test image        | Démarre l'image, attend un **HTTP 200** sur l'accueil ; échec du job sinon. |
| 15. Log in to GHCR          | `docker login` (master uniquement).                                         |
| 16. Semantic release        | Calcule la version + pose le tag (master uniquement, cf. §4).               |
| 17. Publish versioned image | Pousse `:X.Y.Z` + `:latest` + `:<sha>` (master uniquement, cf. §4).         |

### Identifiants stockés de manière sécurisée

Aucun mot de passe en clair. On utilise le **`GITHUB_TOKEN`** — jeton **éphémère**
injecté automatiquement par GitHub Actions à chaque run, jamais stocké manuellement.
Les droits sont accordés explicitement dans le workflow :

```yaml
permissions:
  contents: write # semantic-release : tag Git + Release GitHub
  packages: write # push de l'image sur GHCR
  issues: write
  pull-requests: write
```

Le login se fait via `--password-stdin` : le token passe par l'entrée standard,
**jamais** en argument de commande visible dans les logs.

```powershell
$env:GHCR_TOKEN | docker login ghcr.io -u ${{ github.actor }} --password-stdin
```

> **Prérequis GitHub** : _Settings → Actions → General → Workflow permissions_ doit être
> sur **« Read and write permissions »**, sinon le `GITHUB_TOKEN` ne peut ni pousser le
> tag ni publier sur GHCR.

### Build & vérification à chaque run, publication conditionnelle

- **PR / push `develop`** : build de l'image + smoke test. **Aucune publication.**
- **push `master`** : build + smoke test + release + publication.

La publication est conditionnée par `if: github.ref == 'refs/heads/master' && github.event_name == 'push'`.

---

## 4. Versioning sémantique des images (release)

### D'où vient le numéro de version ?

**Des commits conventionnels**, via [`semantic-release`](https://semantic-release.gitbook.io/).
Le numéro n'est **jamais saisi à la main**. La config est dans `.releaserc.json` :

```json
{
  "branches": ["master"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github"
  ]
}
```

### Qui incrémente quoi, et quand ?

Ce sont les **préfixes des messages de commit** (déjà imposés par commitlint) qui
décident du bump. semantic-release ne tourne que sur `master`.

| Préfixe de commit                    | Incrément SemVer | Exemple           |
| ------------------------------------ | ---------------- | ----------------- |
| `fix:`                               | **PATCH**        | `1.4.0` → `1.4.1` |
| `feat:`                              | **MINOR**        | `1.4.0` → `1.5.0` |
| `BREAKING CHANGE:` (corps de commit) | **MAJOR**        | `1.4.0` → `2.0.0` |
| `docs:`, `chore:`, `test:`, …        | aucun            | pas de release    |

Un push master ne contenant que des commits sans impact (`chore:`, `docs:`) **ne produit
aucune version** et ne publie rien. La première release est `1.0.0`.

### Chaîne de publication

```
push master
  └─ semantic-release
       ├─ analyse les commits depuis la dernière release
       ├─ calcule la version X.Y.Z
       ├─ crée le tag Git vX.Y.Z
       └─ crée la Release GitHub (notes de version = changelog auto)
  └─ Publish versioned image
       ├─ lit le tag posé sur le commit : git tag --points-at HEAD
       ├─ si vX.Y.Z → docker tag + push :X.Y.Z, :latest, :<sha>
       └─ sinon      → rien à publier
```

- Le tag **`X.Y.Z`** est **immuable** : il désigne toujours cette build précise → sert au **rollback**.
- Le tag **`latest`** est **mobile** : repoussé à chaque release, raccourci vers « la dernière version publiée ».
- Le tag **`<sha>`** relie directement une image à un commit Git.

### Condition de release

Garantie à **deux niveaux** : `"branches": ["master"]` dans `.releaserc.json`, **et**
la condition `if:` sur les étapes 16-17 du workflow. Aucune version n'est produite sur
une branche de feature.

### Comment retrouver, sur le registre, la version correspondant à un commit ?

Triple traçabilité :

| Point de départ | Chemin                                                                        |
| --------------- | ----------------------------------------------------------------------------- |
| Un commit       | `git tag --points-at <sha>` → `vX.Y.Z` ; ou l'image `ghcr.io/…:<sha>`.        |
| Une version     | Release GitHub `vX.Y.Z` → commit associé ; image `ghcr.io/…:X.Y.Z`.           |
| Le registre     | Chaque image porte `:X.Y.Z` **et** `:<sha>` → lien direct dans les deux sens. |

### Rollback (TP suivants)

Le tag version étant immuable, revenir à une version antérieure est explicite :

```powershell
docker pull ghcr.io/paulowo/cezizen-devopstp:1.3.0
```

---

## Récapitulatif des fichiers

| Fichier                    | Rôle                                                            |
| -------------------------- | --------------------------------------------------------------- |
| `Dockerfile`               | Image multi-stage, non-root, client Prisma généré.              |
| `.dockerignore`            | Exclut node_modules, artefacts, `.env` de l'image.              |
| `docker-compose.yml`       | Orchestration db + migrate + app (une seule commande).          |
| `.releaserc.json`          | Config semantic-release (branche master, 3 plugins).            |
| `.github/workflows/ci.yml` | Build + smoke test + release + publication versionnée sur GHCR. |
