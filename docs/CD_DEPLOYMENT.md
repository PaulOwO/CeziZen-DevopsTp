# Déploiement continu local (CD)

Ce document décrit l'étape de **Continuous Deployment** : faire tourner
automatiquement l'image publiée en CI, sur la machine cible, dès qu'une version
valide est produite. Il couvre le TP « Déploiement local ».

Voir aussi [DOCKER_AND_RELEASE.md](DOCKER_AND_RELEASE.md) (image + release),
[CICD_OVERVIEW.md](CICD_OVERVIEW.md) (pipeline complet),
[decisions.md](decisions.md) (justification des choix) et
[NOTES_PEDAGOGIQUES.md](NOTES_PEDAGOGIQUES.md) (annexe éducative).

---

## 1. De la livraison au déploiement

La CI existante s'arrêtait à **« l'image est publiée sur GHCR »** — c'est de la
_Continuous Delivery_ (on livre un artefact prêt). Le CD ajoute la dernière
lettre : **faire tourner** cet artefact, sans intervention manuelle.

```
CI (existant)                            CD (ce TP)
build → test → push GHCR   ─[master]─►   .env←secrets → migrate → up -d (pull) → smoke test
```

**Le déclic : le runner self-hosted EST la machine cible.** Le job de déploiement
s'exécute sur le runner local ⇒ `docker compose up -d` crée les conteneurs sur
**cette machine**. On ne « pousse » rien vers la machine ; c'est elle qui exécute
son propre déploiement. Un runner cloud (`ubuntu-latest`) déploierait dans une VM
jetable, détruite en fin de job — d'où l'obligation d'un runner **self-hosted**
pour un déploiement local.

---

## 2. Bascule build → pull (`docker-compose.deploy.yml`)

Le `docker-compose.yml` de base **construit** l'image (`build:`) — pratique en dev.
Le déploiement, lui, doit **tirer l'image exacte testée et publiée** en CI
(reproductibilité) : on ne reconstruit pas sur la cible.

On utilise le mécanisme d'**override** de Compose : un second fichier ne contenant
que les _deltas_, fusionné avec le base.

```powershell
docker compose -f docker-compose.yml -f docker-compose.deploy.yml pull
docker compose -f docker-compose.yml -f docker-compose.deploy.yml up -d --no-build
```

`docker-compose.deploy.yml` remplace `build:` par `image:` sur `migrate` et `app` :

```yaml
services:
  migrate:
    image: ghcr.io/paulowo/cezizen-devopstp:${TAG:-latest}
    command: ['node', 'node_modules/prisma/build/index.js', 'migrate', 'deploy']
  app:
    image: ghcr.io/paulowo/cezizen-devopstp:${TAG:-latest}
```

| Élément      | Rôle                                                                                   |
| ------------ | -------------------------------------------------------------------------------------- |
| `${TAG}`     | Version à déployer (ex. `1.2.0`), injectée par le pipeline. `:-latest` = repli manuel. |
| `--no-build` | **Indispensable** : voir l'encadré ci-dessous.                                         |

> **Piège `build` + `image`.** Un override peut _ajouter_ `image:` mais ne peut pas
> _supprimer_ le `build:` du fichier de base. Après fusion, les deux coexistent sur
> `app`/`migrate` → un `up` classique risquerait de **rebuilder**. `docker compose pull`
> tire l'image, et `up -d --no-build` **interdit tout build** → on utilise strictement
> l'image tirée.

---

## 3. Migrations embarquées dans l'image (choix « 2B »)

### Le problème

L'image finale (`runner`) était volontairement **dépourvue de la CLI Prisma** (image
légère). Or `prisma migrate deploy` en a besoin. Comment migrer en ne tirant que
l'image publiée, sans build local ?

### La solution retenue

**Embarquer la capacité de migration dans l'image publiée** : une seule image,
auto-suffisante, qui porte l'app **et** ses migrations. Le `Dockerfile` copie la CLI
Prisma + ses moteurs (déjà téléchargés dans le `builder`) vers le stage `runner` :

