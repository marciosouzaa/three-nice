import { useCallback, useState } from 'react'
import type { PointerEvent } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Ocean } from '../scene/Ocean'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'

const moments = [
  { name: 'Hora dourada', time: '17:24' },
  { name: 'Pôr do sol', time: '17:48' },
  { name: 'Crepúsculo', time: '18:12' },
]

export default function MarePage() {
  const [light, setLight] = useState(0.5)
  const [wind, setWind] = useState(0.36)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()
  const moment = light < 0.325 ? 0 : light < 0.7 ? 1 : 2
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])

  const move = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType === 'touch') return
    if ((event.target as Element).closest('header, button, a')) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const height = (event.clientY - bounds.top) / bounds.height
    const vertical = Math.max(0, Math.min(1, (height - 0.04) / 0.92))
    setLight(vertical)
    setWind(1 - vertical)
  }

  return (
    <main
      className={`experience mare-experience ${ready ? 'is-ready' : ''}`}
      onPointerMove={move}
    >
      <Ocean
        light={light}
        wind={wind}
        paused={reducedMotion}
        onReady={onReady}
        onError={onError}
      />
      <div className="scene-shade" aria-hidden="true" />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Encontrando o horizonte…"
      />
      <section className="intro interface" aria-label="Oceano ao pôr do sol">
        <p className="intro-note">Sem pressa. Sem destino.</p>
        <h1>
          Até o último
          <br />
          raio de sol.
        </h1>
        <p className="intro-description">
          Um horizonte só seu.
          <br />
          Deixe o mundo lá fora por um instante.
        </p>
        <span className="intro-rule" aria-hidden="true" />
        <p className="pointer-hint">
          Suba para o sol. Desça para a calmaria.
          <ArrowUpRight size={13} />
        </p>
      </section>
      <aside
        className="moment-caption interface"
        aria-label="Atmosfera do oceano"
      >
        <span className="moment-time">{moments[moment].time}</span>
        <span>{moments[moment].name}</span>
        <span className="moment-line" />
      </aside>
      <footer className="footer interface">
        <span>O horizonte nunca é o mesmo.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
