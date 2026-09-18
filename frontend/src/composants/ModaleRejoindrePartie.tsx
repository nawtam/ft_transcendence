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
  const [password, setPassword] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  const valider = async () => {
    if (!code.trim()) return;

    setEnCours(true);
    setErreur('');

    try {
      const game = await rejoindreParCode(code, password.trim() || undefined);

      if (!game) {
        setErreur('Aucune partie ne correspond à ce code.');
        return;
      }

      onRejointe(game);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Impossible de rejoindre.');
    } finally {
      setEnCours(false);
    }
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
          placeholder="ex : game-1789…"
          onKeyDown={(event) => {
            if (event.key === 'Enter') valider();
          }}
        />
      </div>

      <div className="modale__champ">
        <label htmlFor="mdp-rejoindre">Mot de passe (si privée)</label>
        <input
          id="mdp-rejoindre"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Laisser vide si publique"
          onKeyDown={(event) => {
            if (event.key === 'Enter') valider();
          }}
        />
      </div>

      {erreur && <p className="modale__erreur">{erreur}</p>}

      <button
        type="button"
        className="modale__valider"
        onClick={valider}
        disabled={!code.trim() || enCours}
      >
        {enCours ? 'Recherche…' : 'Rejoindre'}
      </button>
    </Modale>
  );
}