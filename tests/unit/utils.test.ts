import { describe, it, expect } from 'vitest'
import {
  generateSlug,
  isValidEmail,
  isValidPassword,
  calculateTotalDuration,
  formatDuration
} from '../../app/utils/helpers'

// describe() regroupe les tests par thème
// it() définit un test individuel
// expect() vérifie le résultat

describe('generateSlug', () => {
  it('convertit un titre simple en slug', () => {
    expect(generateSlug('Santé mentale')).toBe('sante-mentale')
  })

  it('convertit les majuscules en minuscules', () => {
    expect(generateSlug('CESIZen')).toBe('cesizen')
  })

  it('remplace les espaces multiples par un seul tiret', () => {
    expect(generateSlug('Qui  sommes  nous')).toBe('qui-sommes-nous')
  })

  it('supprime les tirets en début et fin', () => {
    expect(generateSlug(' titre ')).toBe('titre')
  })

  it('gère les caractères spéciaux', () => {
    expect(generateSlug("Qu'est-ce que l'anxiété ?")).toBe('qu-est-ce-que-l-anxiete')
  })

  it('retourne une chaîne vide pour une entrée vide', () => {
    expect(generateSlug('')).toBe('')
  })

  it('gère les nombres dans le titre', () => {
    expect(generateSlug('Exercice 2024 Meditation')).toBe('exercice-2024-meditation')
  })

  it('supprime les caractères accentués', () => {
    expect(generateSlug('Énergie Été Naïf')).toBe('energie-ete-naif')
  })

  it('gère les tirets et underscores', () => {
    expect(generateSlug('respiration-box_breathing')).toBe('respiration-box-breathing')
  })

  it('ne laisse pas de tirets multiples', () => {
    expect(generateSlug('Technique... de... respiration')).toBe('technique-de-respiration')
  })
})

