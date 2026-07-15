# Politique de sécurité — CESIZen

Ce fichier décrit comment signaler une vulnérabilité et les engagements de
l'équipe. Il est reconnu par GitHub et apparaît dans l'onglet **Security** du dépôt.
Le plan de sécurisation complet se trouve dans [docs/SECURITY_PLAN.md](docs/SECURITY_PLAN.md).

## Versions supportées

Seule la dernière version publiée (tag `X.Y.Z` sur GHCR) reçoit des correctifs de
sécurité. Les versions antérieures ne sont plus maintenues.

| Version          | Supportée |
| ---------------- | --------- |
| Dernière `X.Y.Z` | ✅        |
| Antérieures      | ❌        |

## Signaler une vulnérabilité

**Ne créez pas d'issue publique pour une faille non corrigée.** Deux canaux privés :

1. **GitHub Security Advisories** (recommandé) : onglet _Security_ →
   _Report a vulnerability_ (divulgation privée coordonnée).
2. **E-mail** : `security@cesizen.fr`.

Merci d'inclure : description, composant affecté, étapes de reproduction, impact
estimé, et si possible une piste de correction. **N'incluez jamais de données
personnelles réelles ni de secrets** dans le rapport.

## Engagements de délai (rapporteur)

| Étape                          | Délai visé                         |
| ------------------------------ | ---------------------------------- |
| Accusé de réception            | 48 h ouvrées                       |
| Évaluation initiale (sévérité) | 5 jours ouvrés                     |
| Correctif                      | selon sévérité (cf. SECURITY_PLAN) |

Les correctifs de sécurité critiques sont déployés dans les **24 h** suivant leur
disponibilité (cf. [docs/MAINTENANCE_PLAN.md](docs/MAINTENANCE_PLAN.md)).

## Périmètre

Application web CESIZen (Nuxt), son pipeline CI/CD (GitHub Actions), son image
Docker et son infrastructure de déploiement. Les dépendances tierces relèvent de
leurs mainteneurs respectifs ; leurs failles sont suivies via **Dependabot** et
`npm audit`.
