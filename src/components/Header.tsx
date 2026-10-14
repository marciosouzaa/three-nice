import { Orbit } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { experiences } from '../experiences'

export function Header() {
  return (
    <header className="collection-header">
      <Link
        className="collection-brand"
        to="/mare"
        aria-label="Three Nice — início"
      >
        <Orbit size={26} strokeWidth={1.2} />
        <span>
          three<span className="brand-light">nice</span>
        </span>
      </Link>
      <nav className="experience-nav" aria-label="Experiências Three.js">
        {experiences.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `experience-link ${isActive ? 'is-current' : ''} ${item.ready ? '' : 'is-planned'}`
            }
          >
            <span>{item.name}</span>
            {!item.ready && <small>Em breve</small>}
          </NavLink>
        ))}
      </nav>
      <span className="collection-note">
        Pequenos mundos.
        <br />
        Novas perspectivas.
      </span>
    </header>
  )
}
