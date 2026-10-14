import { expect, test } from '@playwright/test'

test('renders water with hidden manual controls and supports keyboard pause and immersion', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await expect(page.locator('.scene-error')).toHaveCount(0)
  await expect(page.locator('.control-dock')).toBeHidden()
  await expect(page.locator('.footer button')).toBeHidden()
  await expect(page.getByRole('slider')).toHaveCount(0)
  await page.keyboard.press('Space')
  const canvas = page.locator('canvas')
  await page.waitForTimeout(400)
  const pausedFrame = await canvas.screenshot()
  await page.waitForTimeout(400)
  expect((await canvas.screenshot()).equals(pausedFrame)).toBe(true)
  expect(pausedFrame.length).toBeGreaterThan(50_000)
  await page.getByRole('button', { name: 'Só o oceano' }).click()
  await expect(page.locator('.experience')).toHaveClass(/is-immersive/)
  await expect(page.getByRole('heading', { level: 1 })).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.locator('.control-dock')).toBeHidden()
  expect(errors).toEqual([])
})

test('manual controls stay hidden on mobile and reduced motion starts paused', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await expect(page.locator('.control-dock')).toBeHidden()
  await expect(page.locator('.footer button')).toBeHidden()
  await expect(page.locator('.scene-error')).toHaveCount(0)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const canvas = page.locator('canvas')
  const frame = await canvas.screenshot()
  await page.waitForTimeout(400)
  expect((await canvas.screenshot()).equals(frame)).toBe(true)
})

test('the mouse still drives sunlight and waves with the manual panel hidden', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await page.mouse.move(720, 2)
  await expect(page.locator('#wind')).toHaveValue('1')
  await expect(page.locator('.moment-caption')).toContainText('Hora dourada')
  await page.mouse.move(720, 898)
  await expect(page.locator('#wind')).toHaveValue('0')
  await expect(page.locator('.moment-caption')).toContainText('Crepúsculo')
  await page.keyboard.press('Space')
  await page.mouse.move(720, 2)
  await expect(page.locator('#wind')).toHaveValue('0')
  await expect(page.locator('.moment-caption')).toContainText('Crepúsculo')
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Só o oceano' }).click()
  await page.mouse.move(720, 2)
  await expect(page.locator('#wind')).toHaveValue('1')
  await page.mouse.move(720, 898)
  await expect(page.locator('#wind')).toHaveValue('0')
  await expect(page.locator('.control-dock')).toBeHidden()
  await expect(page.locator('.scene-error')).toHaveCount(0)
})

test('a lost GPU context gives a recoverable error', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await page.evaluate(() => {
    const canvas = document.querySelector('canvas')!
    canvas
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context')!
      .loseContext()
  })
  await expect(page.getByRole('alert')).toContainText(
    'A conexão com a placa gráfica foi interrompida',
  )
  await expect(
    page.getByRole('button', { name: 'Tentar novamente' }),
  ).toBeVisible()
})
