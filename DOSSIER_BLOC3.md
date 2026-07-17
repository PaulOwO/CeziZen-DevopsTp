# CESIZen — Déployer et sécuriser les applications informatiques

**Titre Concepteur Développeur d'Applications — Bloc 3 (Activité 3)**
**Auteur : Paul BREUZA** · Projet CESIZen · 2026

---

## Sommaire

1. Introduction
   - 1.1 Contexte du projet
   - 1.2 Périmètre fonctionnel couvert
   - 1.3 Stack technique
   - 1.4 Objet et plan du dossier
2. Plan de déploiement
   - 2.1 Architecture applicative
   - 2.2 Les trois environnements
   - 2.3 Versioning des sources et flux Git
   - 2.4 Intégration continue (CI)
   - 2.5 Conteneurisation et release versionnée
   - 2.6 Déploiement continu (CD)
   - 2.7 Migrations de base de données : CI vs CD
   - 2.8 Gestion des secrets
3. Plan de maintenance
   - 3.1 Gestion des anomalies
   - 3.2 Gestion des évolutions
   - 3.3 Outillage de ticketing
   - 3.4 Suivi et métriques
   - 3.5 Veille technologique
   - 3.6 Gestion des incidents critiques
4. Plan de sécurisation
   - 4.1 Surface d'attaque
   - 4.2 Analyse des risques
   - 4.3 Actions préventives et correctives
   - 4.4 Chiffrement et cryptage
   - 4.5 Données personnelles et RGPD
   - 4.6 Bonnes pratiques de développement
   - 4.7 Notification d'incident et gestion de crise
5. Conclusion et perspectives
6. Annexes — documentation de référence

---

# 1. Introduction

## 1.1 Contexte du projet

CESIZen est une application web de **santé mentale** développée dans le cadre d'une
**commande publique fictive** portée par le Ministère de la Santé et de la
Prévention, à destination du grand public. Sa mission : proposer des outils
d'information et de gestion du stress (diagnostics, exercices de respiration,
activités de détente, suivi d'émotions) accessibles au plus grand nombre.

Le contexte de commande publique a orienté plusieurs choix : utilisation du
**Système de Design de l'État (DSFR)** pour l'accessibilité et la cohérence visuelle,
hébergement des données **au sein de l'Union Européenne**, et exigence forte de
sécurité (l'application, associée au Ministère, est une cible plausible d'attaques).

Le présent dossier couvre l'**Activité 3 — Déployer et sécuriser les applications
informatiques**. Il présente les trois livrables attendus : le **plan de
déploiement**, le **plan de maintenance** et le **plan de sécurisation**. Les outils
associés (versioning, automatisation, ticketing) sont **réellement mis en place et
configurés**, et sont démontrés lors de la soutenance.

## 1.2 Périmètre fonctionnel couvert

Le projet étant individuel, tous les modules ne sont pas développés. Le prototype
couvre les deux modules **obligatoires** et un module **au choix** :

| Module                   | Statut      | Fonctionnalités principales                                                               |
| ------------------------ | ----------- | ----------------------------------------------------------------------------------------- |
| Comptes utilisateurs     | Obligatoire | Inscription, connexion/déconnexion, changement de mot de passe, gestion admin des comptes |
| Informations             | Obligatoire | Affichage de pages de contenu, édition par un administrateur                              |
| Exercices de respiration | Au choix    | Sélection et lancement d'exercices de cohérence cardiaque configurables                   |

Trois acteurs sont gérés : **visiteur anonyme**, **utilisateur connecté**,
**administrateur** — via un Front-Office public et un Back-Office d'administration.

## 1.3 Stack technique

| Couche                     | Technologie                                                               |
| -------------------------- | ------------------------------------------------------------------------- |
| Frontend + Backend         | **Nuxt 4** (Vue 3) — framework fullstack, server routes intégrées (Nitro) |
| Base de données            | **PostgreSQL 16** — conteneurisée avec Docker Compose                     |
| ORM                        | **Prisma 5** — modélisation, migrations, accès typé                       |
| Authentification           | **nuxt-auth-utils** — sessions chiffrées, cookies HttpOnly                |
| Design System              | **DSFR** (`@gouvminint/vue-dsfr`) — Système de Design de l'État           |
| Tests unitaires            | **Vitest**                                                                |
| Tests E2E / non-régression | **Playwright**                                                            |
| Sécurité mots de passe     | **bcrypt** (coût 12)                                                      |
| Conteneurisation           | **Docker** multi-stage + Docker Compose                                   |
| CI/CD                      | **GitHub Actions** (runner self-hosted Windows)                           |
| Registre d'images          | **GHCR** (GitHub Container Registry)                                      |
| Qualité de code            | ESLint, Prettier, Commitlint, **SonarCloud**                              |
| Versioning sémantique      | **semantic-release**                                                      |

