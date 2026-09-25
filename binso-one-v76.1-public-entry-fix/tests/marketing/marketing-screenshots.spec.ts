import { mkdirSync } from 'node:fs'
import { test, expect } from '@playwright/test'

const outputDir = 'public/marketing/screenshots'
mkdirSync(outputDir, { recursive: true })

function suffix(projectName: string) {
  return projectName.includes('mobile') ? 'mobile' : 'desktop'
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    localStorage.setItem('binso-theme', 'light')
    localStorage.setItem('binso-cookie-preferences-v1', JSON.stringify({ necessary: true, statistics: false }))
  })
})

test('landing page', async ({ page }, testInfo) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.screenshot({ path: `${outputDir}/landing-${suffix(testInfo.project.name)}.png`, fullPage: true, animations: 'disabled' })
})

test('login', async ({ page }, testInfo) => {
  await page.goto('/sign-in?preview=1')
  await expect(page.getByRole('heading', { name: 'Binso One öffnen' })).toBeVisible()
  await page.screenshot({ path: `${outputDir}/login-${suffix(testInfo.project.name)}.png`, fullPage: true, animations: 'disabled' })
})

test('authenticated product screens', async ({ page }, testInfo) => {
  const mode = suffix(testInfo.project.name)
  const routes = [
    ['dashboard', '/dashboard'],
    ['customers', '/customers'],
    ['quotes', '/quotes'],
    ['orders', '/orders'],
    ['time', '/time'],
    ['invoices', '/invoices'],
  ] as const

  for (const [name, route] of routes) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.screenshot({ path: `${outputDir}/${name}-${mode}.png`, fullPage: true, animations: 'disabled' })
  }
})
