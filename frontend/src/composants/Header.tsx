import { Coins, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom'
import '../css/Header.css';

interface Joueur {
  pseudo: string;
  niveau: number;
  classe: string;
  xpActuel: number;
  xpTotal: number;
  or: number;
  mana: number;
  manaMax: number;
  rank: string;
}

interface HeaderProps {
  joueur: Joueur;
}

function Header({ joueur }: HeaderProps) {
  const pourcentageXP = (joueur.xpActuel / joueur.xpTotal) * 100;
  const [menuOuvert, setMenuOuvert] = useState(false);
  return (
    <header className="header-connecte">
      <span className="site-name">Transcendence</span>

      <div className="header-right">
        <div className="header-stats">
          <span className="stat-item">
            <Coins className="stat-icon stat-icon-gold" />
            {joueur.or}
          </span>
          <span className="stat-divider"></span>
          <span className="stat-item">
            <FlaskConical className="stat-icon stat-icon-mana" />
            {joueur.mana}/{joueur.manaMax}
          </span>
        </div>

        <div className="header-player" onClick={() => setMenuOuvert(!menuOuvert)}>
          <div className="avatar-wrapper">
            <div className="avatar">{joueur.pseudo.charAt(0).toUpperCase()}</div>
            <div className="level-badge">Niv. {joueur.niveau}</div>
            {menuOuvert && (
             <div className="dropdown-menu">
            <Link to="/Profil" className="dropdown-item">Mon profil</Link>
            <Link to="/Parametre" className="dropdown-item">Paramètres</Link>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item dropdown-item-danger">Déconnexion</button>
            </div>
)}
          </div>

          <div className="player-info">
            <span className="player-pseudo">{joueur.pseudo}</span>
            <span className="player-classe">{joueur.classe}</span>
            <div className="player-xp-row">
              <div className="xp-barre-fond">
                <div className="xp-barre-remplie" style={{ width: `${pourcentageXP}%` }}></div>
              </div>
              <span className="xp-text">{joueur.xpActuel}/{joueur.xpTotal} XP</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
