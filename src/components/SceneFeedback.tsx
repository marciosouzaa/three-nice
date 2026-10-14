import { Orbit } from 'lucide-react'

export function SceneFeedback({
  ready,
  error,
  loading,
}: {
  ready: boolean
  error: string | null
  loading: string
}) {
  if (error)
    return (
      <div className="scene-error" role="alert">
        <Orbit size={32} strokeWidth={1} />
        <h2>Não foi possível abrir esta cena.</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Tentar novamente
        </button>
      </div>
    )
  if (ready) return null
  return (
    <div className="loading" role="status">
      <Orbit size={28} strokeWidth={1} />
      <span>{loading}</span>
    </div>
  )
}
