import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Tunnel } from '../scene/Tunnel'
import { speedFromHeight } from '../scene/tunnelPath'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function TunnelPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pace, setPace] = useState('Cruzeiro')
  const [direction, setDirection] = useState('Seguindo o fluxo')
  const reducedMotion = useReducedMotion()
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const speed = speedFromHeight((event.clientY - bounds.top) / bounds.height)
    setPace(speed > 0.72 ? 'Dobra' : speed < 0.25 ? 'Deriva' : 'Cruzeiro')
    setDirection(
      x < 0.35
        ? 'Rumo à esquerda'
        : x > 0.65
          ? 'Rumo à direita'
          : 'Seguindo o fluxo',
    )
  }
  return (
    <main
      className={`experience tunnel-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <div className="tunnel-velocity-glow" aria-hidden="true" />
      <Tunnel paused={reducedMotion} onReady={onReady} onError={onError} />
      <div className="tunnel-shade" aria-hidden="true" />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Abrindo caminho entre as luzes…"
      />
      <section
        className="intro tunnel-intro interface"
        aria-label="Viagem pelo túnel espacial"
      >
        <p className="intro-note">O caminho também é o destino.</p>
        <h1>
          O horizonte
          <br />é só o começo.
        </h1>
        <p className="intro-description">
          Mova para escolher o caminho.
          <br />
          Suba para acelerar. Desça para flutuar.
        </p>
        <p className="pointer-hint">
          Deixe a luz levar você.
          <ArrowUpRight size={13} />
        </p>
      </section>
      <aside className="tunnel-caption interface" aria-label="Ritmo da viagem">
        <span className="tunnel-signal" />
        <span>{pace}</span>
        <span>{direction}</span>
      </aside>
      <footer className="footer interface">
        <span>Cada curva leva mais longe.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
