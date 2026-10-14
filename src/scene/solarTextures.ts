import * as THREE from 'three'
import type { SolarPlanet } from './solarData'

function field(x: number, y: number, z: number) {
  return (
    Math.sin(x * 3.7 + Math.cos(z * 2.8)) * Math.cos(y * 4.1 + z * 1.7) * 0.55 +
    Math.sin(x * 8.3 - z * 6.1 + y * 3) * 0.25 +
    Math.cos(z * 16 + x * 9 - y * 12) * 0.13 +
    Math.sin(x * 31 + y * 28 + z * 23) * 0.07
  )
}

export function createPlanetTexture(planet: SolarPlanet) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const context = canvas.getContext('2d')!
  const pixels = context.createImageData(canvas.width, canvas.height)
  const low = new THREE.Color(planet.palette[0]),
    high = new THREE.Color(planet.palette[1])
  const color = new THREE.Color(),
    land = new THREE.Color('#6e8560'),
    ice = new THREE.Color('#e0eaec')
  const stormColor = new THREE.Color('#ae684d')
  for (let row = 0; row < canvas.height; row++) {
    const latitude = (row / (canvas.height - 1) - 0.5) * Math.PI
    const cosLat = Math.cos(latitude),
      y = Math.sin(latitude)
    for (let col = 0; col < canvas.width; col++) {
      const longitude = (col / canvas.width) * Math.PI * 2
      const x = Math.cos(longitude) * cosLat,
        z = Math.sin(longitude) * cosLat
      const noise = field(x, y, z)
      let tint = noise * 0.5 + 0.5
      if (planet.kind === 'gas' || planet.kind === 'cloud') {
        tint =
          0.5 +
          Math.sin(latitude * 37 + noise * 3) * 0.22 +
          Math.sin(latitude * 83 + noise * 2) * 0.12 +
          noise * 0.14
      }
      if (planet.kind === 'ice')
        tint = 0.6 + Math.sin(latitude * 13 + noise) * 0.1 + noise * 0.08
      color.copy(low).lerp(high, THREE.MathUtils.clamp(tint, 0, 1))
      if (planet.kind === 'earth') {
        const continents = field(x * 1.3 + 4, y * 1.3, z * 1.3 - 2)
        if (continents > 0.06)
          color.copy(land).multiplyScalar(0.8 + noise * 0.22)
        const polar = THREE.MathUtils.smoothstep(Math.abs(y), 0.87, 0.96)
        color.lerp(ice, polar)
        const clouds = THREE.MathUtils.smoothstep(
          field(x * 2 + 12, y * 2, z * 2),
          0.24,
          0.6,
        )
        color.lerp(ice, clouds * 0.85)
      }
      if (planet.name === 'Júpiter') {
        const storm =
          Math.pow((longitude - 4.1) / 0.3, 2) +
          Math.pow((latitude + 0.28) / 0.13, 2)
        color.lerp(stormColor, Math.exp(-storm) * 0.85)
      }
      const offset = (row * canvas.width + col) * 4
      // Canvas pixels use sRGB; Color stores the working linear space.
      color.convertLinearToSRGB()
      pixels.data[offset] = Math.round(color.r * 255)
      pixels.data[offset + 1] = Math.round(color.g * 255)
      pixels.data[offset + 2] = Math.round(color.b * 255)
      pixels.data[offset + 3] = 255
    }
  }
  context.putImageData(pixels, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

export function createSolarGlow() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,219,148,.85)')
  gradient.addColorStop(0.2, 'rgba(255,170,67,.4)')
  gradient.addColorStop(0.45, 'rgba(244,111,35,.09)')
  gradient.addColorStop(1, 'rgba(244,111,35,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
