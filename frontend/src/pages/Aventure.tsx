import { Link } from 'react-router-dom'
import { useJoueur } from '../context/JoueurContext.tsx';
import '../css/aventure.css';

function Aventure() {
  const { joueur } = useJoueur();

  const pourcentagePV = (joueur.pv / joueur.pvMax) * 100;
  const pourcentageEN = (joueur.energie / joueur.energieMax) * 100;
  const pourcentageXP = (joueur.xpActuel / joueur.xpTotal) * 100;

  return (
    <div>
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
      <div className="p-page">
        <Link to="/" className="btn-retour">← Retour</Link>

        <main className="box-main">
          <div className="p-player-info">
            <div className="p-avatar-wrapper">
              <span className="p-stat-or">{joueur.or} Or</span>
              <span className="p-stat-action">{joueur.action} Points d'action</span>
              <span className="p-player-rank">{joueur.rank}</span>
              <div className="p-avatar">{joueur.pseudo.charAt(0).toUpperCase()}</div>
              <div className="p-level-badge">Niv. {joueur.niveau}</div>
            </div>

            <span className="p-player-pseudo">{joueur.pseudo}</span>
            <span className="p-player-classe">{joueur.classe}</span>

            <div className="p-player-xp-row">
              <div className="p-xp-barre-fond">
                <div className="p-xp-barre-remplie" style={{ width: `${pourcentageXP}%` }}></div>
              </div>
            </div>

            <div className="profil-txt-xp">
              <span className="p-xp-text">Expérience</span>
              <span className="p-xp-text">{joueur.xpActuel}/{joueur.xpTotal}</span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
export default Aventure