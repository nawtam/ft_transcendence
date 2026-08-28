import { Link } from 'react-router-dom';
import type { Universe } from '../../context/multi/universes';
import { getGamesByUniverse } from '../context/multi/games';
import '../css/multi/UniversCard.css';

interface UniverseCardProps {
  universe: Universe;
}

export function UniverseCard({ universe }: UniverseCardProps) {
  const nombrePartiesEnAttente = getGamesByUniverse(universe.id).length;

  return (
    <div
      className={`universe-card ${universe.disponible ? '' : 'universe-card--indisponible'}`}
      style={{ backgroundImage: `url(${universe.cover})` }}
    >
      <div className="universe-card__badge">
        {universe.disponible
          ? `${nombrePartiesEnAttente} ${nombrePartiesEnAttente > 1 ? 'parties' : 'partie'} en attente`
          : 'Bientôt'}
      </div>

      <div className="universe-card__content">
        <h3 className="universe-card__titre">{universe.nom}</h3>
        <p className="universe-card__description">{universe.description}</p>

        {universe.disponible && (
          <Link to={`/univers/${universe.id}`} className="universe-card__bouton">
            Rejoindre
          </Link>
        )}
      </div>
    </div>
  );
}