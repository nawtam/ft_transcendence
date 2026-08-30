import type { Personnage } from '../context/multi/personnages';
import '../css/multi/Personnagecard.css';

interface PersonnageCardProps {
  personnage: Personnage;
  selectionne: boolean;
  pris: boolean;
  onSelectionner: () => void;
}

export default function PersonnageCard({
  personnage,
  selectionne,
  pris,
  onSelectionner,
}: PersonnageCardProps) {
  return (
    <button
      type="button"
      className={`carte-personnage ${selectionne ? 'carte-personnage--selectionne' : ''} ${
        pris ? 'carte-personnage--pris' : ''
      }`}
      onClick={onSelectionner}
      disabled={pris}
    >
      <span
        className="carte-personnage__portrait"
        style={{ backgroundImage: `url(${personnage.asset})` }}
      />
      <span className="carte-personnage__nom">{personnage.nom}</span>
      <span className="carte-personnage__classe">{personnage.classe}</span>
      {pris && <span className="carte-personnage__pris-label">Pris</span>}
    </button>
  );
}