## 1.4 Objet et plan du dossier

Ce dossier détaille, dans l'ordre du barème :

- un **plan de déploiement** décrivant l'architecture, les trois environnements, le
  versioning, l'intégration continue, la release versionnée et le déploiement
  continu automatisé ;
- un **plan de maintenance** décrivant l'outil de ticketing (GitHub), la
  méthodologie de gestion des anomalies et évolutions, et la veille technologique ;
- un **plan de sécurisation** décrivant l'analyse des risques, les actions
  préventives et correctives, le chiffrement, la conformité RGPD, les bonnes
  pratiques et la gestion de crise.

Ce dossier est **autoportant** : il contient l'ensemble des éléments évalués. La
documentation technique complète versionnée dans le dépôt (dossier `docs/`, cf.
Annexes) en constitue le **complément** et est **présentée et démontrée en
soutenance** (pipelines, tableaux de bord, configuration des outils).

---

# 2. Plan de déploiement

Ce plan permet un **déploiement externalisé et automatisé** de la solution. Il
décrit l'architecture, les environnements, ainsi que les outils de **versioning** et
d'**automatisation** réellement configurés.

## 2.1 Architecture applicative

L'application est **conteneurisée** et orchestrée par Docker Compose autour de trois
services :

```
                 ┌───────────────────────────────────────────┐
   Navigateur    │        Machine hôte (runner + Docker)       │
   ──HTTPS──►    │                                             │
                 │   ┌─────────┐   ┌───────────┐   ┌────────┐  │
                 │   │  app    │──►│    db     │◄──│migrate │  │
                 │   │ Nuxt 4  │   │PostgreSQL │   │(prisma)│  │
                 │   │ :3000   │   │  :5432    │   └────────┘  │
                 │   └─────────┘   └───────────┘               │
                 │        réseau interne Compose (DNS par nom) │
                 └───────────────────────────────────────────┘
```

| Service   | Rôle                                                                            |
| --------- | ------------------------------------------------------------------------------- |
| `db`      | PostgreSQL 16, volume persistant, `healthcheck` (`pg_isready`).                 |
| `migrate` | Job éphémère : applique les migrations Prisma (`migrate deploy`) puis s'arrête. |
| `app`     | Application Nuxt (serveur Nitro), écoute sur le port 3000.                      |

**Ordre de démarrage garanti** par les dépendances Compose :
`db (sain) → migrate (terminé avec succès) → app`. L'application ne démarre jamais
sur un schéma de base périmé.

L'image applicative est construite en **multi-stage** (un stage `builder` qui compile,
un stage `runner` minimal ~266 Mo), tourne en utilisateur **non-root**, et n'embarque
aucun secret. Détails : [docs/DOCKER_AND_RELEASE.md](docs/DOCKER_AND_RELEASE.md).

## 2.2 Les trois environnements

| Caractéristique  | Développement                             | Test / Intégration (CI)                 | Production (déploiement)                           |
| ---------------- | ----------------------------------------- | --------------------------------------- | -------------------------------------------------- |
| Objectif         | Coder et tester localement                | Valider chaque changement               | Servir les utilisateurs finaux                     |
| Déclenchement    | Manuel (`npm run dev`)                    | Automatique (push / PR)                 | Automatique (release sur `master`)                 |
| Image            | Build local (`docker compose up --build`) | Build + smoke test éphémère             | **Pull** de l'image publiée sur GHCR               |
| Base de données  | PostgreSQL locale (`.env` dev)            | Base **jetable** (shadow DB, port 5433) | PostgreSQL persistante (secrets)                   |
| Configuration    | `.env` local                              | Variables du runner / secrets           | `.env` généré depuis GitHub Secrets                |
| Migrations       | `prisma migrate dev`                      | **Vérification** (`migrate diff`)       | **Application** (`migrate deploy`)                 |
| Fichiers Compose | `docker-compose.yml`                      | —                                       | `docker-compose.yml` + `docker-compose.deploy.yml` |

Le cahier des charges impose qu'**un seul environnement** soit réellement mis en
place et configuré pour la démonstration : c'est l'environnement de **déploiement
(production locale)**, décrit en §2.6 et démontré à la soutenance. Les deux autres
sont opérationnels (dev local, CI GitHub Actions).

## 2.3 Versioning des sources et flux Git

L'outil de versioning est **Git**, hébergé sur **GitHub**
(`github.com/PaulOwO/CeziZen-DevopsTp`).

**Flux de branches imposé** : `feature/* → develop → master`.

| Branche                           | Rôle                                                           |
| --------------------------------- | -------------------------------------------------------------- |
| `master`                          | Code stable, publié et déployé. Une release = un tag `vX.Y.Z`. |
| `develop`                         | Branche d'intégration : toutes les features y convergent.      |
| `feature/*`, `fix/*`, `docs/*`, … | Branches de travail, une par tâche.                            |

