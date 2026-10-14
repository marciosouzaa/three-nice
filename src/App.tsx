import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router'
import { Header } from './components/Header'
import { SceneFeedback } from './components/SceneFeedback'
import { experiences } from './experiences'
import './App.css'

const MarePage = lazy(() => import('./pages/MarePage'))
const ParticlesPage = lazy(() => import('./pages/ParticlesPage'))
const LiquidPage = lazy(() => import('./pages/LiquidPage'))
const PlanetPage = lazy(() => import('./pages/PlanetPage'))
const TunnelPage = lazy(() => import('./pages/TunnelPage'))

function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    const experience = experiences.find((item) => item.path === pathname)
    document.title = `${experience?.name ?? 'Experiências'} — Three Nice`
  }, [pathname])

  return (
    <div
      className={`collection ${pathname === '/liquido' ? 'collection--liquid' : ''}`}
    >
      <Header />
      <Suspense
        fallback={
          <main className="experience">
            <SceneFeedback
              ready={false}
              error={null}
              loading="Abrindo um novo mundo…"
            />
          </main>
        }
      >
        <Routes>
          <Route path="/" element={<Navigate to="/mare" replace />} />
          <Route path="/mare" element={<MarePage />} />
          <Route path="/particulas" element={<ParticlesPage />} />
          <Route path="/liquido" element={<LiquidPage />} />
          <Route path="/planeta" element={<PlanetPage />} />
          <Route path="/tunel" element={<TunnelPage />} />
          <Route path="*" element={<Navigate to="/mare" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