```dockerfile
COPY --from=builder /app/node_modules/prisma  ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma  ./node_modules/@prisma
```

On **copie** plutôt que de réinstaller car :

- `npm ci` dans le `runner` relancerait le postinstall du projet (`nuxt prepare`),
  qui échoue faute de code source dans ce stage minimal ;
- `--ignore-scripts` éviterait ça mais empêcherait le téléchargement du moteur
  Prisma → `migrate deploy` planterait.

Le service `migrate` du déploiement réutilise donc **exactement la même image** que
`app`, avec seulement la commande surchargée (`node node_modules/prisma/build/index.js
migrate deploy`). On appelle le binaire par son chemin explicite (pas `npx`) pour
éviter toute tentative d'installation réseau.

> **Évolution vs le TP précédent.** En dev (base `docker-compose.yml`), le service
> `migrate` continue d'utiliser le stage `builder` (`build.target: builder`). En
> déploiement, il utilise l'image publiée avec Prisma embarqué. Les deux approches
> coexistent : voir [decisions.md](decisions.md).

### Ordre garanti : migrer AVANT de basculer l'app

Une nouvelle version qui démarre sur un schéma périmé échoue ou corrompt les données.
L'ordre est garanti **structurellement** par les `depends_on` du compose :

```
db (service_healthy) → migrate (service_completed_successfully) → app
```

`up -d` attend que `migrate` se termine avec succès avant de (re)démarrer `app`,
même en mode détaché.

### Idempotent & non destructif

| Exigence         | Mécanisme                                                                         |
| ---------------- | --------------------------------------------------------------------------------- |
| Rejouable N fois | `up -d` ne recrée que ce qui change ; `migrate deploy` ne rejoue que le manquant. |
| Non destructif   | Volume nommé `postgres_data` conservé — **jamais** `docker compose down -v`.      |
| Migrations sûres | `migrate deploy` applique les migrations versionnées, sans `reset` ni `push`.     |

Preuve d'idempotence (2ᵉ déploiement du même tag) :

```
3 migrations found in prisma/migrations
No pending migrations to apply.
```

> **Frontière TP2 → TP4.** Le TP précédent **générait** un script de migration en
> artefact (`migration.sql`, via `migrate diff`). Ce TP **applique** les migrations
> versionnées (`migrate deploy`). On applique un script versionné, jamais des
> changements manuels.

---

## 4. Déploiement automatique (`ci.yml`, job `deploy`)

Un second job `deploy` (dans `ci.yml`) s'exécute **après** le job `ci`, sur le même
runner local.

**Condition d'exécution :** push sur `master` **et** une version a été publiée.

```yaml
deploy:
  needs: ci
  runs-on: self-hosted
  if: >-
    github.ref == 'refs/heads/master' &&
    github.event_name == 'push' &&
    needs.ci.outputs.version != ''
```

### Passage de la version entre jobs

Le job `ci` **expose la version** publiée par semantic-release en sortie de job ;
`deploy` la lit via `needs.ci.outputs.version`. Absence de version ⇒ pas de nouvelle
image ⇒ pas de déploiement.

```yaml
# job ci
outputs:
  version: ${{ steps.publish.outputs.version }}
```

### Étapes du job `deploy`

