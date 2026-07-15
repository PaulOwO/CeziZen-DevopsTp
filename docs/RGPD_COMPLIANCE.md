# Conformité RGPD & gestion des données personnelles — CESIZen

> CESIZen traite des données personnelles d'utilisateurs du grand public dans un
> contexte de santé mentale. Ce document décrit les données collectées, les bases
> légales, les mesures de protection en place et la feuille de route de mise en
> conformité. Il complète le [plan de sécurisation](SECURITY_PLAN.md).

---

## 1. Rôles et responsabilités

| Rôle                          | Attribution (contexte fiction Ministère)                         |
| ----------------------------- | ---------------------------------------------------------------- |
| **Responsable de traitement** | Le Ministère de la Santé et de la Prévention (commanditaire)     |
| **Sous-traitant**             | Le prestataire (équipe CESIZen)                                  |
| **DPO**                       | Délégué à la protection des données du responsable de traitement |
| **Point de contact**          | `security@cesizen.fr` (relaye au DPO)                            |

---

## 2. Données personnelles collectées (registre de traitement)

Recensement à partir du modèle de données réel (`prisma/schema.prisma`).

| Donnée                  | Table                     | Catégorie                  | Finalité                              | Base légale                    |
| ----------------------- | ------------------------- | -------------------------- | ------------------------------------- | ------------------------------ |
| E-mail                  | `User.email`              | Donnée d'identification    | Authentification, contact             | Exécution du service (contrat) |
| Nom, prénom             | `User.firstName/lastName` | Donnée d'identification    | Personnalisation du compte            | Exécution du service           |
| Mot de passe (haché)    | `User.passwordHash`       | Donnée d'authentification  | Sécuriser l'accès au compte           | Exécution du service           |
| Rôle, statut actif      | `User.role/isActive`      | Donnée technique           | Contrôle d'accès                      | Intérêt légitime / sécurité    |
| Consultations de pages  | `PageConsultation`        | Donnée d'usage             | Suivi de parcours (fonctionnalité)    | Consentement (à recueillir)    |
| Sessions de respiration | `BreathingSession`        | Donnée d'usage / bien-être | Historique personnel de l'utilisateur | Consentement (à recueillir)    |

> **Point d'attention** : les données d'usage liées au bien-être/à la santé mentale
> (`BreathingSession`, suivi d'émotions à venir) sont **sensibles** au regard du
> contexte. Elles exigent une base **consentement** explicite et une protection
> renforcée. Ces tables sont modélisées mais **non alimentées** par l'API à ce jour
> (pas d'endpoint d'écriture) — la collecte devra être conditionnée au consentement
> dès son implémentation.

**Aucun transfert hors Union Européenne** : hébergement et base de données restent
dans l'UE (exigence du cahier des charges).

---

## 3. Principes RGPD appliqués

| Principe (art. 5 RGPD)           | Mise en œuvre CESIZen                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Licéité, loyauté, transparence   | Politique de confidentialité à publier ; finalités explicites                                                           |
| **Minimisation**                 | Seules les données nécessaires (email, nom, prénom) ; pas de date de naissance, adresse, téléphone                      |
| Exactitude                       | L'utilisateur peut modifier son compte ; réinitialisation de mot de passe                                               |
| **Limitation de conservation**   | Politique de rétention à définir ; suppression/anonymisation des comptes inactifs                                       |
| **Intégrité et confidentialité** | Mots de passe hachés (bcrypt 12), transport HTTPS/HSTS, cookies scellés, contrôle d'accès serveur, secrets externalisés |
| Responsabilité (accountability)  | Ce registre + plan de sécurisation + journalisation (roadmap)                                                           |

---

## 4. Mesures de protection déjà en place

- **Mots de passe** : hachés avec **bcrypt (coût 12)** + salt — jamais stockés ni
  transmis en clair, non réversibles.
- **Transport** : **HTTPS** (reverse proxy TLS en production) + en-tête **HSTS**.
- **Sessions** : cookies **chiffrés et scellés** (`httpOnly`, `secure`, `sameSite`),
  expiration 7 jours.
- **Contrôle d'accès** : autorisation vérifiée **côté serveur** sur toutes les routes
  sensibles ; les données d'un utilisateur ne sont accessibles qu'à lui ou à un
  administrateur habilité.
- **Cloisonnement** : base de données non exposée publiquement (réseau interne
  Docker). Accès aux données via ORM paramétré (pas d'injection SQL).
- **Secrets** : aucun secret versionné ; `.env` hors dépôt et hors image.
- **Sécurité applicative** : en-têtes de sécurité (CSP, X-Frame-Options…),
  Dependabot, npm audit, SonarCloud.

---

## 5. Droits des personnes concernées

| Droit (RGPD)                              | État / mécanisme                                                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Droit d'accès                             | Consultation du compte (front) ; export structuré **à implémenter**                                                          |
| Droit de rectification                    | ✅ Modification du compte + changement de mot de passe                                                                       |
| **Droit à l'effacement**                  | Désactivation (`isActive`) en place ; **suppression/anonymisation définitive à implémenter** (endpoint self-service + purge) |
| Droit à la portabilité                    | Export JSON des données du compte **à implémenter**                                                                          |
| Droit d'opposition / retrait consentement | Gestion du consentement aux données d'usage **à implémenter**                                                                |
| Droit à la limitation                     | Désactivation du compte (`isActive=false`)                                                                                   |

> **Actuellement**, l'API permet à un administrateur de **désactiver** un compte
> (`PATCH /api/users/modify`) mais il n'existe **pas** d'endpoint de suppression
> définitive ni d'export. Ces fonctionnalités constituent la priorité de mise en
> conformité (cf. §7).

---

## 6. Violation de données — procédure

En cas de violation de données personnelles (fuite, accès non autorisé, perte) :

1. **Qualification & confinement** immédiats (cf. gestion de crise,
   [SECURITY_PLAN.md](SECURITY_PLAN.md) §6).
2. **Notification à la CNIL sous 72 h** après en avoir pris connaissance
   (art. 33 RGPD), sauf risque improbable pour les droits et libertés.
3. **Information des personnes concernées** sans délai si risque **élevé**
   (art. 34), en termes clairs.
4. **Documentation** de la violation dans un registre interne (nature, personnes
   concernées, conséquences, mesures) — même si non notifiée.
5. **Post-mortem** et actions correctives
   ([incident-postmortem-template.md](incident-postmortem-template.md)).

---

## 7. Feuille de route de mise en conformité

| Priorité | Action                                                                     |
| -------- | -------------------------------------------------------------------------- |
| 1        | Publier une **politique de confidentialité** + mentions légales            |
| 2        | Endpoint **droit à l'effacement** (suppression/anonymisation self-service) |
| 3        | Endpoint **export de données** (portabilité, JSON)                         |
| 4        | **Consentement** explicite avant collecte des données d'usage/bien-être    |
| 5        | **Politique de rétention** + purge automatique des comptes inactifs        |
| 6        | **Journalisation** des accès aux données personnelles (accountability)     |
| 7        | Pseudonymisation/chiffrement ciblé des données au repos                    |

---

**Version** : 1.0 — **Dernière révision** : 2026-07-15
