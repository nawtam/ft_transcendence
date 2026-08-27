import { Link } from 'react-router-dom'
import { useJoueur } from '../context/JoueurContext.tsx';
import { useMonde } from '../context/MondeContext.tsx';
import '../css/aventure.css';

function Aventure() {
  const { joueur } = useJoueur();
  const { lieux, quetesAventure } = useMonde();

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
              <span className="p-lieuActuel"> Lieu actuel : {joueur.lieuActuel}</span>
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
           <div className="contenu-perso">
                  
                  <div classeName="stat-perso">
                    <div className="stat-force">{joueur.force}
                    <span>Force</span></div>
                    <div className="stat-agilite">{joueur.agilite}
                    <span>Agilité</span></div>
                    <div className="stat-endurance">{joueur.endurance}
                    <span>Endurance</span></div>
                    <div className="stat-intelligent">{joueur.intelligence}
                    <span>Intélligence</span></div>
                  </div>
                  

                  <div className="profil-vitality">
                    <p className="title-pv">Point de vie</p>
                    <p className="profil-pv">{joueur.pv} / {joueur.pvMax}</p>
                    <div className="pv-barre" style={{ width: `${pourcentagePV}%` }}></div>
                    <p className="title-energie">Energie</p>
                    <p className="profil-energie">{joueur.energie} / {joueur.energieMax}</p>
                    <div className="energie-barre" style={{ width: `${pourcentageEN}%` }}></div>
                    </div>

                  <div className= "profil-inventaire">
                  <span className="title-inventaire">inventaire</span>
                  <span className="plus-tard">a faire</span>
                    </div>
                  <div className="lieux">
                <span className="title-lieux">Lieux</span>
                <ul className="liste-lieux">
                  {lieux.map((lieu) => (
                    <li key={lieu.id} className={`lieu-carte ${lieu.decouvert ? "decouvert" : "inconnu"}`}>
                      <span className="lieu-etat"></span>
                      <div className="lieu-infos">
                        <p className="lieu-nom">{lieu.decouvert ? lieu.nom : "????"}</p>
                        <p className="lieu-desc">{lieu.decouvert ? lieu.description : "????"}</p>
                      </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                  <div className="quetes-aventure">
                <span className="title-quetes-aventure">Quêtes</span>
                <ul className="liste-quetes-aventure">
                  {quetesAventure.map((q) => (
                    <li key={q.id} className={`quete-aventure-carte ${q.decouverte ? "decouverte" : "inconnue"}`}>
                      <span className="quete-aventure-etat"></span>
                      <div className="quete-aventure-infos">
          <p className="quete-aventure-titre">
            {q.decouverte ? q.titre : "????"}
            {q.decouverte && <span className={`quete-aventure-type ${q.type}`}>{q.type}</span>}
          </p>
          <p className="quete-aventure-desc">{q.decouverte ? q.description : "????"}</p>
        </div>
      </li>
    ))}
  </ul>
</div>
                    </div>
                  <Link to="/play-Aventure" className="btn-play">Jouer</Link>
        </main>
      </div>
    </div>
  );
}
export default Aventure