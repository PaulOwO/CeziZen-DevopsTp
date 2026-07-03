# Vue d'ensemble CI/CD & Automatisations

Ce document décrit l'ensemble des mécanismes mis en place autour du code source :
outils locaux, hooks Git, pipelines GitHub Actions, analyse de qualité, protection des
branches et déploiement continu local. Le déploiement (CD) a son doc dédié :
[CD_DEPLOYMENT.md](CD_DEPLOYMENT.md).

---

## 1. Outils de qualité locale

Ces packages sont installés en `devDependencies` et s'exécutent sur le poste du développeur.

| Outil           | Package                                               | Rôle                                                                      |
| --------------- | ----------------------------------------------------- | ------------------------------------------------------------------------- |
| **Prettier**    | `prettier`                                            | Formateur de code automatique (JS, TS, Vue, JSON, CSS, Markdown).         |
| **lint-staged** | `lint-staged`                                         | Exécute Prettier uniquement sur les fichiers stagés (pas tout le projet). |
| **ESLint**      | `eslint` + `@nuxt/eslint`                             | Analyse statique du code — détecte les erreurs et mauvaises pratiques.    |
| **Husky**       | `husky`                                               | Gestionnaire de hooks Git — déclenche des scripts à chaque commit/push.   |
| **Commitlint**  | `@commitlint/cli` + `@commitlint/config-conventional` | Valide le format des messages de commit.                                  |

### Configuration Prettier (`.prettierrc`)

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Configuration lint-staged (`package.json`)

```json
"lint-staged": {
  "*.{js,ts,vue,json,css,md}": "prettier --write"
}
```

### Configuration Commitlint (`commitlint.config.cjs`)

Étend `@commitlint/config-conventional` — format imposé : `<type>: <description>`

