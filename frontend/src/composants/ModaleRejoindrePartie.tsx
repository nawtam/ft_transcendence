import { useState } from 'react';
import Modale from './Modale';
import { rejoindreParCode } from '../context/multi/games';
import type { Game } from '../context/multi/games';

interface ModaleRejoindrePartieProps {
  onFermer: () => void;
  onRejointe: (game: Game) => void;
}

export default function ModaleRejoindrePartie({ onFermer, onRejointe }: ModaleRejoindrePartieProps) {
  const [code, setCode] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const valider = async () => {
    if (!code.trim()) return;
    setEnCours(true);
    setErreur('');

    const game = await rejoindreParCode(code);

    setEnCours(false);

    if (!game) {
      setErreur('Aucune partie ne correspond à ce code.');
      return;
    }

    onRejointe(game);
  };

  return (
    <Modale titre="Rejoindre une partie" onFermer={onFermer}>
      <div className="modale__champ">
        <label htmlFor="code-partie">Code de la partie</label>
        <input
          id="code-partie"
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="ex : trahison-blackreach"
          onKeyDown={(event) => {
            if (event.key === 'Enter') valider();
          }}
        />
      </div>

      {erreur && <p className="modale__erreur">{erreur}</p>}

      <button type="button" className="modale__valider" onClick={valider} disabled={!code.trim() || enCours}>
        {enCours ? 'Recherche…' : 'Rejoindre'}
      </button>
    </Modale>
  );
}