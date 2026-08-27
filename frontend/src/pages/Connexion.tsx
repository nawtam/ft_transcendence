import { Link } from 'react-router-dom'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/Connexion.css'



function Connexion ()
{
  const [pseudo, setPseudo] = useState('')
  const [mdp, setMdp] = useState('')
  const navigate = useNavigate()

  function gererSoumission(e: FormEvent) {
  e.preventDefault()
  navigate('/')
  console.log(pseudo, mdp)
  }
  
    return (

    <div className>
      <header className="header-connexion">
        <span className="Transcendence">Transcendence</span>
        {/* <button className="btn-connexion">Connexion</button> */}
      </header>

      <Link to="/" className="btn-retour">← Retour</Link>
      <main className="box">
        <h1 className="box-title">Bienvenue</h1>
        <form className="form" onSubmit={gererSoumission}>
        <span className="id">Pseudo</span>
        <input type="text" 
        placeholder="Nom d'aventurier" 
        value={pseudo}
        onChange={(e) => setPseudo(e.target.value)}
        />

        <span className="mdp">Mot de passe</span>
        <input type="password" 
        placeholder="••••••••" 
        value={mdp}
        onChange={(e) => setMdp(e.target.value)}
        />

        <button className="btn-entrer" type="submit">Entrer</button>
        </form>

        <p className="Registration">
    Nouveau parmi nous ? <Link to="/Registration" className="Registration-link">Créer un compte</Link>
        </p>
      </main>
    </div>
  )
}


export default Connexion