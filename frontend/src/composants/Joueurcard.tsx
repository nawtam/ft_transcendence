import type { LobbyPlayer } from '../context/multi/lobbyContext';
import '../css/multi/Joueurcard.css';

interface JoueurCardProps {
  joueur: LobbyPlayer;
  estHote?: boolean;
}

export default function JoueurCard({ joueur, estHote = false }: JoueurCardProps) {
  const initiale = joueur.pseudo.charAt(0).toUpperCase();

  return (
    <div className="carte-joueur">
      <span className="carte-joueur__avatar">{initiale}</span>
      <div className="carte-joueur__infos">
        <p className="carte-joueur__pseudo">
          {joueur.pseudo}
          {estHote && (
            <span className="carte-joueur__couronne" title="Hôte">
              👑
            </span>
          )}
        </p>
        <p className="carte-joueur__classe">{joueur.classe || 'Personnage non choisi'}</p>
      </div>
      <span className={`carte-joueur__statut ${joueur.pret ? 'carte-joueur__statut--pret' : ''}`}>
        {joueur.pret ? '✓ Prêt' : 'En attente'}
      </span>
    </div>
  );
}