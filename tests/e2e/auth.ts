import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.trunc(Math.random() * 16) // NOSONAR - pseudorandom acceptable pour les tests
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function createRandomUser() {
  return {
    firstName: `Jean${Math.random().toString(36).substring(2, 6)}`,
    lastName: `Random${Math.random().toString(36).substring(2, 6)}`,
    email: `test-${Date.now()}-${uuidv4()}@example.com`,
    password: 'motdepasse123', // NOSONAR - credentials de test uniquement
    newPassword: 'nouveaumotdepasse123', // NOSONAR - credentials de test uniquement
  }
}

export const randomUser = {
  firstName: 'Jean',
  lastName: 'Random',
  email: `test-${Date.now()}-${uuidv4()}@example.com`,
  password: 'motdepasse123', // NOSONAR - credentials de test uniquement
  newPassword: 'nouveaumotdepasse123', // NOSONAR - credentials de test uniquement
}

export const basicUser = {
  firstName: 'Jean',
  lastName: 'Basic',
  email: `test-user@example.com`,
  password: 'motdepasse123', // NOSONAR - credentials de test uniquement
  newPassword: 'nouveaumotdepasse123', // NOSONAR - credentials de test uniquement
}

export const adminUser = {
  firstName: 'Jean',
  lastName: 'Admin',
  email: `test-admin@example.com`,
  password: 'motdepasse123', // NOSONAR - credentials de test uniquement
  newPassword: 'nouveaumotdepasse123', // NOSONAR - credentials de test uniquement
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/login')
  await expect(page.getByTestId('email-input')).toBeVisible()
  await page.waitForTimeout(1000)

  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('password-input').fill(password)

  await page.waitForTimeout(1000)
  await page.getByTestId('login-button').click()

  await expect(page).toHaveURL('/home')
  await page.waitForTimeout(3000)
}

export async function register(
  page: Page,
  email: string,
  firstName: string,
  lastName: string,
  password: string
) {
  await page.goto('/auth/register')
  await expect(page.getByTestId('first-name-input')).toBeVisible()
  await page.waitForTimeout(1000)

  await page.getByTestId('email-input').fill(email)
  await page.getByTestId('first-name-input').fill(firstName)
  await page.getByTestId('last-name-input').fill(lastName)
  await page.getByTestId('password-input').fill(password)

  await page.waitForTimeout(1000)
  await page.getByTestId('register-button').click()
  await page.waitForTimeout(1000)

  await expect(page).toHaveURL('/auth/login')
}
