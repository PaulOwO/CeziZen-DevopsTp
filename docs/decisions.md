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

## `shell: bash` sur le runner Windows

**Décision :** Le job CI force `defaults.run.shell: bash`.

**Raison :** Le runner self-hosted est sous Windows, où GitHub Actions utilise PowerShell par défaut. Les étapes multi-lignes (continuations `\`, `if [ ]`, `wc`, `seq`) sont en syntaxe bash et échoueraient sous PowerShell. Git Bash (déjà présent avec Git) est utilisé à la place.

---

## Idempotence du script — limite de Prisma

**Décision :** Le script `migration.sql` est déterministe mais non idempotent, et c'est documenté comme accepté.

**Raison :** `prisma migrate diff --script` ne propose pas d'option idempotente (pas d'équivalent au `--idempotent` d'EF Core). Le SQL généré contient des `CREATE TABLE` bruts. Le TP demande l'idempotence « quand l'outil le permet » — ici l'outil ne le permet pas.
