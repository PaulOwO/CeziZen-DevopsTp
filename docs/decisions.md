# Décisions techniques

## SonarCloud — suppression du step dans ci.yml

**Décision :** Le step `SonarSource/sonarcloud-github-action` a été retiré de `ci.yml`.

**Raison :** Lors de la liaison du repo GitHub à SonarCloud, une **GitHub App** est installée automatiquement. Cette app déclenche l'analyse SonarCloud sur chaque PR de façon autonome, indépendamment du pipeline CI. Garder le step dans `ci.yml` aurait produit une double analyse redondante.

**Conséquence :** SonarCloud continue de tourner sur chaque PR via la GitHub App. Le check `SonarCloud Code Analysis` reste visible et requis dans les branch protection rules.

---

## Garde-fou migration — shadow database Docker jetable

**Décision :** Le garde-fou (`prisma migrate diff --from-migrations`) s'appuie sur une base PostgreSQL jetable démarrée en conteneur Docker (port 5433), et non sur la base de dev.

**Raison :** Prisma exige une _shadow database_ pour rejouer les migrations et détecter un drift entre `schema.prisma` et `prisma/migrations/`. Sans `--shadow-database-url`, la commande échoue (`You must pass the --shadow-database-url`). Une base dédiée (port 5433, distincte du 5432 de dev) évite toute interférence avec l'environnement de développement, et elle est détruite en fin de job (`if: always()`).

---

## Détection du drift — `--exit-code` plutôt que taille du fichier

**Décision :** Le drift est détecté via le flag `--exit-code` (0 = en sync, 2 = drift), pas en testant si le fichier de sortie est vide.

**Raison :** Quand le schéma est en sync, `migrate diff` écrit quand même `-- This is an empty migration.` — un fichier **non vide**. Un test `[ -s fichier ]` produirait donc un faux positif systématique.

---

## Shadow database sans mot de passe (auth `trust`)

**Décision :** La base jetable utilise `POSTGRES_HOST_AUTH_METHOD=trust` (aucun mot de passe).

**Raison :** Un mot de passe en dur dans le workflow (`postgresql://user:pass@...`) est signalé par SonarCloud comme Security Hotspot (règle S6698), ce qui casse la Quality Gate (100 % des hotspots doivent être revus). La base ne contenant aucune donnée et étant éphémère, l'auth `trust` supprime le secret sans risque.

---

## Shell des étapes CI — PowerShell (et non bash)

**Décision :** Le job CI force `defaults.run.shell: powershell` ; les étapes multi-lignes sont écrites en PowerShell 5.1.

**Raison :** Le runner self-hosted est sous Windows. Une première tentative avec `shell: bash` a échoué : GitHub Actions a résolu `bash` vers **WSL** (non installé/cassé) au lieu de Git Bash — erreur `execvpe(/bin/bash) failed: No such file or directory`. Le chemin de Git Bash contient un espace (`C:\Program Files\Git\...`), mal géré par le shell custom de GitHub. PowerShell 5.1 est natif, toujours présent, sans ambiguïté de résolution.

**Détail :** l'artefact `migration.sql` est écrit via `[System.IO.File]::WriteAllText` pour éviter le BOM UTF-8 que `Out-File`/`>` ajoutent en PowerShell 5.1.

---

## Gestion des erreurs natives en PowerShell (`NativeCommandError`)

**Décision :** Chaque étape PowerShell qui appelle un exécutable natif (docker, npx) commence par `$ErrorActionPreference = 'Continue'`, et l'existence d'un conteneur est vérifiée avant sa suppression (`docker ps -aq -f name=...`).

**Raison :** GitHub Actions préfixe les scripts PowerShell avec `$ErrorActionPreference = 'Stop'`. En PowerShell 5.1, dès qu'un exécutable natif écrit sur stderr (ex. `docker rm` sur un conteneur inexistant au premier run), PowerShell lève une `NativeCommandError` **fatale** — et `2>$null` ne la supprime pas. Résultat : l'étape échouait avec `exit code 1` alors que la commande était anodine. Passer en `Continue` + tester l'existence avant suppression élimine le problème. Les codes de sortie réels sont ensuite gérés explicitement via `$LASTEXITCODE`.

