import * as THREE from 'three'

const RADIUS = 2
const up = new THREE.Vector3(0, 1, 0)

function terrainField(n: THREE.Vector3) {
  return (
    Math.sin(n.x * 3.3 + 1.1) * Math.cos(n.z * 2.8 - 0.4) +
    Math.sin(n.y * 4.2 + n.z * 1.8) * 0.47 +
    Math.cos(n.x * 6.2 + n.y * 3.7) * 0.18 +
    0.28
  )
}

function terrainRadius(n: THREE.Vector3) {
  const field = terrainField(n)
  const ridge = Math.pow(
    Math.max(
      0,
      Math.sin(n.x * 8.3 + n.z * 3.7) * Math.cos(n.y * 7.1 - n.x * 2.5),
    ),
    3,
  )
  return 1.98 + Math.max(0, field) * 0.29 + (field > 0.65 ? ridge * 0.16 : 0)
}

function fibonacciDirection(index: number, count: number) {
  const y = 1 - ((index + 0.5) / count) * 2
  const r = Math.sqrt(1 - y * y)
  const angle = index * Math.PI * (3 - Math.sqrt(5))
  return new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r)
}

export function createPlanetModel(time: { value: number }) {
  const root = new THREE.Group()
  const geometries: THREE.BufferGeometry[] = []
  const materials: THREE.Material[] = []
  const instances: THREE.InstancedMesh[] = []
  const trackGeometry = <T extends THREE.BufferGeometry>(geometry: T) => {
    geometries.push(geometry)
    return geometry
  }
  const trackMaterial = <T extends THREE.Material>(material: T) => {
    materials.push(material)
    return material
  }
  const geometry = trackGeometry(new THREE.IcosahedronGeometry(1, 7))
  const positions = geometry.getAttribute('position')
  const colors = new Float32Array(positions.count * 3)
  const direction = new THREE.Vector3()
  const palette = ['#e3cf98', '#8fbf83', '#6b9d70', '#879b8b', '#edf0de'].map(
    (color) => new THREE.Color(color),
  )
  for (let i = 0; i < positions.count; i += 3) {
    let height = 0
    let latitude = 0
    for (let j = 0; j < 3; j++) {
      direction.fromBufferAttribute(positions, i + j).normalize()
      const radius = terrainRadius(direction)
      height += radius - RADIUS
      latitude += Math.abs(direction.y)
      positions.setXYZ(
        i + j,
        direction.x * radius,
        direction.y * radius,
        direction.z * radius,
      )
    }
    height /= 3
    latitude /= 3
    const color =
      latitude > 0.89 || height > 0.38
        ? palette[4]
        : height < 0.05
          ? palette[0]
          : height < 0.16
            ? palette[1]
            : height < 0.28
              ? palette[2]
              : palette[3]
    for (let j = 0; j < 3; j++) color.toArray(colors, (i + j) * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  const landMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      vertexColors: true,
      flatShading: true,
      roughness: 1,
    }),
  )
  root.add(new THREE.Mesh(geometry, landMaterial))

  const waterGeometry = trackGeometry(new THREE.SphereGeometry(2.015, 80, 48))
  const waterMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#4eacb7',
      roughness: 0.3,
      metalness: 0.12,
      emissive: '#143b55',
      emissiveIntensity: 0.1,
    }),
  )
  waterMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = time
    shader.vertexShader = 'uniform float uWaterTime;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\ntransformed += normal * sin(position.x * 16.0 + uWaterTime * 0.7) * cos(position.z * 13.0 - uWaterTime * 0.5) * 0.003;',
    )
  }
  waterMaterial.customProgramCacheKey = () => 'three-nice-planet-water-v1'
  root.add(new THREE.Mesh(waterGeometry, waterMaterial))

  const trees: THREE.Vector3[] = []
  const mountains: THREE.Vector3[] = []
  for (let i = 0; i < 3500; i++) {
    // Shuffle samples so both hemispheres get forests before the instance limit.
    const n = fibonacciDirection((i * 977 + 417) % 3500, 3500)
    const field = terrainField(n)
    if (
      trees.length < 190 &&
      field > 0.4 &&
      field < 1.03 &&
      Math.abs(n.y) < 0.83 &&
      i % 4 === 0
    )
      trees.push(n)
    if (
      mountains.length < 12 &&
      field > 0.65 &&
      Math.abs(n.y) < 0.76 &&
      mountains.every((other) => n.dot(other) < 0.94)
    )
      mountains.push(n)
  }
  const forest = trees.filter((n) =>
    mountains.every((mountain) => n.dot(mountain) < 0.985),
  )
  const dummy = new THREE.Object3D()
  const addInstances = (
    meshGeometry: THREE.BufferGeometry,
    material: THREE.MeshStandardMaterial,
    directions: THREE.Vector3[],
    altitude: number,
    sizes: (index: number) => number,
    shades?: THREE.Color[],
  ) => {
    const mesh = new THREE.InstancedMesh(
      meshGeometry,
      material,
      directions.length,
    )
    directions.forEach((n, i) => {
      const scale = sizes(i)
      dummy.position.copy(n).multiplyScalar(terrainRadius(n) + altitude * scale)
      dummy.quaternion.setFromUnitVectors(up, n)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      if (shades) mesh.setColorAt(i, shades[i % shades.length])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
    instances.push(mesh)
    root.add(mesh)
    return mesh
  }
  const treeScale = (i: number) => 0.65 + (Math.sin(i * 17.3) + 1) * 0.28
  const trunkMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#896d51',
      roughness: 1,
      flatShading: true,
    }),
  )
  const leafMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 1,
      flatShading: true,
    }),
  )
  const leafColors = ['#315b43', '#477954', '#5b8e61', '#2e6552'].map(
    (color) => new THREE.Color(color),
  )
  addInstances(
    trackGeometry(new THREE.CylinderGeometry(0.022, 0.031, 0.15, 5)),
    trunkMaterial,
    forest,
    0.06,
    treeScale,
  )
  addInstances(
    trackGeometry(new THREE.ConeGeometry(0.095, 0.27, 6)),
    leafMaterial,
    forest,
    0.21,
    treeScale,
    leafColors,
  )
  addInstances(
    trackGeometry(new THREE.ConeGeometry(0.072, 0.21, 6)),
    leafMaterial,
    forest,
    0.32,
    treeScale,
    leafColors,
  )

  const mountainMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#8f9c9a',
      roughness: 1,
      flatShading: true,
    }),
  )
  const snowMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#f2f1dc',
      roughness: 1,
      flatShading: true,
    }),
  )
  const mountainScale = (i: number) => 0.85 + (i % 4) * 0.13
  addInstances(
    trackGeometry(new THREE.ConeGeometry(0.26, 0.55, 5)),
    mountainMaterial,
    mountains,
    0.19,
    mountainScale,
  )
  addInstances(
    trackGeometry(new THREE.ConeGeometry(0.1, 0.22, 5)),
    snowMaterial,
    mountains,
    0.36,
    mountainScale,
  )

  const clouds = new THREE.Group()
  const cloudMaterial = trackMaterial(
    new THREE.MeshStandardMaterial({
      color: '#faf6e9',
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
    }),
  )
  const cloudGeometry = trackGeometry(new THREE.SphereGeometry(1, 10, 7))
  const cloudMesh = new THREE.InstancedMesh(cloudGeometry, cloudMaterial, 70)
  const local = new THREE.Vector3()
  const orientation = new THREE.Quaternion()
  for (let i = 0; i < 14; i++) {
    const n = fibonacciDirection(i + 2, 18)
    orientation.setFromUnitVectors(up, n)
    for (let puff = 0; puff < 5; puff++) {
      local
        .set((puff - 2) * 0.19, (puff % 2) * 0.035, Math.sin(puff * 2) * 0.06)
        .applyQuaternion(orientation)
      dummy.position.copy(n).multiplyScalar(2.62).add(local)
      dummy.quaternion.copy(orientation)
      dummy.scale.set(
        0.19 + (puff % 3) * 0.055,
        0.1 + (puff % 2) * 0.04,
        0.16 + (puff % 3) * 0.035,
      )
      dummy.updateMatrix()
      cloudMesh.setMatrixAt(i * 5 + puff, dummy.matrix)
    }
  }
  cloudMesh.instanceMatrix.needsUpdate = true
  cloudMesh.computeBoundingSphere()
  instances.push(cloudMesh)
  clouds.add(cloudMesh)
  root.add(clouds)

  const fireflyGeometry = trackGeometry(new THREE.BufferGeometry())
  const fireflyPositions = new Float32Array(Math.min(forest.length, 100) * 3)
  forest.slice(0, 100).forEach((n, i) => {
    const tangent = new THREE.Vector3().crossVectors(up, n).normalize()
    n.clone()
      .multiplyScalar(terrainRadius(n) + 0.18)
      .addScaledVector(tangent, 0.12)
      .toArray(fireflyPositions, i * 3)
  })
  fireflyGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(fireflyPositions, 3),
  )
  const fireflyMaterial = trackMaterial(
    new THREE.PointsMaterial({
      color: '#ffe1a0',
      size: 0.037,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  )
  root.add(new THREE.Points(fireflyGeometry, fireflyMaterial))

  return {
    root,
    clouds,
    cloudMaterial,
    waterMaterial,
    fireflyMaterial,
    dispose() {
      instances.forEach((mesh) => mesh.dispose())
      geometries.forEach((resource) => resource.dispose())
      materials.forEach((resource) => resource.dispose())
      root.clear()
    },
  }
}
