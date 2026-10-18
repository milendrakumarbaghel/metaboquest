// Reuses the Playwright installation already in Problem 1. No packages added.
import { chromium, expect } from '../../../problem1/frontend/node_modules/@playwright/test/index.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
await mkdir('screenshots', { recursive: true })
const base = 'http://127.0.0.1:5186'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const results = []
async function scenario(name, action) {
  if (process.env.TEST_FILTER && !name.includes(process.env.TEST_FILTER)) return
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, timezoneId: 'Asia/Kolkata', reducedMotion: 'reduce' })
  const page = await context.newPage(); const errors = []; const apiRequests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
  page.on('request', request => { if (request.url().includes('/api/v1/')) apiRequests.push(request.url()) })
  try { await action(page, context, errors, apiRequests); results.push({ name, passed: true, consoleErrors: errors }); console.log(`PASS ${name}`) }
  catch (error) { results.push({ name, passed: false, error: error.message, consoleErrors: errors }); console.log(`FAIL ${name}: ${error.message}`); await page.screenshot({ path: `screenshots/failure-${results.length}.png`, fullPage: true }).catch(() => {}) }
  finally { await context.close() }
}
async function screenshot(page, path) {
  while (await page.getByRole('button', { name: 'Dismiss notification' }).count()) await page.getByRole('button', { name: 'Dismiss notification' }).first().click()
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path, fullPage: true })
}
const nav = (page, name) => page.getByRole('navigation').getByRole('button', { name }).click()
async function openDemo(page) { await page.goto(`${base}/?demo=true`); await expect(page.getByText('Demo mode — using sample data. Remove ?demo=true for live API.')).toBeVisible(); await expect(page.getByRole('button', { name: /Generate content package/ })).toBeEnabled() }
async function approve(page) {
  await nav(page, /Doctor review/)
  await page.getByRole('textbox', { name: /Doctor name/ }).fill('Dr. Demo Reviewer')
  await page.getByRole('textbox', { name: /Review note/ }).fill('Checked for demonstration.')
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: '✓ Approve claim', exact: true }).first().click(); await expect(page.getByRole('button', { name: '✓ Approve claim', exact: true })).toHaveCount(2 - i) }
  await page.getByRole('button', { name: /Approve full package/ }).click()
  await expect(page.getByRole('heading', { name: /Science. With a little more/ })).toBeVisible()
}
await scenario('All five demo tabs, approval gates, clinical review, all media previews and JSON export', async (page, context, errors, requests) => {
  await openDemo(page)
  await screenshot(page, 'screenshots/demo-papers-desktop.png')
  await nav(page, /Media studio/); await expect(page.getByText('Doctor approval required before Media Studio unlocks.')).toBeVisible()
  await nav(page, /Publish & schedule/); await expect(page.getByText('Doctor approval required before scheduling or publishing.')).toBeVisible()
  await nav(page, /Effort audit/); await expect(page.getByRole('heading', { name: 'Evidence traceability' })).toBeVisible()
  await nav(page, /Doctor review/)
  await page.getByRole('button', { name: '✓ Approve claim', exact: true }).first().click()
  await expect(page.locator('.error').filter({ hasText: 'Enter the doctor’s name before reviewing.' }).first()).toBeVisible()
  await page.locator('summary').first().click(); await expect(page.getByText(/Illustrative sample text:/).first()).toBeVisible()
  await screenshot(page, 'screenshots/demo-review-desktop.png')
  await approve(page)
  await page.locator('.slide-list button').nth(1).click(); await expect(page.locator('.demo-art h3')).toHaveText('Look at the whole study.')
  await screenshot(page, 'screenshots/demo-studio-desktop.png')
  await expect(page.getByRole('button', { name: 'Download ZIP', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: /Canva export JSON/ }).click(); await expect(page.getByRole('dialog')).toBeVisible()
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download JSON' }).click(); expect((await download).suggestedFilename()).toBe('steer-sample-canva.json')
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: /Static post/ }).click()
  for (const format of ['Square', 'Story', 'Portrait']) { await page.getByRole('button', { name: new RegExp(format + ' ·') }).click(); await expect(page.locator('.demo-art')).toBeVisible() }
  await page.getByRole('button', { name: /Reel storyboard/ }).click()
  for (let n = 1; n <= 4; n++) { await page.getByRole('button', { name: `Scene ${n}`, exact: true }).click(); await expect(page.locator('.asset-copy .eyebrow')).toContainText(`SCENE ${n}`) }
  await page.getByText('B-roll prompts ＋', { exact: true }).click(); await expect(page.getByText('A paper on a warm cream desk.')).toBeVisible()
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.getByRole('button', { name: /Copy caption/ }).click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('#Steer')
  await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('denied')) } }))
  await page.getByRole('button', { name: /Copy caption/ }).click(); await expect(page.getByText(/Clipboard unavailable/)).toBeVisible()
  await nav(page, /Effort audit/); await expect(page.locator('.impact-banner')).toContainText('1 min 15 sec'); await expect(page.locator('.impact-banner')).toContainText('99.4%')
  await screenshot(page, 'screenshots/demo-effort-desktop.png')
  expect(requests).toEqual([]); expect(errors).toEqual([])
})
await scenario('Scheduling validation, platform selection, hashtags, saved edits and simulated publish', async (page, _context, errors, requests) => {
  await openDemo(page); await approve(page); await nav(page, /Publish & schedule/)
  await expect(page.getByRole('heading', { name: 'Not yet scheduled' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Publish now/ })).toBeDisabled()
  for (const platform of ['Instagram Reels', 'Instagram Stories', 'Facebook', 'Instagram Feed']) { await page.getByRole('radio', { name: platform, exact: true }).check(); await expect(page.getByRole('radio', { name: platform, exact: true })).toBeChecked() }
  await page.getByLabel('Schedule date & time').fill('2020-01-01T10:00'); await page.getByRole('button', { name: /Schedule post/ }).click()
  await expect(page.locator('.error').filter({ hasText: 'Choose a future date and time.' }).first()).toBeVisible()
  await page.getByLabel('Schedule date & time').fill('2030-11-01T10:00')
  await page.getByRole('textbox', { name: 'Caption', exact: true }).fill('A carefully reviewed demo caption.')
  const tag = page.getByPlaceholder('Type a tag and press Enter'); await tag.fill('test'); await tag.press('Enter')
  await expect(page.getByRole('button', { name: 'Remove #test', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Remove #test', exact: true }).click()
  await tag.fill('newtopic'); await page.getByRole('button', { name: 'Add', exact: true }).click()
  await page.getByRole('button', { name: /Schedule post/ }).click(); await expect(page.locator('.schedule-status')).toContainText('SCHEDULED')
  await screenshot(page, 'screenshots/demo-schedule-desktop.png')
  await page.getByRole('textbox', { name: 'Caption', exact: true }).fill('Updated demo caption.'); await expect(page.getByRole('button', { name: /Publish now/ })).toBeDisabled()
  await page.getByRole('button', { name: /Save schedule/ }).click(); await expect(page.getByRole('button', { name: /Publish now/ })).toBeEnabled()
  await tag.fill('pending'); await expect(page.getByRole('button', { name: /Publish now/ })).toBeDisabled(); await tag.fill('')
  await nav(page, /Effort audit/); await nav(page, /Publish & schedule/); await expect(page.getByRole('textbox', { name: 'Caption', exact: true })).toHaveValue('Updated demo caption.')
  await page.getByRole('button', { name: /Publish now/ }).click(); await expect(page.getByRole('dialog')).toContainText('Updated demo caption.')
  await page.getByRole('button', { name: 'Simulate publication', exact: true }).click(); await expect(page.locator('.schedule-status')).toContainText('PUBLISHED')
  await expect(page.locator('.schedule-status')).toContainText('DEMO-NOT-PUBLISHED'); await expect(page.getByRole('button', { name: /Publish now/ })).toBeDisabled()
  expect(requests).toEqual([]); expect(errors).toEqual([])
})
await scenario('Demo paper import, PDF upload, title, English generation, batch processing and paper switching', async (page, _context, errors, requests) => {
  await openDemo(page)
  await expect(page.locator('input[name=language]')).toHaveCount(0)
  await expect(page.getByRole('group', { name: 'Content language' })).toHaveCount(0)
  await expect(page.getByText('Three languages', { exact: false })).toHaveCount(0)
  await page.getByRole('textbox', { name: /Paper title/ }).fill('My uploaded research title')
  await page.getByLabel('Upload research PDF').setInputFiles({ name: 'sample.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nDemo document\n%%EOF') })
  await expect(page.locator('.paper-detail h2')).toHaveText('My uploaded research title')
  await page.getByRole('textbox', { name: /Paper title/ }).fill('Imported demonstration')
  await page.getByRole('textbox', { name: 'Research URL' }).fill('https://example.org/research')
  await page.getByRole('button', { name: 'Import paper →' }).click(); await expect(page.locator('.paper-detail h2')).toHaveText('Imported demonstration')
  await page.getByRole('button', { name: /Generate content package/ }).click(); await expect(page.locator('.package-summary')).toContainText('Good science deserves careful storytelling.')
  await nav(page, /Papers & evidence/)
  await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check()
  await page.getByRole('button', { name: /Batch process 2 papers/ }).click(); await expect(page.locator('.batch-panel')).toContainText('COMPLETED')
  await expect(page.getByRole('button', { name: 'Review package 1', exact: true })).toBeEnabled(); await page.getByRole('button', { name: 'Review package 1', exact: true }).click(); await expect(page.locator('.claims-list article')).toHaveCount(3)
  await page.getByRole('combobox').selectOption('demo-paper'); await expect(page.locator('.package-summary')).toBeVisible()
  await nav(page, /Papers & evidence/); await page.getByRole('button', { name: /Refresh paper/ }).click()
  await page.getByRole('button', { name: /Generate content package/ }).click(); await expect(page.locator('.package-summary')).toContainText('Good science deserves careful storytelling.')
  expect(requests).toEqual([]); expect(errors).toEqual([])
})
await scenario('Claim rejection and request-changes package decisions preserve approval gates', async (page, _context, errors) => {
  await openDemo(page); await nav(page, /Doctor review/)
  await page.getByRole('textbox', { name: /Doctor name/ }).fill('Dr. Test')
  await page.getByRole('button', { name: '× Reject claim', exact: true }).first().click()
  await expect(page.locator('.claim-rejected')).toContainText('Rejected by Dr. Test')
  await expect(page.getByRole('button', { name: /Approve full package/ })).toHaveCount(0)
  await nav(page, /Media studio/); await expect(page.getByText(/Doctor approval required before Media Studio/)).toBeVisible()
  await nav(page, /Papers & evidence/); await page.getByRole('button', { name: /Generate content package/ }).click()
  await page.getByRole('textbox', { name: /Doctor name/ }).fill('Dr. Test')
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: '✓ Approve claim', exact: true }).first().click(); await expect(page.getByRole('button', { name: '✓ Approve claim', exact: true })).toHaveCount(2 - i) }
  await page.getByRole('button', { name: 'Request changes', exact: true }).click(); await expect(page.locator('.status-banner')).toContainText('Changes requested.')
  await page.getByRole('button', { name: 'Reject package', exact: true }).click(); await expect(page.locator('.error').filter({ hasText: 'Package rejected:' })).toBeVisible()
  expect(errors).toEqual([])
})
await scenario('Responsive navigation on all tabs at 320, 390, 768 and 1280px', async (page, _context, errors) => {
  await openDemo(page); await approve(page)
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const tab of [/Papers & evidence/, /Doctor review/, /Media studio/, /Publish & schedule/, /Effort audit/]) {
      await nav(page, tab)
      await expect(page.locator('main h1').first()).toBeVisible()
      await expect(page.locator('input[name=language]')).toHaveCount(0)
      await expect(page.locator('body')).not.toContainText(/[\u0900-\u097f]|Hinglish/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    }
    if (width === 390) await screenshot(page, 'screenshots/demo-mobile.png')
  }
  expect(errors).toEqual([])
})
await scenario('Intercepted API failures: offline recovery, generation, rendering, schedule and effort retries', async (page, _context, errors) => {
  let paper, pkg
  let imports = 0, generations = 0, renders = 0
  let failSchedule = true, failEffort = true
  const unexpected = []
  const reply = (route, data, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/papers/from-url')) {
      imports++
      if (imports === 1) return route.abort('connectionrefused')
      return reply(route, paper)
    }
    if (path.endsWith('/generate')) {
      generations++; await new Promise(resolve => setTimeout(resolve, 600))
      return generations === 1 ? reply(route, { error: 'Generation temporarily unavailable.' }, 503) : reply(route, pkg)
    }
    if (path.includes('/render/')) {
      if (route.request().url().includes('width=540') && ++renders === 1) return route.fulfill({ status: 503, body: '' })
      return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="540" height="675"><rect width="540" height="675" fill="#e6cbbd"/><text x="30" y="60">Intercepted test image</text></svg>' })
    }
    if (path.endsWith('/schedule')) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return failSchedule ? reply(route, { error: 'Schedule temporarily unavailable.' }, 500) : route.fulfill({ status: 204 })
    }
    if (path.endsWith('/effort')) {
      await new Promise(resolve => setTimeout(resolve, 600))
      return failEffort ? reply(route, { error: 'Telemetry temporarily unavailable.' }, 500) : reply(route, { ingestSeconds: 2, extractionSeconds: 3, reviewSeconds: 60, exportSeconds: 1, totalHumanSeconds: 60, manualBaselineSeconds: 3600, timeSavedPercentage: 98.3 })
    }
    unexpected.push(path); return reply(route, { error: 'Unexpected test request.' }, 500)
  })
  await page.goto(base)
  // Test-only fixtures; all API requests are intercepted before reaching any backend.
  const fixtures = await page.evaluate(async () => { const data = await import('/src/mockData.ts'); return { paper: data.samplePaper, pkg: data.samplePackage } })
  paper = fixtures.paper; pkg = { ...fixtures.pkg, status: 'APPROVED' }
  await expect(page.getByRole('heading', { name: /Good content begins/ })).toBeVisible()
  await page.getByRole('textbox', { name: 'Research URL' }).fill('https://example.org/test')
  await page.getByRole('button', { name: 'Import paper →' }).click()
  await expect(page.locator('.offline-banner')).toBeVisible()
  await expect(page.locator('.error').filter({ hasText: 'Unable to reach the backend' }).first()).toBeVisible()
  await page.getByRole('button', { name: 'Import paper →' }).click()
  await expect(page.locator('.paper-detail h2')).toHaveText(paper.title); await expect(page.locator('.offline-banner')).toHaveCount(0)
  await page.getByRole('button', { name: /Generate content package/ }).click()
  await expect(page.getByRole('button', { name: /Generating content/ })).toBeDisabled()
  await expect(page.getByText('Extracting claims…', { exact: false })).toBeVisible()
  await expect(page.locator('.error').filter({ hasText: 'Generation temporarily unavailable.' }).first()).toBeVisible()
  await page.getByRole('button', { name: /Generate content package/ }).click(); await expect(page.locator('.package-summary')).toBeVisible()
  await nav(page, /Media studio/)
  await expect(page.locator('.render-preview .error')).toBeVisible(); await page.locator('.render-preview').getByRole('button', { name: 'Retry' }).click()
  await expect(page.locator('.render-preview img')).toBeVisible()
  await expect.poll(() => page.locator('.render-preview img').evaluate(img => img.naturalWidth)).toBe(540)
  await nav(page, /Publish & schedule/); await expect(page.getByText('Checking existing schedule…')).toBeVisible()
  await expect(page.getByText('Schedule temporarily unavailable.', { exact: true })).toBeVisible()
  failSchedule = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Not yet scheduled' })).toBeVisible()
  await nav(page, /Effort audit/); await expect(page.getByText('Loading effort telemetry…')).toBeVisible()
  await expect(page.getByText('Telemetry temporarily unavailable.', { exact: true })).toBeVisible()
  failEffort = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click(); await expect(page.locator('.impact-banner')).toContainText('1 min 0 sec')
  expect(unexpected).toEqual([])
  // Browser network error logs are expected for the five deliberately failed requests.
  expect(errors.length).toBeGreaterThanOrEqual(5)
  expect(errors.every(error => error.startsWith('Failed to load resource:'))).toBe(true)
})
await scenario('English-only generation payloads and workspace state preserve the backend DTO contract', async (page, _context, errors) => {
  const writes = []
  await page.route('**/api/v1/**', async route => {
    writes.push({ path: new URL(route.request().url()).pathname, body: route.request().postDataJSON(), key: route.request().headers()['x-api-key'] })
    await route.fulfill({ contentType: 'application/json', body: '{}' })
  })
  await page.goto(base)
  const state = await page.evaluate(async () => {
    const { packagesApi } = await import('/src/api/packages.ts')
    const { initialState, reducer } = await import('/src/context/store.ts')
    const { samplePackage } = await import('/src/mockData.ts')
    // Existing DTO values remain accepted, but this frontend always requests English.
    for (const language of ['en', 'hi', 'hinglish']) {
      await packagesApi.generate('test-paper', { language, audience: 'Test audience' })
      await packagesApi.batch(['paper-a', 'paper-b'], { language, audience: 'Test audience' })
    }
    const next = reducer(initialState, { type: 'package', pkg: { ...samplePackage, language: 'hi' }, activate: true })
    const { date } = await import('/src/components/utils.ts')
    return { language: next.activeLanguage, activePackage: next.activePackageId, formatted: date('2030-11-01T10:00:00Z') }
  })
  expect(writes).toHaveLength(6)
  for (const write of writes) {
    expect(write.body).toEqual(write.path.endsWith('/batches') ? { paperIds: ['paper-a', 'paper-b'], language: 'en', audience: 'Test audience' } : { language: 'en', audience: 'Test audience' })
    expect(write.key).toBeTruthy()
  }
  expect(state.language).toBe('en'); expect(state.activePackage).toBeNull(); expect(state.formatted).toContain('Nov')
  expect(errors).toEqual([])
})
await browser.close()
await writeFile('screenshots/browser-report.json', JSON.stringify(results, null, 2) + '\n')
console.log(JSON.stringify({ passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length }))
if (results.some(r => !r.passed)) process.exitCode = 1
