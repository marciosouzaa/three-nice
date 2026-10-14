import * as THREE from 'three'
import { TUNNEL_LENGTH } from './tunnelPath'

export function createTunnelRings() {
  const rings = 76
  const segments = 112
  const positions: number[] = []
  const indices: number[] = []
  for (let ring = 0; ring < rings; ring++) {
    for (let segment = 0; segment < segments; segment++) {
      const angle = (segment / segments) * Math.PI * 2
      const next = ((segment + 1) / segments) * Math.PI * 2
      const depth = (ring / rings) * TUNNEL_LENGTH
      const index = positions.length / 3
      positions.push(
        angle,
        -1,
        depth,
        angle,
        1,
        depth,
        next,
        1,
        depth,
        next,
        -1,
        depth,
      )
      indices.push(index, index + 1, index + 2, index, index + 2, index + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setIndex(indices)
  return geometry
}

export function createTunnelStrands() {
  const strands = 14
  const segments = 144
  const positions: number[] = []
  const indices: number[] = []
  for (let strand = 0; strand < strands; strand++) {
    for (let segment = 0; segment < segments; segment++) {
      const angle = (strand / strands) * Math.PI * 2
      const depth = 1 + (segment / segments) * (TUNNEL_LENGTH - 1)
      const next = 1 + ((segment + 1) / segments) * (TUNNEL_LENGTH - 1)
      const index = positions.length / 3
      positions.push(
        angle,
        -1,
        depth,
        angle,
        1,
        depth,
        angle,
        1,
        next,
        angle,
        -1,
        next,
      )
      indices.push(index, index + 1, index + 2, index, index + 2, index + 3)
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setIndex(indices)
  return geometry
}

export function createTunnelSparks() {
  const count = 2400
  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const random = Math.sin(i * 127.1 + 19.2) * 43758.5453
    const seed = random - Math.floor(random)
    positions[i * 3] = i * 2.399963
    positions[i * 3 + 1] = 2.7 + seed * 2.1
    positions[i * 3 + 2] =
      ((i / count) * TUNNEL_LENGTH + seed * 5) % TUNNEL_LENGTH
    seeds[i] = seed
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  return geometry
}

export function createTunnelStreaks() {
  const count = 420
  const positions: number[] = []
  const ends: number[] = []
  const seeds: number[] = []
  const indices: number[] = []
  for (let i = 0; i < count; i++) {
    const seed = (Math.sin(i * 311.7 + 4.8) * 43758.5453) % 1
    const value = seed < 0 ? seed + 1 : seed
    const angle = i * 2.399963
    const depth = (i / count) * TUNNEL_LENGTH
    const index = positions.length / 3
    positions.push(
      angle,
      -1,
      depth,
      angle,
      1,
      depth,
      angle,
      1,
      depth,
      angle,
      -1,
      depth,
    )
    ends.push(0, 0, 1, 1)
    seeds.push(value, value, value, value)
    indices.push(index, index + 1, index + 2, index, index + 2, index + 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  )
  geometry.setAttribute('aEnd', new THREE.Float32BufferAttribute(ends, 1))
  geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))
  geometry.setIndex(indices)
  return geometry
}
