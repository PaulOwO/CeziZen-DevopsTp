# Guide Complet: Outils de Maintenance CESIZen

## Comment utiliser, comprendre et expliquer les tools

---

## TABLE DES MATIÈRES

1. Vue d'ensemble du système
2. GitHub Issues - Gestion des tickets
3. GitHub Project Board - Suivi du travail
4. GitHub Actions - Automatisations
5. Exemple complet: Cycle de vie d'un bug
6. Bonnes pratiques
7. FAQ & Troubleshooting

---

## PART 1: VUE D'ENSEMBLE DU SYSTÈME

### Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │  GitHub Issues   │      │  GitHub Projects │             │
│  │  (Tickets)       │←────→│  (Board Kanban)  │             │
│  │  - Bug reports   │      │  - Colonnes      │             │
│  │  - Features      │      │  - Automation    │             │
│  │  - Labels        │      │  - Metrics       │             │
│  └──────────────────┘      └──────────────────┘             │
│           ↑                          ↑                        │
│           │                          │                        │
│           └──────────┬───────────────┘                       │
│                      │                                        │
│           ┌──────────▼──────────┐                           │
│           │  GitHub Actions     │                           │
│           │  (Automatisations)  │                           │
│           │  - Workflows        │                           │
│           │  - Triggers         │                           │
│           │  - Scripts          │                           │
│           └─────────────────────┘                           │
│                      ↓                                        │
│           ┌──────────────────────┐                          │
│           │  Notifications Slack │                          │
│           │  Issues labels auto  │                          │
│           │  Reports création    │                          │
│           └──────────────────────┘                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Qu'est-ce que chaque outil fait?

| Outil          | Rôle                   | Analogue réel                  |
| -------------- | ---------------------- | ------------------------------ |
| **Issues**     | Créer & gérer tickets  | Un carnet de notes post-its    |
| **Projects**   | Organiser & visualiser | Un tableau blanc avec colonnes |
| **Actions**    | Automatiser les tâches | Un robot qui travaille 24/7    |
| **Labels**     | Catégoriser & filtrer  | Des autocollants de couleur    |
| **Milestones** | Grouper par sprint     | Une phase du projet            |

### Le flux complet

```
UTILISATEUR SIGNALE UN BUG
           ↓
     Crée une ISSUE
           ↓
    Système ajoute automatiquement:
    - Label "bug" (GitHub Actions)
    - Ajout au PROJECT BOARD
    - Demande de priorité
           ↓
   TRIAGE & ASSIGNATION
   (Product Owner)
           ↓
   Développeur change statut
   au PROJECT (In Progress)
           ↓
   Code écrit → Pull Request
           ↓
   Statut change (In Review)
   sur PROJECT
           ↓
   PR Merged
           ↓
   GitHub Actions change "Done"
           ↓
   Issue automatiquement fermée
```

---

## PART 2: GITHUB ISSUES - Gestion des Tickets

### 2.1 Qu'est-ce qu'une Issue?

Une **Issue** = Un ticket = Une demande/problème

**Types d'issues** (on en a créé 3 templates):

#### Template 1: 🐛 Bug Report

**Quand l'utiliser**: Un bug a été découvert

**Exemple réel**:

```
Titre: [BUG] Le bouton "Login" ne marche pas sur mobile

Description:
- Quand je clique sur le bouton login sur mon téléphone
- Le formulaire n'apparaît pas
- Erreur dans la console: "TypeError: button undefined"

Sévérité: HAUTE
```

#### Template 2: ✨ Feature Request

**Quand l'utiliser**: On veut une nouvelle fonctionnalité

**Exemple réel**:

```
Titre: [FEATURE] Ajouter notification email

Description:
Problème: Les utilisateurs ne savent pas quand on poste du contenu

Critères d'acceptation:
- [ ] Notification email envoyée 5min après post
- [ ] Email contient lien vers post
- [ ] User peut se désabonner
```