Types autorisés : `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `ci`, `build`, `revert`

### Prettier vs ESLint — rôles complémentaires

Le linting se produit à **deux moments distincts** avec deux outils différents :

|                     | Pre-commit (local)          | Pipeline CI                  |
| ------------------- | --------------------------- | ---------------------------- |
| Outil               | Prettier (via lint-staged)  | ESLint                       |
| Rôle                | Formate le code             | Détecte les erreurs logiques |
| Action              | **Corrige automatiquement** | **Bloque si problème**       |
| Porte sur           | Fichiers stagés uniquement  | Tout le projet               |
| Peut être contourné | Oui (`--no-verify`)         | Non (bloque le merge)        |

**Prettier** gère le style visuel du code (indentation, guillemets, virgules…) sans analyser la logique.
**ESLint** analyse la logique du code (imports inutilisés, types `any`, règles Vue/TypeScript…) sans reformater.

---

## 2. Hooks Git (Husky)

Les hooks s'exécutent **localement** sur le poste du développeur à chaque action Git.
Ils constituent la première ligne de contrôle qualité, avant même que le code atteigne GitHub.

| Hook         | Déclencheur  | Outil                  | Rôle                                                                  |
| ------------ | ------------ | ---------------------- | --------------------------------------------------------------------- |
| `pre-commit` | `git commit` | lint-staged + Prettier | Reformate automatiquement les fichiers stagés avant le commit.        |
| `commit-msg` | `git commit` | Commitlint             | Rejette le commit si le message ne suit pas le format conventionnel.  |
| `pre-push`   | `git push`   | Script bash            | Bloque le push si le nom de branche ne respecte pas le format imposé. |

### Convention de nommage des branches

| Catégorie                      | Exemples                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Branches protégées (exemptées) | `master`, `develop`                                                                                        |
| Branches de travail            | `feature/nom`, `fix/nom`, `hotfix/nom`, `release/nom`, `docs/nom`, `chore/nom`, `refactor/nom`, `test/nom` |

---

## 3. Runner local GitHub Actions

Un **runner auto-hébergé** (self-hosted) est installé sur le poste du développeur.
Il reçoit les jobs GitHub Actions et les exécute localement — utile pour accéder à des ressources
locales (base de données, réseau interne) et éviter les coûts de runners cloud.

### Installation (Windows)

1. GitHub → Settings → Actions → Runners → New self-hosted runner → Windows
2. Exécuter les commandes fournies par GitHub dans un PowerShell administrateur :
   ```powershell
   mkdir actions-runner; cd actions-runner
   # (téléchargement + configuration fournis par GitHub avec token unique)
   ./config.cmd --url https://github.com/ORG/REPO --token TOKEN
   ./run.cmd
   ```
3. Le runner apparaît comme **Idle** dans GitHub dès qu'il est connecté.

### Installation en service Windows (démarrage automatique)

```powershell
./svc.cmd install
./svc.cmd start
```

Le runner tourne alors en arrière-plan sans terminal ouvert, visible dans `services.msc`.

### Référence dans les workflows

```yaml
runs-on: self-hosted
```

---

## 4. GitHub Actions — Workflows

### `ci.yml` — Pipeline CI principal

**Déclencheurs :** push ou PR vers `master` ou `develop`
**Runner :** self-hosted (local)

| Étape                     | Commande                           | Rôle                                                                                        |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Checkout                  | `actions/checkout@v4`              | Récupère le code source.                                                                    |
| Node.js                   | `actions/setup-node@v4` (v22)      | Installe Node.js 22 LTS.                                                                    |
| Install                   | `npm ci`                           | Installe les dépendances de façon strictement reproductible depuis le lock file.            |
| Lint                      | `npm run lint`                     | Analyse statique ESLint — échoue si des erreurs sont présentes.                             |
| Build                     | `npm run build`                    | Compile le projet Nuxt — échoue si une erreur de compilation est présente.                  |
| Tests                     | `npm test -- --run`                | Lance les tests unitaires Vitest en mode one-shot (pas de watch).                           |
| Start shadow database     | `docker run postgres:16`           | Démarre une base PostgreSQL jetable (port 5433, sans mot de passe) pour le garde-fou.       |
| Check pending migrations  | `prisma migrate diff --exit-code`  | Échoue si `schema.prisma` a des changements sans migration correspondante.                  |
| Generate migration script | `prisma migrate diff --script`     | Génère le SQL complet du schéma actuel sans toucher aucune base réelle.                     |
| Upload artifact           | `actions/upload-artifact@v4`       | Publie `migration.sql` comme artefact téléchargeable depuis GitHub Actions (30 jours).      |
| Stop shadow database      | `docker rm -f`                     | Détruit la base jetable (`if: always()`, même en cas d'échec précédent).                    |
| Set image name            | (PowerShell)                       | Calcule `ghcr.io/<owner>/<repo>` en minuscules (exigence GHCR).                             |
| Build Docker image        | `docker build`                     | Construit l'image « candidate » taguée `:<sha>`.                                            |
| Smoke test image          | `docker run` + `Invoke-WebRequest` | Démarre l'image et exige un **HTTP 200** sur l'accueil — échoue sinon.                      |
| Log in to GHCR            | `docker login --password-stdin`    | Connexion au registre (master uniquement) via `GITHUB_TOKEN`, jamais en clair.              |
| Semantic release          | `npx semantic-release`             | Calcule la version depuis les commits, pose le tag Git + Release GitHub (master only).      |
| Publish versioned image   | `docker tag` + `docker push`       | Pousse `:X.Y.Z` + `:latest` + `:<sha>` sur GHCR (master only, si une version est produite). |

**Notes techniques :**

- Les étapes Docker/release (build → smoke test → publication versionnée) sont détaillées dans [DOCKER_AND_RELEASE.md](DOCKER_AND_RELEASE.md).
- Le `GITHUB_TOKEN` a besoin de `contents: write` + `packages: write` (bloc `permissions:` du workflow) ; côté GitHub, _Workflow permissions_ doit être sur « Read and write ».
- `actions/checkout` utilise `fetch-depth: 0` : semantic-release exige l'historique complet + les tags.

- **`defaults.run.shell: powershell`** — le runner est sous Windows ; les scripts multi-lignes sont écrits en PowerShell 5.1 (natif, toujours présent). `shell: bash` avait été tenté mais pointait vers WSL (cassé) au lieu de Git Bash.
- **Shadow database** — Prisma exige une base jetable pour rejouer les migrations et détecter un drift. Elle est isolée de la base de dev (conteneur + port 5433 dédiés) et détruite en fin de job.
- SonarCloud n'est **pas** dans ce pipeline — il est déclenché automatiquement par la GitHub App SonarCloud sur chaque PR. Voir [decisions.md](decisions.md).
- **Actions épinglées à un SHA** — toutes les actions (`checkout`, `setup-node`, `upload-artifact`, `login-action`) sont épinglées à un SHA de commit immuable (`@<sha> # vX.Y.Z`) et non à un tag mutable, pour couper le risque _supply chain_ (Security Hotspot Sonar). Voir [decisions.md](decisions.md).
- Le smoke test de l'image tourne sur le **port 3001** (et non 3000) : le job `deploy` laisse l'app déployée occuper le 3000 en permanence.

