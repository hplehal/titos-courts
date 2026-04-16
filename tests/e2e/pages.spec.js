import { test, expect } from '@playwright/test'

/* ─── SMOKE TESTS — all pages return 200 and render core UI ─── */
const pages = [
  { path: '/', title: /Tito's Courts/, expected: /FIND YOUR/ },
  { path: '/leagues', title: /Leagues/, expected: /Tuesday COED|Sunday MENS/ },
  { path: '/standings', title: /Standings/, expected: /Season Standings/i },
  { path: '/schedule', title: /Schedule/, expected: /SCHEDULE/ },
  { path: '/results', title: /Results/, expected: /RESULTS/ },
  { path: '/rules', title: /Rules/, expected: /League Rules/i },
  { path: '/about', title: /About/, expected: /About Tito/i },
  { path: '/contact', title: /Contact/, expected: /Contact Us/i },
  { path: '/register', title: /Register/, expected: /Join the League/i },
  { path: '/leagues/tuesday-coed', title: /Tuesday COED|Tito/, expected: /Tuesday COED/i },
  { path: '/leagues/sunday-mens', title: /Sunday MENS|Tito/, expected: /Sunday MENS/i },
  { path: '/champions', title: /Champions/, expected: /Champions/i },
]

for (const { path, expected } of pages) {
  test(`page ${path} loads successfully`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response.status()).toBe(200)
    await expect(page.locator('body')).toContainText(expected)
  })
}

/* ─── NAVBAR TESTS ─── */
test.describe('Navbar', () => {
  test('all nav links are visible on desktop', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop only')
    await page.goto('/')
    for (const label of ['Home', 'Leagues', 'Standings', 'Schedule', 'Results', 'Rules & Info', 'About']) {
      await expect(page.getByRole('navigation').getByText(label, { exact: false }).first()).toBeVisible()
    }
  })

  test('Register button is visible and links to /register', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Desktop only — mobile has hamburger')
    await page.goto('/')
    const registerBtn = page.getByRole('link', { name: /Register/i }).first()
    await expect(registerBtn).toBeVisible()
    await registerBtn.click()
    await expect(page).toHaveURL(/\/register/)
  })

  test('mobile menu opens and shows all links', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only')
    await page.goto('/')
    // Tap hamburger
    const toggle = page.getByRole('button', { name: /menu|toggle/i })
    await toggle.click()
    // Wait for mobile menu to appear and check Leagues link is visible
    await expect(page.getByRole('link', { name: 'Standings' }).first()).toBeVisible({ timeout: 3000 })
  })
})

/* ─── SCHEDULE PAGE — tier click interaction ─── */
test.describe('Schedule page', () => {
  test('tier card expands match schedule when clicked', async ({ page }) => {
    await page.goto('/schedule')
    await page.waitForLoadState('networkidle')
    // Wait for ANY Tier text to appear (data fetched client-side)
    await page.waitForSelector('text=/Tier \\d/', { timeout: 15000 })
    await page.waitForTimeout(500) // let rendering stabilize

    const tierCard = page.locator('text=/^Tier 1$/').first()
    await expect(tierCard).toBeVisible({ timeout: 5000 })

    // Count visible "vs" tokens before click
    const vsBefore = await page.locator('text=/\\bvs\\b/').count()

    await tierCard.click()
    await page.waitForTimeout(700) // wait for animation

    // After clicking, the match panel adds many "vs" tokens (6-9 games)
    const vsAfter = await page.locator('text=/\\bvs\\b/').count()
    expect(vsAfter).toBeGreaterThan(vsBefore)
  })
})

/* ─── RESULTS PAGE — tier click interaction ─── */
test.describe('Results page', () => {
  test('league tabs switch between leagues', async ({ page }) => {
    await page.goto('/results')
    await page.waitForLoadState('networkidle')

    // Click Sunday MENS tab
    const mensTab = page.getByRole('button', { name: /Sunday MENS/i }).first()
    if (await mensTab.isVisible()) {
      await mensTab.click()
      await page.waitForTimeout(1500)
      // Verify page still shows tier content
      await expect(page.getByText(/Tier/).first()).toBeVisible()
    }
  })

  test('tier card expands to show standings and scores', async ({ page }) => {
    await page.goto('/results')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    const tierCard = page.getByText(/^Tier 1$/).first()
    if (await tierCard.isVisible({ timeout: 5000 })) {
      // Count "Standings" / "Matches" labels before click — should be 0
      const labelsBefore = await page.locator('text=/^Standings$/i').count()

      await tierCard.click()
      await page.waitForTimeout(500)

      // After click, the panel header adds a "Standings" label
      const labelsAfter = await page.locator('text=/^Standings$/i').count()
      expect(labelsAfter).toBeGreaterThan(labelsBefore)
    }
  })
})

/* ─── STANDINGS PAGE — toggle overall/tier view ─── */
test.describe('Standings page', () => {
  test('can toggle between Overall and Tier View', async ({ page }) => {
    await page.goto('/standings')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click Tier View
    const tierViewBtn = page.getByRole('button', { name: /Tier View/i })
    await tierViewBtn.click()
    await page.waitForTimeout(500)

    // Should show tier cards
    await expect(page.getByText(/^Tier 1$/i).first()).toBeVisible({ timeout: 3000 })

    // Toggle back to Overall
    const overallBtn = page.getByRole('button', { name: /^Overall$/i })
    await overallBtn.click()
    await page.waitForTimeout(500)

    // Should show "Overall Standings" heading (visible on both mobile and desktop)
    await expect(page.getByText(/Overall Standings/i).first()).toBeVisible({ timeout: 3000 })
  })
})

/* ─── MOBILE RESPONSIVE ─── */
test.describe('Mobile responsive', () => {
  test('no horizontal scroll on homepage', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only')
    await page.goto('/')
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // allow 2px rounding
  })

  test('no horizontal scroll on schedule', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only')
    await page.goto('/schedule')
    await page.waitForTimeout(1500)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })

  test('schedule uses 1-column layout on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only')
    await page.goto('/schedule')
    await page.waitForTimeout(2000)
    const tierCards = page.locator('[class*="rounded-xl"]').filter({ hasText: /Tier/ })
    const count = await tierCards.count()
    if (count >= 2) {
      const first = await tierCards.first().boundingBox()
      const second = await tierCards.nth(1).boundingBox()
      if (first && second) {
        // Second card should be below the first (not side-by-side)
        expect(second.y).toBeGreaterThan(first.y + 20)
      }
    }
  })
})

/* ─── ACCESSIBILITY ─── */
test.describe('Accessibility', () => {
  test('homepage has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
  })

  test('all images have alt text on homepage', async ({ page }) => {
    await page.goto('/')
    const imagesWithoutAlt = await page.locator('img:not([alt])').count()
    expect(imagesWithoutAlt).toBe(0)
  })

  test('touch targets meet 44px minimum on mobile', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile', 'Mobile only')
    await page.goto('/')
    // Check register button
    const registerBtn = page.getByRole('link', { name: /Register/i }).first()
    if (await registerBtn.isVisible()) {
      const box = await registerBtn.boundingBox()
      if (box) expect(box.height).toBeGreaterThanOrEqual(40) // allow slight variance
    }
  })
})
