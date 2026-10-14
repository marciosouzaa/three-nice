import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { oceanFragment, oceanVertex, skyFragment, skyVertex } from './shaders'

interface OceanProps {
  light: number
  wind: number
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

// Concentrate vertices near the observer, keeping the horizon vast without a
// uniformly enormous mesh. Everything lives in world space, including normals.
function createOceanGeometry() {
  const columns = 256
  const rows = 300
  const positions = new Float32Array((columns + 1) * (rows + 1) * 3)
  const indices: number[] = []
  for (let row = 0; row <= rows; row++) {
    const depth = 0.5 * Math.pow(7000, row / rows)
    const halfWidth = 18 + depth * 3
    for (let column = 0; column <= columns; column++) {
      const index = (row * (columns + 1) + column) * 3
      positions[index] = ((column / columns) * 2 - 1) * halfWidth
      positions[index + 1] = 0
      positions[index + 2] = 12 - depth
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column
        const b = a + columns + 1
        indices.push(a, a + 1, b, a + 1, b + 1, b)
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

export function Ocean({ light, wind, paused, onReady, onError }: OceanProps) {
  const container = useRef<HTMLDivElement>(null)
  const settings = useRef({ light, wind, paused })
  useEffect(() => {
    settings.current = { light, wind, paused }
  }, [light, wind, paused])

  useEffect(() => {
    const host = container.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch {
      onError(
        'Ative a aceleração de hardware ou abra a experiência em um navegador com suporte a WebGL 2.',
      )
      return
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.25 : 1.5),
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.95
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Ocean shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'O navegador não conseguiu renderizar a água. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute(
      'aria-label',
      'Oceano tridimensional com ondas e reflexos do pôr do sol',
    )
    renderer.domElement.setAttribute('role', 'img')
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 10000)
    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const target = new THREE.Vector3()
    const uniforms = {
      uTime: { value: 0 },
      uLight: { value: settings.current.light },
      uWind: { value: settings.current.wind },
      uSun: { value: new THREE.Vector3(0.38, 0.065, -1).normalize() },
    }
    const skyGeometry = new THREE.SphereGeometry(4500, 32, 16)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: skyVertex,
      fragmentShader: skyFragment,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    })
    const sky = new THREE.Mesh(skyGeometry, skyMaterial)
    sky.frustumCulled = false
    sky.renderOrder = -1
    scene.add(sky)
    const waterGeometry = createOceanGeometry()
    const waterMaterial = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: oceanVertex,
      fragmentShader: oceanFragment,
      side: THREE.DoubleSide,
    })
    const water = new THREE.Mesh(waterGeometry, waterMaterial)
    water.frustumCulled = false
    scene.add(water)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host)
    resize()
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || settings.current.paused) return
      if ((event.target as Element).closest('button, a, input, .control-dock'))
        return
      const bounds = host.getBoundingClientRect()
      pointer.set(
        THREE.MathUtils.clamp(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -1,
          1,
        ),
        THREE.MathUtils.clamp(
          ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
          -1,
          1,
        ),
      )
    }
    const resetPointer = () => pointer.set(0, 0)
    const lostContext = (event: Event) => {
      event.preventDefault()
      renderer.setAnimationLoop(null)
      onError(
        'A conexão com a placa gráfica foi interrompida. Recarregue para voltar ao oceano.',
      )
    }
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', resetPointer)
    renderer.domElement.addEventListener('webglcontextlost', lostContext)
    let previous = performance.now()
    let elapsed = 0
    let firstFrame = true
    const visibility = () => {
      previous = performance.now()
    }
    document.addEventListener('visibilitychange', visibility)
    renderer.setAnimationLoop((now) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (document.hidden) return
      const current = settings.current
      if (!current.paused) elapsed += delta * (0.7 + uniforms.uWind.value * 0.5)
      const ease = 1 - Math.exp(-delta * 2.0)
      uniforms.uLight.value = THREE.MathUtils.lerp(
        uniforms.uLight.value,
        current.light,
        ease,
      )
      uniforms.uWind.value = THREE.MathUtils.lerp(
        uniforms.uWind.value,
        current.wind,
        ease,
      )
      if (Math.abs(uniforms.uWind.value - current.wind) < 0.001)
        uniforms.uWind.value = current.wind
      uniforms.uTime.value = elapsed
      const sunHeight = THREE.MathUtils.lerp(
        0.22,
        -0.045,
        uniforms.uLight.value,
      )
      const sunX = THREE.MathUtils.lerp(
        0.12,
        0.38,
        THREE.MathUtils.smoothstep(camera.aspect, 0.6, 1.4),
      )
      uniforms.uSun.value.set(sunX, sunHeight, -1).normalize()
      if (!current.paused) smoothPointer.lerp(pointer, 1 - Math.exp(-delta * 3))
      camera.position.set(
        smoothPointer.x * 5,
        3.5 + Math.sin(elapsed * 0.23) * 0.09 * uniforms.uWind.value,
        10,
      )
      target.set(smoothPointer.x * 32, 5.9 - smoothPointer.y * 0.8, -100)
      camera.lookAt(target)
      renderer.render(scene, camera)
      if (firstFrame) {
        firstFrame = false
        onReady()
      }
    })
    return () => {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', resetPointer)
      document.removeEventListener('visibilitychange', visibility)
      renderer.domElement.removeEventListener('webglcontextlost', lostContext)
      waterGeometry.dispose()
      waterMaterial.dispose()
      skyGeometry.dispose()
      skyMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onReady, onError])

  return <div className="ocean-canvas" ref={container} />
}
