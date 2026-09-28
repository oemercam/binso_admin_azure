import { test, expect, type Page } from '@playwright/test'

const routes = [
  '/',
  '/features',
  '/pricing',
  '/faq',
  '/contact',
  '/how-it-works',
  '/security',
  '/status',
  '/help',
  '/support',
  '/legal/privacy',
  '/legal/terms',
  '/legal/imprint',
  '/legal/cookies',
  '/sign-in?preview=1',
  '/admin-access?preview=1',
  '/register',
  '/register?mode=demo',
  '/onboarding',
  '/subscription-required',

  '/dashboard',
  '/account',
  '/accounting',
  '/contacts',
  '/contracts',
  '/customers',
  '/data',
  '/employees',
  '/finance',
  '/invoices',
  '/orders',
  '/organization',
  '/quotes',
  '/settings',
  '/time',
  '/work',

  '/platform',
  '/platform/analytics',
  '/platform/audit',
  '/platform/customers',
  '/platform/data-lifecycle',
  '/platform/help',
  '/platform/incidents',
  '/platform/jobs',
  '/platform/leads',
  '/platform/mail',
  '/platform/monitoring',
  '/platform/operations',
  '/platform/operators',
  '/platform/pilot',
  '/platform/registrations',
  '/platform/releases',
  '/platform/settings',
  '/platform/subscriptions',
  '/platform/support',
] as const

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
] as const

async function getLayoutMetrics(page: Page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth

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
      .filter((item) =>
        item.width > 0 &&
        (item.left < -1 || item.right > viewportWidth + 1)
      )
      .slice(0, 12)

    return {
      viewportWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      offenders,
    }
  })
}

for (const viewport of viewports) {
  test(`all known pages remain visually contained at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    test.setTimeout(180_000)

    await page.setViewportSize(viewport)

    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      await expect(page.locator('body'), `${route}: body`).toBeVisible()

      const metrics = await getLayoutMetrics(page)

      const details = metrics.offenders.length
        ? ` offenders=${JSON.stringify(metrics.offenders)}`
        : ''

      expect(
        metrics.documentWidth,
        `${route}: document horizontal overflow.${details}`
      ).toBeLessThanOrEqual(metrics.viewportWidth + 1)

      expect(
        metrics.bodyWidth,
        `${route}: body horizontal overflow.${details}`
      ).toBeLessThanOrEqual(metrics.viewportWidth + 1)

      const heading = page.locator('h1').first()

      if (await heading.count()) {
        await expect(heading, `${route}: first h1`).toBeVisible()

        const box = await heading.boundingBox()

        if (box) {
          expect(
            box.width,
            `${route}: h1 wider than viewport`
          ).toBeLessThanOrEqual(viewport.width + 1)
        }
      }

      const screenshots = page.locator('.marketing-real-screenshot img')
      const screenshotCount = await screenshots.count()

      for (let index = 0; index < screenshotCount; index += 1) {
        const screenshot = screenshots.nth(index)

        if (!(await screenshot.isVisible())) continue

        const box = await screenshot.boundingBox()
        if (!box) continue

        expect(
          box.width,
          `${route}: screenshot ${index} wider than viewport`
        ).toBeLessThanOrEqual(viewport.width + 1)

        if (viewport.width <= 820) {
          expect(
            box.width,
            `${route}: screenshot ${index} dominates mobile width`
          ).toBeLessThanOrEqual(360)

          expect(
            box.height,
            `${route}: screenshot ${index} dominates mobile viewport`
          ).toBeLessThanOrEqual(420)
        } else {
          expect(
            box.width,
            `${route}: screenshot ${index} too large on desktop`
          ).toBeLessThanOrEqual(460)

          expect(
            box.height,
            `${route}: screenshot ${index} too tall on desktop`
          ).toBeLessThanOrEqual(540)
        }

        const style = await screenshot.evaluate((element) => {
          const css = getComputedStyle(element)

          return {
            radius: css.borderRadius,
            shadow: css.boxShadow,
            objectFit: css.objectFit,
          }
        })

        expect(style.radius, `${route}: screenshot radius`).toBe('0px')
        expect(style.shadow, `${route}: screenshot shadow`).toBe('none')
        expect(style.objectFit, `${route}: screenshot fit`).toBe('contain')
      }
    }
  })
}

test('mobile authenticated navigation remains centred and reachable', async ({ page }) => {
  for (const width of [320, 360, 390, 430] as const) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

    const pill = page.locator('.mobile-primary-nav, .mobile-pill').first()

    await expect(pill).toBeVisible()

    const box = await pill.boundingBox()
    expect(box).not.toBeNull()

    if (box) {
      const centre = box.x + box.width / 2

      expect(
        Math.abs(centre - width / 2),
        `${width}px: mobile nav centred`
      ).toBeLessThanOrEqual(2)

      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(width)
    }
  }
})
