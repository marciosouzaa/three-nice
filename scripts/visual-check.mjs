import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: process.argv.includes('--gpu')
    ? []
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })
  page.on('console', (message) => {
    if (message.type() === 'error') console.error(message.text())
  })
  page.on('pageerror', (error) => console.error(error.message))
  await page.goto('http://127.0.0.1:5173')
  await page.locator('.is-ready').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'artifacts/desktop.png' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: 'artifacts/mobile.png' })
  console.log(
    JSON.stringify(
      await page.evaluate(() => ({
        title: document.title,
        overflow: document.documentElement.scrollWidth > innerWidth,
        error: document.querySelector('.scene-error')?.textContent,
      })),
    ),
  )
} finally {
  await browser.close()
}
