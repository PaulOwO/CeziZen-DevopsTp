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
