import { useState } from 'react';
import Modale from './Modale';
import { creerPartie, modeLabels } from '../context/multi/games';
import type { Game, GameMode, GameVisibility } from '../context/multi/games';

interface ModaleCreerPartieProps {
  universeId: string;
  onFermer: () => void;
  onCreee: (game: Game) => void;
}

const MODES: GameMode[] = ['cooperatif', 'chacunPourSoi', 'equipeVsEquipe'];

export default function ModaleCreerPartie({ universeId, onFermer, onCreee }: ModaleCreerPartieProps) {
  const [titre, setTitre] = useState('');
  const [mode, setMode] = useState<GameMode>('cooperatif');
  const [visibilite, setVisibilite] = useState<GameVisibility>('public');
  const [joueursMax, setJoueursMax] = useState(4);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    if (!titre.trim()) return;
    setEnCours(true);

    const game = await creerPartie(universeId, {
      titre: titre.trim(),
      mode,
      visibilite,
      joueursMax,
    });

    setEnCours(false);
    onCreee(game);
  };

  return (
    <Modale titre="Créer une partie" onFermer={onFermer}>
      <div className="modale__champ">
        <label htmlFor="titre-partie">Titre</label>
        <input
          id="titre-partie"
          type="text"
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          placeholder="Le nom de votre partie…"
        />
      </div>

      <div className="modale__champ">
        <label htmlFor="mode-partie">Mode</label>
        <select
          id="mode-partie"
          value={mode}
          onChange={(event) => setMode(event.target.value as GameMode)}
        >
          {MODES.map((valeur) => (
            <option key={valeur} value={valeur}>
              {modeLabels[valeur]}
            </option>
          ))}
        </select>
      </div>

      <div className="modale__champ">
        <label>Visibilité</label>
        <div className="modale__visibilite">
          <button
            type="button"
            className={visibilite === 'public' ? 'actif' : ''}
            onClick={() => setVisibilite('public')}
          >
            Public
          </button>
          <button
            type="button"
            className={visibilite === 'prive' ? 'actif' : ''}
            onClick={() => setVisibilite('prive')}
          >
            Privé
          </button>
        </div>
      </div>

      <div className="modale__champ">
        <label htmlFor="joueurs-max">Joueurs max</label>
        <input
          id="joueurs-max"
          type="number"
          min={2}
          max={8}
          value={joueursMax}
          onChange={(event) => setJoueursMax(Number(event.target.value))}
        />
      </div>

      <button type="button" className="modale__valider" onClick={valider} disabled={!titre.trim() || enCours}>
        {enCours ? 'Création…' : 'Créer la partie'}
      </button>
    </Modale>
  );
}