**Conventions et garde-fous** :

- **Conventional Commits** imposés par **Commitlint** (`feat`, `fix`, `docs`,
  `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `revert`).
- **Convention de nommage des branches** vérifiée localement (hook Husky `pre-push`)
  **et** en CI (`branch-check.yml`).
- **Protection de branche** (`master`, `develop`) configurée dans GitHub :
  - Pull Request obligatoire avant merge (pas de push direct).
  - Au moins **1 approbation**.
  - **Checks obligatoires verts** : CI Pipeline, Branch Name Check, SonarCloud.
  - Force-push interdit ; règles appliquées **même aux administrateurs**.
- **`enforce-master-source`** : une PR vers `master` ne peut venir **que** de
  `develop` (status check bloquant) → garantit que tout code publié a été intégré et
  testé sur `develop`.

**Hooks Git locaux (Husky)** — première ligne de contrôle, avant même GitHub :

| Hook         | Rôle                                                      |
| ------------ | --------------------------------------------------------- |
| `pre-commit` | Reformate les fichiers stagés (Prettier via lint-staged). |
| `commit-msg` | Valide le format du message (Commitlint).                 |
| `pre-push`   | Vérifie le nom de la branche.                             |

## 2.4 Intégration continue (CI)

L'automatisation repose sur **GitHub Actions**, exécutée sur un **runner
auto-hébergé** (self-hosted) installé sur la machine cible — ce qui permet, à la même
étape, de déployer localement (§2.6).

Le pipeline `ci.yml` se déclenche sur **push et pull request** vers `master` ou
`develop`. Ses étapes :

| #     | Étape                      | Rôle                                                                            |
| ----- | -------------------------- | ------------------------------------------------------------------------------- |
| 1     | Checkout                   | Récupère le code (historique complet pour semantic-release).                    |
| 2     | Setup Node 22              | Installe Node.js 22 LTS.                                                        |
| 3     | `npm ci`                   | Installe les dépendances de façon reproductible.                                |
| 4     | **Lint** (ESLint)          | Analyse statique — bloque si erreur.                                            |
| 5     | **Build** (`nuxt build`)   | Vérifie la compilation.                                                         |
| 6     | **Tests** (Vitest)         | Tests unitaires en mode one-shot.                                               |
| 7     | Shadow database            | Démarre une base PostgreSQL jetable (port 5433) pour le garde-fou.              |
| 8     | **Garde-fou migrations**   | Échoue si `schema.prisma` a changé sans migration (`migrate diff --exit-code`). |
| 9     | Génération `migration.sql` | Produit le script SQL complet du schéma (artefact).                             |
| 10    | Upload artifact            | Publie `migration.sql` (téléchargeable 30 jours).                               |
| 11    | Stop shadow database       | Détruit la base jetable (`if: always()`).                                       |
| 12-14 | Image Docker               | Build de l'image candidate `:<sha>` + **smoke test HTTP 200** (port 3001).      |
| 15-17 | Release + publication      | (master uniquement) semantic-release + push GHCR.                               |

Points clés :

- Les tests sont **le garde-fou de la publication** : si une étape échoue, la release
  ne s'exécute pas → jamais d'artefact non vérifié publié.
- **SonarCloud** analyse chaque PR de façon autonome (GitHub App) — Quality Gate
  requise pour merger.
- Un workflow **`dependency-check.yml`** (hebdomadaire) exécute `npm audit`, détecte
  les paquets obsolètes et **vérifie la présence des en-têtes de sécurité** dans
  `nuxt.config.ts` (garde-fou de non-régression sécurité).

Détails : [docs/CICD_OVERVIEW.md](docs/CICD_OVERVIEW.md).

## 2.5 Conteneurisation et release versionnée

**Le numéro de version n'est jamais saisi à la main** : il est calculé par
**semantic-release** à partir des commits conventionnels, uniquement sur `master`.

| Préfixe de commit    | Incrément SemVer | Exemple           |
| -------------------- | ---------------- | ----------------- |
| `fix:`               | PATCH            | `1.4.0` → `1.4.1` |
| `feat:`              | MINOR            | `1.4.0` → `1.5.0` |
| `BREAKING CHANGE:`   | MAJOR            | `1.4.0` → `2.0.0` |
| `docs:`, `chore:`, … | aucun            | pas de release    |

Chaîne de publication sur `master` : semantic-release calcule la version, pose le tag
Git `vX.Y.Z`, crée la Release GitHub (changelog automatique), puis l'image est poussée
sur GHCR avec **trois tags** :

- `:X.Y.Z` — **immuable** → sert au **rollback** ;
- `:latest` — mobile, « dernière version publiée » ;
- `:<sha>` — lien direct commit ↔ image (traçabilité).

## 2.6 Déploiement continu (CD)

Le déploiement est **automatique** : un job `deploy` (dans `ci.yml`) s'exécute
**après** le job `ci`, sur le **même runner self-hosted**, **uniquement** si un push
sur `master` a produit une nouvelle version.

Comme le runner **est** la machine cible, `docker compose up -d` crée les conteneurs
**sur cette machine** : on ne « pousse » rien vers un serveur, c'est la machine qui
exécute son propre déploiement.

Étapes du déploiement :

| Étape          | Rôle                                                               |
| -------------- | ------------------------------------------------------------------ |
| Checkout       | Récupère les fichiers Compose (l'image vient de GHCR).             |
| Write `.env`   | Génère le `.env` depuis les **GitHub Secrets** (jamais versionné). |
| Log in to GHCR | Authentification pour tirer l'image (package privé).               |
| Deploy         | `docker compose pull` puis `up -d --no-build` (migrate → app).     |
| Smoke test     | Exige **HTTP 200** sur `http://localhost:3000`.                    |

**Propriétés du déploiement** :

- **Reproductible** : on déploie l'**image exacte** testée en CI (pull, pas de rebuild
  local — override `docker-compose.deploy.yml` + `--no-build`).