---

## Idempotence du script — limite de Prisma

**Décision :** Le script `migration.sql` est déterministe mais non idempotent, et c'est documenté comme accepté.

**Raison :** `prisma migrate diff --script` ne propose pas d'option idempotente (pas d'équivalent au `--idempotent` d'EF Core). Le SQL généré contient des `CREATE TABLE` bruts. Le TP demande l'idempotence « quand l'outil le permet » — ici l'outil ne le permet pas.

---

## Image Docker — build multi-stage

**Décision :** Le `Dockerfile` utilise deux stages (`builder` puis `runner`), l'image finale ne récupérant que `.output/` + `prisma/`.

**Raison :** Une app Nuxt a besoin des devDependencies et d'outils de compilation pour se builder, mais pas pour tourner. Un build mono-stage produirait une image ~800 MB–1 GB embarquant du code source et des outils inutiles. Le multi-stage descend à ~266 MB, réduit la surface d'attaque et accélère le push vers le registre.

---

## `.npmrc` copié dans l'image

**Décision :** Le `Dockerfile` copie `.npmrc` en même temps que `package.json`/`package-lock.json`, avant `npm ci`.

**Raison :** `.npmrc` contient `legacy-peer-deps=true`. Sans lui, `npm ci` échoue dans le conteneur (`ERESOLVE`) car `@gouvminint/vue-dsfr` attend `@iconify/vue` v4 alors que le projet est en v5. En local et en CI ça passe car npm lit le `.npmrc` du repo ; dans le build Docker, seules les couches explicitement copiées sont visibles — il faut donc le copier avant l'installation.

---

## Conteneur non-root (`USER node`)

**Décision :** L'image bascule sur l'utilisateur non-privilégié `node` (fourni par l'image officielle) avant le `CMD`.

**Raison :** Par défaut l'image `node` tourne en root (signalé par SonarLint, règle `docker:S6471`). Principe du moindre privilège : si l'app est compromise, l'attaquant n'obtient pas root dans le conteneur. L'app ne fait que servir sur le port 3000 (> 1024), aucun privilège élevé n'est nécessaire.

---

## Migration en job séparé dans Compose

**Décision :** Le déploiement du schéma (`prisma migrate deploy`) est confié à un service `migrate` dédié qui réutilise le stage `builder`, et non à l'image `app`.

**Raison :** L'image finale (`runner`) est volontairement dépourvue de la CLI Prisma (image légère). Seul le stage `builder` possède la CLI + le schéma. Le service `migrate` (`build.target: builder`) déploie le schéma une fois puis s'arrête ; `app` attend sa réussite (`service_completed_successfully`). C'est le pattern « init container » : migration = job distinct de l'exécution de l'app.

> **Évolution (TP CD).** Ceci reste vrai pour le **dev** (base `docker-compose.yml`). Pour le **déploiement**, le service `migrate` réutilise l'image publiée (avec Prisma embarqué, cf. décision « Migrations embarquées dans l'image publiée ») au lieu du stage `builder`. Voir [CD_DEPLOYMENT.md](CD_DEPLOYMENT.md).

---

## Push GHCR — `GITHUB_TOKEN` plutôt qu'un secret manuel

**Décision :** L'authentification au registre GHCR utilise le `GITHUB_TOKEN` d'Actions, via `--password-stdin`, plutôt qu'un Access Token stocké dans les secrets.

**Raison :** Le `GITHUB_TOKEN` est éphémère, injecté automatiquement, et ses droits sont cadrés par le bloc `permissions:` du workflow (`packages: write`). Rien à créer ni à faire tourner manuellement, contrairement à un PAT ou un token Docker Hub. `--password-stdin` évite que le secret apparaisse dans les logs. Le registre choisi est GHCR car le repo est déjà sur GitHub (zéro compte externe).

---

## Versioning — semantic-release plutôt que tag Git manuel

