import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('http://127.0.0.1:5173')
  await page.locator('.is-ready').waitFor()
  await page.mouse.move(640, 2)
  await page.waitForTimeout(3500)
  await page.screenshot({ path: 'artifacts/mouse-top.png' })
  await page.mouse.move(640, 798)
  await page.waitForTimeout(4200)
  await page.screenshot({ path: 'artifacts/mouse-bottom.png' })
  await page.mouse.move(2, 350)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'artifacts/mouse-left.png' })
  await page.mouse.move(1278, 350)
  await page.waitForTimeout(2500)
  await page.screenshot({ path: 'artifacts/mouse-right.png' })
  console.log(
    JSON.stringify({
      errors,
      sceneError: await page.locator('.scene-error').count(),
    }),
  )
} finally {
  await browser.close()
}
