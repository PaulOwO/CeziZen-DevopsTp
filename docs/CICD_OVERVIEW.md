# Vue d'ensemble CI/CD & Automatisations

Ce document décrit l'ensemble des mécanismes mis en place autour du code source :
outils locaux, hooks Git, pipelines GitHub Actions, analyse de qualité et protection des branches.

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

| Étape    | Commande                      | Rôle                                                                             |
| -------- | ----------------------------- | -------------------------------------------------------------------------------- |
| Checkout | `actions/checkout@v4`         | Récupère le code source.                                                         |
| Node.js  | `actions/setup-node@v4` (v22) | Installe Node.js 22 LTS.                                                         |
| Install  | `npm ci`                      | Installe les dépendances de façon strictement reproductible depuis le lock file. |
| Lint     | `npm run lint`                | Analyse statique ESLint — échoue si des erreurs sont présentes.                  |
| Build    | `npm run build`               | Compile le projet Nuxt — échoue si une erreur de compilation est présente.       |
| Tests    | `npm test -- --run`           | Lance les tests unitaires Vitest en mode one-shot (pas de watch).                |

> SonarCloud n'est **pas** dans ce pipeline — il est déclenché automatiquement par la GitHub App SonarCloud sur chaque PR. Voir [decisions.md](decisions.md).

---

### `branch-check.yml` — Validation du nom de branche

**Déclencheurs :** push (hors `master`, `develop`) et ouverture de PR
**Runner :** ubuntu-latest (GitHub-hosted)

Logique appliquée :

1. Les branches `main`, `master`, `develop` sont exemptées.
2. Toute autre branche doit correspondre au format `<type>/<description>`.
3. En cas d'échec, le message d'erreur indique les types autorisés.

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

SonarCloud analyse automatiquement le code à chaque exécution du pipeline CI.

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

---

## 6. Protection des branches (GitHub Settings)

Configurée dans GitHub → Settings → Branches → Branch protection rules.

Appliquée sur `master` et `develop` :

| Règle                                        | Effet                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| Require a pull request before merging        | Interdit tout push direct — oblige à passer par une PR.                |
| Require approvals (1 minimum)                | La PR doit être approuvée par au moins un autre membre avant le merge. |
| Require status checks to pass                | Les checks suivants doivent être verts avant le merge.                 |
| → `CI Pipeline / ci`                         | Le pipeline complet (install, lint, build, tests) doit passer.         |
| → `Branch Name Check / Validate branch name` | Le nom de la branche source doit être valide.                          |
| → `SonarCloud Code Analysis`                 | La Quality Gate SonarCloud doit être verte.                            |
| Block force pushes                           | Interdit `git push --force` sur ces branches.                          |
| Do not allow bypassing                       | Même les administrateurs sont soumis aux règles.                       |

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
     ├─ ci.yml               → Install + Lint + Build + Tests + SonarCloud
     ├─ issue-triage.yml     → Labels automatiques
     │
     └─ Merge autorisé seulement si :
          ✅ CI passée
          ✅ Quality Gate verte
          ✅ 1 approbation
```
