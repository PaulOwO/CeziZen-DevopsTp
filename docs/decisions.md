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
