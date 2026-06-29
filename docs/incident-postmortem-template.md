# Incident Post-Mortem Template

## Informations Générales

- **Date de l'incident** : [AAAA-MM-JJ HH:MM UTC]
- **Durée** : [Début] à [Fin] = X minutes
- **Sévérité** : [ ] Critique [ ] Haute [ ] Moyenne [ ] Basse
- **Responsable Post-Mortem** : [Nom]
- **Participants** : [Liste]

## Chronologie

| Heure UTC | Événement |
|-----------|-----------|
| HH:MM | Détection/Alerte |
| HH:MM | Escalade |
| HH:MM | Root cause identifiée |
| HH:MM | Mitigation commencée |
| HH:MM | Résolution complète |

## Résumé Exécutif

[1-2 paragraphes expliquant clairement ce qui s'est passé et l'impact]

## Cause Racine

### Analyse des Causes

```
Incident observé
    ↓
Cause directe : [Quoi?]
    ↓
Cause sous-jacente : [Pourquoi?]
    ↓
Facteur contributing : [Comment?]
```

**Cause racine identifiée** : [Description technique précise]

## Impact

| Domaine | Description | Utilisateurs Affectés |
|---------|-------------|----------------------|
| **Disponibilité** | [OUI/NON] - % uptime perte | X% users |
| **Données** | [Intégrité/Perte/Exposition?] | [Détails] |
| **Performance** | Dégradation : [Avant/Après] | [Scope] |
| **Sécurité** | [Exploitation possible?] | [Scope] |

**Nombre d'utilisateurs affectés** : X  
**Données compromises** : [Listing ou Non]  
**Coût opérationnel** : X heures * Y $/h = $Z

## Actions Immédates Prises

1. [Action A - Qui - Quand - Résultat]
2. [Action B - Qui - Quand - Résultat]
3. [Action C - Qui - Quand - Résultat]

## Actions Correctives (Prevention)

| # | Action | Propriétaire | Deadline | Statut |
|---|--------|-------------|----------|--------|
| 1 | [Corrective action 1] | [Personne] | [Date] | [ ] To Do |
| 2 | [Corrective action 2] | [Personne] | [Date] | [ ] To Do |
| 3 | [Corrective action 3] | [Personne] | [Date] | [ ] To Do |

**Responsable du suivi** : [Personne]

## Leçons Apprises

### Qu'avons-nous bien fait?
- [Point positif 1]
- [Point positif 2]

### Qu'aurait-on pu faire mieux?
- [Amélioration 1]
- [Amélioration 2]

### Insights technologiques
- [Tech insight 1]
- [Tech insight 2]

## Communication

### Notifications Clients
- [ ] Email client envoyé à [Heure]
- [ ] Status page mise à jour
- [ ] Twitter/Communication publique

### Message aux Utilisateurs
[Template du message envoyé]

## Recommandations

### Court terme (< 2 semaines)
1. [Action rapide 1]
2. [Action rapide 2]

### Moyen terme (< 3 mois)
1. [Amélioration architecturale]
2. [Monitoring enhancement]

### Long terme (> 3 mois)
1. [Infrastructure upgrade]
2. [Process improvement]

## Suivi et Surveillance

- [ ] Monitoring renforcé activé jusqu'au [Date]
- [ ] Alertes ajoutées : [Décription]
- [ ] Tests ajoutés au CI/CD : [Décription]
- [ ] Documentation mise à jour : [Liens]

## Approbation

| Rôle | Nom | Signature | Date |
|------|-----|-----------|------|
| Tech Lead | | | |
| Product Owner | | | |
| Director | | | |

---

**Confidentialité** : Confidentiel (Équipe uniquement)  
**Archivage** : [Lien repository]  
**Révision** : [Date prochaine revue] par [Personne]