- **Idempotent** : rejouable sans effet de bord (`migrate deploy` n'applique que les
  migrations en attente ; `up -d` ne recrée que ce qui change).
- **Non destructif** : le volume PostgreSQL est **conservé** (jamais `down -v`).
- **Rollback** : le tag `:X.Y.Z` étant immuable, revenir à une version antérieure est
  explicite (`docker pull …:1.3.0`).
- **Déploiement manuel** : un workflow `deploy.yml` (`workflow_dispatch`) permet de
  redéployer un tag choisi — utile pour rejouer un déploiement ou effectuer un
  rollback sans créer de commit.

Détails et retours d'expérience (incidents réels) :
[docs/CD_DEPLOYMENT.md](docs/CD_DEPLOYMENT.md).

## 2.7 Migrations de base de données : CI vs CD

La frontière entre CI et CD est stricte :

|                     | CI (job `ci`)                                | CD (job `deploy`)               |
| ------------------- | -------------------------------------------- | ------------------------------- |
| Outil               | `prisma migrate diff`                        | `prisma migrate deploy`         |
| Action              | **Génère** le SQL + **vérifie** la cohérence | **Applique** les migrations     |
| Base réelle touchée | Aucune (base jetable)                        | Base de l'environnement déployé |

**Règle fondamentale** : le job `ci` n'applique **jamais** de migration sur une base
réelle — il ne fait que générer et vérifier (garde-fou anti-drift). L'application des
migrations relève exclusivement du job `deploy`, avec `migrate deploy` (idempotent,
non destructif).

## 2.8 Gestion des secrets

Aucun secret n'est versionné. En développement, un fichier **`.env`** (ignoré par git
**et** par Docker) porte les identifiants ; un modèle **`.env.example`** sans valeur
réelle documente les variables. En déploiement, les secrets sont stockés dans
**GitHub Secrets** et le `.env` est **généré à la volée** dans le job.

| Secret                      | Rôle                                           |
| --------------------------- | ---------------------------------------------- |
| `POSTGRES_USER/PASSWORD/DB` | Identifiants de la base déployée.              |
| `NUXT_SESSION_PASSWORD`     | Secret de chiffrement des cookies (≥ 32 car.). |

---

# 3. Plan de maintenance

L'outil de gestion des demandes de corrections et d'évolutions est **l'écosystème
GitHub** (Issues + Projects + Actions), déjà utilisé pour le code — un choix cohérent
(zéro outil externe, traçabilité complète issue → PR → commit → release). Détails :
[docs/MAINTENANCE_PLAN.md](docs/MAINTENANCE_PLAN.md), [GUIDE_OUTILS_MAINTENANCE.md](GUIDE_OUTILS_MAINTENANCE.md).

## 3.1 Gestion des anomalies

**Détection & signalement** : monitoring/erreurs, remontées utilisateurs, alertes.
Toute anomalie devient une **issue GitHub** via le template `bug_report.md`
(labellisation automatique `bug`).

**Cycle de vie** :

```
Détecté → Signalé → Triagé → Assigné → En cours → Testé → Résolu → Fermé
```

**Grille de sévérité et SLA** :

| Sévérité | Critères                                          | Prise en compte | Correction |
| -------- | ------------------------------------------------- | --------------- | ---------- |
| Critique | Système indisponible, perte de données, faille    | 1 h             | 4 h        |
| Haute    | Fonctionnalité majeure indisponible (>10 % users) | 4 h             | 1 jour     |
| Moyenne  | Service dégradé, contournement possible           | 1 jour          | 3 jours    |
| Basse    | Défaut cosmétique, sans impact                    | 3 jours         | 1 semaine  |

**Responsabilités** : Product Owner (validation), Développeurs (correction),
QA/Testeurs (vérification), DevOps (déploiement).

