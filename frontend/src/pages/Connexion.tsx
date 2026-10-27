import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import '../css/Connexion.css'

function Connexion() {
  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp] = useState('')
  const [erreur, setErreur] = useState('')
  const navigate = useNavigate()

  async function gererSoumission(e: FormEvent) {
    e.preventDefault()
    setErreur('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: pseudo, password: mdp }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      setErreur(data?.detail || 'Connexion impossible.')
      return
    }

    navigate('/')
  }

  return (
    <div className>
      <header className="header-connexion">
        <span className="Transcendence">Transcendence</span>
      </header>

      <Link to="/" className="btn-retour">← Retour</Link>
      <main className="box">
        <h1 className="box-title">Bienvenue</h1>
        <form className="form" onSubmit={gererSoumission}>
          <span className="id">Pseudo</span>
          <input
            type="text"
            placeholder="Nom d'aventurier"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />

          <span className="mdp">Mot de passe</span>
          <input
            type="password"
            placeholder="••••••••"
            value={mdp}
            onChange={(e) => setMdp(e.target.value)}
          />

          <button className="btn-entrer" type="submit">Entrer</button>
          {erreur ? <p>{erreur}</p> : null}
        </form>

        <p className="Registration">
          Nouveau parmi nous ? <Link to="/Registration" className="Registration-link">Créer un compte</Link>
        </p>
      </main>
    </div>
  )
}

export default Connexion