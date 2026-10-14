import * as THREE from 'three'
import { marsHeight } from './marsTerrain'

// Models are built from local geometry, sharing their unit shapes and materials.
export function createMarsExpedition() {
  const expedition = new THREE.Group()
  const sphere = new THREE.SphereGeometry(1, 24, 16)
  const box = new THREE.BoxGeometry(1, 1, 1)
  const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16)
  const white = new THREE.MeshStandardMaterial({
    color: '#e7e2d7',
    roughness: 0.65,
  })
  const aluminum = new THREE.MeshStandardMaterial({
    color: '#a4a5a2',
    metalness: 0.55,
    roughness: 0.4,
  })
  const dark = new THREE.MeshStandardMaterial({
    color: '#252b30',
    roughness: 0.75,
  })
  const tire = new THREE.MeshStandardMaterial({
    color: '#353330',
    roughness: 0.95,
  })
  const gold = new THREE.MeshStandardMaterial({
    color: '#c6a364',
    metalness: 0.45,
    roughness: 0.4,
  })
  const red = new THREE.MeshStandardMaterial({
    color: '#a34d3d',
    roughness: 0.7,
  })
  const blue = new THREE.MeshStandardMaterial({
    color: '#315678',
    metalness: 0.25,
    roughness: 0.25,
  })
  const skin = new THREE.MeshStandardMaterial({
    color: '#79b773',
    roughness: 0.8,
  })
  const eye = new THREE.MeshPhysicalMaterial({
    color: '#131e1a',
    roughness: 0.16,
    clearcoat: 1,
  })
  const visor = new THREE.MeshPhysicalMaterial({
    color: '#dca74c',
    metalness: 0.45,
    roughness: 0.23,
    clearcoat: 1,
    emissive: '#624017',
    emissiveIntensity: 0.2,
  })
  const add = (
    parent: THREE.Object3D,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    position: number[],
    scale: number[],
  ) => {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(position[0], position[1], position[2])
    mesh.scale.set(scale[0], scale[1], scale[2])
    parent.add(mesh)
    return mesh
  }
  const ball = (
    parent: THREE.Object3D,
    material: THREE.Material,
    position: number[],
    scale: number[],
  ) => add(parent, sphere, material, position, scale)
  const block = (
    parent: THREE.Object3D,
    material: THREE.Material,
    position: number[],
    scale: number[],
  ) => add(parent, box, material, position, scale)
  const beam = (
    parent: THREE.Object3D,
    material: THREE.Material,
    from: number[],
    to: number[],
    radius: number,
  ) => {
    const a = new THREE.Vector3(...from),
      b = new THREE.Vector3(...to),
      direction = b.clone().sub(a)
    const mesh = add(
      parent,
      cylinder,
      material,
      a.clone().add(b).multiplyScalar(0.5).toArray(),
      [radius, direction.length(), radius],
    )
    mesh.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    )
    return mesh
  }
  const logoCanvas = document.createElement('canvas')
  logoCanvas.width = logoCanvas.height = 256
  const context = logoCanvas.getContext('2d')!
  context.fillStyle = '#153a70'
  context.beginPath()
  context.arc(128, 128, 116, 0, Math.PI * 2)
  context.fill()
  context.fillStyle = '#ffffff'
  for (const [x, y] of [
    [65, 72],
    [166, 60],
    [190, 142],
    [85, 193],
    [134, 182],
  ])
    context.fillRect(x, y, 3, 3)
  context.strokeStyle = '#e15647'
  context.lineWidth = 10
  context.beginPath()
  context.moveTo(25, 186)
  context.quadraticCurveTo(133, 138, 230, 62)
  context.stroke()
  context.font = 'bold 64px serif'
  context.textAlign = 'center'
  context.fillText('NASA', 128, 152)
  const logoTexture = new THREE.CanvasTexture(logoCanvas)
  logoTexture.colorSpace = THREE.SRGBColorSpace
  const logoMaterial = new THREE.MeshBasicMaterial({
    map: logoTexture,
    transparent: true,
  })
  const logoGeometry = new THREE.PlaneGeometry(1, 1)

  const rover = new THREE.Group()
  rover.name = 'Rover de exploração NASA'
  const roverModel = new THREE.Group()
  roverModel.rotation.y = -0.32
  rover.add(roverModel)
  block(roverModel, white, [0, 0.99, 0], [1.55, 0.42, 1.85])
  block(roverModel, gold, [0, 1.25, -0.04], [1.4, 0.12, 1.65])
  block(roverModel, dark, [0, 0.73, 0], [1.15, 0.14, 1.6])
  add(
    roverModel,
    logoGeometry,
    logoMaterial,
    [-0.35, 1.0, 0.932],
    [0.34, 0.34, 1],
  )
  for (const side of [-1, 1]) {
    for (const z of [-0.85, 0, 0.85]) {
      const wheel = add(
        roverModel,
        cylinder,
        tire,
        [side * 1.03, 0.37, z],
        [0.37, 0.25, 0.37],
      )
      wheel.rotation.z = Math.PI / 2
      const hub = add(
        roverModel,
        cylinder,
        aluminum,
        [side * 1.17, 0.37, z],
        [0.16, 0.03, 0.16],
      )
      hub.rotation.z = Math.PI / 2
      for (let tread = 0; tread < 14; tread++) {
        const angle = (tread / 14) * Math.PI * 2
        const rib = block(
          roverModel,
          aluminum,
          [
            side * 1.03,
            0.37 + Math.sin(angle) * 0.365,
            z + Math.cos(angle) * 0.365,
          ],
          [0.27, 0.045, 0.085],
        )
        rib.rotation.x = -angle
      }
      beam(
        roverModel,
        aluminum,
        [side * 0.65, 0.83, z * 0.65],
        [side * 1.03, 0.37, z],
        0.055,
      )
    }
    beam(
      roverModel,
      dark,
      [side * 0.86, 0.72, -0.85],
      [side * 0.86, 0.72, 0.85],
      0.04,
    )
    ball(roverModel, dark, [side * 0.54, 1.07, 0.96], [0.09, 0.075, 0.06])
  }
  beam(roverModel, aluminum, [-0.48, 1.28, 0.42], [-0.48, 2.04, 0.42], 0.055)
  block(roverModel, white, [-0.48, 2.08, 0.42], [0.62, 0.25, 0.29])
  for (const x of [-0.64, -0.32])
    ball(roverModel, blue, [x, 2.08, 0.585], [0.085, 0.085, 0.04])
  block(roverModel, aluminum, [0.42, 1.46, -0.57], [0.34, 0.3, 0.4])
  beam(roverModel, aluminum, [0.48, 1.29, -0.42], [0.48, 2.0, -0.42], 0.025)
  ball(roverModel, white, [0.48, 2.02, -0.42], [0.14, 0.05, 0.14])
  beam(roverModel, aluminum, [0, 0.98, 0.96], [0.46, 0.68, 1.53], 0.07)
  ball(roverModel, dark, [0.46, 0.68, 1.53], [0.11, 0.11, 0.11])
  beam(roverModel, aluminum, [0.46, 0.68, 1.53], [0.23, 0.46, 1.88], 0.06)
  ball(roverModel, dark, [0.23, 0.46, 1.88], [0.16, 0.13, 0.15])
  block(roverModel, white, [0, 1.26, -1.04], [0.75, 0.38, 0.38])
  for (let fin = 0; fin < 6; fin++)
    block(
      roverModel,
      aluminum,
      [-0.3 + fin * 0.12, 1.28, -1.12],
      [0.035, 0.46, 0.43],
    )

  const astronaut = new THREE.Group()
  astronaut.name = 'Astronauta'
  const astronautModel = new THREE.Group()
  astronautModel.rotation.y = -0.08
  astronaut.add(astronautModel)
  const suitLimb = new THREE.CapsuleGeometry(1, 2.8, 4, 12)
  for (const side of [-1, 1]) {
    block(astronautModel, white, [side * 0.21, 0.13, 0.08], [0.31, 0.26, 0.49])
    block(astronautModel, dark, [side * 0.21, 0.035, 0.1], [0.33, 0.065, 0.51])
    add(
      astronautModel,
      suitLimb,
      white,
      [side * 0.19, 0.58, 0],
      [0.15, 0.18, 0.15],
    )
    beam(
      astronautModel,
      red,
      [side * 0.19, 0.48, 0],
      [side * 0.19, 0.53, 0],
      0.157,
    )
    ball(astronautModel, white, [side * 0.36, 1.45, 0], [0.18, 0.18, 0.18])
    beam(
      astronautModel,
      white,
      [side * 0.38, 1.46, 0],
      [side * 0.5, 1.12, 0.06],
      0.135,
    )
    ball(astronautModel, white, [side * 0.5, 1.12, 0.06], [0.137, 0.137, 0.137])
    beam(
      astronautModel,
      white,
      [side * 0.5, 1.12, 0.06],
      [side * 0.46, 0.92, 0.17],
      0.115,
    )
    beam(
      astronautModel,
      red,
      [side * 0.468, 0.96, 0.15],
      [side * 0.46, 0.92, 0.17],
      0.12,
    )
    ball(astronautModel, white, [side * 0.46, 0.85, 0.19], [0.12, 0.14, 0.12])
  }
  ball(astronautModel, white, [0, 1.21, 0], [0.34, 0.46, 0.27])
  block(astronautModel, white, [0, 1.26, -0.34], [0.48, 0.65, 0.3])
  for (const side of [-1, 1])
    add(
      astronautModel,
      cylinder,
      aluminum,
      [side * 0.25, 1.29, -0.41],
      [0.095, 0.57, 0.095],
    )
  ball(astronautModel, white, [0, 1.82, 0], [0.37, 0.37, 0.34])
  ball(astronautModel, dark, [0, 1.84, 0.25], [0.316, 0.28, 0.13])
  ball(astronautModel, visor, [0, 1.84, 0.29], [0.29, 0.25, 0.135])
  const reflection = ball(
    astronautModel,
    white,
    [-0.08, 1.95, 0.406],
    [0.095, 0.012, 0.008],
  )
  reflection.rotation.z = 0.2
  block(astronautModel, aluminum, [0, 1.3, 0.27], [0.35, 0.26, 0.08])
  block(astronautModel, dark, [0, 1.33, 0.315], [0.27, 0.11, 0.015])
  for (const x of [-0.09, 0, 0.09])
    ball(
      astronautModel,
      x === 0 ? red : blue,
      [x, 1.23, 0.32],
      [0.025, 0.025, 0.012],
    )
  add(
    astronautModel,
    logoGeometry,
    logoMaterial,
    [-0.15, 1.54, 0.24],
    [0.15, 0.15, 1],
  )
  block(astronautModel, red, [0.4, 1.48, 0.13], [0.11, 0.075, 0.02])

  const alien = new THREE.Group()
  alien.name = 'ET'
  const alienModel = new THREE.Group()
  alienModel.rotation.y = -0.15
  alien.add(alienModel)
  ball(alienModel, skin, [0, 1.04, 0], [0.24, 0.39, 0.17])
  beam(alienModel, skin, [0, 1.3, 0], [0, 1.54, 0], 0.07)
  ball(alienModel, skin, [0, 1.79, 0.02], [0.37, 0.43, 0.3])
  for (const side of [-1, 1]) {
    const iris = ball(
      alienModel,
      eye,
      [side * 0.145, 1.84, 0.279],
      [0.113, 0.165, 0.047],
    )
    iris.rotation.z = side * -0.27
    ball(
      alienModel,
      white,
      [side * 0.145 - 0.022, 1.88, 0.325],
      [0.019, 0.023, 0.008],
    )
    beam(
      alienModel,
      skin,
      [side * 0.125, 0.79, 0],
      [side * 0.18, 0.42, 0.015],
      0.068,
    )
    beam(
      alienModel,
      skin,
      [side * 0.18, 0.42, 0.015],
      [side * 0.19, 0.09, 0.06],
      0.052,
    )
    ball(alienModel, skin, [side * 0.19, 0.07, 0.12], [0.115, 0.075, 0.2])
  }
  const smile = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.065, 1.59, 0.27),
    new THREE.Vector3(0, 1.57, 0.29),
    new THREE.Vector3(0.065, 1.59, 0.27),
  ])
  alienModel.add(
    new THREE.Mesh(new THREE.TubeGeometry(smile, 12, 0.008, 6, false), eye),
  )
  beam(alienModel, skin, [-0.2, 1.28, 0], [-0.34, 0.96, 0.02], 0.055)
  beam(alienModel, skin, [-0.34, 0.96, 0.02], [-0.39, 0.76, 0.09], 0.044)
  ball(alienModel, skin, [-0.39, 0.72, 0.09], [0.072, 0.11, 0.045])
  beam(alienModel, skin, [0.2, 1.27, 0], [0.46, 1.47, 0.03], 0.055)
  beam(alienModel, skin, [0.46, 1.47, 0.03], [0.52, 1.82, 0.05], 0.044)
  ball(alienModel, skin, [0.52, 1.87, 0.05], [0.08, 0.105, 0.045])
  for (const finger of [-1, 0, 1]) {
    beam(
      alienModel,
      skin,
      [0.52 + finger * 0.045, 1.92, 0.055],
      [0.52 + finger * 0.072, 2.08 - Math.abs(finger) * 0.03, 0.055],
      0.018,
    )
  }

  const shadowCanvas = document.createElement('canvas')
  shadowCanvas.width = shadowCanvas.height = 128
  const shadowContext = shadowCanvas.getContext('2d')!
  const gradient = shadowContext.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(25,14,9,.42)')
  gradient.addColorStop(0.45, 'rgba(25,14,9,.24)')
  gradient.addColorStop(1, 'rgba(25,14,9,0)')
  shadowContext.fillStyle = gradient
  shadowContext.fillRect(0, 0, 128, 128)
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
  shadowTexture.colorSpace = THREE.SRGBColorSpace
  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  const actors = [
    {
      root: rover,
      desktop: [-3.7, -10.5],
      mobile: [-2.05, -14],
      footprint: [3.3, 3.2],
    },
    {
      root: astronaut,
      desktop: [0, -9],
      mobile: [0, -10],
      footprint: [1.0, 0.85],
    },
    {
      root: alien,
      desktop: [3.25, -10.5],
      mobile: [2.05, -12],
      footprint: [0.8, 0.8],
    },
  ].map((actor) => {
    const geometry = new THREE.PlaneGeometry(
      actor.footprint[0],
      actor.footprint[1],
      10,
      10,
    )
    geometry.rotateX(-Math.PI / 2)
    actor.root.add(new THREE.Mesh(geometry, shadowMaterial))
    expedition.add(actor.root)
    return { ...actor, shadowGeometry: geometry }
  })
  const layout = (mobile: boolean) => {
    actors.forEach((actor) => {
      const [x, z] = mobile ? actor.mobile : actor.desktop
      const ground = marsHeight(x, z)
      actor.root.position.set(x, ground, z)
      const positions = actor.shadowGeometry.attributes.position
      for (let i = 0; i < positions.count; i++) {
        positions.setY(
          i,
          marsHeight(x + positions.getX(i), z + positions.getZ(i)) -
            ground +
            0.025,
        )
      }
      positions.needsUpdate = true
      actor.shadowGeometry.computeBoundingSphere()
    })
  }
  layout(false)
  return { group: expedition, layout }
}