| Étape          | Rôle                                                                              |
| -------------- | --------------------------------------------------------------------------------- |
| Checkout       | Récupère les fichiers compose (l'image, elle, vient de GHCR).                     |
| Write .env     | Génère le `.env` à partir des **GitHub Secrets** (jamais versionné).              |
| Log in to GHCR | `docker/login-action` pour tirer l'image (package privé).                         |
| Deploy         | `TAG=<version>` → `docker compose pull` puis `up -d --no-build`.                  |
| Smoke test     | Attend un **HTTP 200** sur `http://localhost:3000` (l'app déployée reste en vie). |

> **Port 3000 vs 3001.** L'app déployée occupe le **3000 en permanence**. Le smoke
> test _éphémère_ du job `ci` a donc été déplacé sur le **3001** pour ne pas entrer
> en conflit de port avec le déploiement.

---

## 5. Déploiement manuel (`deploy.yml`, `workflow_dispatch`)

Un workflow séparé permet de **redéployer à la demande**, utile pour les tests :
rejouer un déploiement, vérifier l'idempotence, ou revenir à une version précise
(rollback).

```yaml
on:
  workflow_dispatch:
    inputs:
      tag:
        description: "Tag d'image à déployer (ex. 1.2.0, ou latest)"
        default: latest
```

Lancement : onglet **Actions → « Deploy (manuel) » → Run workflow** → saisir le tag.
Les étapes sont identiques au job auto (`pull` → `migrate` → `up -d` → smoke test),
mais `TAG` vient de l'`input` au lieu de la sortie du job `ci`.

> **Pourquoi un fichier séparé et non le même job ?** Le déploiement auto a besoin de
> la sortie `version` du job `ci` (facile _dans_ le même workflow). Faire communiquer
> deux workflows pour se passer cette valeur est pénible. D'où : auto dans `ci.yml`,
> manuel autonome dans `deploy.yml` (léger doublon assumé pour la lisibilité).

---

## 6. Secrets de déploiement (GitHub Secrets)

Le runner checkout dans un dossier de travail **neuf** à chaque run : le `.env` local
de la machine n'y est pas présent. Les secrets sont donc stockés dans **GitHub
Secrets** (Settings → Secrets and variables → Actions) et le `.env` est **généré à la
volée** dans le job — jamais versionné.

| Secret                  | Rôle                                                 |
| ----------------------- | ---------------------------------------------------- |
| `POSTGRES_USER`         | Utilisateur PostgreSQL de l'environnement déployé.   |
| `POSTGRES_PASSWORD`     | Mot de passe PostgreSQL déployé.                     |
| `POSTGRES_DB`           | Nom de la base.                                      |
| `NUXT_SESSION_PASSWORD` | Secret de session nuxt-auth-utils (≥ 32 caractères). |

> **PostgreSQL fige ces identifiants au premier démarrage** (volume vide). Les changer
> ensuite ne met pas à jour le volume existant → connexions cassées. Ces valeurs sont
> donc définitives pour l'environnement, et distinctes du `.env` de dev (bonne pratique :
> secrets de déploiement ≠ secrets de dev).

---

## 7. Comportement à l'arrêt de la machine

Deux choses **indépendantes** :

|                        | Le **runner** (qui déploie)                | L'**app déployée** (conteneurs)       |
| ---------------------- | ------------------------------------------ | ------------------------------------- |
| Géré par               | Le processus runner (service/terminal)     | Le démon Docker + `restart: always`   |
| Si le runner s'arrête  | Plus de nouveau déploiement                | **Continue de tourner** (indépendant) |
| Au redémarrage machine | Reprend les jobs en file **si en service** | Revient **si Docker redémarre**       |

Points d'attention Windows :

- Le runner ne redémarre au boot **que s'il est installé en service** (`svc.cmd install`).
- Docker Desktop ne démarre **qu'après connexion de la session** Windows (ce n'est pas
  un vrai service de boot) → après reboot sans login, l'app reste éteinte malgré
  `restart: always`.
- Un push sur `master` pendant que la machine est éteinte : le job **attend en file**
  et se jouera au retour du runner.

> Limite assumée d'un déploiement sur poste perso vs un serveur 24/7 : la disponibilité
> est liée à l'allumage de la machine.

---

## Récapitulatif des fichiers

| Fichier                        | Rôle                                                                   |
| ------------------------------ | ---------------------------------------------------------------------- |
| `Dockerfile`                   | Le stage `runner` embarque désormais la CLI Prisma (migrations auto).  |
| `docker-compose.deploy.yml`    | Override de déploiement : bascule `build` → `pull` de l'image publiée. |
| `.github/workflows/ci.yml`     | Job `deploy` automatique sur release + sortie de version.              |
| `.github/workflows/deploy.yml` | Déploiement manuel à la demande (`workflow_dispatch`).                 |
