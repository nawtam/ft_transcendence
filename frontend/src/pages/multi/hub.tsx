import { Link } from 'react-router-dom';
import { universeList } from '../../context/multi/universe';
import { games } from '../../context/multi/games';
import { UniverseCard } from '../../composants/UniversCard';
import '../../css/multi/hub.css';

export function Hub() {
  const nombrePartiesOuvertes = games.length;

  return (
    <div>

      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
    <div className="hub">
      <Link to="/" className="hub__retour">
        ← Retour
      </Link>

      <div className="hub__entete">
        <p className="hub__label">Hub multijoueur</p>
        <h1 className="hub__titre">Jouez à plusieurs, même époque</h1>
      </div>

      {/* <div className="hub__stats">
        <div className="hub__stat">
          <span className="hub__stat-valeur">{nombrePartiesOuvertes}</span>
          <span className="hub__stat-label">Parties en attente</span>
        </div>
      </div> */}

      <div className="hub__section-entete">
        <div>
          {/* <h2 className="hub__section-titre">Univers disponibles</h2> */}
          {/* <p className="hub__section-sous-titre">
            Choisissez une époque et rejoignez une table de joueurs.
          </p> */}
        </div>
      </div>

      <div className="hub__grille">
        {universeList.map((universe) => (
          <UniverseCard key={universe.id} universe={universe} />
        ))}
      </div>
    </div>
    </div>
  );
}

export default  Hub