import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUniverse } from '../../context/multi/universeContext';
import { getGameById, modeLabels, modeDescriptions } from '../../context/multi/games';
import { getPersonnagesByUniverse } from '../../context/multi/Personnages';
import type { Personnage } from '../../context/multi/Personnages';
import { useLobby, ID_JOUEUR_LOCAL } from '../../context/multi/lobbyContext';
import JoueurCard from '../../composants/Joueurcard';
import PersonnageCard from '../../composants/Personnagecard';
import ChatBox from '../../composants/Chatbox';
import RepartitionStats from '../../composants/Repartitionstats';
import '../../css/multi/lobby.css';

// NB : nom de fonction en minuscule par convention (voir universePage.tsx),
// à importer avec une majuscule dans App.tsx.
export default function lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const universe = useUniverse();
  const navigate = useNavigate();
  const { joueurs, messages, envoyerMessage, basculerPret, choisirPersonnage } = useLobby();
 
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [chargementGame, setChargementGame] = useState(true);
 
  useEffect(() => {
    if (!gameId) {
      setChargementGame(false);
      return;
    }
    let annule = false;
    setChargementGame(true);
 
    getGameById(gameId).then((resultat) => {
      if (!annule) {
        setGame(resultat);
        setChargementGame(false);
      }
    });
 
    return () => {
      annule = true;
    };
  }, [gameId]);
 
  const [personnagesDisponibles, setPersonnagesDisponibles] = useState<Personnage[]>([]);
  const [chargementPersonnages, setChargementPersonnages] = useState(true);
 
  useEffect(() => {
    if (!universe) return;
    let annule = false;
    setChargementPersonnages(true);
 
    getPersonnagesByUniverse(universe.id).then((liste) => {
      if (!annule) {
        setPersonnagesDisponibles(liste);
        setChargementPersonnages(false);
      }
    });
 
    return () => {
      annule = true;
    };
  }, [universe]);
 
  if (chargementGame) {
    return (
      <div className="page-lobby page-lobby--introuvable">
        <p>Chargement de la partie…</p>
      </div>
    );
  }
 
  if (!universe || !game) {
    return (
      <div className="page-lobby page-lobby--introuvable">
        <p>Partie introuvable.</p>
        <Link to="/hub">Retour aux univers</Link>
      </div>
    );
  }
 
  const vous = joueurs.find((joueur) => joueur.id === ID_JOUEUR_LOCAL);
  const nombrePrets = joueurs.filter((joueur) => joueur.pret).length;
  const tousPrets = joueurs.length >= game.joueursMax && nombrePrets === joueurs.length;
 
  const basculerMonStatut = () => basculerPret(ID_JOUEUR_LOCAL);
 
  const lancerLaPartie = () => {
    if (!tousPrets) return;
    navigate(`/univers/${universe.id}/partie/${game.gameId}/jouer`);
  };
 
  return (
    <div
      className="page-lobby"
      style={{ '--image-fond': `url(${universe.cover})` } as CSSProperties}
    >
      <div className="page-lobby__contenu">
        <header className="page-lobby__entete">
          <h1 className="page-lobby__titre-univers">{universe.nom}</h1>
          <p className="page-lobby__ambiance">« {universe.ambiance} »</p>
        </header>
 
        <div className="page-lobby__grille">
          <section className="panneau-briefing">
            <p className="panneau-briefing__label">Briefing de l'IA</p>
            <h2 className="panneau-briefing__titre">{game.titre}</h2>
            <p className="panneau-briefing__narration">« {game.narration} »</p>
 
            <div className="panneau-briefing__recompenses">
              <span>
                Récompense : <strong>{game.recompensePA} PA</strong> · <strong>{game.recompenseXP} XP</strong>
              </span>
              <span className="panneau-briefing__difficulte">Difficulté {game.difficulte}/5</span>
            </div>
 
            <details className="panneau-briefing__info">
              <summary>Comment sont calculées ces récompenses ?</summary>
              <p>Basées sur la difficulté de la partie et le temps de jeu estimé.</p>
            </details>
 
            <div className="panneau-briefing__section">
              <p className="panneau-briefing__sous-titre">Mode de jeu</p>
              <div className="mode-fige">
                <p className="mode-fige__nom">{modeLabels[game.mode]}</p>
                <p className="mode-fige__description">{modeDescriptions[game.mode]}</p>
              </div>
            </div>
 
            <div className="panneau-briefing__section">
              <p className="panneau-briefing__sous-titre">Personnage prédéfini</p>
              <div className="grille-personnages">
                {chargementPersonnages ? (
                  <p className="panneau-briefing__chargement">Chargement des personnages…</p>
                ) : (
                  personnagesDisponibles.map((personnage) => {
                    const pris = joueurs.some(
                      (joueur) => joueur.id !== ID_JOUEUR_LOCAL && joueur.personnageId === personnage.id,
                    );
                    return (
                      <PersonnageCard
                        key={personnage.id}
                        personnage={personnage}
                        selectionne={vous?.personnageId === personnage.id}
                        pris={pris}
                        onSelectionner={() =>
                          choisirPersonnage(ID_JOUEUR_LOCAL, personnage.id, personnage.classe)
                        }
                      />
                    );
                  })
                )}
              </div>
            </div>
 
            <div className="panneau-briefing__section">
              <RepartitionStats />
            </div>
          </section>
 
          <aside className="panneau-joueurs">
            <div className="panneau-joueurs__entete">
              <p className="panneau-joueurs__label">Joueurs</p>
              <span className="panneau-joueurs__compte">
                {nombrePrets}/{joueurs.length} prêts
              </span>
            </div>
 
            <div className="panneau-joueurs__barre">
              <div
                className="panneau-joueurs__progression"
                style={{ width: `${(nombrePrets / joueurs.length) * 100}%` }}
              />
            </div>
 
            <div className="panneau-joueurs__liste">
              {joueurs.map((joueur) => (
                <JoueurCard key={joueur.id} joueur={joueur} estHote={joueur.pseudo === game.hote} />
              ))}
            </div>
 
            <ChatBox messages={messages} onEnvoyer={envoyerMessage} />
 
            <button type="button" className="bouton-pret" onClick={basculerMonStatut}>
              {vous?.pret ? 'Rengainer' : 'Dégainer'}
            </button>
 
            <button
              type="button"
              className="bouton-lancer"
              onClick={lancerLaPartie}
              disabled={!tousPrets}
            >
              {tousPrets ? 'Lancer la partie' : `En attente (${nombrePrets}/${joueurs.length})`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
 