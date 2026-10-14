import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight, Moon, Sun } from 'lucide-react'
import { Planet } from '../scene/Planet'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function PlanetPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [phase, setPhase] = useState(0)
  const reducedMotion = useReducedMotion()
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const height = (event.clientY - bounds.top) / bounds.height
    setPhase(height < 0.4 ? 0 : height < 0.7 ? 1 : 2)
  }
  return (
    <main
      className={`experience planet-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <div className="planet-sky" aria-hidden="true">
        <div className="planet-night-sky" />
      </div>
      <Planet paused={reducedMotion} onReady={onReady} onError={onError} />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Cultivando um pequeno mundo…"
      />
      <section
        className="intro planet-intro interface"
        aria-label="Pequeno planeta interativo"
      >
        <p className="intro-note">Um lugar para se perder.</p>
        <h1>
          Um pequeno
          <br />
          mundo inteiro.
        </h1>
        <p className="intro-description">
          Florestas, mares e um céu que muda.
          <br />
          Explore um mundo do tamanho de um gesto.
        </p>
        <span className="intro-rule" aria-hidden="true" />
        <p className="pointer-hint">
          Suba para o dia. Desça para a noite.
          <ArrowUpRight size={13} />
        </p>
      </section>
      <aside
        className="planet-caption interface"
        aria-label="Atmosfera do planeta"
      >
        {phase === 2 ? (
          <Moon size={15} strokeWidth={1.3} />
        ) : (
          <Sun size={15} strokeWidth={1.3} />
        )}
        <span>{['Dia aberto', 'Hora azul', 'Noite estrelada'][phase]}</span>
        <span>Um mundo em movimento</span>
      </aside>
      <footer className="footer interface">
        <span>Há sempre outro lado para descobrir.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