### `ci.yml` — Job `deploy` (déploiement continu local)

**Déclencheur :** push `master` **et** une version a été publiée (`needs.ci.outputs.version != ''`)
**Runner :** self-hosted (local) — le déploiement a donc lieu sur cette machine.

| Étape          | Rôle                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| Checkout       | Récupère les fichiers compose (l'image vient de GHCR).                     |
| Write .env     | Génère le `.env` depuis les **GitHub Secrets** (jamais versionné).         |
| Log in to GHCR | `docker/login-action` — tire l'image (package privé).                      |
| Deploy         | `docker compose … pull` puis `up -d --no-build` (migrate → app).           |
| Smoke test     | Exige un **HTTP 200** sur `http://localhost:3000` (app déployée en ligne). |

Le job `ci` **expose la version** (`outputs.version`) que `deploy` lit via `needs`.
Détails complets dans [CD_DEPLOYMENT.md](CD_DEPLOYMENT.md).

---

### `deploy.yml` — Déploiement manuel à la demande

**Déclencheur :** `workflow_dispatch` (bouton _Run workflow_) avec un input `tag`
**Runner :** self-hosted (local)

Redéploie le tag choisi (défaut `latest`) selon la même logique que le job auto
(`pull` → `migrate` → `up -d` → smoke test). Utile pour les tests : rejouer un
déploiement, vérifier l'idempotence, ou revenir à une version précise (rollback).
Voir [CD_DEPLOYMENT.md](CD_DEPLOYMENT.md).

---

### `branch-check.yml` — Validation du nom de branche

**Déclencheurs :** push (hors `master`, `develop`) et ouverture de PR
**Runner :** ubuntu-latest (GitHub-hosted)

Deux jobs :

**`check-branch-name`** — valide le nom de la branche source :

1. Les branches `main`, `master`, `develop` sont exemptées.
2. Toute autre branche doit correspondre au format `<type>/<description>`.
3. En cas d'échec, le message d'erreur indique les types autorisés.

**`enforce-master-source`** — impose le flux `feature/* → develop → master` :

- Ne s'exécute que sur les PR ciblant `master` (`github.base_ref == 'master'`).
- Échoue si la branche source n'est pas `develop` (« develop strict » : `hotfix/*` et
  `release/*` directs vers master sont donc bloqués).
- À rendre **required** dans la protection de branche de `master` pour bloquer le merge.
  Garantit que l'état publié depuis `master` a toujours été intégré/testé sur `develop`.

---

### `issue-triage.yml` — Gestion automatique des Issues & PRs

**Déclencheurs :** ouverture ou réouverture d'une issue ou d'une PR

