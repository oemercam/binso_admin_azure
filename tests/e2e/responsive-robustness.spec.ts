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

const publicRoutes = ['/', '/features', '/pricing', '/faq', '/contact', '/how-it-works', '/security', '/status', '/help', '/support', '/legal/privacy', '/legal/terms', '/legal/imprint', '/sign-in', '/register', '/register?mode=demo', '/admin-access']
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
      const pill = page.locator('.mobile-primary-nav')
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
  const visual = page.locator('.v816-laptop')
  await expect(visual).toBeVisible()
  const box = await visual.boundingBox()
  expect(box).not.toBeNull()
  if (box) expect(box.height, 'hero visual must not dominate the desktop viewport').toBeLessThan(620)
  await expect(page.locator('.v80-footer')).toBeVisible()
  await expectNoViewportOverflow(page, '1440px V80 landing')
})

test('V81.8 mobile public layout keeps calm mockup content order at 390x844', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.v80-desktop-nav')).toBeHidden()
  const trigger = page.locator('.v80-menu-trigger')
  await expect(trigger).toBeVisible()
  await trigger.click()
  await expect(page.locator('.v80-mobile-menu-panel')).toBeVisible()
  await expect(page.locator('.v80-mobile-primary a')).toHaveCount(4)
  await trigger.click()
  const visual = page.locator('.v816-laptop')
  const box = await visual.boundingBox()
  expect(box).not.toBeNull()
  if (box) expect(box.height, 'hero visual must stay compact on mobile').toBeLessThan(360)

  const firstRowCopy = page.locator('.v816-feature').first().locator('.v816-feature-copy')
  const firstRowVisual = page.locator('.v816-feature').first().locator('.v816-product-shot')
  const copyBox = await firstRowCopy.boundingBox()
  const rowVisualBox = await firstRowVisual.boundingBox()
  expect(copyBox).not.toBeNull()
  expect(rowVisualBox).not.toBeNull()
  if (copyBox && rowVisualBox) expect(copyBox.y + copyBox.height, 'mobile mockup requires copy before the product image').toBeLessThan(rowVisualBox.y + 2)

  const screenshot = page.locator('.v816-feature').first().locator('.marketing-real-screenshot img')
  await expect(screenshot).toHaveAttribute('src', /orders-mockup-desktop\.png$/)

  const timeVisual = page.locator('.v817-time-visual')
  await expect(timeVisual).toBeVisible()
  await expect(page.locator('.v817-time-section .marketing-real-screenshot')).toHaveCount(0)
  await expect(page.locator('.v817-time-grid .v817-time-card')).toHaveCount(4)

  await expectNoViewportOverflow(page, '390px V81.8 landing')
})

test('V81.10 public subpages use the same headline scale as the landing at 1440px', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const landingSize = Number.parseFloat(await page.locator('.v816-hero-copy h1').evaluate((el) => getComputedStyle(el).fontSize))
  for (const route of ['/features', '/pricing', '/faq', '/contact', '/how-it-works', '/security', '/status', '/help'] as const) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    const title = page.locator('.v812-page-intro h1')
    await expect(title).toBeVisible()
    const size = Number.parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize))
    expect(Math.abs(size - landingSize), `${route} title must match landing typography`).toBeLessThanOrEqual(1)
    await expectNoViewportOverflow(page, `1440px ${route}`)
  }
})

test('V81.10 public titles match landing typography at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const landingSize = Number.parseFloat(await page.locator('.v816-hero-copy h1').evaluate((el) => getComputedStyle(el).fontSize))
  for (const route of ['/features', '/pricing', '/faq', '/contact', '/how-it-works', '/security', '/status', '/help'] as const) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    const title = page.locator('.v812-page-intro h1')
    await expect(title).toBeVisible()
    const size = Number.parseFloat(await title.evaluate((el) => getComputedStyle(el).fontSize))
    expect(Math.abs(size - landingSize), `${route} mobile title must match landing typography`).toBeLessThanOrEqual(1)
  }
})

test('V81.10 registration keeps public shell visible during bootstrap', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register?mode=demo', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.v80-header')).toBeVisible()
  await expect(page.locator('.v80-footer')).toBeVisible()
})

