import { useNavigate } from 'react-router-dom';
import { Game, GameMode, modeLabels } from '../context/multi/games';
import '../css/multi/PartieCard.css';
import {
  IconeGlobe,
  IconeCadenas,
  IconePersonnes,
} from './Icones';

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
  const IconeMode = [partie.mode];

  const rejoindre = () => {
    if (complet) return;
    navigate(`/univers/${partie.universeId}/partie/${partie.gameId}`);
  };

  return (
    <article className="carte-partie">
      <header className="carte-partie__entete">
        <h3 className="carte-partie__titre">{partie.titre}</h3>
        <span className={`badge-visibilite badge-visibilite--${partie.visibilite}`}>
          {partie.visibilite === 'public' ? <IconeGlobe taille={12} /> : <IconeCadenas taille={12} />}
          {partie.visibilite === 'public' ? 'Public' : 'Privé'}
        </span>
      </header>

      <p className="carte-partie__hote">Hôte : {partie.hote}</p>

      <footer className="carte-partie__pied">
        <div className="carte-partie__infos">
          <span className={`badge-mode badge-mode--${ClasseParMode[partie.mode]}`}>
            <IconeMode taille={13} />
            {modeLabels[partie.mode]}
          </span>
          <span className="carte-partie__joueurs">
            <IconePersonnes taille={14} />
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