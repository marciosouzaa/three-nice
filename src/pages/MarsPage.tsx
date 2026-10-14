import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { Mars } from '../scene/Mars'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function MarsPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState('Horizonte marciano')
  const reducedMotion = useReducedMotion()
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const y = (event.clientY - bounds.top) / bounds.height
    setView(
      y < 0.3
        ? 'Céu marciano'
        : y > 0.7
          ? 'Solo marciano'
          : 'Horizonte marciano',
    )
  }
  return (
    <main
      className={`experience mars-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <Mars paused={reducedMotion} onReady={onReady} onError={onError} />
      <div className="mars-shade" aria-hidden="true" />
      <SceneFeedback ready={ready} error={error} loading="Pousando em Marte…" />
      <section
        className="mars-intro interface"
        aria-label="Na superfície de Marte"
      >
        <h1>Um passo em outro mundo.</h1>
        <p>
          Olhe para os lados. Levante o olhar.
          <br />O horizonte é seu.
        </p>
      </section>
      <aside className="mars-caption interface" aria-label="Direção do olhar">
        {view}
      </aside>
      <footer className="footer interface">
        <span>Marte, visto do chão.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