test('V81.8 demo registration steps stay readable and contained on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/register?mode=demo', { waitUntil: 'domcontentloaded' })
  const title = page.locator('.register-start-copy h1')
  const flow = page.locator('.register-start-flow')
  const steps = flow.locator('.register-start-step')
  await expect(title).toBeVisible()
  await expect(flow).toBeVisible()
  await expect(steps).toHaveCount(3)
  for (const step of await steps.all()) {
    const box = await step.boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(390)
    }
  }
  await expectNoViewportOverflow(page, '390px demo registration')
})


test('V81.13 all public pages keep visual system at desktop and mobile sizes', async ({ page }) => {
  test.setTimeout(120_000)
  const checks = [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ] as const
  const routes = ['/features','/pricing','/faq','/contact','/how-it-works','/security','/status','/help','/sign-in?preview=1','/admin-access?preview=1','/register','/register?mode=demo'] as const

  for (const viewport of checks) {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      if (route.includes('preview=1')) await expect(page).toHaveURL(new RegExp(route.replace('/', '\\/').replace('?', '\\?')))
      await expect(page.locator('.v80-header'), `${route} must render the public header`).toBeVisible()
      await expect(page.locator('.v80-footer'), `${route} must render the public footer`).toBeVisible()
      await expectNoViewportOverflow(page, `V81.13 ${viewport.width}px ${route}`)

      const title = page.locator('.v812-page-intro h1, .v812-auth-copy h1, .register-start-copy h1').first()
      if (await title.count()) {
        await expect(title).toBeVisible()
        const style = await title.evaluate((el) => {
          const s = getComputedStyle(el)
          return { size: Number.parseFloat(s.fontSize), lineHeight: Number.parseFloat(s.lineHeight), weight: Number.parseInt(s.fontWeight, 10) }
        })
        expect(style.size, `${route} title too small`).toBeGreaterThanOrEqual(viewport.width <= 360 ? 33 : viewport.width <= 560 ? 36 : viewport.width <= 820 ? 39 : 42)
        expect(style.lineHeight / style.size, `${route} title line-height`).toBeLessThanOrEqual(1.08)
        expect(style.weight, `${route} title weight`).toBeGreaterThanOrEqual(700)
      }
    }
  }
})

test('V81.9 mobile demo steps and graphics remain readable at 320 and 390', async ({ page }) => {
  for (const width of [320, 390] as const) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 })
    await page.goto('/register?mode=demo', { waitUntil: 'domcontentloaded' })
    const flow = page.locator('.register-start-flow')
    await expect(flow).toBeVisible()
    const steps = flow.locator('.register-start-step')
    await expect(steps).toHaveCount(3)
    for (const step of await steps.all()) {
      const box = await step.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(width + 1)
        expect(box.height).toBeGreaterThan(40)
      }
      await expect(step.locator('strong')).toBeVisible()
      await expect(step.locator('small')).toBeVisible()
    }
    await expectNoViewportOverflow(page, `V81.9 demo ${width}`)

    await page.goto('/security', { waitUntil: 'domcontentloaded' })
    const flowItems = page.locator('.v812-flow span')
    await expect(flowItems).toHaveCount(5)
    for (const item of await flowItems.all()) await expect(item).toBeVisible()
    await expectNoViewportOverflow(page, `V81.9 security flow ${width}`)
  }
})

test('V81.9 public imagery stays compact and consistently framed', async ({ page }) => {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }] as const) {
    await page.setViewportSize(viewport)
    for (const route of ['/features','/how-it-works'] as const) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      const visuals = page.locator('.v812-visual')
      const count = await visuals.count()
      expect(count).toBeGreaterThan(0)
      for (let index = 0; index < count; index += 1) {
        const visual = visuals.nth(index)
        const box = await visual.boundingBox()
        expect(box).not.toBeNull()
        if (box) {
          expect(box.width).toBeLessThanOrEqual(viewport.width)
          expect(box.height, `${route} visual ${index} is too tall`).toBeLessThan(viewport.width <= 820 ? 330 : 380)
        }
      }
      await expectNoViewportOverflow(page, `V81.9 imagery ${viewport.width}px ${route}`)
    }
  }
})