## 3.2 Gestion des évolutions

Quatre types, chacun avec son label : **fonctionnelle** (`feature`), **amélioration**
(`enhancement`), **dette technique** (`technical-debt`), **documentation**
(`documentation`).

**Processus** : Proposition (template `feature_request.md`) → Évaluation (PO +
estimation S/M/L) → Planification (backlog / milestone) → Implémentation (dev + code
review obligatoire + tests) → Validation (staging + UAT) → Production.

**Gouvernance** : revue mensuelle du backlog, sprint planning bi-hebdomadaire,
priorisation trimestrielle, communication régulière aux utilisateurs.

## 3.3 Outillage de ticketing

| Outil               | Rôle                                                                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub Issues**   | Tickets (bugs, features, incidents de sécurité) avec 3 templates.                                                                       |
| **GitHub Projects** | Tableau Kanban : Backlog → Todo → In Progress → In Review → Done, avec automatisations natives (déplacement sur ouverture/merge de PR). |
| **Labels**          | Catégorisation : priorité (critical/high/medium/low), type, statut, domaine.                                                            |
| **Milestones**      | Regroupement par sprint (bi-hebdomadaire).                                                                                              |

**Automatisations GitHub Actions** (`issue-triage.yml`) :

- **Auto-label** selon le titre (`[BUG]`, `[FEATURE]`, `[SECURITY]`).
- **Priority prompt** : commentaire automatique demandant la priorité (issues).
- **Auto-close stale** : marque les issues inactives 30 j, ferme après 60 j (exempte
  `critical`, `bug`, `security`, `blocked`).

## 3.4 Suivi et métriques

| Métrique                 | Objectif                  | Définition                      |
| ------------------------ | ------------------------- | ------------------------------- |
| MTTR                     | < 4 h (critique)          | Temps de détection → résolution |
| MTBF                     | > 99,5 % uptime           | Disponibilité continue          |
| Taux de fermeture        | 100 % des issues traitées | Fermées / ouvertes              |
| Temps de cycle évolution | < 2 sprints               | Demande → mise en production    |

Rapports **mensuels** (incidents, évolutions déployées, MTTR) et **trimestriels**
(tendances, roadmap technologique).

## 3.5 Veille technologique

La pérennité de l'application dépend du suivi des évolutions. La veille est
**documentée et outillée** ([docs/TECH_WATCH_STRATEGY.md](docs/TECH_WATCH_STRATEGY.md)).

| Domaine                   | Fréquence    | Sources principales                    |
| ------------------------- | ------------ | -------------------------------------- |
| Sécurité / vulnérabilités | Quotidienne  | Dependabot, OWASP, CVE, npm advisories |
| Écosystème Nuxt/Vue       | Hebdomadaire | Nuxt Blog, GitHub Releases             |
| Base de données / ORM     | Hebdomadaire | Prisma Releases, PostgreSQL News       |
| Infrastructure / DevOps   | Hebdomadaire | Docker Hub, GitHub Actions Blog        |

**Processus** : Collecte → Triage → Analyse d'impact → Documentation → Décision →
Implémentation. Toute découverte est consignée dans le **registre de veille**
(`.github/TECH_WATCH_LOG.md`).

**Automatisation** : **Dependabot** (`.github/dependabot.yml`) ouvre des PR de mise à
jour hebdomadaires sur trois écosystèmes — npm, GitHub Actions et Docker — validées
par la CI avant tout merge. Politique de mise à jour : correctif de sécurité déployé
sous **24 h**, mise à jour mineure au sprint suivant, majeure après évaluation
(2–4 semaines).

## 3.6 Gestion des incidents critiques

**Escalade** : `Support (L1) → Développeur (L2) → Tech Lead (L3) → Direction`.

**Post-mortem** systématique après tout incident critique (cause racine, analyse,
actions correctives, suivi), via un modèle dédié
([docs/incident-postmortem-template.md](docs/incident-postmortem-template.md)).

---

# 4. Plan de sécurisation

Application associée au Ministère → cible plausible. Une attention particulière est
portée à la sécurisation des données et de l'application. Cette section présente
l'analyse des vulnérabilités, les actions préventives et correctives, le chiffrement,
la conformité RGPD, les bonnes pratiques et la gestion de crise.

## 4.1 Surface d'attaque

Points d'entrée : formulaires d'inscription/connexion/mot de passe, API publiques de
lecture, interface d'administration. La base PostgreSQL n'est **pas exposée**
publiquement (réseau interne Docker). L'accès aux données passe exclusivement par
l'ORM Prisma (requêtes paramétrées).

## 4.2 Analyse des risques

Chaque risque est coté **Probabilité (P) × Impact (I)** sur une échelle de 1
(faible) à 4 (critique) ; la **criticité = P × I** fixe la priorité. Référentiel :
**OWASP Top 10** (2021) et bonnes pratiques **ANSSI**.

