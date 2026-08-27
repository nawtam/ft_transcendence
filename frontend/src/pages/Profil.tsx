import { useState } from "react";
import { Link } from 'react-router-dom'
import '../css/profil/refs.css';
import '../css/profil/page.css';
import '../css/profil/banner.css';
import '../css/profil/solo.css';
import '../css/profil/multi.css';
import '../css/profil/succes.css';
import '../css/profil/quetes.css';


interface Joueur {
  pseudo: string;
  niveau: number;
  classe: string;
  xpActuel: number;
  xpTotal: number;
  or: number;
  action: number;
  actionMax: number;
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

interface Parties {
  univers: string,
  mode: string,
  perso: string,
  resultat: string,
}

interface Succes {
  id: string;
  titre: string;
  rarete: "Commun" | "Rare" | "Épique" | "Légendaire";
  categorie: string;
  debloque: boolean;
  description: string;
  progression?: { actuel: number; but: number };
}


interface Quete {
  id: string;
  nom: string;
  description: string;
  pa: number;
  xp: number;
  actuel: number;
  but: number;
}

  const questesJournalieres: Quete[] = [
  { id: "qj1", nom: "Souffle quotidien", description: "Se connecter et réclamer le coffre journalier.", pa: 2, xp: 50, actuel: 1, but: 1 },
  { id: "qj2", nom: "Compagnon d'armes", description: "Terminer 1 partie multijoueur.", pa: 3, xp: 120, actuel: 1, but: 1 },
  { id: "qj3", nom: "Fil narratif", description: "Faire 5 choix narratifs en solo.", pa: 2, xp: 80, actuel: 3, but: 5 },
  { id: "qj4", nom: "Main chanceuse", description: "Réussir 3 jets de dés.", pa: 2, xp: 60, actuel: 1, but: 3 },
];
 
const questesHebdomadaires: Quete[] = [
  { id: "qh1", nom: "Tour des mondes", description: "Jouer une partie dans 3 univers différents.", pa: 8, xp: 400, actuel: 2, but: 3 },
  { id: "qh2", nom: "Vétéran de l'arène", description: "Remporter 5 parties multijoueur.", pa: 10, xp: 600, actuel: 3, but: 5 },
  { id: "qh3", nom: "Archiviste", description: "Collecter 4 objets d'histoire.", pa: 6, xp: 300, actuel: 1, but: 4 },
];


function GroupeQuetes({ titre, quetes }: { titre: string; quetes: Quete[] }) {
  return (
    <div className="groupe-quetes">
      <h3 className="titre-groupe-quetes">{titre}</h3>
      <ul className="liste-quetes">
        {quetes.map((q) => {
          const terminee = q.actuel >= q.but;
          const pourcentage = Math.min(100, (q.actuel / q.but) * 100);
          return (
            <li key={q.id} className={`quete-carte ${terminee ? "terminee" : ""}`}>
              <div className="quete-entete">
                <div className="quete-texte">
                  <p className="quete-nom">{q.nom}</p>
                  <p className="quete-desc">{q.description}</p>
                </div>
                <div className="quete-recompenses">
                  <span className="recompense-pa">{q.pa} PA</span>
                  <span className="recompense-xp">{q.xp} XP</span>
                </div>
              </div>
              <div className="quete-progression">
                <div className="quete-progression-barre-fond">
                  <div
                    className="quete-progression-barre"
                    style={{ width: `${pourcentage}%` }}
                  ></div>
                </div>
                <span className="quete-progression-texte">
                  {q.actuel} / {q.but}
                </span>
                {terminee && <span className="quete-terminee-icone"></span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Profil() {
  const [joueur, setJoueur] = useState<Joueur>({
    pseudo: "NONO",
    niveau: 67,
    classe: "chat noir",
    xpActuel: 100,
    xpTotal: 667,
    or: 2026,
    action: 80,
    actionMax: 100,
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

  const parties: Parties[] = [
  { univers: "cyberpunk", mode: "Coop", perso: "barman", resultat: "Victoire"},
  { univers: "Médiéval", mode: "TeamVsTeam", perso: "Garde", resultat: "Défaite"},
  { univers: "Fantastique", mode: "coop", perso: "Sorcier", resultat: "Victoire"},
  { univers: "Pirate", mode: "Solo", perso: "Capitaine", resultat: "Victoire"},

];

  const pourcentagePV = (joueur.pv / joueur.pvMax) * 100;
  const pourcentageEN = (joueur.energie / joueur.energieMax) * 100;
  const pourcentageXP = (joueur.xpActuel / joueur.xpTotal) * 100;
  const [ongletActif, setOngletActif] = useState('perso')
  
  const succesCategories = ["Tous", "Aventure", "Multijoueur", "Exploration", "Collection", "Maîtrise"];
  const succesListe: Succes[] = [
    { id: "s1", titre: "Premier Souffle", rarete: "Commun", categorie: "Exploration", debloque: true, description: "" },
    { id: "s2", titre: "Éveil des Runes", rarete: "Commun", categorie: "Aventure", debloque: true, description: "" },
    { id: "s3", titre: "Marcheur d'Ombres", rarete: "Commun", categorie: "Aventure", debloque: true, description: "" },
    { id: "s4", titre: "Porteur de Lumière", rarete: "Commun", categorie: "Aventure", debloque: true, description: "" },
    { id: "s5", titre: "Voix du Destin", rarete: "Rare", categorie: "Aventure", debloque: true, description: "" },
    { id: "s6", titre: "Chasseur de Dragons", rarete: "Épique", categorie: "Aventure", debloque: false, description: "Vaincre le Dragon Céleste en Fantastique.", progression: { actuel: 0, but: 1 } },
    { id: "s7", titre: "Élu du Voile", rarete: "Légendaire", categorie: "Aventure", debloque: false, description: "Débloquer la fin secrète d'une campagne." },
    { id: "s8", titre: "Effet Domino", rarete: "Épique", categorie: "Aventure", debloque: false, description: "Obtenir 3 fins alternatives différentes.", progression: { actuel: 1, but: 3 } },
    { id: "s9", titre: "Chroniqueur", rarete: "Rare", categorie: "Aventure", debloque: false, description: "Terminer 10 épisodes solo.", progression: { actuel: 4, but: 10 } },
  ];

  const [categorieActive, setCategorieActive] = useState("Tous");
  const [seulementADebloquer, setSeulementADebloquer] = useState(false);
  
  const succesFiltres = succesListe.filter(
    (s) =>
      (categorieActive === "Tous" || s.categorie === categorieActive) &&
      (!seulementADebloquer || !s.debloque)
  );
  
  const nbDebloques = succesListe.filter((s) => s.debloque).length;
  const pourcentageSucces = Math.round((nbDebloques / succesListe.length) * 100);

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

          <div className="barre-onglets">
            <div className="section-perso" onClick={() => setOngletActif('perso')}>
                Solo
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
                    <div className="stat-multi">
                      <div className="palmares">
                        <h2>Palmarès</h2>
                        <div className="victoires">
                          <span>Victoires</span>
                          </div>
                        <div className="Defaites">
                          <span>Défaites</span>
                          </div>
                        <div className="heures-de-jeu">
                          <span>Heures</span>
                          </div>
                        </div>

                        <section className="Historique">
                          <h2 className="title-historique">Historique</h2>
                          <ul className="multi-historique">
                          {parties.map((partie, index) => (
                          <li key={index} className="multi-partie">
                          <span className="multi-univers">{partie.univers}</span>
                          <span className="p-perso">{partie.perso}</span>
                          <span className="p-mode">{partie.mode}</span>
                          <span className={`multi-resultat ${partie.resultat === "Victoire" ? "Victoire" : "Défaite"}`}>
                            {partie.resultat}
                          </span>
                          </li>
                            ))}
                          </ul>

                        </section>
                      </div>
                  }</div>
              )}
              
              {ongletActif === 'succes' && (
                <div className="contenu-succes">
                  <div className="succes-header">
                    <h2>Succès</h2>
                    <span className="succes-compteur">
                      {nbDebloques} / {succesListe.length} débloqués — {pourcentageSucces}%
                    </span>
                  </div>
              
                  <div className="succes-barre-fond">
                    <div className="succes-barre" style={{ width: `${pourcentageSucces}%` }}></div>
                  </div>
              
                  <div className="succes-filtres">
                    {succesCategories.map((cat) => (
                      <button
                        key={cat}
                        className={`succes-filtre ${categorieActive === cat ? "actif" : ""}`}
                        onClick={() => setCategorieActive(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                    <button
                      className={`succes-toggle ${seulementADebloquer ? "actif" : ""}`}
                      onClick={() => setSeulementADebloquer(!seulementADebloquer)}
                    >
                      À débloquer
                    </button>
                  </div>
              
                  <ul className="succes-grille">
                    {succesFiltres.map((s) => (
                      <li key={s.id} className={`succes-carte ${s.debloque ? "debloque" : "verrouille"}`}>
                        <span className="succes-etat"></span>
                        <div className="succes-infos">
                          <p className="succes-titre">
                            {s.titre} <span className={`succes-rarete ${s.rarete}`}>{s.rarete}</span>
                          </p>
                          <p className="succes-desc">{s.debloque ? "Débloqué" : s.description}</p>
                          {!s.debloque && s.progression && (
                            <div className="succes-progression">
                              <div className="succes-progression-barre-fond">
                                <div
                                  className="succes-progression-barre"
                                  style={{ width: `${(s.progression.actuel / s.progression.but) * 100}%` }}
                                ></div>
                              </div>
                              <span className="succes-progression-texte">
                                {s.progression.actuel} / {s.progression.but}
                              </span>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {ongletActif === 'quetes' && (
                <div className="contenu-quetes">
                  <div className="quetes-header">
                    <h2>Quêtes &amp; défis</h2>
                    <span className="quetes-reset">Réinitialisation dans 6h</span>
                  </div>
                  <GroupeQuetes titre="Défis journaliers" quetes={questesJournalieres} />
                  <GroupeQuetes titre="Défis hebdomadaires" quetes={questesHebdomadaires} />
                </div>
              )}
            </div>
      
      </main>
      </div>
      </div>

    
);
}

export default Profil