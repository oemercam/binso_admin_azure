import { expect, test } from '@playwright/test'

const expected = {
  fr: { browser: 'fr-CH', features: 'Fonctionnalités', signIn: 'Se connecter' },
  it: { browser: 'it-CH', features: 'Funzionalità', signIn: 'Accedi' },
  en: { browser: 'en-CH', features: 'Features', signIn: 'Sign in' },
  tr: { browser: 'tr-CH', features: 'Özellikler', signIn: 'Giriş yap' },
} as const

test.describe('V82.1 internationalisation', () => {
  for (const [locale, copy] of Object.entries(expected)) {
    test(`detects ${locale} (${copy.browser}) and localises the public shell`, async ({ browser }) => {
      const context = await browser.newContext({ locale: copy.browser })
      const page = await context.newPage()
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-locale', locale)
      await expect(page.locator('html')).toHaveAttribute('lang', copy.browser)
      await expect(page.locator('.v80-desktop-nav')).toContainText(copy.features)
      await expect(page.locator('.v80-login')).toHaveText(copy.signIn)
      await context.close()
    })
  }

  test('manual selection overrides browser language and persists', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'de-CH' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-locale', 'de')
    await page.locator('.public-language-selector .language-selector-trigger').click()
    await page.locator('.public-language-selector .language-selector-menu button[data-locale="en"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-CH')
    await expect(page.locator('.v80-desktop-nav')).toContainText('Features')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-CH')
    await expect(page.locator('.v80-login')).toHaveText('Sign in')
    await context.close()
  })

  test('automatic option returns to the browser language after a manual override', async ({ browser }) => {
    const context = await browser.newContext({ locale: 'fr-CH' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-locale', 'fr')
    await page.locator('.public-language-selector .language-selector-trigger').click()
    await page.locator('.public-language-selector .language-selector-menu button[data-locale="en"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-CH')

    await page.locator('.public-language-selector .language-selector-trigger').click()
    await page.locator('.public-language-selector .language-selector-menu button[data-locale="auto"]').click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr-CH')
    await expect(page.locator('.v80-desktop-nav')).toContainText('Fonctionnalités')
    await context.close()
  })

})
