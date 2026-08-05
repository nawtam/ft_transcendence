import { Link } from 'react-router-dom'
import '../css/Registration.css'

function Registration() {
  return (
    <div className="reg-page">
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
      <Link to="/Connexion" className="reg-back">← Retour</Link>

      <form className="reg-form">
        <h1 className="reg-title">Inscription</h1>
        <span className="reg-pseudo">Pseudo</span>
        <input type="text" placeholder="nom de jeu" />

        <span className="reg-mail">mail</span>
        <input type="text" placeholder="email@" />

        <span className="reg-dob">Date de naissance</span>
        <input type="date" />

        <span className="reg-mdp">Mot de passe</span>
        <input type="password" placeholder="••••••••" />

        <label className="reg-cgu">
          <input type="checkbox" required />
          J'accepte les <Link to="/conditions-generales" className="cg-link">conditions générales</Link>
        </label>

        <button className="btn-reg-entrer" type="submit">Entrer</button>
      </form>
    </div>
  )
}

export default Registration