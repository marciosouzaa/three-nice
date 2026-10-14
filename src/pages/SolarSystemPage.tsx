import { useCallback, useState } from 'react'
import { SceneFeedback } from '../components/SceneFeedback'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { SolarSystem } from '../scene/SolarSystem'
import { solarPlanets } from '../scene/solarData'

export default function SolarSystemPage() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback((message: string) => setError(message), [])
  const onHover = useCallback((index: number | null) => setHovered(index), [])
  const reducedMotion = useReducedMotion()
  const selected = hovered === null ? null : solarPlanets[hovered]
  return (
    <main className={`experience solar-experience ${ready ? 'is-ready' : ''}`}>
      <SolarSystem
        paused={reducedMotion}
        onReady={onReady}
        onError={onError}
        onHover={onHover}
      />
      <div className="solar-shade" aria-hidden="true" />
      <SceneFeedback
        ready={ready}
        error={error}
        loading="Encontrando nosso lugar no espaço…"
      />
      <div className="solar-labels interface" aria-label="Planetas em órbita">
        {solarPlanets.map((planet) => (
          <span
            className="solar-planet-label"
            data-planet={planet.name}
            key={planet.name}
          >
            {planet.name}
          </span>
        ))}
      </div>
      <section
        className="solar-intro interface"
        aria-label="Sistema solar interativo"
      >
        <h1>
          Há um mundo
          <br />
          além do nosso.
        </h1>
        <p>
          Mova o mouse para mudar a perspectiva.
          <br />
          Passe sobre um planeta e conheça seu mundo.
        </p>
      </section>
      <aside
        className={`solar-facts interface ${selected ? 'has-planet' : ''}`}
        aria-label="Planeta em destaque"
        aria-live="polite"
      >
        <span
          className="solar-facts-mark"
          style={{ backgroundColor: selected?.color ?? '#b9a785' }}
        />
        <h2>{selected?.name ?? 'Tudo gira ao redor de uma estrela.'}</h2>
        <p>
          {selected?.description ??
            'Oito planetas. Uma vizinhança inteira para explorar.'}
        </p>
      </aside>
      <footer className="footer interface">
        <span>Escalas e órbitas ilustrativas.</span>
        <span>Explore com o mouse</span>
      </footer>
    </main>
  )
}