test('V81.14 desktop footer stays compact and visually grouped', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const footer = page.locator('.v80-footer-main')
  await expect(footer).toBeVisible()
  const footerBox = await footer.boundingBox()
  expect(footerBox).not.toBeNull()
  if (footerBox) {
    expect(footerBox.width).toBeLessThanOrEqual(982)
    expect(footerBox.x).toBeGreaterThan(180)
  }

  const brand = page.locator('.v80-footer-brand')
  const groups = page.locator('.v80-footer-group')
  await expect(groups).toHaveCount(4)
  const brandBox = await brand.boundingBox()
  const firstGroupBox = await groups.first().boundingBox()
  const lastGroupBox = await groups.last().boundingBox()
  expect(brandBox).not.toBeNull()
  expect(firstGroupBox).not.toBeNull()
  expect(lastGroupBox).not.toBeNull()
  if (brandBox && firstGroupBox && lastGroupBox && footerBox) {
    expect(firstGroupBox.x - (brandBox.x + brandBox.width), 'product links should stay close to brand').toBeLessThanOrEqual(40)
    expect(lastGroupBox.x + lastGroupBox.width, 'legal links must remain inside compact footer').toBeLessThanOrEqual(footerBox.x + footerBox.width + 1)
  }
  await expectNoViewportOverflow(page, 'V81.14 desktop footer')
})


test('V81.15 mobile public navigation opens, closes and stays above content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const trigger = page.locator('.v80-menu-trigger')
  await expect(trigger).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')

  await trigger.click()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  const panel = page.locator('body > #public-mobile-navigation')
  await expect(panel).toBeVisible()
  await expect(panel.locator('.v80-mobile-primary a')).toHaveCount(4)
  await expect(panel.getByText('30 Tage kostenlos testen')).toBeVisible()

  const box = await panel.boundingBox()
  expect(box).not.toBeNull()
  if (box) {
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(391)
    expect(box.y).toBeGreaterThanOrEqual(60)
  }

  await page.keyboard.press('Escape')
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(panel).toBeHidden()

  await trigger.click()
  await panel.getByRole('link', { name: 'Preise' }).click()
  await expect(page).toHaveURL(/\/pricing$/)
  await expect(page.locator('.v80-menu-trigger')).toHaveAttribute('aria-expanded', 'false')
  await expectNoViewportOverflow(page, 'V81.15 mobile navigation')
})

test('V81.16 public layout matrix stays clean across 320, 360, 390, 430, 768, 834, 1024, 1440, 1920', async ({ page }) => {
  test.setTimeout(180_000)
  const viewports = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 768, height: 1024 },
    { width: 834, height: 1112 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ] as const
  const routes = ['/', '/features', '/pricing', '/contact', '/register?mode=demo', '/sign-in?preview=1'] as const

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    for (const route of routes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('.v80-header'), `${route} header at ${viewport.width}px`).toBeVisible()
      await expect(page.locator('.v80-footer'), `${route} footer at ${viewport.width}px`).toBeVisible()
      await expectNoViewportOverflow(page, `V81.16 ${viewport.width}px ${route}`)

      const shell = page.locator('.public-site-v80')
      await expect(shell).toBeVisible()
      const family = await shell.evaluate((el) => getComputedStyle(el).fontFamily)
      expect(family.length, `${route} font family at ${viewport.width}px`).toBeGreaterThan(0)

      const title = page.locator('.v816-hero-copy h1, .v812-page-intro h1, .v812-auth-copy h1, .register-start-copy h1').first()
      if (await title.count()) {
        await expect(title).toBeVisible()
        const style = await title.evaluate((el) => {
          const s = getComputedStyle(el)
          return { size: Number.parseFloat(s.fontSize), lineHeight: Number.parseFloat(s.lineHeight) }
        })
        expect(style.size, `${route} H1 too small at ${viewport.width}px`).toBeGreaterThanOrEqual(33)
        expect(style.size, `${route} H1 too large at ${viewport.width}px`).toBeLessThanOrEqual(51)
        expect(style.lineHeight / style.size, `${route} H1 line-height at ${viewport.width}px`).toBeLessThanOrEqual(1.08)
      }

      const main = page.locator('.v816-inner, .v80-main.v812-page, .v80-main.v812-auth-page, .register-entry-v706').first()
      if (await main.count()) {
        const box = await main.boundingBox()
        expect(box).not.toBeNull()
        if (box) {
          expect(box.x, `${route} left gutter at ${viewport.width}px`).toBeGreaterThanOrEqual(viewport.width <= 360 ? 14 : 15)
          expect(viewport.width - (box.x + box.width), `${route} right gutter at ${viewport.width}px`).toBeGreaterThanOrEqual(viewport.width <= 360 ? 14 : 15)
        }
      }

      if (viewport.width <= 960) {
        await expect(page.locator('.v80-menu-trigger'), `mobile/tablet menu at ${viewport.width}px`).toBeVisible()
        await expect(page.locator('.v80-desktop-nav'), `desktop nav hidden at ${viewport.width}px`).toBeHidden()
      } else {
        await expect(page.locator('.v80-desktop-nav'), `desktop nav at ${viewport.width}px`).toBeVisible()
      }
    }
  }
})

