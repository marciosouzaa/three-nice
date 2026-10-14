import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, PointerEvent } from 'react'
import {
  ArrowUpRight,
  AudioLines,
  Check,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sun,
  Volume2,
  Waves,
  Wind,
} from 'lucide-react'
import { Ocean } from './scene/Ocean'
import { createOceanAudio } from './scene/audio'
import './App.css'

const moments = [
  { name: 'Hora dourada', time: '17:24', light: 0.15, color: '#ffd7a0' },
  { name: 'Pôr do sol', time: '17:48', light: 0.5, color: '#ffa78a' },
  { name: 'Crepúsculo', time: '18:12', light: 0.9, color: '#aba4e2' },
]

function App() {
  const [light, setLight] = useState(0.5)
  const [wind, setWind] = useState(0.36)
  const moment = light < 0.325 ? 0 : light < 0.7 ? 1 : 2
  const [paused, setPaused] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [sound, setSound] = useState(false)
  const [immersive, setImmersive] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioError, setAudioError] = useState(false)
  const handleReady = useCallback(() => setReady(true), [])
  const handleError = useCallback((message: string) => setError(message), [])

  useEffect(() => {
    if (!sound) return
    let audio: ReturnType<typeof createOceanAudio> | undefined
    let disposed = false
    void (async () => {
      try {
        audio = createOceanAudio()
        await audio.start()
      } catch {
        if (!disposed) {
          setAudioError(true)
          setSound(false)
        }
      }
    })()
    return () => {
      disposed = true
      audio?.stop()
    }
  }, [sound])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImmersive(false)
      if (event.code === 'Space' && event.target === document.body) {
        event.preventDefault()
        setPaused((value) => !value)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const reset = () => {
    setLight(0.5)
    setWind(0.36)
    setPaused(false)
  }

  const moveAtmosphere = (event: PointerEvent<HTMLElement>) => {
    if (paused || event.pointerType === 'touch') return
    // Let the dock and buttons keep their own controls while the open scene
    // responds continuously to the pointer. Edge bands make both extremes easy.
    if ((event.target as Element).closest('button, a, input, .control-dock'))
      return
    const bounds = event.currentTarget.getBoundingClientRect()
    const height = (event.clientY - bounds.top) / bounds.height
    const vertical = Math.max(0, Math.min(1, (height - 0.04) / 0.92))
    setLight(vertical)
    setWind(1 - vertical)
  }

  return (
    <main
      className={`experience ${ready ? 'is-ready' : ''} ${immersive ? 'is-immersive' : ''}`}
      onPointerMove={moveAtmosphere}
    >
      <Ocean
        light={light}
        wind={wind}
        paused={paused}
        onReady={handleReady}
        onError={handleError}
      />
      <div className="scene-shade" aria-hidden="true" />
      {!ready && !error && (
        <div className="loading" role="status">
          <Waves size={28} strokeWidth={1} />
          <span>Encontrando o horizonte…</span>
        </div>
      )}
      {error && (
        <div className="scene-error" role="alert">
          <Waves size={32} />
          <h2>O oceano precisa de um pouco mais de espaço.</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </div>
      )}

      <header className="header interface">
        <a className="wordmark" href="./" aria-label="Maré — início">
          <Waves size={31} strokeWidth={1.35} />
          <span>maré</span>
        </a>
        <div className="header-right">
          <span className="live-indicator">
            <span /> Um respiro no seu dia
          </span>
          <button
            className="immersive-button"
            onClick={() => setImmersive(true)}
          >
            <Maximize2 size={15} />
            <span>Só o oceano</span>
          </button>
        </div>
      </header>

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
        aria-label="Momento selecionado"
      >
        <span className="moment-time">{moments[moment].time}</span>
        <span>{moments[moment].name}</span>
        <span className="moment-line" />
      </aside>

      <section
        className="control-dock interface"
        aria-label="Controles do oceano"
        hidden
      >
        <div className="moment-control">
          <span className="control-label">
            <Sun size={14} /> A luz do instante
          </span>
          <div
            className="moment-options"
            role="group"
            aria-label="Horário do céu"
          >
            {moments.map((item, index) => (
              <button
                key={item.name}
                className={`moment-option ${moment === index ? 'selected' : ''}`}
                aria-label={item.name}
                aria-pressed={moment === index}
                onClick={() => setLight(item.light)}
              >
                <span
                  className="color-dot"
                  style={{ background: item.color }}
                  aria-hidden="true"
                >
                  {moment === index && <Check size={9} strokeWidth={3} />}
                </span>
                {item.name}
              </button>
            ))}
          </div>
        </div>
        <div className="wind-control">
          <label className="control-label" htmlFor="wind">
            <Wind size={14} /> Intensidade das ondas{' '}
            <span>
              {wind < 0.3 ? 'Calma' : wind < 0.65 ? 'Brisa' : 'Forte'}
            </span>
          </label>
          <input
            id="wind"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={wind}
            onChange={(event) => setWind(Number(event.target.value))}
            style={{ '--range-progress': `${wind * 100}%` } as CSSProperties}
          />
        </div>
        <div className="playback-controls">
          <button
            className={`icon-button ${sound ? 'active' : ''}`}
            aria-label={
              sound ? 'Desligar som do oceano' : 'Ligar som do oceano'
            }
            aria-pressed={sound}
            title={sound ? 'Desligar som' : 'Ligar som do oceano'}
            onClick={() => {
              setAudioError(false)
              setSound((value) => !value)
            }}
          >
            {sound ? <AudioLines size={20} /> : <Volume2 size={20} />}
          </button>
          <button
            className="pause-button"
            aria-label={paused ? 'Retomar animação' : 'Pausar animação'}
            title={paused ? 'Retomar · Espaço' : 'Pausar · Espaço'}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? (
              <Play size={18} fill="currentColor" />
            ) : (
              <Pause size={18} fill="currentColor" />
            )}
          </button>
        </div>
      </section>

      <footer className="footer interface">
        <span>O horizonte nunca é o mesmo.</span>
        <button onClick={reset} hidden>
          <RotateCcw size={12} /> Recomeçar
        </button>
      </footer>
      {audioError && (
        <p className="audio-error" role="status">
          Não foi possível iniciar o som. Tente ligar novamente.
        </p>
      )}
      {immersive && (
        <button className="exit-immersive" onClick={() => setImmersive(false)}>
          <Minimize2 size={16} /> Mostrar interface <kbd>Esc</kbd>
        </button>
      )}
    </main>
  )
}

export default App
