import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useUniverse } from '../../context/multi/universeContext';
import { getGamesByUniverse, modeLabels } from '../../context/multi/games';
import type { GameMode } from '../../context/multi/games';
import GameCard from '../../composants/GameCard';
import { Search, Plus } from 'lucide-react';
import '../../css/multi/universePage.css';

type FiltreMode = 'tous' | GameMode;

const modesFiltres: { valeur: FiltreMode; label: string }[] = [
  { valeur: 'tous', label: 'Tous les modes' },
  { valeur: 'cooperatif', label: modeLabels.cooperatif },
  { valeur: 'chacunPourSoi', label: modeLabels.chacunPourSoi },
  { valeur: 'equipeVsEquipe', label: modeLabels.equipeVsEquipe },
];


export default function universePage() {
  const universe = useUniverse();
  const [filtre, setFiltre] = useState<FiltreMode>('tous');

  const parties = useMemo(
    () => (universe ? getGamesByUniverse(universe.id) : []),
    [universe],
  );

  const partiesFiltrees = useMemo(
    () => (filtre === 'tous' ? parties : parties.filter((partie) => partie.mode === filtre)),
    [parties, filtre],
  );

  if (!universe) {
    return (
      <div className="page-univers page-univers--introuvable">
        <p>Univers introuvable.</p>
        <Link to="/hub"> ← Retour</Link>
      </div>
    );
  }

  const creerPartie = () => {
    console.log('Créer une partie');
  };

  const rejoindreParCode = () => {
    console.log('Rejoindre une partie par code');
  };

  return (
    <div
      className="page-univers"
      style={{ '--image-fond': `url(${universe.cover})` } as CSSProperties}
    >
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
      <div className="page-univers__contenu">
        <Link to="/hub" className="page-univers__retour">

          ← Retour
        </Link>

        <div className="page-univers__entete">
          <div className="page-univers__titre-bloc">
            <p className="page-univers__label">Univers {universe.nom}</p>
            <h1 className="page-univers__titre">Parties en cours</h1>
            <p className="page-univers__sous-titre">
              {parties.length} table(s) ouverte(s)
            </p>
            <p className="page-univers__sous-titre">
              rejoignez ou créez votre aventure!
            </p>
          </div>

          <div className="page-univers__actions">
            <button type="button" className="bouton-creer" onClick={creerPartie}>
              <Plus></Plus>
              Créer une partie
            </button>
            <button type="button" className="bouton-rejoindre-code" onClick={rejoindreParCode}>
              <Search></Search>
              Rejoindre une partie
            </button>
          </div>
        </div>

        <nav className="page-univers__filtres">
          {modesFiltres.map(({ valeur, label }) => (
            <button
              key={valeur}
              type="button"
              className={`filtre-mode ${filtre === valeur ? 'filtre-mode--actif' : ''}`}
              onClick={() => setFiltre(valeur)}
            >
              {label}
            </button>
          ))}
        </nav>

        {partiesFiltrees.length > 0 ? (
          <div className="page-univers__grille">
            {partiesFiltrees.map((partie) => (
              <GameCard key={partie.gameId} partie={partie} />
            ))}
          </div>
        ) : (
          <p className="page-univers__vide">Aucune partie ne correspond à ce filtre pour le moment.</p>
        )}
      </div>
    </div>
  );
}