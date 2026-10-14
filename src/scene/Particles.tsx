import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createParticleGeometry, morphFromHeight } from './particleGeometry'
import { particleFragment, particleVertex } from './particleShaders'

interface ParticlesProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function Particles({ paused, onReady, onError }: ParticlesProps) {
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
        alpha: true,
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
    renderer.setClearColor(0x060914, 0)
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Particle shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar as partículas. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Jardim tridimensional de partículas luminosas que se transforma com o mouse',
    )
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.z = 10
    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const hit = new THREE.Vector3()
    let pointerActive = false
    let targetMorph = 0
    const uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uDpr: { value: renderer.getPixelRatio() },
      uPointer: { value: new THREE.Vector3(20, 20, 20) },
      uInteraction: { value: 0 },
    }
    const geometry = createParticleGeometry()
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    scene.add(points)

    const starPositions = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) {
      starPositions[i * 3] = Math.sin(i * 127.1) * 24
      starPositions[i * 3 + 1] = Math.cos(i * 311.7) * 14
      starPositions[i * 3 + 2] = -8 - (i % 20) * 0.6
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3),
    )
    const starMaterial = new THREE.PointsMaterial({
      color: 0x9a93cc,
      size: 0.018,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      const mobile = width < 760
      const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(45 / 2)) * 10
      points.position.set(
        mobile ? 0 : frustumHeight * camera.aspect * 0.18,
        mobile ? -1.05 : 0,
        0,
      )
      points.scale.setScalar(Math.min(1, camera.aspect * 1.05))
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const move = (event: PointerEvent) => {
      if (motionPaused.current || event.pointerType === 'touch') return
      if ((event.target as Element).closest('header, a, button')) {
        pointerActive = false
        return
      }
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
      pointer.set(x * 2 - 1, 1 - y * 2)
      targetMorph = morphFromHeight(y)
      pointerActive = true
    }
    const leave = () => {
      pointerActive = false
      pointer.set(0, 0)
    }
    const lost = (event: Event) => {
      event.preventDefault()
      renderer.setAnimationLoop(null)
      onError(
        'A conexão com a placa gráfica foi interrompida. Recarregue para continuar.',
      )
    }
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerleave', leave)
    renderer.domElement.addEventListener('webglcontextlost', lost)
    let previous = performance.now()
    let elapsed = 0
    let first = true
    const visibility = () => {
      previous = performance.now()
    }
    document.addEventListener('visibilitychange', visibility)
    renderer.setAnimationLoop((now) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (document.hidden) return
      if (!motionPaused.current) {
        elapsed += delta
        const ease = 1 - Math.exp(-delta * 3.5)
        smoothPointer.lerp(pointer, ease)
        uniforms.uMorph.value = THREE.MathUtils.lerp(
          uniforms.uMorph.value,
          targetMorph,
          ease,
        )
        uniforms.uInteraction.value = THREE.MathUtils.lerp(
          uniforms.uInteraction.value,
          pointerActive ? 1 : 0,
          ease,
        )
        points.rotation.y = smoothPointer.x * 0.22
        points.rotation.x = smoothPointer.y * 0.05
        camera.position.x = smoothPointer.x * 0.7
        camera.position.y = smoothPointer.y * 0.25
        camera.lookAt(0, 0, 0)
        camera.updateMatrixWorld()
        points.updateMatrixWorld()
        raycaster.setFromCamera(smoothPointer, camera)
        if (raycaster.ray.intersectPlane(plane, hit)) {
          points.worldToLocal(hit)
          uniforms.uPointer.value.lerp(hit, ease)
        }
        stars.rotation.z = Math.sin(elapsed * 0.025) * 0.02
      }
      uniforms.uTime.value = elapsed
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
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('visibilitychange', visibility)
      renderer.domElement.removeEventListener('webglcontextlost', lost)
      geometry.dispose()
      material.dispose()
      starGeometry.dispose()
      starMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [onReady, onError])

  return <div className="ocean-canvas particle-canvas" ref={container} />
}
