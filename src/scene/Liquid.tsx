import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { liquidVertexFunctions } from './liquidShader'
import { createLiquidEnvironment } from './liquidEnvironment'

interface LiquidProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function Liquid({ paused, onReady, onError }: LiquidProps) {
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
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    renderer.setClearColor(0xd8d9e2, 0)
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Liquid shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar o metal líquido. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Escultura de metal líquido cromado com deformação e reflexos que acompanham o mouse',
    )
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.3, 9)
    camera.lookAt(0, 0, 0)
    const environment = createLiquidEnvironment(renderer)
    scene.environment = environment.texture
    scene.environmentIntensity = 1.15
    const uniforms = {
      uTime: { value: 0 },
      uDeform: { value: 0.4 },
      uPointer: { value: new THREE.Vector3(20, 20, 20) },
      uInteraction: { value: 0 },
    }
    const geometry = new THREE.SphereGeometry(1.65, 128, 96)
    const material = new THREE.MeshPhysicalMaterial({
      color: '#e2e5ef',
      metalness: 1,
      roughness: 0.14,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      iridescence: 0.22,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [100, 260],
    })
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms)
      shader.vertexShader = liquidVertexFunctions + shader.vertexShader
      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        '#include <beginnormal_vertex>\nobjectNormal = liquidNormal(position);',
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        'vec3 transformed = liquidPosition(position);',
      )
    }
    material.customProgramCacheKey = () => 'three-nice-liquid-v1'
    const sculpture = new THREE.Mesh(geometry, material)
    sculpture.frustumCulled = false
    scene.add(sculpture)

    const coolLight = new THREE.PointLight('#a8caff', 20, 25, 2)
    coolLight.position.set(-3, 2, 4)
    const warmLight = new THREE.PointLight('#f3b59b', 15, 25, 2)
    warmLight.position.set(5, -0.5, 3)
    scene.add(coolLight, warmLight)
    const shadowGeometry = new THREE.PlaneGeometry(6, 6)
    const shadowMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: 0.2 } },
      vertexShader:
        'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'varying vec2 vUv; uniform float uOpacity; void main() { float r = length((vUv - 0.5) * 2.0); float alpha = pow(max(1.0 - r, 0.0), 3.0) * uOpacity; gl_FragColor = vec4(0.14, 0.14, 0.22, alpha); }',
    })
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial)
    shadow.rotation.x = -Math.PI / 2
    scene.add(shadow)

    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const hit = new THREE.Vector3()
    const coldColor = new THREE.Color('#c5d8f2')
    const hotColor = new THREE.Color('#f3d1bd')
    const neutralColor = new THREE.Color('#e2e5ef')
    const basePosition = new THREE.Vector3()
    let active = false
    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      const mobile = width < 760
      const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(21)) * 9
      basePosition.set(
        mobile ? 0 : frustumHeight * camera.aspect * 0.185,
        mobile ? -1.22 : 0.1,
        0,
      )
      sculpture.position.copy(basePosition)
      sculpture.scale.setScalar(Math.min(1.1, camera.aspect * 1.18))
      shadow.position.set(
        basePosition.x,
        basePosition.y - 2.35 * sculpture.scale.x,
        0,
      )
      shadow.scale.setScalar(sculpture.scale.x)
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    const move = (event: PointerEvent) => {
      if (motionPaused.current || event.pointerType === 'touch') return
      if ((event.target as Element).closest('header, a, button')) {
        active = false
        return
      }
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
      active = true
    }
    const leave = () => {
      active = false
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
        const ease = 1 - Math.exp(-delta * 3)
        smoothPointer.lerp(pointer, ease)
        uniforms.uDeform.value = THREE.MathUtils.lerp(
          uniforms.uDeform.value,
          active ? 0.12 + (smoothPointer.y + 1) * 0.36 : 0.4,
          ease,
        )
        uniforms.uInteraction.value = THREE.MathUtils.lerp(
          uniforms.uInteraction.value,
          active ? 1 : 0,
          ease,
        )
        sculpture.rotation.set(
          smoothPointer.y * 0.28 + Math.sin(elapsed * 0.13) * 0.05,
          elapsed * 0.09 + smoothPointer.x * 0.8,
          Math.sin(elapsed * 0.2) * 0.08,
        )
        sculpture.position.y = basePosition.y + Math.sin(elapsed * 0.7) * 0.08
        scene.environmentRotation.set(
          smoothPointer.y * 0.1,
          smoothPointer.x * 0.85 + elapsed * 0.018,
          0,
        )
        if (smoothPointer.x < 0)
          material.color
            .copy(neutralColor)
            .lerp(coldColor, -smoothPointer.x * 0.8)
        else
          material.color
            .copy(neutralColor)
            .lerp(hotColor, smoothPointer.x * 0.8)
        material.iridescence = 0.16 + (smoothPointer.y + 1) * 0.14
        coolLight.intensity = 20 - smoothPointer.x * 10
        warmLight.intensity = 15 + smoothPointer.x * 10
        coolLight.position.x = basePosition.x - 3 + smoothPointer.x
        warmLight.position.x = basePosition.x + 3 + smoothPointer.x
        camera.position.x = smoothPointer.x * 0.35
        camera.lookAt(0, 0, 0)
        camera.updateMatrixWorld()
        sculpture.updateMatrixWorld()
        raycaster.setFromCamera(
          new THREE.Vector2(smoothPointer.x, -smoothPointer.y),
          camera,
        )
        if (raycaster.ray.intersectPlane(plane, hit)) {
          sculpture.worldToLocal(hit)
          uniforms.uPointer.value.lerp(hit, ease)
        }
        shadowMaterial.uniforms.uOpacity.value =
          0.18 - Math.sin(elapsed * 0.7) * 0.015
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
      shadowGeometry.dispose()
      shadowMaterial.dispose()
      scene.environment = null
      environment.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, onError])

  return <div className="ocean-canvas liquid-canvas" ref={container} />
}
