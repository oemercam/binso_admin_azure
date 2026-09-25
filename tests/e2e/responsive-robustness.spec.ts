import { test, expect } from '@playwright/test'

const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 834, height: 1194 },
  { width: 1024, height: 1366 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const

const publicRoutes = ['/', '/features', '/pricing', '/faq', '/sign-in', '/register', '/admin-access']
const appRoutes = ['/dashboard', '/customers', '/quotes', '/orders', '/time', '/invoices', '/employees', '/settings']
const routes = [...publicRoutes, ...appRoutes]

async function expectNoViewportOverflow(page: import('@playwright/test').Page, route: string) {
  const metrics = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth
    const offenders = Array.from(document.querySelectorAll<HTMLElement>('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          left: Math.round(rect.left * 10) / 10,
          right: Math.round(rect.right * 10) / 10,
          width: Math.round(rect.width * 10) / 10,
        }
      })
      .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewport + 1))
      .slice(0, 8)

    return {
      viewport,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    }
  })
  const detail = metrics.offenders.length ? `; offenders: ${JSON.stringify(metrics.offenders)}` : ''
  expect(metrics.documentWidth, `${route} document overflow${detail}`).toBeLessThanOrEqual(metrics.viewport + 1)
  expect(metrics.bodyWidth, `${route} body overflow${detail}`).toBeLessThanOrEqual(metrics.viewport + 1)
}

for (const viewport of viewports) {
  test(`public and authenticated UI stay inside ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(60_000)
    await page.setViewportSize(viewport)

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('body')).toBeVisible()
      await expectNoViewportOverflow(page, `${viewport.width}px ${route}`)
    }

    if (viewport.width <= 820) {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      const pill = page.locator('.mobile-pill')
      await expect(pill).toBeVisible()
      const box = await pill.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        const pillCenter = box.x + box.width / 2
        expect(Math.abs(pillCenter - viewport.width / 2), `${viewport.width}px pill must stay centred`).toBeLessThanOrEqual(1.5)
        expect(box.x, `${viewport.width}px pill left edge`).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width, `${viewport.width}px pill right edge`).toBeLessThanOrEqual(viewport.width)
      }
    }
  })
}

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const) {
  for (const route of ['/sign-in', '/admin-access'] as const) {
    test(`${route} keeps the canonical auth layout at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      test.setTimeout(30_000)
      await page.setViewportSize(viewport)
      await page.goto(`${route}?preview=1`, { waitUntil: 'domcontentloaded' })

      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}\\?preview=1$`))
      const panel = page.locator('.entry-auth-login-panel')
      const card = page.locator('.entry-auth-card')
      await expect(panel).toBeVisible()
      await expect(card).toBeVisible()
      await expectNoViewportOverflow(page, `${viewport.width}px ${route}`)

      const cardBox = await card.boundingBox()
      expect(cardBox).not.toBeNull()
      if (cardBox) {
        expect(cardBox.x, `${route} card left edge`).toBeGreaterThanOrEqual(0)
        expect(cardBox.x + cardBox.width, `${route} card right edge`).toBeLessThanOrEqual(viewport.width + 1)
      }

      const brandPanel = page.locator('.entry-auth-brand-panel')
      if (viewport.width <= 720) await expect(brandPanel).toBeHidden()
      else await expect(brandPanel).toBeVisible()
    })
  }
}