describe('isValidEmail', () => {
  it('accepte un email valide', () => {
    expect(isValidEmail('paul@example.com')).toBe(true)
  })

  it('accepte un email avec sous-domaine', () => {
    expect(isValidEmail('paul@mail.example.com')).toBe(true)
  })

  it('refuse un email sans @', () => {
    expect(isValidEmail('paulexample.com')).toBe(false)
  })

  it('refuse un email sans domaine', () => {
    expect(isValidEmail('paul@')).toBe(false)
  })

  it('refuse une chaîne vide', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('accepte un email avec des nombres', () => {
    expect(isValidEmail('user123@example456.com')).toBe(true)
  })

  it('accepte un email avec un point dans la partie locale', () => {
    expect(isValidEmail('paul.dupont@example.com')).toBe(true)
  })

  it('accepte un email avec tirets et underscores', () => {
    expect(isValidEmail('paul_dupont-test@example.com')).toBe(true)
  })

  it('refuse un email avec des espaces', () => {
    expect(isValidEmail('paul @example.com')).toBe(false)
  })

  it('refuse un email avec plusieurs @', () => {
    expect(isValidEmail('paul@@example.com')).toBe(false)
  })

  it('refuse un email avec @ au début', () => {
    expect(isValidEmail('@example.com')).toBe(false)
  })

  it('accepte un email avec domaine court', () => {
    expect(isValidEmail('user@co.uk')).toBe(true)
  })

  it('refuse un email sans TLD', () => {
    expect(isValidEmail('paul@example')).toBe(false)
  })
})

describe('isValidPassword', () => {
  it('accepte un mot de passe de 8 caractères', () => {
    expect(isValidPassword('12345678')).toBe(true)
  })

  it('accepte un mot de passe long', () => {
    expect(isValidPassword('motdepassetreslongetsecurise')).toBe(true)
  })

  it('refuse un mot de passe de 7 caractères', () => {
    expect(isValidPassword('1234567')).toBe(false)
  })

  it('refuse un mot de passe vide', () => {
    expect(isValidPassword('')).toBe(false)
  })

  it('accepte un mot de passe avec majuscules et minuscules', () => {
    expect(isValidPassword('MyPassword123')).toBe(true)
  })

  it('accepte un mot de passe avec caractères spéciaux', () => {
    expect(isValidPassword('Pass@word#2024!')).toBe(true)
  })

  it('accepte exactement 8 caractères (limite inférieure)', () => {
    expect(isValidPassword('12345678')).toBe(true)
  })

  it('refuse exactement 7 caractères', () => {
    expect(isValidPassword('1234567')).toBe(false)
  })

  it('accepte un mot de passe très long', () => {
    expect(isValidPassword('ceci-est-un-mot-de-passe-tres-long-et-securise-avec-beaucoup-de-caracteres')).toBe(true)
  })

  it('accepte un mot de passe avec espaces (8+ caractères)', () => {
    expect(isValidPassword('pass word 123')).toBe(true)
  })

  it('accepte un mot de passe avec accents', () => {
    expect(isValidPassword('mötdëpässé123')).toBe(true)
  })

  it('refuse un seul caractère', () => {
    expect(isValidPassword('a')).toBe(false)
  })
})

describe('calculateTotalDuration', () => {
  it('calcule correctement la durée totale', () => {
    // 4s inspiration + 0s pause + 4s expiration = 8s par cycle * 5 cycles = 40s
    expect(calculateTotalDuration(4, 0, 4, 5)).toBe(40)
  })

  it('inclut la pause dans le calcul', () => {
    // 4s + 4s + 4s = 12s par cycle * 3 cycles = 36s
    expect(calculateTotalDuration(4, 4, 4, 3)).toBe(36)
  })

  it('retourne 0 pour 0 cycles', () => {
    expect(calculateTotalDuration(4, 0, 4, 0)).toBe(0)
  })

  it('calcule la cohérence cardiaque (5-5-5 * 6)', () => {
    // Exercice classique : 5s inspiration, 5s pause, 5s expiration * 6 cycles = 90s
    expect(calculateTotalDuration(5, 5, 5, 6)).toBe(90)
  })

  it('gère les paramètres zéro individuellement', () => {
    // 0 + 0 + 0 = 0 par cycle * 10 cycles = 0
    expect(calculateTotalDuration(0, 0, 0, 10)).toBe(0)
  })

  it('gère un seul cycle', () => {
    // 3 + 2 + 3 = 8s par cycle * 1 cycle = 8s
    expect(calculateTotalDuration(3, 2, 3, 1)).toBe(8)
  })

  it('gère de grands nombres de cycles', () => {
    // 2 + 1 + 2 = 5s par cycle * 100 cycles = 500s
    expect(calculateTotalDuration(2, 1, 2, 100)).toBe(500)
  })

  it('gère des durées longues', () => {
    // 60 + 30 + 60 = 150s par cycle * 2 cycles = 300s
    expect(calculateTotalDuration(60, 30, 60, 2)).toBe(300)
  })

  it('gère seulement l\'inspiration et l\'expiration (sans pause)', () => {
    // 4 + 0 + 4 = 8s par cycle * 10 cycles = 80s
    expect(calculateTotalDuration(4, 0, 4, 10)).toBe(80)
  })

  it('gère seulement la pause (inspiration et expiration à 0)', () => {
    // 0 + 10 + 0 = 10s par cycle * 5 cycles = 50s
    expect(calculateTotalDuration(0, 10, 0, 5)).toBe(50)
  })
})

describe('formatDuration', () => {
  it('formate correctement les secondes', () => {
    expect(formatDuration(90)).toBe('01:30')
  })

  it('formate 0 secondes', () => {
    expect(formatDuration(0)).toBe('00:00')
  })

  it('formate moins d\'une minute', () => {
    expect(formatDuration(45)).toBe('00:45')
  })

  it('formate exactement une minute', () => {
    expect(formatDuration(60)).toBe('01:00')
  })

  it('formate plus d\'une heure', () => {
    expect(formatDuration(3600)).toBe('60:00')
  })

  it('formate les secondes avec zéro en début', () => {
    expect(formatDuration(1)).toBe('00:01')
  })

  it('formate 59 secondes', () => {
    expect(formatDuration(59)).toBe('00:59')
  })

  it('formate 61 secondes', () => {
    expect(formatDuration(61)).toBe('01:01')
  })

  it('formate les deux minutes', () => {
    expect(formatDuration(120)).toBe('02:00')
  })

  it('formate 5 minutes et 30 secondes', () => {
    expect(formatDuration(330)).toBe('05:30')
  })

  it('formate 10 minutes', () => {
    expect(formatDuration(600)).toBe('10:00')
  })

  it('formate 1 heure, 5 minutes et 30 secondes', () => {
    expect(formatDuration(3930)).toBe('65:30')
  })

  it('formate 2 heures', () => {
    expect(formatDuration(7200)).toBe('120:00')
  })

  it('formate une grande durée', () => {
    expect(formatDuration(86400)).toBe('1440:00') // 24 heures
  })
})