**Décision :** La version des images est calculée automatiquement par `semantic-release` à partir des commits conventionnels, et non posée manuellement (`git tag`).

**Raison :** La suite du projet prévoit une CD déclenchée automatiquement sur chaque push `master`. Un versioning manuel serait incohérent avec un déploiement automatique (risque d'oubli, d'erreur de niveau). semantic-release exploite les commits conventionnels déjà imposés par commitlint (`feat`→MINOR, `fix`→PATCH, `BREAKING CHANGE`→MAJOR), pose le tag Git + la Release GitHub, et n'agit que sur `master`. La porte reste ouverte au tag manuel, mais l'automatisation colle au reste de la chaîne.

---

## Publication versionnée — lecture du tag Git plutôt que plugin exec

**Décision :** Après `semantic-release`, une étape PowerShell lit le tag posé sur le commit (`git tag --points-at HEAD`) puis tague/pousse l'image ; on n'utilise pas `@semantic-release/exec` pour piloter Docker.

**Raison :** `@semantic-release/exec` lance ses commandes via `cmd.exe` sur Windows (shell:true), ce qui casserait la syntaxe PowerShell (`${env:IMAGE}`) utilisée partout dans le pipeline. Garder la logique Docker en PowerShell explicite dans `ci.yml` la rend cohérente, lisible et débogable. L'image « candidate » est d'abord taguée `:<sha>` (pour le smoke test) ; `:latest` et `:X.Y.Z` ne sont posés qu'à la publication d'une vraie version — `latest` = « dernière version **publiée** », pas « dernier commit ».

---

## Checkout complet pour semantic-release (`fetch-depth: 0`)

**Décision :** L'étape `actions/checkout` utilise `fetch-depth: 0`.

**Raison :** `semantic-release` compare les commits depuis la dernière release et lit les tags existants. Le clone superficiel par défaut (`fetch-depth: 1`) ne fournit ni l'historique complet ni les tags, ce qui fausserait le calcul de version. `fetch-depth: 0` récupère tout l'historique + les tags.

---

## Identifiants Compose externalisés dans `.env` (Security Hotspot S2068)

**Décision :** Les identifiants (`POSTGRES_PASSWORD`, `DATABASE_URL`, `NUXT_SESSION_PASSWORD`) ne sont plus en dur dans `docker-compose.yml` ; ils sont injectés via un fichier `.env` non versionné, avec un modèle `.env.example` versionné (sans secret réel).