| Criticité (P×I) | Niveau   | Traitement                       |
| --------------- | -------- | -------------------------------- |
| 12 – 16         | Critique | Correction immédiate / bloquante |
| 6 – 11          | Élevé    | Correction planifiée court terme |
| 3 – 5           | Modéré   | Backlog priorisé                 |
| 1 – 2           | Faible   | Surveillance                     |

Matrice complète des risques identifiés :

| #   | Risque / Vulnérabilité (OWASP)                          | P   | I   | P×I | Niveau | État         |
| --- | ------------------------------------------------------- | --- | --- | --- | ------ | ------------ |
| R1  | Injection SQL (A03)                                     | 1   | 4   | 4   | Modéré | ✅ Couvert   |
| R2  | Vol de session / cookie (A07)                           | 2   | 4   | 8   | Élevé  | ✅ Couvert   |
| R3  | Brute-force / credential stuffing sur `/api/auth` (A07) | 3   | 3   | 9   | Élevé  | ⚠️ Partiel   |
| R4  | XSS stocké via contenu admin (`content`/`title`) (A03)  | 2   | 3   | 6   | Élevé  | ⚠️ À traiter |
| R5  | Clickjacking / framing (A05)                            | 2   | 2   | 4   | Modéré | ✅ Couvert   |
| R6  | Élévation de privilège (accès admin) (A01)              | 2   | 4   | 8   | Élevé  | ✅ Couvert   |
| R7  | Exposition de secrets (dépôt / image) (A05)             | 2   | 4   | 8   | Élevé  | ✅ Couvert   |
| R8  | Dépendances vulnérables (A06)                           | 3   | 3   | 9   | Élevé  | ✅ Couvert   |
| R9  | Compromission chaîne CI/CD (supply chain) (A08)         | 2   | 4   | 8   | Élevé  | ✅ Couvert   |
| R10 | Données personnelles / non-conformité RGPD              | 2   | 3   | 6   | Élevé  | ⚠️ Partiel   |
| R11 | Interruption de service (perte volume, machine éteinte) | 3   | 3   | 9   | Élevé  | ⚠️ Partiel   |
| R12 | Validation d'entrée insuffisante (données corrompues)   | 3   | 2   | 6   | Élevé  | ⚠️ À traiter |
| R13 | Absence de journalisation / détection (A09)             | 3   | 2   | 6   | Élevé  | ⚠️ À traiter |
| R14 | Man-in-the-middle / transport non chiffré (A02)         | 2   | 4   | 8   | Élevé  | ✅ Prévu     |

Légende : ✅ mesure en place — ⚠️ partiellement couvert / action planifiée.

Pour chaque risque, une action **préventive** (réduire la probabilité) et une action
**corrective** (réagir si le risque se réalise) sont définies.

| #   | Action préventive (en place ou prévue)                                                  | Action corrective                                               |
| --- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| R1  | Accès données **via Prisma uniquement** (requêtes paramétrées), aucune requête brute    | Correctif + règle SonarCloud sur les injections ; audit du code |
| R2  | Cookies de session **scellés/chiffrés**, `httpOnly`+`secure`+`sameSite`, expiration 7 j | Rotation du secret de session + invalidation des sessions       |
| R3  | Message d'erreur générique (anti-énumération), bcrypt coût 12, blocage comptes inactifs | Ajout **rate-limiting** + verrouillage temporaire ; CAPTCHA     |
| R4  | Échappement Vue par défaut, **CSP** restrictive (`default-src 'self'`)                  | **Sanitisation** des contenus admin, CSP par nonces             |
| R5  | En-têtes **`X-Frame-Options: DENY`** + CSP `frame-ancestors 'none'`                     | Vérification en CI (garde-fou en-têtes) ; correctif config      |
| R6  | **Autorisation serveur** sur toutes les routes (`requireUserSession` + rôle 403)        | Révocation de session, tests de non-régression d'autorisation   |
| R7  | Aucun secret versionné (`.env` hors git/Docker), GitHub Secrets, détection Sonar        | **Rotation** immédiate + purge d'historique ; révocation token  |
| R8  | **Dependabot** (npm) + `npm audit` hebdomadaire                                         | Application du patch (< 24 h si critique)                       |
| R9  | Actions GitHub **épinglées à un SHA**, permissions minimales                            | Dependabot (github-actions) bumpe les SHA ; revue workflows     |
| R10 | Minimisation, mots de passe hachés, pas de transfert hors UE                            | Endpoints RGPD (effacement/export), notification CNIL           |
| R11 | `restart: always`, healthcheck, volume persistant, image versionnée immuable            | **Rollback** (`pull …:X.Y.Z`), restauration `pg_dump`           |
| R12 | Contrôles manuels (champs requis, format e-mail, longueur)                              | **Validation zod** stricte (bornes, types) → rejet 400          |
| R13 | (à mettre en place) journalisation des évènements de sécurité                           | Supervision + alertes ; corrélation des logs                    |
| R14 | En-tête **HSTS** émis par l'application                                                 | **Reverse proxy TLS** + redirection HTTP→HTTPS en production    |

