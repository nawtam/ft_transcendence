import { useNavigate } from 'react-router-dom';
import { Game, GameMode, modeLabels } from '../context/multi/games';
import { Globe, Key, UserRound } from 'lucide-react';
import '../css/multi/GameCard.css';

interface PartieCardProps {
  partie: Game;
}

const ClasseParMode: Record<GameMode, string> = {
  cooperatif: 'cooperatif',
  chacunPourSoi: 'chacun-pour-soi',
  equipeVsEquipe: 'equipe-vs-equipe',
};

export default function GameCard({ partie }: PartieCardProps) {
  const navigate = useNavigate();
  const complet = partie.joueursActuels >= partie.joueursMax;

  const rejoindre = () => {
    if (complet) return;
    navigate(`/univers/${partie.universeId}/partie/${partie.gameId}`);
  };

  return (
    <article className="carte-partie">
      <header className="carte-partie__entete">
        <h3 className="carte-partie__titre">{partie.titre}</h3>
        <span className={`badge-visibilite badge-visibilite--${partie.visibilite}`}>
          {partie.visibilite === 'public' ? <Globe taille={10} /> : <Key taille={12} />}
          {partie.visibilite === 'public' ? 'Public' : 'Privé'}
        </span>
      </header>

      <p className="carte-partie__hote">Hôte : {partie.hote}</p>

      <footer className="carte-partie__pied">
        <div className="carte-partie__infos">
          <span className={`badge-mode badge-mode--${ClasseParMode[partie.mode]}`}>
            {modeLabels[partie.mode]}
          </span>
          <span className="carte-partie__joueurs">
            <UserRound taille={14} />
            {partie.joueursActuels}/{partie.joueursMax}
          </span>
        </div>

        <button
          type="button"
          className="bouton-rejoindre"
          onClick={rejoindre}
          disabled={complet}
        >
          {complet ? 'Complet' : 'Rejoindre'}
        </button>
      </footer>
    </article>
  );
}