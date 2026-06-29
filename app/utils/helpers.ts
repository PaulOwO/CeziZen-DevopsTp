/**
 * Génère un slug à partir d'un titre
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Valide le format d'un email
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Valide la force d'un mot de passe (min 8 caractères)
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8
}

/**
 * Calcule la durée totale d'un exercice de respiration en secondes
 */
export function calculateTotalDuration(
  inhaleDuration: number,
  holdDuration: number,
  exhaleDuration: number,
  cycles: number
): number {
  return (inhaleDuration + holdDuration + exhaleDuration) * cycles
}

/**
 * Formate une durée en secondes en mm:ss
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}