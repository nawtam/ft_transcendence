import { Link, useNavigate } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import '../css/Registration.css'

function Registration() {
  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const [cguAcceptees, setCguAcceptees] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)
  const navigate = useNavigate()

  async function gererSoumission(e: FormEvent) {
    e.preventDefault()
    setErreur('')

    if (!cguAcceptees) {
      setErreur('Tu dois accepter les conditions générales.')
      return
    }

    setEnCours(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: pseudo,
          email,
          password: mdp,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const detail = data?.detail
        setErreur(
          typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(' · ') || 'Inscription impossible.'
              : 'Inscription impossible.',
        )
        return
      }

      navigate('/')
    } catch {
      setErreur('Impossible de joindre le serveur.')
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div>
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
      <Link to="/Connexion" className="reg-back">← Retour</Link>

      <form className="reg-form" onSubmit={gererSoumission}>
        <h1 className="reg-title">Inscription</h1>
        <span className="reg-pseudo">Pseudo</span>
        <input
          type="text"
          placeholder="nom de jeu"
          value={pseudo}
          onChange={(e) => setPseudo(e.target.value)}
        />

        <span className="reg-mail">mail</span>
        <input
          type="text"
          placeholder="email@"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <span className="reg-dob">Date de naissance</span>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
        />

        <span className="reg-mdp">Mot de passe</span>
        <input
          type="password"
          placeholder="••••••••"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
        />

        <label className="reg-cgu">
          <input
            type="checkbox"
            checked={cguAcceptees}
            required
            onChange={(e) => setCguAcceptees(e.target.checked)}
          />
          J'accepte les <Link to="/conditions-generales" className="cg-link">conditions générales</Link>
        </label>

        {erreur ? <p>{erreur}</p> : null}

        <button className="btn-reg-entrer" type="submit" disabled={enCours}>
          {enCours ? 'Création…' : 'Entrer'}
        </button>
      </form>
    </div>
  )
}

export default Registration