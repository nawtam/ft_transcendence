import { useState } from 'react';
import '../css/multi/Repartitionstats.css';

interface Attribut {
  cle: string;
  nom: string;
  base: number;
}

const ATTRIBUTS: Attribut[] = [
  { cle: 'force', nom: 'Force', base: 10 },
  { cle: 'agilite', nom: 'Agilité', base: 5 },
  { cle: 'intelligence', nom: 'Intelligence', base: 5 },
];

const POINTS_DISPONIBLES = 5;
const BONUS_MAX_PAR_ATTRIBUT = 3;

// NB : purement local pour l'instant (pas de back). La répartition finale n'est
// pas encore remontée à useLobby/useLobbyContext — à brancher plus tard si elle
// doit être visible par les autres joueurs ou envoyée au serveur.
export default function RepartitionStats() {
  const [bonus, setBonus] = useState<Record<string, number>>(
    Object.fromEntries(ATTRIBUTS.map((attribut) => [attribut.cle, 0])),
  );

  const pointsUtilises = Object.values(bonus).reduce((total, valeur) => total + valeur, 0);
  const pointsRestants = POINTS_DISPONIBLES - pointsUtilises;

  const modifier = (cle: string, delta: number) => {
    setBonus((precedent) => {
      const valeurActuelle = precedent[cle];
      const nouvelleValeur = valeurActuelle + delta;

      if (nouvelleValeur < 0 || nouvelleValeur > BONUS_MAX_PAR_ATTRIBUT) return precedent;
      if (delta > 0 && pointsRestants <= 0) return precedent;

      return { ...precedent, [cle]: nouvelleValeur };
    });
  };

  return (
    <div className="repartition-stats">
      <div className="repartition-stats__entete">
        <p className="repartition-stats__titre">Affiner les statistiques</p>
        <span className="repartition-stats__points">
          {pointsUtilises}/{POINTS_DISPONIBLES} points — +{BONUS_MAX_PAR_ATTRIBUT} par attribut
        </span>
      </div>

      {ATTRIBUTS.map((attribut) => (
        <div key={attribut.cle} className="repartition-stats__ligne">
          <span className="repartition-stats__nom">{attribut.nom}</span>
          <div className="repartition-stats__controle">
            <button
              type="button"
              onClick={() => modifier(attribut.cle, -1)}
              disabled={bonus[attribut.cle] === 0}
            >
              −
            </button>
            <span className="repartition-stats__valeur">{attribut.base + bonus[attribut.cle]}</span>
            <button
              type="button"
              onClick={() => modifier(attribut.cle, 1)}
              disabled={bonus[attribut.cle] === BONUS_MAX_PAR_ATTRIBUT || pointsRestants === 0}
            >
              +
            </button>
          </div>
          <span className="repartition-stats__base">(base {attribut.base})</span>
        </div>
      ))}
    </div>
  );
}