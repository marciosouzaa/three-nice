import * as THREE from 'three'

function hash(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7 + 74.8) * 43758.5453
  return value - Math.floor(value)
}
function noise(x: number, y: number) {
  const ix = Math.floor(x),
    iy = Math.floor(y)
  const fx = x - ix,
    fy = y - iy
  const sx = fx * fx * (3 - 2 * fx),
    sy = fy * fy * (3 - 2 * fy)
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(hash(ix, iy), hash(ix + 1, iy), sx),
    THREE.MathUtils.lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), sx),
    sy,
  )
}
function fbm(x: number, z: number) {
  return (
    noise(x, z) * 0.57 +
    noise(x * 2.07 + 11, z * 2.07) * 0.28 +
    noise(x * 4.1, z * 4.1 + 5) * 0.15
  )
}

export function marsHeight(x: number, z: number) {
  const radius = Math.hypot(x, z)
  const angle = Math.atan2(z, x)
  const floor =
    (fbm(x * 0.026, z * 0.026) - 0.5) * 3.4 +
    Math.sin(x * 0.12 + Math.sin(z * 0.035) * 2) * 0.24
  const ridge = Math.exp(
    -Math.pow((radius - 125 - Math.sin(angle * 3 + 0.4) * 24) / 35, 2),
  )
  const peaks =
    10 + fbm(x * 0.022 + 8, z * 0.022 - 17) * 24 + Math.sin(angle * 7) * 4
  const far =
    THREE.MathUtils.smoothstep(radius, 170, 290) *
    fbm(x * 0.017, z * 0.017) *
    38
  const erosion = (noise(x * 0.13, z * 0.13) - 0.5) * 5
  return floor + ridge * (peaks + erosion) + far
}

export function createMarsTerrain() {
  const geometry = new THREE.PlaneGeometry(640, 640, 320, 320)
  geometry.rotateX(-Math.PI / 2)
  const positions = geometry.attributes.position
  const colors = new Float32Array(positions.count * 3)
  const color = new THREE.Color()
  const rust = new THREE.Color('#a15f40'),
    sand = new THREE.Color('#c68c60')
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      z = positions.getZ(i)
    const height = marsHeight(x, z)
    positions.setY(i, height)
    color.copy(rust).lerp(sand, fbm(x * 0.065 + 12, z * 0.065) * 0.85)
    color.multiplyScalar(
      0.88 + Math.sin(height * 2.3 + noise(x * 0.04, z * 0.04)) * 0.06,
    )
    color.toArray(colors, i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function createMarsRocks() {
  const geometry = new THREE.IcosahedronGeometry(1, 1)
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i)
    // Equal vertices receive equal displacements, keeping the seams closed.
    const rough = 0.87 + noise(x * 5 + y * 3, z * 5) * 0.25
    positions.setXYZ(i, x * rough, y * rough, z * rough)
  }
  geometry.computeVertexNormals()
  const material = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 1,
    flatShading: true,
  })
  const rocks = new THREE.InstancedMesh(geometry, material, 650)
  const dummy = new THREE.Object3D(),
    color = new THREE.Color()
  for (let i = 0; i < rocks.count; i++) {
    const angle = i * 2.399963
    const radius = 5 + Math.pow(hash(i, 5), 1.1) * 125
    const x = Math.cos(angle) * radius,
      z = Math.sin(angle) * radius
    const size =
      (0.07 + Math.pow(hash(i, 8), 3) * 1.1) * (radius < 12 ? 0.45 : 1)
    dummy.position.set(x, marsHeight(x, z) + size * 0.18, z)
    dummy.rotation.set(hash(i, 9) * 0.6, angle, hash(i, 10) * 0.5)
    dummy.scale.set(size * (1 + hash(i, 11)), size * 0.65, size)
    dummy.updateMatrix()
    rocks.setMatrixAt(i, dummy.matrix)
    color.set('#896654').multiplyScalar(0.75 + hash(i, 15) * 0.35)
    rocks.setColorAt(i, color)
  }
  rocks.instanceMatrix.needsUpdate = true
  rocks.instanceColor!.needsUpdate = true
  rocks.computeBoundingSphere()
  return rocks
}
