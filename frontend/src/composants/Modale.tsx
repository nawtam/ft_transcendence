import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import '../css/multi/Modale.css';

interface ModaleProps {
  titre: string;
  onFermer: () => void;
  children: ReactNode;
}

export default function Modale({ titre, onFermer, children }: ModaleProps) {
  return (
    <div className="modale__fond" onClick={onFermer}>
      <div className="modale__boite" onClick={(event) => event.stopPropagation()}>
        <div className="modale__entete">
          <h2 className="modale__titre">{titre}</h2>
          <button type="button" className="modale__fermer" onClick={onFermer} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}