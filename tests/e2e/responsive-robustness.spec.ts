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
    test(`${route} keeps the V81 mockup auth layout at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      test.setTimeout(30_000)
      await page.setViewportSize(viewport)
      await page.goto(`${route}?preview=1`, { waitUntil: 'domcontentloaded' })

      await expect(page).toHaveURL(new RegExp(`${route.replace('/', '\\/')}\\?preview=1$`))
      const layout = page.locator('.v812-auth-layout')
      const copy = page.locator('.v812-auth-copy')
      const card = page.locator('.v812-auth-card')
      await expect(layout).toBeVisible()
      await expect(copy).toBeVisible()
      await expect(card).toBeVisible()
      await expectNoViewportOverflow(page, `${viewport.width}px ${route}`)

      const cardBox = await card.boundingBox()
      expect(cardBox).not.toBeNull()
      if (cardBox) {
        expect(cardBox.x, `${route} card left edge`).toBeGreaterThanOrEqual(0)
        expect(cardBox.x + cardBox.width, `${route} card right edge`).toBeLessThanOrEqual(viewport.width + 1)
      }

      const layoutColumns = await layout.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
      if (viewport.width <= 820) expect(layoutColumns, `${route} must stack on compact screens`).toBe(1)
      else expect(layoutColumns, `${route} must use the mockup two-column layout on desktop`).toBeGreaterThanOrEqual(2)
    })
  }
}

test('V80 desktop public navigation and balanced hero remain visible at 1440x900', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.v80-desktop-nav')).toBeVisible()
  await expect(page.locator('.v80-header-actions .v80-login')).toBeVisible()
  await expect(page.locator('.v80-header-cta')).toBeVisible()
  const visual = page.locator('.v80-hero-visual')
  await expect(visual).toBeVisible()
  const box = await visual.boundingBox()
  expect(box).not.toBeNull()
  if (box) expect(box.height, 'hero visual must not dominate the desktop viewport').toBeLessThan(620)
  await expect(page.locator('.v80-footer')).toBeVisible()
  await expectNoViewportOverflow(page, '1440px V80 landing')
})

test('V80 mobile public navigation opens cleanly and product visual stays compact at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.v80-desktop-nav')).toBeHidden()
  const trigger = page.locator('.v80-menu-trigger')
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.locator('.v80-mobile-menu-panel')).toBeVisible()
  await expect(page.locator('.v80-mobile-primary a')).toHaveCount(4)
  await trigger.click()
  const visual = page.locator('.v80-hero-visual')
  const box = await visual.boundingBox()
  expect(box).not.toBeNull()
  if (box) expect(box.height, 'hero visual must stay compact on mobile').toBeLessThan(360)
  await expectNoViewportOverflow(page, '390px V80 landing')
})