**Raison :** SonarCloud signalait un mot de passe PostgreSQL en dur (règle S2068, « Make sure this password gets changed and removed from the code ») sur les lignes `DATABASE_URL` et `POSTGRES_PASSWORD`. Compose charge automatiquement `.env`, donc `docker-compose.yml` ne contient plus que des références `${VAR}`. Le healthcheck utilise `$${POSTGRES_USER}` (le `$$` échappe l'interpolation Compose pour laisser le shell du conteneur résoudre la variable). `.env` est ignoré par git **et** par Docker (`.dockerignore`) : aucun secret ne part dans le dépôt ni dans l'image. Même logique que la shadow database du CI (auth `trust`), adaptée à une base persistante qui, elle, exige un mot de passe.

---

## Login GHCR — `docker/login-action` plutôt que `docker login` en PowerShell

**Décision :** L'authentification à GHCR utilise l'action officielle `docker/login-action@v3`, et non un `$env:TOKEN | docker login ghcr.io --password-stdin` en PowerShell.

**Raison :** La première version (pipe PowerShell) échouait avec `Error response from daemon: Get "https://ghcr.io/v2/": denied: denied` sur le runner Windows self-hosted, alors que les droits (`packages: write`, Workflow permissions « Read and write ») étaient corrects. En PowerShell 5.1, un pipe vers l'entrée standard d'un exécutable natif applique l'encodage console (UTF-16/BOM), ce qui peut corrompre le token en transit → rejet par le registre. `docker/login-action` écrit le token sur stdin en binaire (via Node) et gère le credential store de Docker Desktop, éliminant le problème.

---

## Flux vers master imposé — `develop → master` uniquement (status check)

**Décision :** Un job `enforce-master-source` (dans `branch-check.yml`) échoue si une PR ciblant `master` ne vient pas de `develop`. Il est rendu _required_ dans la protection de branche de `master`.

**Raison :** GitHub n'offre aucun réglage natif pour restreindre la branche source d'une PR. Or on veut garantir le flux `feature/* → develop → master` : ainsi l'état publié depuis `master` a toujours été intégré et testé sur `develop` au préalable (ce qui justifie que le re-test sur `master` soit un filet et non une nécessité). Le job ne se déclenche que sur les PR vers `master` (`github.base_ref == 'master'`) et vérifie `github.head_ref == 'develop'`. Rendu obligatoire, il bloque tout autre merge (y compris `hotfix/*` ou `release/*` directs vers master — choix « develop strict » assumé).

---

## Migrations embarquées dans l'image publiée (choix « 2B »)

**Décision :** L'image finale (`runner`) embarque désormais la CLI Prisma + ses moteurs (copiés depuis le `builder`), pour qu'elle sache appliquer ses propres migrations. Le déploiement utilise donc **une seule image** — l'app et le service `migrate` partagent la même image publiée, seule la commande diffère.

**Raison :** Le déploiement (CD) tire l'image publiée sans build local (reproductibilité). Or `migrate deploy` exige la CLI Prisma, absente du `runner` d'origine. Trois options envisagées : (A) le service `migrate` rebuild le stage `builder` — simple mais casse le « pull-only » ; (B) embarquer Prisma dans l'image publiée — image un peu plus lourde mais artefact auto-suffisant ; (C) rejouer le `.sql` du TP2 via `psql` — écarté car ce script (`--from-empty`) **n'est pas idempotent**. Choix **B** : le plus « production-grade » et reproductible. On **copie** `node_modules/prisma` + `@prisma` depuis le `builder` plutôt que `npm ci` (qui relancerait le postinstall `nuxt prepare`, cassé dans ce stage minimal) ou `--ignore-scripts` (qui empêcherait le téléchargement du moteur Prisma). Le binaire est appelé par son chemin explicite (`node node_modules/prisma/build/index.js`) pour éviter toute install réseau via `npx`.

---

## Override Compose pour le déploiement (`docker-compose.deploy.yml`)

**Décision :** Un fichier d'override (`docker-compose.deploy.yml`) bascule `build:` → `image:` pour `app` et `migrate` ; le déploiement se fait via `docker compose -f docker-compose.yml -f docker-compose.deploy.yml pull` puis `up -d --no-build`.

**Raison :** Le compose de dev **construit** l'image (pratique local) ; le déploiement doit **tirer l'image exacte** testée et publiée en CI (reproductibilité). Un override ne contient que les deltas (DRY, pas de duplication de `db`/`volumes`/`ports`). Subtilité : un override ne peut pas _supprimer_ le `build:` du base — il coexiste alors avec `image:`. `--no-build` interdit tout rebuild → on n'utilise que l'image tirée. Le tag est paramétré via `${TAG:-latest}` (version injectée par le pipeline, `latest` en repli manuel).

---

## Déploiement en job séparé (`deploy`) plutôt qu'étapes ajoutées

**Décision :** Le déploiement automatique est un **job distinct** (`deploy`, `needs: ci`) dans `ci.yml`, et non des étapes ajoutées au job `ci`. Il expose la version publiée en sortie de job (`needs.ci.outputs.version`) et ne s'exécute que si une version a été produite.

**Raison :** Séparer publication et déploiement clarifie la chaîne (`needs:` explicite) et permet de conditionner finement le deploy (`push master` **et** version non vide). Le job `ci` calcule la version via semantic-release ; la passer au job `deploy` se fait proprement par une sortie de job. Le smoke test _éphémère_ du job `ci` a été déplacé du port 3000 au **3001** : l'app déployée occupe le 3000 en permanence, un conteneur de test sur le même port entrerait en conflit.

---

## Déploiement manuel dans un workflow séparé (`deploy.yml`)

**Décision :** Le redéploiement manuel (`workflow_dispatch` avec input `tag`) vit dans un fichier `deploy.yml` distinct, et non dans `ci.yml`.

**Raison :** Le déploiement auto a besoin de la sortie `version` du job `ci` — trivial _dans_ le même workflow. Faire communiquer deux workflows différents pour se transmettre cette valeur (via `workflow_run` + artefact) est complexe et fragile. Séparer donne : auto dans `ci.yml` (avec la version sous la main), manuel autonome dans `deploy.yml` (tag saisi à la main). Léger doublon d'étapes assumé pour la lisibilité. Le manuel sert aux tests : rejouer un déploiement, vérifier l'idempotence, redéployer une version précise (rollback).

---

## Secrets de déploiement via GitHub Secrets, `.env` généré à la volée

**Décision :** Les identifiants de l'environnement déployé sont stockés en **GitHub Secrets** ; le job de déploiement **génère le `.env`** à partir de ces secrets. Jamais dans git.

**Raison :** Le runner checkout dans un dossier de travail neuf à chaque run — le `.env` local de la machine n'y est pas. Les secrets Actions (`POSTGRES_USER/PASSWORD/DB`, `NUXT_SESSION_PASSWORD`) sont écrits en `.env` au moment du déploiement (via `[System.IO.File]::WriteAllLines`, UTF-8 sans BOM), que Compose charge automatiquement. Aligné sur la bonne pratique (secrets injectés à la volée, portables) et cohérent avec l'externalisation `.env` déjà en place. PostgreSQL fige ces identifiants au premier démarrage (volume vide) : ils sont donc définitifs pour l'environnement, et distincts du `.env` de dev.

---

## Actions GitHub épinglées à un SHA de commit

**Décision :** Les actions de `ci.yml` et `deploy.yml` sont épinglées à un **SHA de commit complet** (avec un commentaire `# vX.Y.Z` pour la lisibilité), au lieu d'un tag mutable `@vX`.

**Raison :** SonarCloud signale un Security Hotspot sur les actions référencées par tag : un tag (`@v3`) est un pointeur **mutable** que le mainteneur — ou un attaquant qui compromet le dépôt de l'action — peut déplacer vers du code malveillant, exécuté ensuite avec les secrets du pipeline (risque _supply chain_). Un SHA est **immuable** : on exécute exactement le code audité. Le login GHCR utilise donc `docker/login-action@c94ce9f… # v3.7.0`. Compromis : plus sûr mais figé (plus de mises à jour auto) → à compléter par **Dependabot** (écosystème `github-actions`) qui ouvrira des PR de bump de SHA. Les workflows pré-existants non modifiés (`dependency-check.yml`, `issue-triage.yml`) restent à épingler.

---

## Isolation dev ↔ déploiement par nom de projet Compose

**Décision :** `docker-compose.deploy.yml` déclare `name: cezizen-deploy`. Le déploiement tourne donc dans un projet Compose **distinct** du dev (`cezizen-devopstp`, nom du dossier), avec son propre volume `cezizen-deploy_postgres_data`.

**Raison :** Sur le runner self-hosted, dev et déploiement partagent la même machine, le même démon Docker et le même dossier → par défaut, le **même nom de projet** donc le **même volume Postgres**. Or ils utilisent des identifiants différents (dev = `.env` local ; déploiement = GitHub Secrets). **PostgreSQL fige le mot de passe à la première création du volume** : le second stack à démarrer se voit refuser l'accès (`P1000: Authentication failed`) — panne réellement rencontrée au premier déploiement `v1.1.0`, le volume ayant été initialisé par un test local (mot de passe `cesizen`) avant que le déploiement CI (secret) ne tente de s'y connecter. Un `name:` distinct dans l'override sépare conteneurs et volume, sans modifier les workflows (le `name:` du dernier fichier fusionné l'emporte). Corollaire assumé : ne pas lancer les deux stacks simultanément (conflit de ports 3000/5432).