test('V81.16 mobile navigation breakpoint remains usable on compact tablet widths', async ({ page }) => {
  for (const width of [768, 834, 912, 960] as const) {
    await page.setViewportSize({ width, height: 1024 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const trigger = page.locator('.v80-menu-trigger')
    await expect(trigger).toBeVisible()
    await expect(trigger).toBeEnabled()
    await expect(trigger).toHaveAttribute('data-hydrated', 'true')
    await trigger.click()
    const panel = page.locator('body > #public-mobile-navigation')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('link', { name: 'Funktionen' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
  }
})

test('V81.17 mobile/PWA surface stays white and headers remain sticky', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ffffff')
  const publicHeader = page.locator('.v80-header')
  await expect(publicHeader).toBeVisible()
  expect(await publicHeader.evaluate((el) => getComputedStyle(el).position)).toBe('sticky')
  expect(await page.locator('.public-site-v80').evaluate((el) => getComputedStyle(el).overflowX)).toBe('visible')
  // Public marketing routes do not use the authenticated app RouteTransition wrapper.
  // Assert only properties that actually exist on the public shell here.
  expect(await page.locator('.route-stage').count()).toBe(0)
  expect(await page.locator('html').evaluate((el) => getComputedStyle(el).colorScheme)).toContain('light')

  await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'auto' }))
  await page.waitForTimeout(50)
  const publicHeaderAfterScroll = await publicHeader.boundingBox()
  expect(publicHeaderAfterScroll).not.toBeNull()
  if (publicHeaderAfterScroll) expect(publicHeaderAfterScroll.y).toBeGreaterThanOrEqual(-1)

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  const appHeader = page.locator('.topbar')
  await expect(appHeader).toBeVisible()
  const routeStage = page.locator('.route-stage')
  await expect(routeStage).toBeVisible()
  expect(await routeStage.evaluate((el) => getComputedStyle(el).transform)).toBe('none')
  expect(await appHeader.evaluate((el) => getComputedStyle(el).position)).toBe('sticky')
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'auto' }))
  await page.waitForTimeout(50)
  await expect(appHeader).not.toHaveClass(/is-hidden/)
})

test('V81.18 authenticated navigation exposes only the simple product model', async ({ page }) => {
  test.setTimeout(90000)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

  const desktopNav = page.locator('.desktop-nav')
  await expect(desktopNav).toBeVisible()
  for (const label of ['Übersicht', 'Kunden', 'Arbeit', 'Zeit', 'Rechnungen']) {
    await expect(desktopNav.getByRole('link', { name: label, exact: true })).toBeVisible()
  }
  await expect(desktopNav.getByRole('link', { name: 'Angebote', exact: true })).toBeHidden()
  await expect(desktopNav.getByRole('link', { name: 'Aufträge', exact: true })).toBeHidden()
  await expect(desktopNav.getByRole('link', { name: 'Verträge', exact: true })).toBeHidden()

  await page.getByText('Mehr', { exact: true }).first().click()
  await expect(desktopNav.getByRole('link', { name: 'Einstellungen', exact: true })).toBeVisible()

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  const mobileNav = page.getByRole('navigation', { name: 'Hauptnavigation' })
  await expect(mobileNav).toBeVisible()
  for (const label of ['Übersicht', 'Kunden', 'Arbeit', 'Zeit', 'Rechnungen', 'Mehr']) {
    await expect(mobileNav.getByText(label, { exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Neu erstellen' })).toBeVisible()
})
