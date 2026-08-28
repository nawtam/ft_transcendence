import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/Registration.css'

function Registration() {

  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp] = useState('')
  const [email, setEmail] = useState('')
  const [dob, setDob] = useState('')
  const navigate = useNavigate()
  const [cguAcceptees, setCguAcceptees] = useState(false)

  function gererSoumission(e: FormEvent) {
  e.preventDefault()
  navigate('/')
  console.log(pseudo, email, dob, mdp, cguAcceptees)
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
        <input type="text" 
        placeholder="nom de jeu"
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)} 
        />

        <span className="reg-mail">mail</span>
        <input type="text" 
        placeholder="email@" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        />

        <span className="reg-dob">Date de naissance</span>
        <input type="date" 
        value={dob}
        onChange={(e) => setDob(e.target.value)}/>

        <span className="reg-mdp">Mot de passe</span>
        <input type="password" 
        placeholder="••••••••" 
        value={mdp}
        onChange={(e) => setMdp(e.target.value)}
        />

        <label className="reg-cgu">
          <input type="checkbox" checked={cguAcceptees}  required 
          onChange={(e) => setCguAcceptees(e.target.checked)}/>
          
          J'accepte les <Link to="/conditions-generales" className="cg-link">conditions générales</Link>
        </label>

        <button className="btn-reg-entrer" type="submit">Entrer</button>
      </form>
    </div>
  )
}

export default Registration