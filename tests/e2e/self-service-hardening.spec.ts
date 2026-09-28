import { test, expect } from '@playwright/test'

test('public pricing exposes demo, trial and direct subscription entry points', async ({ page }) => {
  await page.goto('/pricing')

  const pricing = page.getByRole('region', { name: 'Binso One Pläne' })
  await expect(pricing.getByRole('link', { name: /30 Tage kostenlos testen/i }).first()).toHaveAttribute('href', /\?mode=trial&plan=/)
  await expect(pricing.getByRole('link', { name: /Direkt abonnieren/i }).first()).toHaveAttribute('href', /\?mode=subscription&plan=/)
  const demoCta = page.locator('.v812-inline-cta')
  await expect(demoCta.getByRole('link', { name: /Demo ansehen/i })).toHaveAttribute('href', '/register?mode=demo')
})

test('trial registration communicates 30-day verified-email flow', async ({ page }) => {
  await page.goto('/register?mode=trial&plan=business')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Einfach starten')
  await expect(page.getByText(/Bestätigungscode/i).first()).toBeVisible()
  await expect(page.getByText(/30 Tage kostenlos testen/i).first()).toBeVisible()
})

test('direct subscription registration communicates activation after checkout', async ({ page }) => {
  await page.goto('/register?mode=subscription&plan=business')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Konto erstellen und Abo aktivieren')
  await expect(page.getByText(/Aktiv nach Checkout/i)).toBeVisible()
  await expect(page.locator('.register-privacy-note')).toContainText(/AGB und AVV/i)
})

test('billing API fails cleanly when the E2E server intentionally has no database', async ({ request }) => {
  const response = await request.get('/api/billing/subscription', {
    headers: { 'x-correlation-id': 'e2e-billing-no-db' },
  })
  expect(response.status()).toBe(503)
  expect(response.headers()['x-correlation-id']).toBe('e2e-billing-no-db')
  await expect(response.json()).resolves.toMatchObject({
    error: { code: 'service_unavailable' },
  })
})
