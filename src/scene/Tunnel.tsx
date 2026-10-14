import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import {
  createTunnelRings,
  createTunnelSparks,
  createTunnelStrands,
  createTunnelStreaks,
} from './tunnelGeometry'
import { speedFromHeight, tunnelPath } from './tunnelPath'
import {
  glowFragment,
  glowVertex,
  ringFragment,
  ringVertex,
  sparkFragment,
  sparkVertex,
  strandVertex,
  streakFragment,
  streakVertex,
} from './tunnelShaders'

interface TunnelProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function Tunnel({ paused, onReady, onError }: TunnelProps) {
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
    renderer.setClearColor(0x040814, 0)
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Tunnel shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar o túnel. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Viagem por um túnel espacial curvo de luzes e partículas, com direção e velocidade guiadas pelo mouse',
    )
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(68, 1, 0.1, 220)
    const origin = new THREE.Vector3()
    const ahead = new THREE.Vector3()
    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const uniforms = {
      uTravel: { value: 0 },
      uSpeed: { value: 0.45 },
      uSteer: { value: 0 },
      uDpr: { value: renderer.getPixelRatio() },
    }
    const geometries = [
      createTunnelRings(),
      createTunnelStrands(),
      createTunnelSparks(),
      createTunnelStreaks(),
      new THREE.PlaneGeometry(38, 38),
    ]
    const shader = (vertexShader: string, fragmentShader: string) =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    const materials = [
      shader(ringVertex, ringFragment),
      shader(strandVertex, ringFragment),
      shader(sparkVertex, sparkFragment),
      shader(streakVertex, streakFragment),
      shader(glowVertex, glowFragment),
    ]
    const objects = [
      new THREE.Mesh(geometries[0], materials[0]),
      new THREE.Mesh(geometries[1], materials[1]),
      new THREE.Points(geometries[2], materials[2]),
      new THREE.Mesh(geometries[3], materials[3]),
      new THREE.Mesh(geometries[4], materials[4]),
    ]
    objects.forEach((object) => {
      object.frustumCulled = false
      scene.add(object)
    })
    objects[4].renderOrder = -1
    let travel = 0
    let targetSpeed = 0.45
    let lookAhead = 22
    let renderedSpeed = -1
    const orientCamera = () => {
      tunnelPath(travel, origin)
      tunnelPath(travel + lookAhead, ahead).sub(origin)
      ahead.x += smoothPointer.x * 0.8
      ahead.y -= smoothPointer.y * 0.6
      camera.position.set(smoothPointer.x * 0.45, -smoothPointer.y * 0.18, 0)
      camera.lookAt(ahead)
      camera.rotateZ(-smoothPointer.x * 0.045)
    }
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      const mobile = width < 760
      lookAhead = mobile ? 120 : 22
      camera.aspect = width / Math.max(height, 1)
      camera.setViewOffset(
        width,
        height,
        mobile ? 0 : -width * 0.16,
        0,
        width,
        height,
      )
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      orientCamera()
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
      pointer.set(x * 2 - 1, y * 2 - 1)
      targetSpeed = speedFromHeight(y)
    }
    const leave = () => pointer.set(0, 0)
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
    let first = true
    const visibility = () => {
      previous = performance.now()
    }
    document.addEventListener('visibilitychange', visibility)
    renderer.setAnimationLoop((now) => {
      const wallDelta = Math.min((now - previous) / 1000, 0.15)
      previous = now
      if (document.hidden) return
      if (!motionPaused.current) {
        const delta = Math.min(wallDelta, 0.05)
        const ease = 1 - Math.exp(-wallDelta * 3)
        smoothPointer.lerp(pointer, ease)
        uniforms.uSpeed.value = THREE.MathUtils.lerp(
          uniforms.uSpeed.value,
          targetSpeed,
          ease,
        )
        if (Math.abs(uniforms.uSpeed.value - targetSpeed) < 0.001)
          uniforms.uSpeed.value = targetSpeed
        travel +=
          delta * (3 + uniforms.uSpeed.value * uniforms.uSpeed.value * 36)
        uniforms.uTravel.value = travel
        uniforms.uSteer.value = smoothPointer.x
        const fov = 64 + uniforms.uSpeed.value * 16
        if (Math.abs(camera.fov - fov) > 0.01) {
          camera.fov = fov
          camera.updateProjectionMatrix()
        }
        orientCamera()
      }
      if (Math.abs(renderedSpeed - uniforms.uSpeed.value) >= 0.001) {
        host.parentElement?.style.setProperty(
          '--tunnel-speed',
          uniforms.uSpeed.value.toFixed(3),
        )
        renderedSpeed = uniforms.uSpeed.value
      }
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
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, onError])
  return <div className="ocean-canvas tunnel-canvas" ref={container} />
}
