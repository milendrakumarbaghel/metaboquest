import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const context = await browser.newContext({ offline: true, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors = [], requests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()) })
  const url = pathToFileURL(resolve(fileURLToPath(new URL('../dist-playable/index.html', import.meta.url)))).href
  for (const topic of ['Just curious', 'Is it safe?', 'What about side effects?', 'Will I lose muscle?', 'Will the weight come back?', 'Is it only for diabetes?', 'Is it even for me?']) {
    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'GLP-1: how much is fact, and how much is fear?' })).toBeVisible()
    const box = await page.getByRole('link', { name: /Bust the myths/ }).boundingBox()
    assert(box.y + box.height < 600, 'Mobile CTA must be visible without scrolling')
    if (topic === 'Just curious') await page.screenshot({ path: 'screenshots/playable-landing-mobile.png', fullPage: true })
    await page.getByRole('link', { name: /Bust the myths/ }).click()
    await page.getByRole('button', { name: topic, exact: true }).click()
    for (let index = 0; index < 3; index++) {
      await expect(page.locator('.progress-heading')).toContainText(`Question ${index + 1} of 3`)
      await page.getByRole('radio').first().check()
      await page.getByRole('button', { name: /Check answer/ }).click()
      await expect(page.getByRole('heading', { name: /Spot on|Good to know/ })).toBeVisible()
      await expect(page.locator('.feedback-panel')).toContainText(/\S{10}/)
      await page.getByRole('button', { name: index === 2 ? /See my results/ : /Next question/ }).click()
    }
    await expect(page.getByRole('heading', { name: 'What to remember' })).toBeVisible()
    await expect(page.locator('.topic-takeaway')).toBeVisible()
    await expect(page.getByText('Knowledge score', { exact: true }).first()).toBeVisible()
    assert.equal(await page.locator('.learning-takeaways article').count(), 3)
    await page.getByRole('link', { name: /Read the supporting sources/ }).click()
    assert(page.url().includes('#/results/'), 'Anchor must not replace the hash route')
    await page.getByRole('button', { name: 'Share result', exact: true }).click()
    await expect(page.getByText(/This file has no public link/)).toBeVisible()
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: /Download result PNG/ }).click()
    assert.equal((await download).suggestedFilename(), 'metaboquest-result.png')
    await page.keyboard.press('Escape')
    for (const name of [/See if the programme fits you/, /Talk to a Steer doctor/]) {
      const link = page.getByRole('link', { name })
      assert.equal(await link.getAttribute('href'), 'https://steerclub.com')
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer')
      assert.equal(await link.getAttribute('target'), '_blank')
      assert(!(await link.getAttribute('href')).includes('?'), 'Handoff must not carry a query string')
    }
    await page.getByRole('link', { name: 'About Steer' }).click()
    await expect(page.getByRole('heading', { name: 'Diagnostics first' })).toBeVisible()
    assert.equal(await page.getByRole('link', { name: /See if the programme fits you/ }).getAttribute('href'), 'https://steerclub.com')
    if (topic !== 'Just curious') {
      const checkbox = page.getByRole('checkbox', { name: /Include my chosen topic/ })
      await expect(checkbox).not.toBeChecked()
      const before = await page.getByRole('textbox').inputValue()
      await checkbox.check()
      assert.notEqual(await page.getByRole('textbox').inputValue(), before)
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow')
    console.log(`PASS offline topic: ${topic}`)
  }
  assert.deepEqual(errors, [])
  assert.deepEqual(requests, [])
  console.log('PASS: all seven offline flows; no network requests or browser errors')
} finally { await browser.close() }
