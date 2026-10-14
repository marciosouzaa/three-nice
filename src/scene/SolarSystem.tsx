import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { solarPlanets } from './solarData'
import { createPlanetTexture, createSolarGlow } from './solarTextures'
import {
  atmosphereFragment,
  ringFragment,
  ringVertex,
  solarVertex,
  sunFragment,
} from './solarShaders'

interface SolarSystemProps {
  paused: boolean
  onReady: () => void
  onError: (message: string) => void
  onHover: (index: number | null) => void
}

export function SolarSystem({
  paused,
  onReady,
  onError,
  onHover,
}: SolarSystemProps) {
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
    renderer.toneMappingExposure = 1.15
    renderer.setClearColor('#050811')
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      console.error(
        'Solar shader:',
        gl.getProgramInfoLog(program),
        gl.getShaderInfoLog(vertex),
        gl.getShaderInfoLog(fragment),
      )
      onError(
        'Não foi possível desenhar o sistema solar. Atualize o navegador e tente novamente.',
      )
    }
    renderer.domElement.setAttribute('role', 'img')
    renderer.domElement.setAttribute(
      'aria-label',
      'O Sol e os oito planetas em órbitas ilustrativas, com a Lua, anéis de Saturno e estrelas. Explore a perspectiva e os planetas com o mouse.',
    )
    host.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 500)
    const center = new THREE.Vector3()
    const sunUniforms = { uTime: { value: 0 } }
    const sunMaterial = new THREE.ShaderMaterial({
      uniforms: sunUniforms,
      vertexShader: solarVertex,
      fragmentShader: sunFragment,
    })
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(2.15, 48, 32),
      sunMaterial,
    )
    scene.add(sun)
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createSolarGlow(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    )
    glow.scale.set(13, 13, 1)
    scene.add(glow)
    scene.add(new THREE.AmbientLight('#a1b7de', 1.15))
    const light = new THREE.PointLight('#fff1d8', 3.8, 0, 0)
    scene.add(light)
    const labels = Array.from(
      host.parentElement!.querySelectorAll<HTMLElement>('[data-planet]'),
    )
    const worlds = solarPlanets.map((data) => {
      const group = new THREE.Group()
      const material = new THREE.MeshStandardMaterial({
        map: createPlanetTexture(data),
        roughness: 0.95,
      })
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(data.radius, 40, 24),
        material,
      )
      mesh.rotation.z = data.name === 'Urano' ? 1.7 : 0.12
      group.add(mesh)
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(data.radius * 1.07, 32, 20),
        new THREE.ShaderMaterial({
          uniforms: { uColor: { value: new THREE.Color(data.color) } },
          vertexShader: solarVertex,
          fragmentShader: atmosphereFragment,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      if (data.kind === 'rock') atmosphere.visible = false
      group.add(atmosphere)
      if (data.name === 'Saturno') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(1.5, 2.7, 128),
          new THREE.ShaderMaterial({
            vertexShader: ringVertex,
            fragmentShader: ringFragment,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        )
        ring.rotation.x = -Math.PI / 2 + 0.32
        group.add(ring)
      }
      scene.add(group)
      const points = Array.from(
        { length: 160 },
        (_, i) =>
          new THREE.Vector3(
            Math.cos((i / 160) * Math.PI * 2) * data.orbit,
            0,
            Math.sin((i / 160) * Math.PI * 2) * data.orbit,
          ),
      )
      const orbitMaterial = new THREE.LineBasicMaterial({
        color: '#72869b',
        transparent: true,
        opacity: 0.2,
      })
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        orbitMaterial,
      )
      scene.add(orbit)
      return {
        data,
        group,
        mesh,
        orbitMaterial,
        projected: new THREE.Vector3(),
        pixelRadius: 0,
      }
    })
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 12),
      new THREE.MeshStandardMaterial({ color: '#aaa69e', roughness: 1 }),
    )
    worlds[2].group.add(moon)
    const starPositions = new Float32Array(4000 * 3),
      starColors = new Float32Array(4000 * 3)
    const starColor = new THREE.Color()
    for (let i = 0; i < 4000; i++) {
      const y = 1 - ((i + 0.5) / 4000) * 2,
        radial = Math.sqrt(1 - y * y),
        angle = i * 2.399963
      const radius = 120 + (Math.sin(i * 74.7) * 0.5 + 0.5) * 70
      starPositions.set(
        [
          Math.cos(angle) * radial * radius,
          y * radius,
          Math.sin(angle) * radial * radius,
        ],
        i * 3,
      )
      starColor
        .set(i % 9 === 0 ? '#d4b99d' : '#9aafcc')
        .multiplyScalar(0.3 + (Math.sin(i * 311.7) * 0.5 + 0.5) * 0.6)
      starColor.toArray(starColors, i * 3)
    }
    const starGeometry = new THREE.BufferGeometry()
    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3),
    )
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    scene.add(
      new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({
          size: 0.14,
          vertexColors: true,
          transparent: true,
          opacity: 0.85,
          depthWrite: false,
          toneMapped: false,
        }),
      ),
    )
    const beltPositions = new Float32Array(1200 * 3)
    for (let i = 0; i < 1200; i++) {
      const radius = 12.7 + (Math.sin(i * 127.1) * 0.5 + 0.5) * 1.6,
        angle = i * 2.399963
      beltPositions.set(
        [
          Math.cos(angle) * radius,
          Math.sin(i * 311.7) * 0.17,
          Math.sin(angle) * radius,
        ],
        i * 3,
      )
    }
    const beltGeometry = new THREE.BufferGeometry()
    beltGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(beltPositions, 3),
    )
    const belt = new THREE.Points(
      beltGeometry,
      new THREE.PointsMaterial({
        color: '#baad98',
        size: 0.045,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      }),
    )
    scene.add(belt)
    const pointer = new THREE.Vector2(),
      smoothPointer = new THREE.Vector2(),
      screenPointer = new THREE.Vector2(-10000, -10000)
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let width = 1,
      height = 1,
      distance = 82,
      elapsed = 0,
      hovered: number | null = null,
      pointerActive = false
    const orient = () => {
      const azimuth = 0.12 + smoothPointer.x * 0.32,
        elevation = 0.7 - smoothPointer.y * 0.22
      camera.position.set(
        Math.sin(azimuth) * Math.cos(elevation) * distance,
        Math.sin(elevation) * distance,
        Math.cos(azimuth) * Math.cos(elevation) * distance,
      )
      camera.lookAt(center)
      camera.updateMatrixWorld()
    }
    const resize = () => {
      const bounds = host.getBoundingClientRect()
      width = bounds.width
      height = Math.max(bounds.height, 1)
      camera.aspect = width / height
      distance = width < 760 ? 80 / camera.aspect : 82
      camera.setViewOffset(
        width,
        height,
        width < 760 ? 0 : -width * 0.05,
        width < 760 ? -height * 0.03 : 0,
        width,
        height,
      )
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      orient()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()
    const select = (index: number | null) => {
      if (index === hovered) return
      hovered = index
      worlds.forEach((world, i) => {
        world.orbitMaterial.opacity = i === index ? 0.6 : 0.2
        world.orbitMaterial.color.set(
          i === index ? world.data.color : '#72869b',
        )
        labels[i]?.classList.toggle('is-highlighted', i === index)
      })
      onHover(index)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      if ((event.target as Element).closest('header, a, button')) {
        pointerActive = false
        select(null)
        return
      }
      const bounds = host.getBoundingClientRect()
      screenPointer.set(event.clientX - bounds.left, event.clientY - bounds.top)
      pointer.set(
        (screenPointer.x / width) * 2 - 1,
        (screenPointer.y / height) * 2 - 1,
      )
      pointerActive = true
    }
    const leave = () => {
      pointerActive = false
      pointer.set(0, 0)
      select(null)
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
      if (!motionPaused.current && hovered === null) {
        elapsed += delta
        smoothPointer.lerp(pointer, 1 - Math.exp(-delta * 3))
        sunUniforms.uTime.value = elapsed
        belt.rotation.y = elapsed * 0.007
      }
      orient()
      worlds.forEach((world, index) => {
        const angle = world.data.phase + (elapsed * 0.045) / world.data.period
        world.group.position.set(
          Math.cos(angle) * world.data.orbit,
          0,
          Math.sin(angle) * world.data.orbit,
        )
        world.mesh.rotation.y = elapsed * 0.14
        world.group.updateMatrixWorld(true)
        world.projected.copy(world.group.position).project(camera)
        const x = (world.projected.x * 0.5 + 0.5) * width,
          y = (-world.projected.y * 0.5 + 0.5) * height
        const depth = world.group.position.distanceTo(camera.position)
        world.pixelRadius =
          (world.data.radius * height) /
          (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth)
        const label = labels[index]
        if (label) {
          label.style.transform = `translate(${x.toFixed(1)}px, ${(y + world.pixelRadius + 13).toFixed(1)}px) translate(-50%, -50%)`
          label.style.visibility =
            world.projected.z < 1 &&
            Math.abs(world.projected.x) < 0.97 &&
            Math.abs(world.projected.y) < 0.95
              ? 'visible'
              : 'hidden'
        }
      })
      moon.position.set(
        Math.cos(elapsed * 0.45) * 1.06,
        0.08,
        Math.sin(elapsed * 0.45) * 1.06,
      )
      if (pointerActive) {
        ndc.set(
          (screenPointer.x / width) * 2 - 1,
          1 - (screenPointer.y / height) * 2,
        )
        raycaster.setFromCamera(ndc, camera)
        const hit = raycaster.intersectObjects(
          worlds.map((world) => world.mesh),
          false,
        )[0]
        let found: number | null = hit
          ? worlds.findIndex((world) => world.mesh === hit.object)
          : null
        if (found === null) {
          let closest = Infinity
          worlds.forEach((world, i) => {
            const x = (world.projected.x * 0.5 + 0.5) * width,
              y = (-world.projected.y * 0.5 + 0.5) * height
            const dx = screenPointer.x - x,
              dy = screenPointer.y - y
            const separation = Math.hypot(dx, dy)
            const overName =
              Math.abs(dx) < world.data.name.length * 3.7 + 8 &&
              Math.abs(dy - world.pixelRadius - 13) < 10
            if (
              (separation < Math.max(16, world.pixelRadius + 7) || overName) &&
              separation < closest &&
              world.projected.z < 1
            ) {
              found = i
              closest = separation
            }
          })
        }
        select(found)
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
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>(),
        textures = new Set<THREE.Texture>()
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.Line ||
          object instanceof THREE.Sprite
        ) {
          if (!(object instanceof THREE.Sprite)) geometries.add(object.geometry)
          const list = Array.isArray(object.material)
            ? object.material
            : [object.material]
          list.forEach((material) => {
            materials.add(material)
            if ('map' in material && material.map instanceof THREE.Texture)
              textures.add(material.map)
          })
        }
      })
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      scene.clear()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    }
  }, [onReady, onError, onHover])
  return <div className="ocean-canvas solar-canvas" ref={container} />
}
