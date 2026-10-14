import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { createPlanetModel } from './planetModel'
import { atmosphereFragment, atmosphereVertex } from './planetAtmosphere'

interface PlanetProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
}

export function Planet({ paused, onReady, onError }: PlanetProps) {
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
    renderer.toneMappingExposure = 0.95
    renderer.setClearColor(0x123842, 0)
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Planet shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar o planeta. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'Planeta em miniatura com florestas, montanhas, mares e nuvens, que gira e muda entre dia e noite com o mouse',
    )
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0.25, 10)
    camera.lookAt(0, 0, 0)
    const stage = new THREE.Group()
    scene.add(stage)
    const time = { value: 0 }
    const night = { value: 0 }
    const model = createPlanetModel(time)
    model.root.rotation.set(0.12, 0, -0.08)
    stage.add(model.root)

    const atmosphereGeometry = new THREE.SphereGeometry(2.2, 48, 32)
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: { uNight: night },
      vertexShader: atmosphereVertex,
      fragmentShader: atmosphereFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    })
    model.root.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial))

    const hemisphere = new THREE.HemisphereLight('#d9efe5', '#385e50', 1.45)
    const sunLight = new THREE.DirectionalLight('#ffe7bd', 2.3)
    const moonLight = new THREE.DirectionalLight('#9cadff', 0.04)
    sunLight.target = stage
    moonLight.target = stage
    scene.add(hemisphere, sunLight, moonLight)
    const sunGeometry = new THREE.SphereGeometry(0.15, 16, 12)
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: '#ffdf9d',
      toneMapped: false,
      transparent: true,
    })
    const sun = new THREE.Mesh(sunGeometry, sunMaterial)
    sun.position.set(2.75, 2.05, -0.5)
    stage.add(sun)
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
      color: '#ffcf84',
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      toneMapped: false,
    })
    const sunGlow = new THREE.Mesh(sunGeometry, sunGlowMaterial)
    sunGlow.scale.setScalar(1.8)
    sun.add(sunGlow)

    const moonGeometry = new THREE.SphereGeometry(0.18, 18, 12)
    const moonMaterial = new THREE.MeshBasicMaterial({
      color: '#ede6d3',
      transparent: true,
      opacity: 0,
      toneMapped: false,
    })
    const moon = new THREE.Mesh(moonGeometry, moonMaterial)
    moon.visible = false
    moon.position.set(2.5, 2.35, -0.3)
    const craterGeometry = new THREE.SphereGeometry(0.027, 8, 6)
    const craterMaterial = new THREE.MeshBasicMaterial({
      color: '#b4b7bf',
      transparent: true,
      opacity: 0,
      toneMapped: false,
    })
    for (const [x, y] of [
      [-0.05, 0.06],
      [0.06, -0.03],
      [-0.025, -0.075],
    ]) {
      const crater = new THREE.Mesh(craterGeometry, craterMaterial)
      crater.position.set(x, y, 0.17)
      moon.add(crater)
    }
    stage.add(moon)

    const starPositions = new Float32Array(650 * 3)
    for (let i = 0; i < 650; i++) {
      starPositions[i * 3] = Math.sin(i * 127.1) * 24
      starPositions[i * 3 + 1] = Math.cos(i * 311.7) * 14
      starPositions[i * 3 + 2] = -8 - (i % 20) * 0.55
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3),
    )
    const starMaterial = new THREE.PointsMaterial({
      color: '#d8d4ff',
      size: 0.027,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      toneMapped: false,
    })
    const stars = new THREE.Points(starGeometry, starMaterial)
    scene.add(stars)

    const daySky = new THREE.Color('#d9efe5')
    const nightSky = new THREE.Color('#91a2e3')
    const dayGround = new THREE.Color('#385e50')
    const nightGround = new THREE.Color('#151d38')
    const cloudDay = new THREE.Color('#faf6e9')
    const cloudNight = new THREE.Color('#a5b6d7')
    const daySun = new THREE.Color('#ffe7bd')
    const sunsetSun = new THREE.Color('#efa388')
    const pointer = new THREE.Vector2()
    const smoothPointer = new THREE.Vector2()
    const basePosition = new THREE.Vector3()
    let targetNight = 0
    let renderedNight = -1

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      const mobile = width < 760
      const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(21)) * 10
      basePosition.set(
        mobile ? 0 : frustumHeight * camera.aspect * 0.185,
        mobile ? -1.5 : 0.15,
        0,
      )
      stage.position.copy(basePosition)
      stage.scale.setScalar(Math.min(1, camera.aspect * 0.95))
      sunLight.position.set(basePosition.x - 3, basePosition.y + 5, 6)
      moonLight.position.set(basePosition.x + 3, basePosition.y + 2, 5)
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
      targetNight = THREE.MathUtils.clamp((y - 0.2) / 0.65, 0, 1)
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
        night.value = THREE.MathUtils.lerp(night.value, targetNight, ease)
        if (Math.abs(night.value - targetNight) < 0.001)
          night.value = targetNight
        model.root.rotation.set(
          0.12 + smoothPointer.y * 0.24,
          elapsed * 0.035 + smoothPointer.x * 1.4,
          -0.08,
        )
        stage.position.y = basePosition.y + Math.sin(elapsed * 0.55) * 0.05
        model.clouds.rotation.y = elapsed * 0.045
        model.clouds.rotation.z = Math.sin(elapsed * 0.08) * 0.025
        camera.position.x = smoothPointer.x * 0.3
        camera.position.y = 0.25 - smoothPointer.y * 0.12
        camera.lookAt(0, 0, 0)
        const daylight = 1 - night.value
        hemisphere.color.copy(daySky).lerp(nightSky, night.value)
        hemisphere.groundColor.copy(dayGround).lerp(nightGround, night.value)
        hemisphere.intensity = THREE.MathUtils.lerp(1.45, 0.55, night.value)
        sunLight.intensity = 2.3 * Math.pow(daylight, 1.5)
        sunLight.color
          .copy(daySun)
          .lerp(sunsetSun, Math.sin(night.value * Math.PI) * 0.65)
        sunLight.position.set(
          stage.position.x - 3 + night.value * 5,
          stage.position.y + 5 - night.value * 3,
          6,
        )
        moonLight.intensity = 0.04 + night.value * 0.8
        moonLight.position.set(stage.position.x + 3, stage.position.y + 2, 5)
        model.cloudMaterial.color.copy(cloudDay).lerp(cloudNight, night.value)
        model.cloudMaterial.opacity = THREE.MathUtils.lerp(
          0.94,
          0.68,
          night.value,
        )
        model.waterMaterial.emissiveIntensity = 0.1 + night.value * 0.1
        model.fireflyMaterial.opacity = Math.pow(night.value, 2) * 0.9
        starMaterial.opacity = Math.pow(night.value, 1.5) * 0.85
        stars.rotation.z = Math.sin(elapsed * 0.014) * 0.01
        sunMaterial.opacity = daylight
        sun.visible = daylight > 0.001
        sunGlowMaterial.opacity = daylight * 0.12
        moonMaterial.opacity = night.value
        moon.visible = night.value > 0.001
        craterMaterial.opacity = night.value * 0.6
      }
      if (Math.abs(renderedNight - night.value) >= 0.001) {
        host.parentElement?.style.setProperty(
          '--planet-night',
          night.value.toFixed(3),
        )
        renderedNight = night.value
      }
      time.value = elapsed
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
      model.dispose()
      for (const geometry of [
        atmosphereGeometry,
        sunGeometry,
        moonGeometry,
        craterGeometry,
        starGeometry,
      ])
        geometry.dispose()
      for (const material of [
        atmosphereMaterial,
        sunMaterial,
        sunGlowMaterial,
        moonMaterial,
        craterMaterial,
        starMaterial,
      ])
        material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, onError])
  return <div className="ocean-canvas planet-canvas" ref={container} />
}
