# Vue d'ensemble CI/CD & Automatisations

## Hooks Git (local, avant chaque commit)

| Hook         | Déclencheur  | Rôle                                                                             |
| ------------ | ------------ | -------------------------------------------------------------------------------- |
| `pre-commit` | `git commit` | Reformate automatiquement les fichiers stagés avec Prettier.                     |
| `commit-msg` | `git commit` | Vérifie que le message suit le format conventionnel (`feat:`, `fix:`, `docs:`…). |
| `pre-push`   | `git push`   | Vérifie que le nom de la branche suit le format `<type>/<description>`.          |

---

## GitHub Actions

### `issue-triage.yml` — Gestion des Issues & PRs

Déclenché à l'ouverture d'une issue ou d'une PR.

| Job                | Rôle                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `auto-label`       | Ajoute automatiquement un label (`bug`, `feature`, `security`) selon le titre de l'issue ou de la PR. |
| `priority-prompt`  | Poste un commentaire sur les nouvelles issues pour demander de choisir une priorité (critical → low). |
| `auto-close-stale` | Marque les issues sans activité depuis 30 jours comme "stale", puis les ferme après 60 jours.         |

---

### `branch-check.yml` — Nommage des branches

Déclenché à chaque push et ouverture de PR.

| Job                 | Rôle                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `check-branch-name` | Vérifie que la branche respecte le format `<type>/<description>` (`feature/`, `fix/`, `hotfix/`…). |

---

### `dependency-check.yml` — Sécurité des dépendances

Déclenché chaque lundi à 9h UTC (ou manuellement).

| Job                | Rôle                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------- |
| `npm-audit`        | Analyse les dépendances à la recherche de vulnérabilités connues et génère un rapport. |
| `dependency-check` | Liste les packages obsolètes et ouvre une issue de maintenance si nécessaire.          |
| `security-headers` | Vérifie que `nuxt.config.ts` contient une configuration des en-têtes de sécurité HTTP. |
