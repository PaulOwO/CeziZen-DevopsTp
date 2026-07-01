# Décisions techniques

## SonarCloud — suppression du step dans ci.yml

**Décision :** Le step `SonarSource/sonarcloud-github-action` a été retiré de `ci.yml`.

**Raison :** Lors de la liaison du repo GitHub à SonarCloud, une **GitHub App** est installée automatiquement. Cette app déclenche l'analyse SonarCloud sur chaque PR de façon autonome, indépendamment du pipeline CI. Garder le step dans `ci.yml` aurait produit une double analyse redondante.

**Conséquence :** SonarCloud continue de tourner sur chaque PR via la GitHub App. Le check `SonarCloud Code Analysis` reste visible et requis dans les branch protection rules.
