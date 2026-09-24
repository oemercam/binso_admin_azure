import { test, expect } from '@playwright/test'

test('public entry and local authenticated dashboard load', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('customer can be created with only the essential field', async ({ page }) => {
  await page.goto('/customers?new=1')

  await page.getByLabel('Firmenname *').fill('E2E Einfach AG')
  await page.getByRole('button', { name: 'Kunde speichern' }).click()

  await expect(page.getByText('E2E Einfach AG')).toBeVisible()
})

test('quote core flow keeps advanced fields optional', async ({ page }) => {
  await page.goto('/quotes?new=1')

  await page.getByLabel('Titel *').fill('E2E Beratung')
  await page.getByLabel('Beschreibung').first().fill('Beratung')

  await page
    .getByRole('contentinfo')
    .getByRole('button', { name: 'Angebot erstellen' })
    .click()

  await expect(page.getByRole('dialog')).toBeVisible()
})

test('mobile core navigation remains usable', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes('mobile'), 'mobile project only')

  await page.goto('/dashboard')

  await expect(
    page.getByRole('navigation', { name: 'Mobile Navigation' }),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Neu erstellen' }).click()

  await expect(
    page.getByText('Direkt eine Aktion starten'),
  ).toBeVisible()
})

test('invoice can be drafted from a customer and one simple position', async ({ page }) => {
  await page.goto('/invoices?new=1')

  await page.getByLabel('Beschreibung').first().fill('E2E Leistung')
  await page.getByLabel('Preis CHF').first().fill('250')

  await page.getByRole('button', { name: 'Entwurf erstellen' }).click()

  await expect(page.getByText('E2E Leistung')).toBeVisible()
})