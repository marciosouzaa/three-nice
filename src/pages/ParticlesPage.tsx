import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Particles } from '../scene/Particles'
import { morphFromHeight } from '../scene/particleGeometry'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

export default function ParticlesPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shape, setShape] = useState('Esfera')
  const reducedMotion = useReducedMotion()
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const morph = morphFromHeight((event.clientY - bounds.top) / bounds.height)
    setShape(morph < 0.5 ? 'Esfera' : morph < 1.5 ? 'Galáxia' : 'Ondas')
  }
  return (
    <main
      className={`experience particles-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <Particles paused={reducedMotion} onReady={onReady} onError={onError} />
      <div className="particles-shade" aria-hidden="true" />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Acendendo os primeiros pontos…"
      />
      <section
        className="intro particles-intro interface"
        aria-label="Jardim de partículas"
      >
        <p className="intro-note">Um gesto. Mil possibilidades.</p>
        <h1>
          Um universo
          <br />
          em cada ponto.
        </h1>
        <p className="intro-description">
          Aproxime o cursor e abra caminhos na luz.
          <br />
          Suba ou desça para descobrir novas formas.
        </p>
        <span className="intro-rule" aria-hidden="true" />
        <p className="pointer-hint">
          Nada aqui precisa ficar parado.
          <ArrowUpRight size={13} />
        </p>
      </section>
      <aside
        className="particle-caption interface"
        aria-label="Forma das partículas"
      >
        <span className="shape-indicator" />
        <span>{shape}</span>
        <span>Em transformação</span>
      </aside>
      <footer className="footer interface">
        <span>Um pequeno gesto muda tudo.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
