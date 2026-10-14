import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('http://127.0.0.1:5173/marte')
  await page.locator('.mars-experience.is-ready').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'artifacts/mars-horizon.png' })
  for (const [name, x, y] of [
    ['left', 240, 450],
    ['right', 1200, 450],
    ['sky', 720, 150],
    ['ground', 720, 860],
  ]) {
    await page.mouse.move(x, y)
    await page.waitForTimeout(1400)
    await page.screenshot({ path: `artifacts/mars-${name}.png` })
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.locator('.mars-experience.is-ready').waitFor()
  await page.waitForTimeout(800)
  await page.screenshot({ path: 'artifacts/mars-mobile.png' })
  console.log(
    JSON.stringify({
      errors,
      canvasCount: await page.locator('canvas').count(),
      horizontalOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    }),
  )
} finally {
  await browser.close()
}
