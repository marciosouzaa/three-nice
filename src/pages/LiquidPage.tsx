import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Liquid } from '../scene/Liquid'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function LiquidPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reflection, setReflection] = useState('Prata viva')
  const reducedMotion = useReducedMotion()
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    setReflection(
      x < 0.35 ? 'Reflexo frio' : x > 0.65 ? 'Reflexo quente' : 'Prata viva',
    )
  }

  return (
    <main
      className={`experience liquid-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <Liquid paused={reducedMotion} onReady={onReady} onError={onError} />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Encontrando a forma da luz…"
      />
      <section
        className="intro liquid-intro interface"
        aria-label="Escultura líquida cromada"
      >
        <p className="intro-note">Matéria em movimento.</p>
        <h1>
          A luz ganha
          <br />
          outra forma.
        </h1>
        <p className="intro-description">
          Mova o cursor e molde o instante.
          <br />O reflexo acompanha cada gesto.
        </p>
        <span className="intro-rule" aria-hidden="true" />
        <p className="pointer-hint">
          Desça para soltar a forma.
          <ArrowUpRight size={13} />
        </p>
      </section>
      <aside
        className="liquid-caption interface"
        aria-label="Reflexo da escultura"
      >
        <span className="liquid-dot" />
        <span>{reflection}</span>
        <span>Sempre em fluxo</span>
      </aside>
      <footer className="footer interface">
        <span>Nenhuma forma é definitiva.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
