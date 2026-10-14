import { Link } from 'react-router'
import type { experiences } from '../experiences'

type Experience = (typeof experiences)[number]

export default function PlannedPage({
  experience,
}: {
  experience: Experience
}) {
  return (
    <main className="experience planned-experience is-ready">
      <section className="planned-content">
        <p className="planned-status">Uma nova experiência está a caminho</p>
        <h1>{experience.title}</h1>
        <p>{experience.description}</p>
        <Link to="/particulas">Enquanto isso, explore as partículas</Link>
      </section>
      <footer className="footer">
        <span>Uma experiência de cada vez.</span>
        <span>Em breve</span>
      </footer>
    </main>
  )
}