| Job                | Rôle                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `auto-label`       | Ajoute automatiquement un label (`bug`, `feature`, `security`) selon les mots-clés dans le titre.     |
| `priority-prompt`  | Poste un commentaire sur les nouvelles **issues** demandant de choisir une priorité (critical → low). |
| `auto-close-stale` | Marque les issues sans activité depuis 30 jours, les ferme après 60 jours d'inactivité totale.        |

> `priority-prompt` est limité aux issues uniquement (condition `github.event_name == 'issues'`) pour ne pas s'exécuter sur les PRs.

---

### `dependency-check.yml` — Surveillance des dépendances

**Déclencheurs :** chaque lundi à 9h UTC, ou manuellement (`workflow_dispatch`)

| Job                | Rôle                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `npm-audit`        | Analyse les vulnérabilités connues des dépendances, génère un rapport JSON en artifact.   |
| `dependency-check` | Détecte les packages obsolètes, ouvre une issue de maintenance si nécessaire.             |
| `security-headers` | Vérifie la présence de configuration des en-têtes de sécurité HTTP dans `nuxt.config.ts`. |

---

## 5. Analyse qualité — SonarCloud

SonarCloud analyse automatiquement chaque PR et chaque push sur `master`/`develop`, via la **GitHub App SonarCloud** (indépendante du pipeline `ci.yml`).

| Paramètre         | Valeur                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Organisation      | `paulowo`                                                            |
| Project Key       | `PaulOwO_CeziZen-DevopsTp`                                           |
| Config            | `sonar-project.properties`                                           |
| Dossiers analysés | Tout le projet                                                       |
| Dossiers exclus   | `node_modules/`, `dist/`, `.nuxt/`, `.output/`, `coverage/`, `.git/` |

### Comportement selon le contexte

| Contexte                      | Code analysé               | Quality Gate porte sur     |
| ----------------------------- | -------------------------- | -------------------------- |
| Push sur `master` / `develop` | Tout le projet             | L'ensemble du code         |
| Pull Request                  | Uniquement les changements | Le nouveau code uniquement |

### Suppression ciblée (`// NOSONAR`)

Les faux positifs dans les fichiers de test (credentials de test, Math.random pour UUID) sont
marqués `// NOSONAR` pour signaler qu'ils sont intentionnels et revus.

### Security Hotspots

Les Security Hotspots (ex. mot de passe dans une chaîne de connexion) doivent être **revus manuellement**
dans SonarCloud et marqués « Safe » ou « Fixed ». La Quality Gate « Sonar Way » exige **100 % des hotspots
revus** sur le nouveau code. Pour éviter ce point sur la base jetable du CI, celle-ci utilise l'authentification
`trust` (aucun mot de passe) — il n'y a donc aucun secret en dur à revoir.

---

## 6. Protection des branches (GitHub Settings)

Configurée dans GitHub → Settings → Branches → Branch protection rules.

Appliquée sur `master` et `develop` :

| Règle                                        | Effet                                                                      |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Require a pull request before merging        | Interdit tout push direct — oblige à passer par une PR.                    |
| Require approvals (1 minimum)                | La PR doit être approuvée par au moins un autre membre avant le merge.     |
| Require status checks to pass                | Les checks suivants doivent être verts avant le merge.                     |
| → `CI Pipeline / ci`                         | Le pipeline complet (lint, build, tests, garde-fou migration) doit passer. |
| → `Branch Name Check / Validate branch name` | Le nom de la branche source doit être valide.                              |
| → `SonarCloud Code Analysis`                 | La Quality Gate SonarCloud doit être verte.                                |
| Block force pushes                           | Interdit `git push --force` sur ces branches.                              |
| Do not allow bypassing                       | Même les administrateurs sont soumis aux règles.                           |

---

## Flux complet — du commit au merge

