import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUniverse } from '../../context/multi/universeContext';
import { getGamesByUniverse, modeLabels } from '../../context/multi/games';
import type { Game, GameMode } from '../../context/multi/games';
import GameCard from '../../composants/GameCard';
import ModaleCreerPartie from '../../composants/ModaleCreerPartie';
import ModaleRejoindrePartie from '../../composants/ModaleRejoindrePartie';
import { ArrowLeft, Plus, Key } from 'lucide-react';
import '../../css/multi/universePage.css';

type FiltreMode = 'tous' | GameMode;
 
const modesFiltres: { valeur: FiltreMode; label: string }[] = [
  { valeur: 'tous', label: 'Tous les modes' },
  { valeur: 'cooperatif', label: modeLabels.cooperatif },
  { valeur: 'chacunPourSoi', label: modeLabels.chacunPourSoi },
  { valeur: 'equipeVsEquipe', label: modeLabels.equipeVsEquipe },
];
 
// NB : le nom de la fonction commence en minuscule pour suivre la convention du
// projet (hub, universePage, lobby, game). Comme l'export est "default", il suffit
// de l'importer avec une majuscule dans App.tsx :
//   import UniversePage from './pages/multi/universePage';
export default function universePage() {
  const universe = useUniverse();
  const navigate = useNavigate();
  const [filtre, setFiltre] = useState<FiltreMode>('tous');
  const [modaleCreerOuverte, setModaleCreerOuverte] = useState(false);
  const [modaleRejoindreOuverte, setModaleRejoindreOuverte] = useState(false);
 
  // Hooks appelés avant le early return (règle des hooks) : `universe` peut être
  // undefined le temps que la vérification ci-dessous s'exécute.
  const [parties, setParties] = useState<Game[]>([]);
  const [chargementParties, setChargementParties] = useState(true);
 
  useEffect(() => {
    if (!universe) return;
    let annule = false;
    setChargementParties(true);
 
    getGamesByUniverse(universe.id).then((liste) => {
      if (!annule) {
        setParties(liste);
        setChargementParties(false);
      }
    });
 
    return () => {
      annule = true;
    };
  }, [universe]);
 
  const partiesFiltrees = useMemo(
    () => (filtre === 'tous' ? parties : parties.filter((partie) => partie.mode === filtre)),
    [parties, filtre],
  );
 
  if (!universe) {
    return (
      <div className="page-univers page-univers--introuvable">
        <p>Univers introuvable.</p>
        <Link to="/hub">Retour aux univers</Link>
      </div>
    );
  }
 
  const creerPartie = () => setModaleCreerOuverte(true);
  const rejoindreParCode = () => setModaleRejoindreOuverte(true);
 
  const surPartieCreee = (game: Game) => {
    setModaleCreerOuverte(false);
    navigate(`/univers/${universe.id}/partie/${game.gameId}`);
  };
 
  const surPartieRejointe = (game: Game) => {
    setModaleRejoindreOuverte(false);
    navigate(`/univers/${game.universeId}/partie/${game.gameId}`);
  };
 
  return (
    <div
      className="page-univers"
      style={{ '--image-fond': `url(${universe.cover})` } as CSSProperties}
    >
      <div className="page-univers__contenu">
        <Link to="/hub" className="page-univers__retour">
          <ArrowLeft size={13} />
          Retour aux univers
        </Link>
 
        <div className="page-univers__entete">
          <div className="page-univers__titre-bloc">
            <p className="page-univers__label">Univers {universe.nom}</p>
            <h1 className="page-univers__titre">Parties en cours</h1>
            <p className="page-univers__sous-titre">
              {parties.length} table(s) ouverte(s) — rejoignez ou créez la vôtre.
            </p>
          </div>
 
          <div className="page-univers__actions">
            <button type="button" className="bouton-creer" onClick={creerPartie}>
              <Plus size={14} />
              Créer une partie
            </button>
            <button type="button" className="bouton-rejoindre-code" onClick={rejoindreParCode}>
              <Key size={14} />
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
 
        {chargementParties ? (
          <p className="page-univers__vide">Chargement des parties…</p>
        ) : partiesFiltrees.length > 0 ? (
          <div className="page-univers__grille">
            {partiesFiltrees.map((partie) => (
              <GameCard key={partie.gameId} partie={partie} />
            ))}
          </div>
        ) : (
          <p className="page-univers__vide">Aucune partie ne correspond à ce filtre pour le moment.</p>
        )}
      </div>
 
      {modaleCreerOuverte && (
        <ModaleCreerPartie
          universeId={universe.id}
          onFermer={() => setModaleCreerOuverte(false)}
          onCreee={surPartieCreee}
        />
      )}
 
      {modaleRejoindreOuverte && (
        <ModaleRejoindrePartie
          onFermer={() => setModaleRejoindreOuverte(false)}
          onRejointe={surPartieRejointe}
        />
      )}
    </div>
  );
}
 