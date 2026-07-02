# Notes pédagogiques — Docker, CI/CD & Release

> ⚠️ **Document éducatif.** Cette annexe n'est pas une spécification technique : elle
> retranscrit les **questions** que je me suis posées pendant la réalisation du TP et les
> **explications** qui m'ont permis de comprendre les choix. Les décisions « officielles »
> sont dans [decisions.md](decisions.md) ; le fonctionnement dans
> [DOCKER_AND_RELEASE.md](DOCKER_AND_RELEASE.md) et [CICD_OVERVIEW.md](CICD_OVERVIEW.md).
> Le but ici est de **tracer le raisonnement**, pas de documenter le code.

---

## 1. Concepts Docker

### Image vs conteneur

- **Image** = modèle figé, en lecture seule (le résultat d'un `docker build`).
- **Conteneur** = une instance en cours d'exécution de cette image (`docker run`).
- Analogie : l'image est la « classe », le conteneur est l'« objet instancié ».

### Les couches (layers) et le cache

Chaque instruction du `Dockerfile` crée une **couche** mise en cache. Au rebuild, Docker
réutilise les couches inchangées et ne recalcule que celles impactées **et** celles en
dessous. D'où la règle : **dépendances en haut, code en bas**.

```dockerfile
COPY package.json package-lock.json .npmrc ./
RUN npm ci        # reste en cache tant que les manifestes ne changent pas
COPY . .          # le code change souvent → placé après
```

### Le multi-stage

Deux `FROM` dans un même fichier. Le stage `builder` fait le travail lourd (installer,
compiler) puis est **jeté** ; l'image finale ne récupère que le résultat (`.output/`).
Analogie : le `builder` est l'atelier (outils, désordre), l'image finale est le colis
qu'on expédie (juste le produit fini). Gain : ~266 Mo au lieu de ~800 Mo–1 Go.

---

## 2. Pièges rencontrés (et pourquoi)

### `npm ci` échouait dans le conteneur (`ERESOLVE`)

Le `.npmrc` du projet contient `legacy-peer-deps=true` (car `@gouvminint/vue-dsfr` attend
`@iconify/vue` v4 alors qu'on est en v5). En local/CI, npm lit ce fichier ; dans le build
Docker, **seules les couches copiées explicitement existent** → il fallait copier `.npmrc`
avant `npm ci`.

### `denied: denied` au login GHCR

Le `docker login … --password-stdin` via un **pipe PowerShell** corrompait l'encodage du
token (UTF-16/BOM) sur le runner Windows → rejet par le registre. Solution :
`docker/login-action@v3` (écrit le token en binaire).

### Le passage HTTP 500 → 401

Image lancée **seule** : les routes DB renvoyaient **500** (Prisma sans base). Une fois
reliée via Compose : **401** (route protégée, la base répond). Le 401 est donc la **preuve**
que la connexion à la base fonctionne — pas une régression.

### C'est quoi GHCR ?

**GitHub Container Registry** (`ghcr.io`) : le « GitHub des images Docker ». `docker push`
y envoie l'image, `docker pull` la récupère ailleurs. Choisi car le repo est déjà sur
GitHub → auth via `GITHUB_TOKEN`, zéro compte externe.

---

## 3. Questions sur la structure du pipeline

### Le workflow Docker est-il seulement local, ou dans la CI ?

Il **est** dans la CI (`ci.yml`, étapes 12-17). Mes `docker build` dans le terminal
n'étaient que des tests manuels pendant la construction. Subtilité : le runner est
`self-hosted` → « CI » et « local » sont la **même machine** ; la différence est _qui
déclenche_ (GitHub Actions vs moi).

### Les étapes Docker remplacent-elles les étapes 1 à 5 ?

**Non.** Le `docker build` ne fait, à l'intérieur, que `npm ci` + `prisma generate` +
`nuxt build`. Il ne fait **ni lint, ni tests, ni garde-fou migrations**. Il y a deux
« mondes » :

| 🖥️ Runner (hôte) — étapes 1-11            | 📦 Dans l'image — étape 13               |
| ----------------------------------------- | ---------------------------------------- |
| « Mon **code** est-il bon ? »             | « Mon **artefact** est-il fabricable ? » |
| checkout, npm ci, lint, tests, migrations | npm ci, prisma generate, nuxt build      |

Seuls `npm ci` et `nuxt build` se recoupent. Lint et tests n'existent **que** sur l'hôte.

### Pourquoi builder le projet (étape 5) ET le Docker (étape 13) ?

Deux buts distincts : l'étape 5 (`nuxt build` sur l'hôte) donne un **feedback rapide et
isolé** « le code compile » et sert de prérequis aux tests ; l'étape 13 produit
l'**artefact** livrable, dans l'environnement cible (Linux). Le coût du double build est
faible grâce au cache. Choix : on garde les deux (séparation qualité / packaging).

### Pourquoi « builder plusieurs fois » ?

Deux axes se superposent : (a) **dans un run**, `nuxt build` tourne 2× (hôte + Docker) ;
(b) **à travers le cycle de vie**, le pipeline se relance à chaque événement (PR, merge
develop, merge master). Ce n'est pas coûteux car le **cache** (npm + couches Docker,
**persistant** sur un runner self-hosted) ne recalcule que le delta.

---

## 4. Questions sur les déclencheurs & le flux de branches

### Le pipeline tourne-t-il à la création ET au merge d'une PR ?

Oui, ce sont deux événements différents :

| Moment                 | Événement      | Publie ? |
| ---------------------- | -------------- | -------- |
| PR créée / mise à jour | `pull_request` | ❌       |
| **Merge dans master**  | `push`         | ✅       |

« Merger, c'est pousser » : cliquer _Merge_ dépose des commits sur `master` = un `push` →
d'où le 2ᵉ déclenchement, le seul qui publie.

### Pourquoi re-tester sur master (« push = juste publier » ?)

Parce que l'état **intégré** sur `master` n'est pas forcément celui testé isolément (conflit
logique entre deux PR). Et surtout : dans le job unique, si les tests échouent, la
publication ne s'exécute pas → **les tests sont le garde-fou de la publication**. On ne
publie jamais un artefact non vérifié.

### Une branche `develop` d'intégration ne suffit-elle pas ?

En grande partie si : le risque de conflit logique est attrapé sur `develop`. Le re-test
sur `master` devient alors un **filet** (peu coûteux) plutôt qu'une nécessité — **à
condition** que `master` ne reçoive que `develop` (voir ci-dessous). Le **smoke test** de
l'image, lui, reste utile quoi qu'il arrive (il teste l'artefact exact publié).

### Le `push` sur develop doit-il relancer le pipeline ?

C'est le run le plus « optionnel » (develop ne publie rien → pure re-validation). On le
garde car il **détecte tôt** un conflit d'intégration entre deux PR mergées coup sur coup,
et rend `develop` « toujours verte ». Coût quasi nul grâce au cache.

### Peut-on forcer `master` à ne recevoir que des PR de `develop` ?

Pas via un réglage natif GitHub. On l'impose par un **status check obligatoire**
(`enforce-master-source` dans `branch-check.yml`) qui échoue si la source d'une PR vers
`master` n'est pas `develop`. Rendu _required_, il ferme tout autre chemin. Une fois cette
règle en place, l'argument « master a toujours été testé sur develop » devient garanti.
