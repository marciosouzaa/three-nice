import * as THREE from 'three'

// A local photographic studio: luminous cards reflected in the metal. Generate
// the environment only once; moving its orientation moves light without doing
// another expensive cube-map capture on every frame.
export function createLiquidEnvironment(renderer: THREE.WebGLRenderer) {
  const environment = new THREE.Scene()
  environment.background = new THREE.Color('#3a3e4b')
  const geometry = new THREE.PlaneGeometry(1, 1)
  const materials: THREE.MeshBasicMaterial[] = []
  const card = (
    color: string,
    intensity: number,
    position: [number, number, number],
    width: number,
    height: number,
  ) => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(intensity),
      side: THREE.DoubleSide,
    })
    materials.push(material)
    const panel = new THREE.Mesh(geometry, material)
    panel.position.set(...position)
    panel.scale.set(width, height, 1)
    panel.lookAt(0, 0, 0)
    environment.add(panel)
  }
  card('#f6f4ff', 5, [-3.5, 3.5, 4], 3.2, 6)
  card('#ffffff', 3, [4, 1, 3], 1.8, 5)
  card('#a2c9ff', 3, [-4, -1, 0.5], 2.5, 5)
  card('#f7b599', 3, [2.8, -1.5, -3], 3, 4)
  card('#ded4ff', 2, [0, 5, -1], 5, 3)
  const pmrem = new THREE.PMREMGenerator(renderer)
  // The surface roughness already blurs reflections, so 128px retains the
  // studio highlights while reducing startup work and GPU memory fourfold.
  const target = pmrem.fromScene(environment, 0.025, 0.1, 100, { size: 128 })
  pmrem.dispose()
  geometry.dispose()
  materials.forEach((material) => material.dispose())
  environment.clear()
  return target
}
