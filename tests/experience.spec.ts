import { expect, test } from '@playwright/test'

test('home redirects to Maré and navigation switches scenes without leaking canvases', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/')
  await expect(page).toHaveURL(/\/mare$/)
  await expect(page.locator('.mare-experience')).toHaveClass(/is-ready/)
  const nav = page.getByRole('navigation', { name: 'Experiências Three.js' })
  await expect(nav.getByRole('link')).toHaveCount(5)
  await expect(
    nav.getByRole('link', { name: 'Maré', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  for (let i = 0; i < 2; i++) {
    await nav.getByRole('link', { name: 'Partículas', exact: true }).click()
    await expect(page).toHaveURL(/\/particulas$/)
    await expect(page.locator('.particles-experience')).toHaveClass(/is-ready/)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.scene-error')).toHaveCount(0)
    await nav.getByRole('link', { name: 'Líquido', exact: true }).click()
    await expect(page.locator('.liquid-experience')).toHaveClass(/is-ready/)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.scene-error')).toHaveCount(0)
    await nav.getByRole('link', { name: 'Planeta', exact: true }).click()
    await expect(page.locator('.planet-experience')).toHaveClass(/is-ready/)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.scene-error')).toHaveCount(0)
    await nav.getByRole('link', { name: 'Túnel', exact: true }).click()
    await expect(page.locator('.tunnel-experience')).toHaveClass(/is-ready/)
    await expect(page.locator('canvas')).toHaveCount(1)
    await expect(page.locator('.scene-error')).toHaveCount(0)
    await nav.getByRole('link', { name: 'Maré', exact: true }).click()
    await expect(page.locator('.mare-experience')).toHaveClass(/is-ready/)
    await expect(page.locator('canvas')).toHaveCount(1)
  }
  await page.goBack()
  await expect(page).toHaveURL(/\/tunel$/)
  await expect(page.locator('.tunnel-experience')).toHaveClass(/is-ready/)
  await page.reload()
  await expect(page.locator('.tunnel-experience')).toHaveClass(/is-ready/)
  await expect(page).toHaveTitle('Túnel — Three Nice')
  expect(errors).toEqual([])
})

test('mouse controls the ocean atmosphere without manual controls', async ({
  page,
}) => {
  await page.goto('/mare')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await page.mouse.move(720, 115)
  await expect(page.locator('.moment-caption')).toContainText('Hora dourada')
  await page.mouse.move(720, 898)
  await expect(page.locator('.moment-caption')).toContainText('Crepúsculo')
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.locator('.scene-error')).toHaveCount(0)
})

test('particle shapes morph with the mouse and render three distinct images', async ({
  page,
}) => {
  await page.goto('/particulas')
  await expect(page.locator('.experience')).toHaveClass(/is-ready/)
  await page.mouse.move(1000, 150)
  await expect(page.locator('.particle-caption')).toContainText('Esfera')
  await page.waitForTimeout(800)
  const sphere = await page.locator('canvas').screenshot()
  expect(sphere.length).toBeGreaterThan(30_000)
  await page.mouse.move(1000, 450)
  await expect(page.locator('.particle-caption')).toContainText('Galáxia')
  await page.waitForTimeout(1000)
  const galaxy = await page.locator('canvas').screenshot()
  expect(galaxy.equals(sphere)).toBe(false)
  await page.mouse.move(1000, 880)
  await expect(page.locator('.particle-caption')).toContainText('Ondas')
  await page.waitForTimeout(1000)
  expect((await page.locator('canvas').screenshot()).equals(galaxy)).toBe(false)
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.locator('.scene-error')).toHaveCount(0)
})

test('mobile navigation is usable and reduced motion keeps all five scenes still', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const route of [
    '/mare',
    '/particulas',
    '/liquido',
    '/planeta',
    '/tunel',
  ]) {
    await page.goto(route)
    await expect(page.locator('.experience')).toHaveClass(/is-ready/)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true)
    for (const link of await page
      .getByRole('navigation')
      .getByRole('link')
      .all()) {
      const bounds = await link.boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
    }
    const canvas = page.locator('canvas')
    const still = await canvas.screenshot()
    await page.waitForTimeout(350)
    expect((await canvas.screenshot()).equals(still)).toBe(true)
    await expect(page.locator('.scene-error')).toHaveCount(0)
  }
  await expect(page.getByText('Em breve')).toHaveCount(0)
})