#### Template 3: 🔒 Security Incident

**Quand l'utiliser**: Un problème de sécurité

**Exemple réel**:

```
Titre: [SECURITY] XSS vulnerability dans page profil

Type: Vulnerability Discovery
Sévérité: CRITICAL
Description: Utilisateurs peuvent injecter du JS dans bio
```

### 2.2 Comment créer une Issue

**Étape 1**: Aller sur GitHub → Issues tab

```
https://github.com/PaulOwO/CeziZen-DevopsTp/issues
```

**Étape 2**: Cliquer "New Issue"

```
┌────────────────────────────┐
│  New Issue button (vert)   │
└────────────────────────────┘
```

**Étape 3**: Choisir un template

```
Vous verrez 3 options:
- 🐛 Bug report
- ✨ Feature Request
- 🔒 Security Incident
```

**Étape 4**: Remplir le formulaire

```
[Titre] : [BUG] Login button not working on mobile

[Description] : (Suit le template)
```

**Étape 5**: Cliquer "Submit new issue"
→ Issue créée avec numéro automatique (ex: #123)

### 2.3 Les Labels (Étiquettes)

Les labels sont des **catégories colorées** pour organiser les issues.

**Labels utilisés à CESIZen**:

```
🔴 PRIORITÉ (couleurs de priorité)
├─ critical    : ⚠️ URGENT - système down
├─ high        : 🔴 Important - ce sprint
├─ medium      : 🟡 Bientôt - prochain sprint
└─ low         : 🟢 Peut attendre

🟢 TYPE (type de tâche)
├─ bug         : Quelque chose qui ne marche pas
├─ feature     : Nouvelle fonctionnalité
├─ enhancement : Amélioration d'une existante
└─ documentation : Docs à écrire

🔵 STATUT (état actuel)
├─ blocked     : Attend quelque chose
├─ duplicate   : Existe déjà
├─ help-wanted : Besoin d'aide
└─ wontfix     : Ne sera pas réglé

🟠 DOMAINE (partie de l'app)
├─ breathing   : Module respiration
├─ emotion-tracker : Tracker d'émotions
├─ accounts    : Gestion utilisateurs
├─ infra       : Infrastructure
```

### 2.4 Comment ajouter un Label

**Option 1**: Manuelle (après création)

```
1. Ouvrir l'issue
2. À droite: Section "Labels"
3. Cliquer le label qu'on veut
4. Fermer (auto-sauvegarde)
```

**Option 2**: Automatique (GitHub Actions)

```
Notre workflow regarde le titre et ajoute auto:
- Si titre contient "[BUG]" → Ajoute label "bug"
- Si titre contient "[FEATURE]" → Ajoute label "feature"
- Si titre contient "[SECURITY]" → Ajoute label "security"
```

### 2.5 Assignation & Milestone

**Assignation** = Dire qui travaille dessus

```
Issue créée
    ↓
Product Owner regarde
    ↓
Assigne à Developer X
    ↓
Developer accepte et commence
```

**Milestone** = Grouper par phase (sprints)

```
Sprint-2026-W23 (ex: 3-7 juin)
├─ Issue #101 - Bug login
├─ Issue #102 - Feature export
└─ Issue #103 - Docs update
```

---

## PART 3: GITHUB PROJECT BOARD - Suivi du Travail

### 3.1 Qu'est-ce qu'un Project?

Un **Project = Tableau Kanban digital**

C'est comme un tableau blanc avec colonnes:

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ BACKLOG  │   TODO   │IN PROGRESS│IN REVIEW│  DONE    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ Issue#50 │ Issue#45 │ Issue#40 │ Issue#38 │ Issue#30 │
│ Issue#51 │ Issue#46 │ Issue#41 │ Issue#39 │ Issue#31 │
│ Issue#52 │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### 3.2 Les 5 colonnes expliquées

| Colonne         | Signification                | Exemple d'issue                    |
| --------------- | ---------------------------- | ---------------------------------- |
| **BACKLOG**     | Pas encore priorisée         | Feature demandée l'année prochaine |
| **TODO**        | Priorisée, attend assignment | Bug à fixer ce sprint              |
| **IN PROGRESS** | Quelqu'un y travaille        | "Je code le fix en ce moment"      |
| **IN REVIEW**   | Code écrit, attend review    | PR ouverte sur GitHub              |
| **DONE**        | Terminée et déployée         | "Merged en production"             |

### 3.3 Comment utiliser le Board

**Accéder au board**:

```
https://github.com/PaulOwO/CeziZen-DevopsTp/projects
```

**Voir le board**:

```
Chaque issue = Une carte
Chaque carte peut être:
- Glissée d'une colonne à l'autre
- Cliquée pour voir détails
- Éditée directement
```

**Exemple workflow réel**:

```
Lundi matin:
├─ 5 nouvelles issues dans BACKLOG
└─ Aucune n'a de label

Product Owner fait TRIAGE:
├─ Ajoute labels "bug", "medium"
├─ Glisse 3 en TODO (ce sprint)
└─ Laisse 2 en BACKLOG

Développeur commence travail:
├─ Prend issue du TODO
├─ Glisse en IN PROGRESS
├─ Ouvre branche git + code
├─ Quand fini: Crée Pull Request
└─ Issue auto-glisse en IN REVIEW

Après code review:
├─ PR est mergée
└─ Issue auto-glisse en DONE + auto-close
```

### 3.4 Automations du Board

Nos workflows GitHub Actions automatisent certains mouvements:

**Automation 1**: Création issue → Auto-add au board

```
Dès qu'une issue est créée:
├─ GitHub Actions la détecte
├─ Ajoute automatiquement au Project
└─ Placée en colonne BACKLOG
```

**Automation 2**: Pull Request ouvert → Colonne "IN REVIEW"

```
Quand développeur ouvre PR:
├─ GitHub Actions détecte
├─ Déplace issue correspondante
└─ EN IN REVIEW column
```

**Automation 3**: PR mergée → Colonne "DONE"

```
Quand PR est mergée:
├─ GitHub Actions détecte
├─ Déplace issue en DONE
└─ Ferme automatiquement l'issue
```

---

## PART 4: GITHUB ACTIONS - Automatisations

### 4.1 Qu'est-ce qu'une GitHub Action?

Une **GitHub Action = Un robot qui exécute des tâches automatiquement**

**Analogie**: C'est comme avoir un assistant qui:

- Vérifie le code chaque nuit
- Signale les vulnérabilités
- Catégorise automatiquement les tickets
- Envoie des notifications
- Exécute les tests

**Fonctionnement**:

```
Événement déclencheur
        ↓
Action se lance automatiquement
        ↓
Exécute des commandes
        ↓
Résultat: rapport, notification, etc.
```

### 4.2 Workflow 1: Dependency Check

**Fichier**: `.github/workflows/dependency-check.yml`

**Quand ça s'exécute**:

```
Chaque lundi à 9h00 du matin UTC
(Automatiquement, même si personne ne fait rien)
```

**Qu'est-ce que ça vérifie**:

1. **NPM Audit** = Cherche les vulnérabilités dans les packages

```
npm audit

Regarde: Avons-nous des packages obsolètes?
         Y a-t-il des failles de sécurité?
```

2. **Outdated packages** = Cherche les mises à jour disponibles

```
npm outdated

Affiche:
Package      Wanted   Latest
express      4.17.1   4.18.2  ← Mise à jour dispo
lodash       4.15.0   4.17.21 ← Mise à jour dispo
```

3. **Security headers check** = Vérifie config de sécurité

```
Cherche dans nuxt.config.ts:
- Headers HTTPS?
- Cookies httpOnly?
- CSP policies?
```

**Résultat**:

```
Si problèmes trouvés:
  → GitHub crée automatiquement une ISSUE
  → Label: "technical-debt"
  → Titre: "[Maintenance] Outdated dependencies detected"

Si pas de problèmes:
  → Rapport généré (téléchargeable)
  → Rien ne se passe
```

**Où voir les résultats**:

```
1. GitHub Actions tab
   https://github.com/PaulOwO/CeziZen-DevopsTp/actions

2. Chercher "Dependency Check & Audit"

3. Cliquer sur la dernière exécution

4. Voir les logs
```

### 4.3 Workflow 2: Issue Triage

**Fichier**: `.github/workflows/issue-triage.yml`

**Quand ça s'exécute**:

```
IMMÉDIATEMENT quand:
- Une nouvelle issue est créée
- Une issue est réouverte
- Un Pull Request est ouvert
```

**Qu'est-ce que ça fait**:

#### Action 1: Auto-labeling

```
GitHub Actions regarde le TITRE de l'issue:

Si titre = "[BUG] ..."
  → Ajoute automatiquement label "bug" (rouge)

Si titre = "[FEATURE] ..."
  → Ajoute automatiquement label "feature" (bleu)

Si titre = "[SECURITY] ..."
  → Ajoute automatiquement label "security" (urgent)
```

**Exemple**:

```
Vous créez issue avec titre:
"[BUG] Login button not working"

Immédiatement (< 10 secondes):
├─ Label "bug" ajouté automatiquement ✓
├─ Ajoutée au PROJECT board ✓
└─ Message de bienvenue posté ✓
```

#### Action 2: Priority Prompt

Quand une issue est créée, GitHub ajoute un commentaire auto:

```
👋 Thank you for reporting this issue!

Please help us prioritize by adding one of these labels:
- 🔴 critical - System down / Data loss
- 🟠 high - Major functionality broken
- 🟡 medium - Workaround available
- 🟢 low - Minor issue

Also ensure you've selected the correct issue type in the template.
```

Ça dit au reporter: "SVP ajoute la priorité!"

#### Action 3: Auto-close Stale

```
Chaque semaine, GitHub Actions vérifie:

"Y a-t-il des issues sans activité depuis 30 jours?"
  ↓ OUI
  → Ajoute label "stale"
  → Poste message: "Cette issue va être fermée..."

"Y a-t-il des issues sans activité depuis 60 jours?"
  ↓ OUI
  → Ferme automatiquement l'issue
  → Message: "Closed due to inactivity"

Exception: N'y touche pas si label:
  - critical
  - bug
  - security
  - blocked
```

### 4.4 Où voir les Actions en cours

```
1. Aller sur GitHub repo
2. Cliquer "Actions" tab en haut
3. Voir la liste des workflows
4. Cliquer sur un pour voir les détails
```

**Exemple d'affichage**:

```
✅ Tests passed
❌ Security check failed
⏳ Running... (en cours)
⭕ Skipped (pas exécuté)
```

---

## PART 5: EXEMPLE COMPLET - Cycle de Vie d'un Bug

Suivons un bug du signalement à la résolution:

### Jour 1: Un utilisateur signale un bug

**Utilisateur fait**:

```
Va sur: https://github.com/PaulOwO/CeziZen-DevopsTp/issues
Clique: New Issue
Choisit: Bug report template
Remplit:
  - Titre: [BUG] Breathing exercise timer stuck at 0:00
  - Description: (Suit le template)
Clique: Submit
```

**Ce qui se passe auto** (< 30 secondes):

```
GitHub Actions détecte la nouvelle issue:

1. Ajoute label "bug" ✓
   (Parce que titre contient "[BUG]")

2. Ajoute au Project board ✓
   (Colonne: BACKLOG)

3. Ajoute commentaire auto ✓
   "Please add priority label..."

4. Assignés: Product Owner reçoit notification Slack
```

**Résultat**: Issue #247 est créée

### Jour 2: Product Owner fait le triage

**Product Owner fait**:

```
1. Ouvre issue #247
2. Lit description complète
3. Test le bug lui-même (confirm c'est réel)
4. Juge: "C'est CRITIQUE - exercice ne marche pas!"
5. Ajoute:
   - Label "critical" (couleur rouge)
   - Label "breathing" (domaine)
   - Milestone "Sprint-2026-W23"
6. Assigne à: Developer "Alice"
7. Glisse le card de BACKLOG → TODO au Project board
```

**Résultat**:

```
Issue #247 est maintenant:
├─ Labels: bug, critical, breathing
├─ Assignée à: Alice
├─ Milestone: Sprint-2026-W23
└─ Dans colonne TODO du board
```

Alice reçoit notification: "Tu as une issue assignée"

### Jour 3: Developer Alice commence

**Alice fait**:

```
1. Ouvre issue #247
2. Lit tous les détails
3. Lance l'appli pour reproduire bug
4. Crée branche git:
   git checkout -b fix/breathing-timer-#247
5. Commence à coder le fix
6. Au Project board: Glisse card de TODO → IN PROGRESS
```

**Résultat**:

```
Card dans IN PROGRESS au board
Montre que Alice y travaille
```

Alice code pendant 4 heures...

### Jour 4: Fix terminé - Alice crée Pull Request

**Alice fait**:

```
1. Code du fix écrit et testé localement ✓
2. Commit: "Fix: breathing timer not resetting (#247)"
3. Push branche vers GitHub
4. Crée Pull Request:
   - Title: "Fix: Reset breathing timer on completion #247"
   - Description: "Fixes #247"
   - Assigné à: Code Reviewer (ex: Bob)
```

**Ce qui se passe auto**:

```
GitHub Actions détecte la PR:

1. Lance les tests automatiques
2. Vérifie la qualité du code
3. Déplace issue #247:
   BACKLOG → IN REVIEW au board
4. Notifie Bob: "Review needed"
```

**Résultat**:

```
Pull Request #248 créée
Card #247 dans IN REVIEW
Attend review de Bob
```

### Jour 5: Code Review & Merge

**Bob (reviewer) fait**:

```
1. Ouvre Pull Request #248
2. Lit le code ligne par ligne
3. Teste le fix lui-même
4. Laisse des commentaires / demande modifications

(Alice répond et ajuste si besoin)

Une fois approuvé:
5. Clique: "Approve"
6. Clique: "Merge Pull Request"
```

**Ce qui se passe auto**:

```
GitHub Actions détecte le merge:

1. Lance tests complets de nouveau
2. Vérifie tout encore

Si tout ✓:
3. Déploie en staging automatiquement
4. Issue #247:
   - Glisse en DONE au board
   - Se ferme automatiquement
5. Notifie: "Issue fixed in PR #248"

Si problème ❌:
3. Bloque le merge
4. Envoie erreur à Alice
```

**Résultat**:

```
PR mergée en branche main ✓
Issue #247 fermée ✓
Tout le monde a une notification
```

### Jour 6: Déploiement en production

**DevOps fait**:

```
1. Prépare une release (v1.2.0)
2. Inclut PR #248
3. Déploie en production
4. Rajoute tag git: v1.2.0
```

**Résultat final**:

```
✅ Bug résolu en production
✅ Utilisateur qui l'a signalé peut vérifier
✅ Historique complet traçable:
   Issue #247 → PR #248 → Commit abc123 → Release v1.2.0
```

---

## PART 6: Bonnes Pratiques

### 6.1 Lors de la création d'une issue

✅ **À FAIRE**:

```
- Titre clair et spécifique
  BON: "[BUG] Login button not clickable on mobile"
  MAUVAIS: "Something is broken"

- Template approprié
  Utiliser bug_report.md pour bugs!

- Description détaillée avec steps
  Inclure: quoi, quand, où, résultat attendu

- Chercher avant (pas de duplicates)
  Peut-être quelqu'un a déjà signalé

- Une issue = Une problème
  Ne mélanger bug + feature dans même issue
```

❌ **À ÉVITER**:

```
- Titre générique vague
- Pas de détails
- Format pas standard
- Spam/troll
- Discussion longue (utiliser Slack pour ça)
```

### 6.2 Lors du triage (Product Owner)

✅ **À FAIRE**:

```
- Ajouter les labels appropriés
- Assigner à quelqu'un
- Définir la priorité
- Ajouter à un milestone
- Glisser en TODO si ce sprint
```

❌ **À ÉVITER**:

```
- Laisser "BACKLOG" indéfiniment
- Assigner sans parler à la personne
- Priorité mal calibrée
- Laisser sans label
```

### 6.3 Lors du développement

✅ **À FAIRE**:

```
- Glisser card en IN PROGRESS
- Branche avec nom explicite:
  fix/issue-title-#123
  feature/user-auth-#124

- Message commit clair:
  "Fix: breathing timer not resetting #247"

- Glisser en IN REVIEW quand PR créée
- Répondre aux commentaires promptement
```

❌ **À ÉVITER**:

```
- Committer sans branche
- Pas de lien vers issue
- Commit message "asdf" ou "fix"
- Laisser IN PROGRESS trop longtemps
```

### 6.4 Pour la tech watch / Monitoring

✅ **À FAIRE**:

```
- Vérifier TECH_WATCH_LOG.md hebdo
- Réagir aux alertes Dependabot (24h max)
- Ajouter entrées pour nouvelles tech
- Documenter les décisions
```

❌ **À ÉVITER**:

```
- Ignorer les alertes sécurité
- Mettre à jour sans tester
- Ne pas documenter pourquoi rejeté
```

---

## PART 7: FAQ & Troubleshooting

### Q1: Comment je cherche une issue existante?

**Réponse**:

```
Option 1: Utilisez la barre de recherche
- Haut de la page Issues
- Tapez un mot-clé
- Filtrez par label ou assigné

Option 2: Filtrez les labels
- Cliquez un label (ex: "bug")
- Voit toutes les issues avec ce label

Option 3: GitHub search avancé
https://github.com/PaulOwO/CeziZen-DevopsTp/issues?q=breathing+timer
```

### Q2: Une issue n'a pas reçu de label auto, pourquoi?

**Réponse**:

```
Causes possibles:

1. Titre mal formaté
   BON: "[BUG] Something broke"
   MAUVAIS: "BUG: Something broke" (pas de crochets!)

2. Action n'a pas encore tourné
   Attendre 1-2 minutes

3. Droits insuffisants
   Actions ne peut pas modifier si l'issue vient d'un fork

4. Action désactivée
   Vérifier: .github/workflows/issue-triage.yml existe?
```

### Q3: Comment j'ajoute un label manuellement?

**Réponse**:

```
1. Ouvrir l'issue
2. À droite, section "Labels"
3. Cliquer le label (ou 'X' pour enlever)
4. C'est auto-sauvegardé
```

### Q4: Comment on archive une issue vieille?

**Réponse**:

```
Option 1: Fermer l'issue (manuellement)
- Bouton "Close issue" en bas

Option 2: Elle se ferme auto (60 jours stale)
- Sauf si label: critical, bug, security, blocked

Option 3: Filtrer par "closed"
https://github.com/PaulOwO/CeziZen-DevopsTp/issues?q=is%3Aclosed
```

### Q5: Comment voir qui travaille sur quoi?

**Réponse**:

```
Option 1: Project Board
- https://github.com/PaulOwO/CeziZen-DevopsTp/projects
- Voir IN PROGRESS column

Option 2: Filter by assignee
- Issues page
- Filter "Assignee"
- Select "Alice" pour voir ses issues

Option 3: Milestone view
- Select "Sprint-2026-W23"
- Voit toutes les issues du sprint
```

### Q6: Comment j'ajoute une issue à un milestone (sprint)?

**Réponse**:

```
1. Ouvrir l'issue
2. À droite, section "Milestone"
3. Cliquer dropdown "Set milestone"
4. Sélectionner "Sprint-2026-W23"
5. Auto-sauvegardé
```

### Q7: Comment on crée un nouveau milestone?

**Réponse**:

```
1. Aller sur Issues page
2. Haut à droite: "Milestones"
3. Cliquer "Create a milestone"
4. Nom: "Sprint-2026-W24"
5. Date due: Next Sunday
6. Description: "June 16-22, 2026"
7. Create
```

### Q8: Qu'est-ce que ça veut dire "Dependabot alert"?

**Réponse**:

```
Dependabot = Bot de GitHub qui surveille les vulnérabilités

Quand trouve une vuln:
1. Crée automatiquement une Pull Request
2. Avec le fix proposé
3. Title: "[security] Update package X to Y"
4. Tu dois review et merger

Sévérité:
- Critical: Fix dans 24h!
- High: Fix cette semaine
- Medium: Fix ce sprint
- Low: Peut attendre
```

### Q9: Comment voir les logs d'une GitHub Action?

**Réponse**:

```
1. Aller sur: Actions tab
2. Cliquer le workflow que tu veux
3. Cliquer "Run # XX"
4. Voir les logs en détail
5. Chaque étape montre:
   ✓ Réussi
   ✗ Erreur

Utile pour debug si quelque chose ne marche pas.
```

### Q10: Je veux désactiver une GitHub Action?

**Réponse**:

```
Option 1: Directement dans GitHub UI
- Actions tab
- Cliquer workflow
- Menu "..." (3 points)
- "Disable workflow"

Option 2: Code
- Ouvrir le .yml
- Changer "on:" section
- Commenter ou supprimer triggers

Exemple:
# on:
#   schedule:
#     - cron: '0 9 * * 1'

Ça la désactive.
```

---

## RÉSUMÉ POUR L'EXAMEN

Si on te demande d'expliquer le système à l'oral:

### Structure (Elevator pitch):

```
"CESIZen utilise GitHub pour gérer la maintenance via 3 outils:

1. ISSUES: C'est notre système de ticketing
   - Chaque bug/feature = 1 issue
   - Templates standardisés
   - Labels pour catégoriser

2. PROJECT BOARD: Kanban visual
   - 5 colonnes: Backlog → Todo → In Progress → In Review → Done
   - Voir qui travaille sur quoi
   - Tracer la progression

3. GITHUB ACTIONS: Automatisations
   - Dependency checks hebdo (sécurité)
   - Auto-labeling des issues (triage)
   - Auto-close stale (propreté)
   - CI/CD pour tests et deploy

Tout ça = Maintenance efficace et traçable"
```

### Pour l'examen, tu peux dire:

❌ Mauvaise réponse:
"On utilise beaucoup d'outils compliqués, GitHub c'est pour coder"

✅ Bonne réponse:
"GitHub Issues organise nos tickets avec labels et priorities.
Project Board montre vissuellement l'état du travail en Kanban.
GitHub Actions automatise les tâches répétitives (tests, audit, triage)
pour que l'équipe se concentre sur le développement"

---

## DOCUMENTS DE RÉFÉRENCE

Voir aussi:

1. `docs/MAINTENANCE_PLAN.md` - Guide complet maintenance
2. `docs/TECH_WATCH_STRATEGY.md` - Stratégie veille
3. `.github/workflows/` - Les actions réelles
4. `.github/ISSUE_TEMPLATE/` - Les templates
5. `LIVRABLE_MAINTENANCE.md` - Pour la soutenance

---

**Version**: 1.0
**Date**: 2026-05-28
**Pour**: Soutenance Bloc 3 + Examen
