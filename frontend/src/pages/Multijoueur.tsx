import { Link } from 'react-router-dom'
import { useMultiJoueur} from '../context/MultiContext.tsx';
import { useJoueur } from '../context/JoueurContext.tsx';

import '../css/Multi.css'

function Multijoueur() {
  return (
    <div>
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
        <Link to="/" className="btn-retour">← Retour</Link>

      <main>
        <h1 classeName="h-multi"> Hub Multijoueur</h1>
        <div className="stat-multi">
            <div className="victoire"> {joueur.victoire}</div>

        </div>
        
      </main>


      
    </div>
  )
}

export default Multijoueur