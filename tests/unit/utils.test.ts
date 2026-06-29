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
})