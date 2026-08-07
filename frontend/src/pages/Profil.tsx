import { useState } from "react";
import { Link } from 'react-router-dom'
import '../css/Profil.css'
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
  force: number;
  agilite: number;
  endurance: number;
  intelligence: number;
  pv: number;
  pvMax: number;
  energie: number;
  energieMax: number;
}

function Profil() {
  const [joueur, setJoueur] = useState<Joueur>({
    pseudo: "NONO",
    niveau: 67,
    classe: "chat noir",
    xpActuel: 100,
    xpTotal: 667,
    or: 2026,
    mana: 80,
    manaMax: 100,
    rank: "Or II",
    force: 42,
    agilite: 58,
    endurance: 67,
    intelligence: 74,
    pv: 780,
    energie: 420,
    pvMax: 1000,
    energieMax: 1000,
  });
  const pourcentagePV = (joueur.pv / joueur.pvMax) * 100;
  const pourcentageEN = (joueur.energie / joueur.energieMax) * 100;
  const pourcentageXP = (joueur.xpActuel / joueur.xpTotal) * 100;
  const [ongletActif, setOngletActif] = useState('perso')


return (
    <div>
      <header className="header">
        <span className="Transcendence">Transcendence</span>
      </header>
      <div className="page">
        <Link to="/" className="btn-retour">← Retour</Link>


      <main className="box-main">

        <div className="player-info">

        
          <div className="avatar-wrapper">
              <span className="player-rank">{joueur.rank}</span>
              <div className="avatar">{joueur.pseudo.charAt(0).toUpperCase()}</div>
              <div className="level-badge">Niv. {joueur.niveau}</div>
          </div>
          
          <span className="player-pseudo">{joueur.pseudo}</span>
          <span className="player-classe">{joueur.classe}</span>
          
          <div className="player-xp-row">
          <div className="xp-barre-fond">
          <div className="xp-barre-remplie" style={{ width: `${pourcentageXP}%` }}></div>
          </div>
          </div>

          <div className="profil-txt-xp">
          <span className="xp-text">Expérience</span>
          <span className="xp-text">{joueur.xpActuel}/{joueur.xpTotal}</span>
          </div>

        </div>

          <div className="barre-onglets">
            <div className="section-perso" onClick={() => setOngletActif('perso')}>
                Personnage
              </div>
            <div className="section-multi" onClick={() => setOngletActif('multi')}>
                Multijoueur
              </div>
            <div className="section-succes" onClick={() => setOngletActif('succes')}>
                Succès
              </div>
            <div className="section-quetes" onClick={() => setOngletActif('quetes')}>
                Quêtes
              </div>
            </div>

          <div className="zone-contenu">
              {ongletActif === 'perso' && (
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

                </div>
                  
                  
              )}
              {ongletActif === 'multi' && (
                <div className="contenu-multi">
                  {
                  <span> multi </span>
                  }</div>
              )}
              {ongletActif === 'succes' && (
                <div className="contenu-succes">
                  {
                    <span> succes </span>
                  }</div>
              )}
              {ongletActif === 'quetes' && (
                <div className="contenu-quetes">
                  {
                  <span> quetes </span>
                  }</div>
              )}
            </div>
      
      </main>
      </div>
      </div>

    
);
}

export default Profil