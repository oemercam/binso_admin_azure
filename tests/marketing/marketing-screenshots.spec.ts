import { mkdirSync } from 'node:fs'
import { test, expect, type Locator, type Page } from '@playwright/test'

const outputDir = 'public/marketing/screenshots'
mkdirSync(outputDir, { recursive: true })

function suffix(projectName: string) {
  return projectName.includes('mobile') ? 'mobile' : 'desktop'
}

async function firstVisible(page: Page, selectors: string[]): Promise<Locator> {
  for (const selector of selectors) {
    const locator = page.locator(selector).first()
    if (await locator.isVisible().catch(() => false)) return locator
  }

  throw new Error(`Kein sichtbarer Screenshot-Bereich gefunden: ${selectors.join(', ')}`)
}

async function screenshotLocator(
  locator: Locator,
  path: string,
  options: { maxHeight?: number } = {},
) {
  await locator.scrollIntoViewIfNeeded()

  const box = await locator.boundingBox()
  if (!box) throw new Error(`Screenshot-Bereich hat keine Bounding Box: ${path}`)

  const page = locator.page()
  const viewport = page.viewportSize()

  if (!viewport) throw new Error(`Viewport nicht verf?gbar: ${path}`)

  const maxHeight = options.maxHeight ?? box.height
  const height = Math.min(box.height, maxHeight)

  await page.screenshot({
    path,
    animations: 'disabled',
    clip: {
      x: Math.max(0, box.x),
      y: Math.max(0, box.y),
      width: Math.min(box.width, viewport.width - Math.max(0, box.x)),
      height,
    },
  })
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.addInitScript(() => {
    localStorage.setItem('binso-theme', 'light')
    localStorage.setItem(
      'binso-cookie-preferences-v1',
      JSON.stringify({ necessary: true, statistics: false }),
    )
  })
})

test('landing page', async ({ page }, testInfo) => {
  const mode = suffix(testInfo.project.name)

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const target = await firstVisible(page, [
    '.v816-hero',
    'main',
  ])

  await screenshotLocator(
    target,
    `${outputDir}/landing-${mode}.png`,
    { maxHeight: mode === 'mobile' ? 760 : 520 },
  )
})

test('login', async ({ page }, testInfo) => {
  const mode = suffix(testInfo.project.name)

  await page.goto('/sign-in?preview=1')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  const target = await firstVisible(page, [
    '.v812-auth-card',
    '.v812-auth-layout',
  ])

  await screenshotLocator(
    target,
    `${outputDir}/login-${mode}.png`,
    { maxHeight: mode === 'mobile' ? 620 : 520 },
  )
})

test('authenticated product screens', async ({ page }, testInfo) => {
  const mode = suffix(testInfo.project.name)
  const mobile = mode === 'mobile'

  const routes = [
    {
      name: 'dashboard',
      route: '/dashboard',
      desktopSelectors: [
        '.dashboard-layout',
        '#owner-dashboard-kpis',
      ],
      mobileSelectors: [
        '#owner-dashboard-kpis',
        '.mobile-dashboard-summary',
      ],
      desktopMaxHeight: 520,
      mobileMaxHeight: 520,
    },
    {
      name: 'customers',
      route: '/customers',
      desktopSelectors: [
        '.data-list',
      ],
      mobileSelectors: [
        '.mobile-record-list',
        '.mobile-records',
        '.data-list',
      ],
      desktopMaxHeight: 360,
      mobileMaxHeight: 520,
    },
    {
      name: 'quotes',
      route: '/quotes',
      desktopSelectors: [
        '.data-list',
      ],
      mobileSelectors: [
        '.mobile-record-list',
        '.mobile-records',
        '.data-list',
      ],
      desktopMaxHeight: 340,
      mobileMaxHeight: 500,
    },
    {
      name: 'orders',
      route: '/orders',
      desktopSelectors: [
        '.data-list',
      ],
      mobileSelectors: [
        '.mobile-record-list',
        '.mobile-records',
        '.data-list',
      ],
      desktopMaxHeight: 360,
      mobileMaxHeight: 520,
    },
    {
      name: 'time',
      route: '/time',
      desktopSelectors: [
        '.data-list',
        '.time-page .data-list',
      ],
      mobileSelectors: [
        '.mobile-record-list',
        '.operational-mobile-list',
      ],
      desktopMaxHeight: 420,
      mobileMaxHeight: 280,
    },
    {
      name: 'invoices',
      route: '/invoices',
      desktopSelectors: [
        '.data-list',
      ],
      mobileSelectors: [
        '.mobile-record-list',
        '.mobile-records',
        '.data-list',
      ],
      desktopMaxHeight: 360,
      mobileMaxHeight: 520,
    },
  ] as const

  for (const item of routes) {
    await page.goto(item.route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const target = await firstVisible(
      page,
      mobile ? [...item.mobileSelectors] : [...item.desktopSelectors],
    )

    await screenshotLocator(
      target,
      `${outputDir}/${item.name}-${mode}.png`,
      {
        maxHeight: mobile
          ? item.mobileMaxHeight
          : item.desktopMaxHeight,
      },
    )
  }
})