```
Développeur
│
├─ git commit
│    ├─ pre-commit  → Prettier reformate les fichiers
│    └─ commit-msg  → Commitlint valide le message
│
├─ git push
│    └─ pre-push    → Vérifie le nom de branche
│
└─ Pull Request (feature/* → develop ou develop → master)
     │
     ├─ branch-check.yml     → Nom de branche valide ?
     ├─ ci.yml               → Install → Lint → Build → Tests
     │                            → Garde-fou migration (schema en sync ?)
     │                            → Génération migration.sql
     │                            → Upload artifact
     ├─ SonarCloud App       → Quality Gate (indépendant du CI)
     ├─ issue-triage.yml     → Labels automatiques
     │
     └─ Merge autorisé seulement si :
          ✅ CI passée (dont migrations en sync)
          ✅ Quality Gate verte
          ✅ 1 approbation

Merge dans master (push)
└─ ci.yml (job ci)      → build + tests + release + publication image GHCR
└─ ci.yml (job deploy)  → .env←secrets → pull → migrate deploy → up -d → smoke test
                           Automatique, sur le runner local. Voir CD_DEPLOYMENT.md
```

## 7. Migrations de base de données — CI vs CD

### Frontière CI / CD

|                     | CI (job `ci`)                           | CD (job `deploy`)                                         |
| ------------------- | --------------------------------------- | --------------------------------------------------------- |
| Outil               | `prisma migrate diff`                   | `prisma migrate deploy`                                   |
| Action              | Génère le SQL + vérifie la cohérence    | Applique les migrations versionnées                       |
| Base réelle touchée | **Aucune**                              | Base de l'environnement déployé (local)                   |
| Déclencheur         | Automatique sur chaque PR               | Automatique sur push `master` (+ manuel via `deploy.yml`) |
| Artefact            | `migration.sql` téléchargeable 30 jours | —                                                         |

**Règle fondamentale :** le job `ci` ne doit jamais appliquer de migration sur une base réelle — il ne fait que **générer** et **vérifier** (garde-fou). L'**application** relève du job `deploy` (CD), avec `prisma migrate deploy` (idempotent, non destructif). Voir [CD_DEPLOYMENT.md](CD_DEPLOYMENT.md).

### Deux notions à ne pas confondre

|             | Fichiers de migration                     | Artefact `migration.sql`                              |
| ----------- | ----------------------------------------- | ----------------------------------------------------- |
| Emplacement | `prisma/migrations/` (versionné dans git) | Généré à chaque run (non versionné)                   |
| Nature      | Incrémental — un dossier par changement   | Complet — tout le schéma depuis zéro (`--from-empty`) |
| Créé par    | Le développeur (`prisma migrate dev`)     | Le pipeline CI                                        |

Un commit qui ne touche pas le schéma n'ajoute aucune migration. Seul un **changement de schéma** en crée une.

### Les deux commandes du pipeline

```bash
# Garde-fou : échoue si le schéma a changé sans migration (nécessite une shadow database)
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "postgresql://shadow@localhost:5433/shadow" \
  --exit-code            # 0 = en sync, 2 = drift détecté

# Génération de l'artefact : compare uniquement des fichiers, aucune base requise
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql
```

### Pourquoi une shadow database ?

`prisma migrate diff --from-migrations` doit **rejouer** les fichiers de migration pour calculer l'état
résultant, ce qui exige une vraie base PostgreSQL. On utilise une base **jetable** (conteneur Docker dédié,
port 5433, détruite en fin de job) — distincte de toute base réelle. La génération de l'artefact
(`--from-empty`), elle, ne compare que des fichiers et ne nécessite aucune base.

### Idempotence — limite de Prisma

Le TP demande un script idempotent « quand l'outil le permet ». Prisma `migrate diff --script` produit un SQL
**déterministe** (identique pour un même schéma) mais **non idempotent** : il génère des `CREATE TABLE` bruts,
sans `IF NOT EXISTS`. Contrairement à EF Core (`--idempotent`), Prisma n'offre pas cette option. C'est une
limite assumée de la stack.

### Où récupérer l'artefact

GitHub → onglet **Actions** → run du pipeline → section **Artifacts** en bas de page → `migration-script`.
