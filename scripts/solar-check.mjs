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
  await page.goto('http://127.0.0.1:5173/sistema-solar')
  await page.locator('.solar-experience.is-ready').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'artifacts/solar-desktop.png' })
  const selections = []
  for (const name of ['Terra', 'Saturno', 'Júpiter', 'Netuno']) {
    const label = page.locator(`[data-planet="${name}"]`)
    const bounds = await label.boundingBox()
    await page.mouse.move(
      bounds.x + bounds.width / 2,
      bounds.y + bounds.height / 2,
    )
    await page.waitForTimeout(600)
    selections.push(await page.locator('.solar-facts h2').innerText())
    await page.screenshot({ path: `artifacts/solar-${name}.png` })
    await page.mouse.move(700, 870)
    await page.waitForTimeout(500)
  }
  await page.mouse.move(1150, 180)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'artifacts/solar-overhead.png' })
  await page.mouse.move(250, 800)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'artifacts/solar-low.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await page.locator('.solar-experience.is-ready').waitFor()
  await page.waitForTimeout(500)
  await page.screenshot({ path: 'artifacts/solar-mobile.png' })
  console.log(
    JSON.stringify({
      errors,
      selections,
      canvasCount: await page.locator('canvas').count(),
      horizontalOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    }),
  )
} finally {
  await browser.close()
}