test('unknown routes redirect and the fifth experience opens directly', async ({
  page,
}) => {
  await page.goto('/nao-existe')
  await expect(page).toHaveURL(/\/mare$/)
  await expect(page.locator('.mare-experience')).toHaveClass(/is-ready/)
  await expect(page.getByText('Em breve')).toHaveCount(0)
  await page.goto('/tunel')
  await expect(page.locator('.tunnel-experience')).toHaveClass(/is-ready/)
  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(
    page
      .getByRole('navigation')
      .getByRole('link', { name: 'Túnel', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
})

test('a lost GPU context gives a recoverable error in every scene', async ({
  page,
}) => {
  for (const route of [
    '/mare',
    '/particulas',
    '/liquido',
    '/planeta',
    '/tunel',
  ]) {
    await page.goto(route)
    await expect(page.locator('.experience')).toHaveClass(/is-ready/)
    await page.evaluate(() =>
      document
        .querySelector('canvas')!
        .getContext('webgl2')!
        .getExtension('WEBGL_lose_context')!
        .loseContext(),
    )
    await expect(page.getByRole('alert')).toContainText(
      'A conexão com a placa gráfica foi interrompida',
    )
    await expect(
      page.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeVisible()
  }
})

test('tunnel steering and speed respond to the mouse without manual controls', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/tunel')
  await expect(page.locator('.tunnel-experience')).toHaveClass(/is-ready/)
  await page.mouse.move(1150, 150)
  await expect(page.locator('.tunnel-caption')).toContainText('Dobra')
  await expect(page.locator('.tunnel-caption')).toContainText('Rumo à direita')
  const speed = () =>
    page
      .locator('.tunnel-experience')
      .evaluate((element) =>
        Number(
          (element as HTMLElement).style.getPropertyValue('--tunnel-speed'),
        ),
      )
  await expect.poll(speed).toBeGreaterThan(0.95)
  const fast = await page.locator('canvas').screenshot()
  expect(fast.length).toBeGreaterThan(30_000)
  await page.mouse.move(250, 890)
  await expect(page.locator('.tunnel-caption')).toContainText('Deriva')
  await expect(page.locator('.tunnel-caption')).toContainText('Rumo à esquerda')
  await expect.poll(speed).toBeLessThan(0.05)
  expect((await page.locator('canvas').screenshot()).equals(fast)).toBe(false)
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.locator('.scene-error')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('planet rotates with the mouse and its lighting reaches day and night without controls', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/planeta')
  await expect(page.locator('.planet-experience')).toHaveClass(/is-ready/)
  await page.mouse.move(950, 150)
  await expect(page.locator('.planet-caption')).toContainText('Dia aberto')
  const day = await page.locator('canvas').screenshot()
  expect(day.length).toBeGreaterThan(30_000)
  await page.mouse.move(950, 890)
  await expect(page.locator('.planet-caption')).toContainText('Noite estrelada')
  await expect
    .poll(() =>
      page
        .locator('.planet-night-sky')
        .evaluate((element) => Number(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThan(0.95)
  expect((await page.locator('canvas').screenshot()).equals(day)).toBe(false)
  await page.mouse.move(250, 150)
  await expect(page.locator('.planet-caption')).toContainText('Dia aberto')
  await expect
    .poll(() =>
      page
        .locator('.planet-night-sky')
        .evaluate((element) => Number(getComputedStyle(element).opacity)),
    )
    .toBeLessThan(0.05)
  expect((await page.locator('canvas').screenshot()).equals(day)).toBe(false)
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.locator('.scene-error')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('liquid sculpture responds to mouse direction and has no manual controls', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.goto('/liquido')
  await expect(page.locator('.liquid-experience')).toHaveClass(/is-ready/)
  await expect(
    page
      .getByRole('navigation')
      .getByRole('link', { name: 'Líquido', exact: true }),
  ).toHaveAttribute('aria-current', 'page')
  await page.mouse.move(250, 150)
  await expect(page.locator('.liquid-caption')).toContainText('Reflexo frio')
  await page.waitForTimeout(700)
  const cold = await page.locator('canvas').screenshot()
  expect(cold.length).toBeGreaterThan(30_000)
  await page.mouse.move(1150, 760)
  await expect(page.locator('.liquid-caption')).toContainText('Reflexo quente')
  await page.waitForTimeout(900)
  expect((await page.locator('canvas').screenshot()).equals(cold)).toBe(false)
  await expect(page.getByRole('slider')).toHaveCount(0)
  await expect(page.getByRole('button')).toHaveCount(0)
  await expect(page.locator('.scene-error')).toHaveCount(0)
  expect(errors).toEqual([])
})
