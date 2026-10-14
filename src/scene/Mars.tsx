import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createMarsRocks, createMarsTerrain, marsHeight } from './marsTerrain'
import {
  dustFragment,
  dustVertex,
  marsSkyFragment,
  marsSkyVertex,
  marsSurfaceColor,
  marsSurfaceFunctions,
} from './marsShaders'

interface MarsProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function Mars({ paused, onReady, onError }: MarsProps) {
  const container = useRef<HTMLDivElement>(null)
  const motionPaused = useRef(paused)
  useEffect(() => {
    motionPaused.current = paused
  }, [paused])
  useEffect(() => {
    const host = container.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      onError(
        'Ative a aceleração de hardware ou use um navegador com suporte a WebGL 2.',
      )
      return
    }
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 760 ? 1.25 : 1.5),
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Mars shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar Marte. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Vista em primeira pessoa no solo de Marte, com pedras, montanhas ao longe e céu de poeira. O mouse guia o olhar.',
    )
    host.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#ad8068', 0.005)
    const camera = new THREE.PerspectiveCamera(65, 1, 0.08, 900)
    camera.position.set(0, marsHeight(0, 0) + 1.75, 0)
    camera.rotation.order = 'YXZ'
    const sun = new THREE.Vector3(-0.42, 0.14, -0.9).normalize()
    const skyGeometry = new THREE.SphereGeometry(700, 40, 24)
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: { uSun: { value: sun } },
      vertexShader: marsSkyVertex,
      fragmentShader: marsSkyFragment,
      side: THREE.BackSide,
      depthWrite: false,
    })
    scene.add(new THREE.Mesh(skyGeometry, skyMaterial))
    scene.add(new THREE.HemisphereLight('#e9c7a8', '#563727', 1.5))
    const sunlight = new THREE.DirectionalLight('#ffe0b3', 2.8)
    sunlight.position.copy(sun).multiplyScalar(100)
    scene.add(sunlight)
    const terrainGeometry = createMarsTerrain()
    const terrainMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 1,
    })
    terrainMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying vec3 vMarsPosition;',
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvMarsPosition = position;',
        )
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>\n${marsSurfaceFunctions}`,
        )
        .replace(
          '#include <color_fragment>',
          `#include <color_fragment>\n${marsSurfaceColor}`,
        )
    }
    terrainMaterial.customProgramCacheKey = () => 'mars-mineral-surface-v1'
    scene.add(new THREE.Mesh(terrainGeometry, terrainMaterial))
    const rocks = createMarsRocks()
    scene.add(rocks)
    const dustGeometry = new THREE.BufferGeometry()
    const dustPositions = new Float32Array(180 * 3)
    for (let i = 0; i < 180; i++) {
      dustPositions[i * 3] = Math.sin(i * 127.1) * 40
      dustPositions[i * 3 + 1] = 1 + (Math.sin(i * 311.7) * 0.5 + 0.5) * 5
      dustPositions[i * 3 + 2] = Math.cos(i * 74.7) * 40
    }
    dustGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(dustPositions, 3),
    )
    const dustUniforms = {
      uTime: { value: 0 },
      uDpr: { value: renderer.getPixelRatio() },
    }
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: dustUniforms,
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      transparent: true,
      depthWrite: false,
    })
    const dust = new THREE.Points(dustGeometry, dustMaterial)
    dust.frustumCulled = false
    scene.add(dust)
    const pointer = new THREE.Vector2(0, 0.025),
      smooth = pointer.clone()
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    const move = (event: PointerEvent) => {
      if (motionPaused.current || event.pointerType === 'touch') return
      if ((event.target as Element).closest('header, a, button')) return
      const bounds = host.getBoundingClientRect()
      const x = THREE.MathUtils.clamp(
        (event.clientX - bounds.left) / bounds.width,
        0,
        1,
      )
      const y = THREE.MathUtils.clamp(
        (event.clientY - bounds.top) / bounds.height,
        0,
        1,
      )
      // Absolute mouse position gives a wide look range without locking the cursor.
      pointer.set(
        (0.5 - x) * 2.8,
        Math.max(0, (0.5 - y) * 2) * 1.32 + Math.min(0, (0.5 - y) * 2) * 0.32,
      )
    }
    const lost = (event: Event) => {
      event.preventDefault()
      renderer.setAnimationLoop(null)
      onError(
        'A conexão com a placa gráfica foi interrompida. Recarregue para continuar.',
      )
    }
    window.addEventListener('pointermove', move)
    renderer.domElement.addEventListener('webglcontextlost', lost)
    let previous = performance.now(),
      first = true
    const visibility = () => {
      previous = performance.now()
    }
    document.addEventListener('visibilitychange', visibility)
    renderer.setAnimationLoop((now) => {
      const delta = Math.min((now - previous) / 1000, 0.1)
      previous = now
      if (document.hidden) return
      if (!motionPaused.current) {
        smooth.lerp(pointer, 1 - Math.exp(-delta * 4))
        dustUniforms.uTime.value += delta
      }
      camera.rotation.set(smooth.y, smooth.x, 0)
      renderer.render(scene, camera)
      if (first) {
        first = false
        onReady()
      }
    })
    return () => {
      renderer.setAnimationLoop(null)
      observer.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('visibilitychange', visibility)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      rocks.dispose()
      ;[skyGeometry, terrainGeometry, rocks.geometry, dustGeometry].forEach(
        (geometry) => geometry.dispose(),
      )
      ;[skyMaterial, terrainMaterial, rocks.material, dustMaterial].forEach(
        (material) => material.dispose(),
      )
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, onError])
  return <div className="ocean-canvas mars-canvas" ref={container} />
}
