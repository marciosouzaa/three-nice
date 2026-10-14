import * as THREE from 'three'

export const PARTICLE_COUNT = 32000

export function morphFromHeight(height: number) {
  return THREE.MathUtils.clamp((height - 0.18) / 0.66, 0, 1) * 2
}

// A seeded distribution keeps the garden consistent across visits and makes
// all three shapes share the same particles, so morphing never needs a rebuild.
export function createParticleGeometry() {
  let seed = 73
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  const sphere = new Float32Array(PARTICLE_COUNT * 3)
  const galaxy = new Float32Array(PARTICLE_COUNT * 3)
  const wave = new Float32Array(PARTICLE_COUNT * 3)
  const seeds = new Float32Array(PARTICLE_COUNT)
  const sizes = new Float32Array(PARTICLE_COUNT)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const index = i * 3
    const y = 1 - (2 * (i + 0.5)) / PARTICLE_COUNT
    const circle = Math.sqrt(1 - y * y)
    const theta = i * goldenAngle
    const radius = 2.15 + random() * 0.25
    sphere[index] = Math.cos(theta) * circle * radius
    sphere[index + 1] = y * radius
    sphere[index + 2] = Math.sin(theta) * circle * radius

    const r = Math.pow(random(), 0.65) * 3.4
    const arm = ((i % 5) * Math.PI * 2) / 5
    const angle = r * 1.55 + arm + (random() - 0.5) * (0.2 + r * 0.2)
    const galaxyZ = Math.sin(angle) * r
    galaxy[index] = Math.cos(angle) * r
    galaxy[index + 1] = -galaxyZ * 0.62 + (random() - 0.5) * 0.13
    galaxy[index + 2] = galaxyZ * 0.78

    const column = i % 200
    const row = Math.floor(i / 200)
    wave[index] = (column / 199 - 0.5) * 7
    wave[index + 1] = (row / 159 - 0.5) * 3.5
    wave[index + 2] = 0
    seeds[i] = random()
    sizes[i] = 0.65 + Math.pow(random(), 4) * 1.7
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(sphere, 3))
  geometry.setAttribute('aGalaxy', new THREE.BufferAttribute(galaxy, 3))
  geometry.setAttribute('aWave', new THREE.BufferAttribute(wave, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  return geometry
}
