import { Link } from 'react-router-dom'
import '../css/ConditionsGenerales.css'

function ConditionsGenerales() {
  return (
    <div className="cg-page">
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>

      <Link to="/Registration" className="cg-back">← Retour</Link>

      <main className="cg-box">
        <h1 className="cg-title">Conditions Générales d'Utilisation</h1>
        <p className="cg-updated">Dernière mise à jour : à compléter</p>

        <section className="cg-section">
          <h2>1. ELBACHIR</h2>
          <p>
          </p>
        </section>

        <section className="cg-section">
          <h2>2. SAFIYA</h2>
          <p>

          </p>
        </section>

        <section className="cg-section">
          <h2>3. LAMO</h2>
          <p>
          </p>
        </section>

        <section className="cg-section">
          <h2>4. NONO</h2>
          <p>

          </p>
        </section>

      </main>
    </div>
  )
}

export default ConditionsGenerales