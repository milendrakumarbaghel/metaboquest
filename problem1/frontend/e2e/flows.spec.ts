import { test, expect, type Page } from '@playwright/test'
import { questionResponse, session, result, challenge, publicChallenge } from '../src/test/fixtures'
async function mockApi(page: Page) {
  await page.route('**/api/v1/**', async route => {
    const url = route.request().url()
    const body = url.endsWith('/sessions') ? session : url.includes('/questions?') ? questionResponse : url.endsWith('/submit') || url.includes('/results/') ? result : url.endsWith('/challenges') ? challenge : url.includes('/challenges/') ? publicChallenge : { accepted: true }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}
async function finishQuiz(page: Page) {
  for (let i = 0; i < 3; i++) {
    await expect(page.getByRole('heading', { name: questionResponse.questions[i].questionText })).toBeVisible()
    await page.getByRole('radio').nth(1).check()
    await page.getByRole('button', { name: /Check answer/ }).click()
    await expect(page.getByRole('heading', { name: /Spot on|Good to know/ })).toBeVisible()
    await page.getByRole('button', { name: i === 2 ? /See my results/ : /Next question/ }).click()
  }
  await expect(page.getByRole('heading', { name: result.profile.title })).toBeVisible()
}
async function startFromHook(page: Page) { await page.getByRole('link', { name: /Bust the myths/ }).click(); await page.getByRole('link', { name: /Skip, surprise me/ }).click() }
async function noOverflow(page: Page) { expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true) }
test('mobile connected flow, refresh, review, challenge sharing, PNG, and dialog focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockApi(page)
  await page.goto('/'); await startFromHook(page); await finishQuiz(page)
  expect(page.url()).not.toContain(result.resultToken)
  await page.reload(); await expect(page.getByRole('heading', { name: result.profile.title })).toBeVisible()
  await page.locator('summary').first().click(); await expect(page.locator('.review-body').getByText(result.feedback[0].explanation)).toBeVisible()
  await page.screenshot({ path: 'screenshots/results-mobile.png', fullPage: true })
  const opener = page.getByRole('button', { name: /Challenge a friend/ }); await opener.click()
  await expect(page.getByLabel('Public challenge link')).toHaveValue(challenge.challengeUrl)
  await expect(page.getByRole('link', { name: /WhatsApp/ })).toHaveAttribute('href', new RegExp(encodeURIComponent(challenge.challengeUrl)))
  const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: /Download PNG/ }).click()
  const download = await downloadPromise; expect(download.suggestedFilename()).toBe('metaboquest-result.png'); await download.saveAs('screenshots/result-card.png')
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); expect(await page.locator('dialog').evaluate(el => el.contains(document.activeElement))).toBe(true) }
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible(); await expect(opener).toBeFocused()
  await noOverflow(page)
})
test('public friend challenge starts a quiz and retains the comparison', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockApi(page)
  await page.goto(`/challenge/${challenge.challengeCode}`); await expect(page.getByRole('heading', { name: /You’ve been challenged/ })).toBeVisible()
  await page.screenshot({ path: 'screenshots/challenge-mobile.png', fullPage: true })
  await page.getByRole('link', { name: /Accept challenge/ }).click(); await finishQuiz(page)
  await expect(page.getByText(/You: 200 · Your friend: 200/)).toBeVisible()
})
test('all required layouts remain within 320–1440px and the mobile CTA is immediate', async ({ page }) => {
  await mockApi(page)
  for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: width <= 430 ? 740 : 1000 })
    await page.goto('/'); await noOverflow(page)
    if (width <= 430) { const box = await page.getByRole('link', { name: /Bust the myths/ }).boundingBox(); expect(box!.y + box!.height).toBeLessThan(600) }
    if (width === 390 || width === 1440) await page.screenshot({ path: `screenshots/landing-${width}.png`, fullPage: true })
    await page.goto('/topic'); await expect(page.getByRole('button', { name: 'Is it safe?' })).toBeVisible(); await noOverflow(page)
    await page.goto('/play'); await expect(page.getByRole('radio').first()).toBeVisible(); await noOverflow(page)
    if (width === 390 || width === 1440) await page.screenshot({ path: `screenshots/quiz-${width}.png`, fullPage: true })
    await page.goto('/explore'); await noOverflow(page)
    if (width === 1440) await page.screenshot({ path: 'screenshots/explore-desktop.png', fullPage: true })
    await page.goto(`/challenge/${challenge.challengeCode}`); await expect(page.getByRole('heading', { name: /You’ve been challenged/ })).toBeVisible(); await noOverflow(page)
    await page.goto('/missing-page'); await expect(page.getByRole('heading', { name: /off the beaten path/ })).toBeVisible(); await noOverflow(page)
  }
})
test('keyboard answers, reduced motion, and saved quiz exit', async ({ page }) => {
  await mockApi(page); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/play')
  const radios = page.getByRole('radio'); await radios.first().focus(); await page.keyboard.press('ArrowDown'); await expect(radios.nth(1)).toBeChecked()
  await page.getByRole('button', { name: /Exit quiz/ }).click(); await page.getByRole('button', { name: /Save & exit/ }).click()
  await page.getByRole('link', { name: /Bust the myths/ }).click(); await page.getByRole('link', { name: /Continue your quiz/ }).click(); await expect(radios.nth(1)).toBeChecked()
  expect(await page.locator('.question-content').evaluate(el => getComputedStyle(el).animationName)).toBe('none')
})