**Synthèse des mesures préventives déjà opérationnelles** : autorisation côté serveur
sur toutes les routes sensibles ; injection SQL neutralisée (Prisma) ; **en-têtes de
sécurité HTTP** appliqués à toutes les réponses et **vérifiés en exécution** (CSP,
`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
`Permissions-Policy`, HSTS) ; sessions durcies ; secrets hors dépôt ; actions GitHub
épinglées à un SHA ; Dependabot + `npm audit`.

**Feuille de route corrective priorisée** : (1) rate-limiting sur l'authentification
(R3) ; (2) validation zod + sanitisation des contenus admin (R4, R12) ; (3) reverse
proxy TLS + redirection HTTPS (R14) ; (4) endpoints RGPD effacement/export (R10) ;
(5) journalisation de sécurité + supervision (R13).

## 4.4 Chiffrement et cryptage

| Donnée / canal           | Mécanisme                                            |
| ------------------------ | ---------------------------------------------------- |
| Mots de passe            | **Hachage bcrypt (coût 12)** + salt — non réversible |
| Cookies de session       | Chiffrement/scellement (secret ≥ 32 caractères)      |
| Transport                | **HTTPS/TLS** (reverse proxy en prod) + **HSTS**     |
| Secrets d'infrastructure | GitHub Secrets (chiffrés au repos)                   |

Distinction essentielle : les mots de passe sont **hachés** (sens unique, jamais
déchiffrables) ; le transport et les cookies utilisent du **chiffrement** réversible.

## 4.5 Données personnelles et RGPD

**Rôles** : responsable de traitement = le Ministère (commanditaire) ; sous-traitant
= le prestataire ; contact `security@cesizen.fr` (relaye au DPO).

**Registre de traitement** (issu du modèle de données réel `prisma/schema.prisma`) :

| Donnée                  | Catégorie                    | Finalité                   | Base légale                 |
| ----------------------- | ---------------------------- | -------------------------- | --------------------------- |
| E-mail                  | Identification               | Authentification, contact  | Exécution du service        |
| Nom, prénom             | Identification               | Personnalisation du compte | Exécution du service        |
| Mot de passe (haché)    | Authentification             | Sécuriser l'accès          | Exécution du service        |
| Rôle, statut actif      | Technique                    | Contrôle d'accès           | Intérêt légitime / sécurité |
| Consultations de pages  | Usage                        | Suivi de parcours          | Consentement (à recueillir) |
| Sessions de respiration | Usage / bien-être (sensible) | Historique personnel       | Consentement (à recueillir) |

**Aucun transfert hors Union Européenne** (exigence du cahier des charges). Les
données d'usage liées au bien-être sont **sensibles** vu le contexte santé mentale →
consentement explicite requis dès leur collecte (tables modélisées, non encore
alimentées par l'API).

**Principes RGPD appliqués** : minimisation (pas de date de naissance / adresse /
téléphone) ; intégrité et confidentialité (bcrypt, HTTPS/HSTS, cookies scellés,
contrôle d'accès serveur, secrets externalisés) ; exactitude (modification du compte,
changement de mot de passe).

**Droits des personnes concernées** :

| Droit                             | État                                                                  |
| --------------------------------- | --------------------------------------------------------------------- |
| Accès                             | Consultation du compte ; export structuré **à implémenter**           |
| Rectification                     | ✅ Modification du compte + changement de mot de passe                |
| Effacement                        | Désactivation (`isActive`) ; **suppression définitive à implémenter** |
| Portabilité                       | Export JSON **à implémenter**                                         |
| Opposition / retrait consentement | Gestion du consentement **à implémenter**                             |
| Limitation                        | Désactivation du compte (`isActive=false`)                            |

**Violation de données** : qualification/confinement → **notification CNIL sous 72 h**
(art. 33) → information des personnes si risque élevé (art. 34) → documentation dans
un registre interne → post-mortem.

**Feuille de route de conformité** : politique de confidentialité, endpoints
effacement/export self-service, gestion du consentement, politique de rétention et
purge des comptes inactifs.

## 4.6 Bonnes pratiques de développement

- Flux Git contraint (`feature → develop → master`) + protection de branche + revue
  de code obligatoire.
- Qualité automatisée : Prettier, ESLint (bloquant), Commitlint, **SonarCloud**
  (Quality Gate + Security Hotspots 100 % revus).
- Tests **unitaires** (Vitest, 59 tests) + **non-régression E2E** (Playwright, captures
  de référence) : la CI échoue si un test échoue.
- Conteneur durci (multi-stage, non-root, sans secret).
- Principe de moindre privilège (permissions minimales des workflows,
  `GITHUB_TOKEN` éphémère).

## 4.7 Notification d'incident et gestion de crise

**Détection** → **Escalade** (`L1 → L2 → L3 → Direction/DPO`) → traitement selon SLA
de sévérité.

**Procédure de crise** (incident avéré) : qualification → confinement (isolation,
révocation de secrets, rollback image saine) → éradication (correctif < 24 h si
critique) → **notification** (CNIL sous 72 h si données personnelles) → communication
utilisateurs → **post-mortem**.

La politique de divulgation responsable est publiée dans
[SECURITY.md](SECURITY.md) (canal privé : GitHub Security Advisories / e-mail).

---

# 5. Conclusion et perspectives

L'Activité 3 est couverte de bout en bout, outils **réellement configurés** :

| Domaine (barème)                      | Réalisation                                                    |
| ------------------------------------- | -------------------------------------------------------------- |
| Environnements de déploiement (2)     | Dev, CI, production locale — décrits et opérationnels          |
| Plan de déploiement (6)               | Architecture, CI/CD complet, release versionnée, CD idempotent |
| Outil de versioning (2)               | Git + GitHub, flux contraint, semantic-release                 |
| Outil de gestion des évolutions (6)   | GitHub Issues/Projects/Actions, templates, automatisations     |
| Veille & méthodologie (3)             | Stratégie documentée + Dependabot + registre                   |
| Plan de sécurisation (8)              | Matrice de risques, actions préventives/correctives, crise     |
| Données personnelles / RGPD (2)       | Registre, principes, feuille de route de conformité            |
| Bonnes pratiques de développement (1) | Git flow, qualité automatisée, tests, conteneur durci          |

**Ce qui a été ajouté/renforcé dans le cadre de cette activité** : en-têtes de
sécurité HTTP (vérifiés en exécution), durcissement des sessions, bcrypt coût 12,
Dependabot (3 écosystèmes), politique SECURITY.md, épinglage SHA des workflows
restants, plan de sécurisation et documentation RGPD complets.

**Limites assumées et perspectives** : la disponibilité dépend d'un poste personnel
(cible production : serveur 24/7 + sauvegardes + supervision) ; les actions
correctives priorisées (rate-limiting, validation zod, TLS reverse proxy, endpoints
RGPD, journalisation) constituent la suite immédiate. Ces choix et compromis sont
tracés dans [docs/decisions.md](docs/decisions.md) et
[docs/NOTES_PEDAGOGIQUES.md](docs/NOTES_PEDAGOGIQUES.md).

---

# 6. Annexes — Documentation de référence

Ces documents constituent le **complément technique** du présent dossier (qui se
suffit à lui-même) : ils sont versionnés dans le dépôt et **présentés/démontrés lors
de la soutenance** (pipelines exécutés, tableaux de bord, configuration des outils).

| Document                                                   | Contenu                                           |
| ---------------------------------------------------------- | ------------------------------------------------- |
| [docs/CICD_OVERVIEW.md](docs/CICD_OVERVIEW.md)             | Vue d'ensemble CI/CD, hooks, qualité, protection. |
| [docs/DOCKER_AND_RELEASE.md](docs/DOCKER_AND_RELEASE.md)   | Dockerisation, Compose, release versionnée.       |
| [docs/CD_DEPLOYMENT.md](docs/CD_DEPLOYMENT.md)             | Déploiement continu local, idempotence, rollback. |
| [docs/SECURITY_PLAN.md](docs/SECURITY_PLAN.md)             | Plan de sécurisation complet, matrice de risques. |
| [docs/RGPD_COMPLIANCE.md](docs/RGPD_COMPLIANCE.md)         | Registre de traitement, conformité RGPD.          |
| [docs/MAINTENANCE_PLAN.md](docs/MAINTENANCE_PLAN.md)       | Plan de maintenance détaillé.                     |
| [docs/TECH_WATCH_STRATEGY.md](docs/TECH_WATCH_STRATEGY.md) | Stratégie de veille technologique.                |
| [docs/decisions.md](docs/decisions.md)                     | Décisions techniques (ADR).                       |
| [docs/NOTES_PEDAGOGIQUES.md](docs/NOTES_PEDAGOGIQUES.md)   | Raisonnement pas à pas (annexe éducative).        |
| [SECURITY.md](SECURITY.md)                                 | Politique de divulgation de vulnérabilités.       |
| `.github/workflows/`                                       | Workflows CI/CD, triage, dépendances.             |
| `.github/dependabot.yml`                                   | Configuration Dependabot (npm, actions, Docker).  |

---

_Dossier rédigé pour l'Activité 3 — Déployer et sécuriser les applications
informatiques. Version 1.0 — 2026-07-15._
