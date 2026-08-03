import { Link } from 'react-router-dom'
import '../css/Registration.css'

function Registration() {
  return (
    <div>
    <span className="Transcendence">Transcendence</span>
    <Link to="/Connexion" className="btn-retour">← Retour</Link>

    <h1>Inscription</h1>
    <form className="reg-form">
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
        J'accepte les <a href="#">conditions générales</a>
        </label>

        <button className="btn-reg-entrer" type="submit">Entrer</button>
     </form>
    </div>

  )
}

export default Registration