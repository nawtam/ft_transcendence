<<<<<<< Updated upstream
import { useEffect, useState } from 'react';
=======
import { useEffect, useRef, useState } from 'react';
>>>>>>> Stashed changes
import type { CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUniverse } from '../../context/multi/universeContext';
import { getGameById, modeLabels, modeDescriptions } from '../../context/multi/games';
import type { Game } from '../../context/multi/games';
import { getPersonnagesByUniverse } from '../../context/multi/Personnages';
import type { Personnage } from '../../context/multi/Personnages';
import { useLobby } from '../../context/multi/lobbyContext';
<<<<<<< Updated upstream
=======
import type { LobbyStatePayload } from '../../context/multi/lobbyContext';
>>>>>>> Stashed changes
import { getMoi } from '../../context/authSession';
import JoueurCard from '../../composants/Joueurcard';
import PersonnageCard from '../../composants/Personnagecard';
import ChatBox from '../../composants/Chatbox';
import RepartitionStats from '../../composants/Repartitionstats';
import '../../css/multi/lobby.css';

export default function lobby() {
  const { gameId } = useParams<{ gameId: string }>();
  const universe = useUniverse();
  const navigate = useNavigate();
<<<<<<< Updated upstream
  const { joueurs, messages, envoyerMessage, basculerPret, choisirPersonnage, synchroniserJoueurs } = useLobby();
=======
  const { joueurs, messages, appliquerLobbyState, ajouterLobbyChat } = useLobby();
>>>>>>> Stashed changes

  const [monId, setMonId] = useState<string | null>(null);
  const [sessionPrête, setSessionPrête] = useState(false);
  const [game, setGame] = useState<Game | undefined>(undefined);
  const [chargementGame, setChargementGame] = useState(true);
  const [wsStatut, setWsStatut] = useState('Connexion lobby…');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let annule = false;
    getMoi()
      .then((moi) => {
        if (!annule) setMonId(moi.id);
      })
      .catch(() => {
        if (!annule) setMonId(null);
      })
      .finally(() => {
        if (!annule) setSessionPrête(true);
      });
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (!gameId || !monId) {
      if (!gameId) setChargementGame(false);
      return;
    }
    let annule = false;
    setChargementGame(true);

    getGameById(gameId).then((resultat) => {
      if (!annule) {
        setGame(resultat);
<<<<<<< Updated upstream
        if (resultat) {
          synchroniserJoueurs(resultat.playerIds, monId);
        }
=======
>>>>>>> Stashed changes
        setChargementGame(false);
      }
    });

    return () => {
      annule = true;
    };
  }, [gameId, monId]);

<<<<<<< Updated upstream
=======
  useEffect(() => {
    if (!gameId || !monId) return;

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/api/game?gameId=${encodeURIComponent(gameId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatut('Lobby sync');
      ws.send(JSON.stringify({ type: 'lobby_sync' }));
    };
    ws.onclose = () => setWsStatut('Lobby déconnecté');
    ws.onerror = () => setWsStatut('Erreur lobby WS');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.type === 'error') {
          setWsStatut(data.text || 'Erreur lobby');
          return;
        }
        if (data.type === 'lobby_state') {
          appliquerLobbyState(data as LobbyStatePayload, monId);
          return;
        }
        if (data.type === 'lobby_chat') {
          ajouterLobbyChat(data, monId);
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId, monId]);

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  const envoyerWs = (payload: object) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(payload));
  };

>>>>>>> Stashed changes
  if (!sessionPrête || chargementGame) {
    return (
      <div className="page-lobby page-lobby--introuvable">
        <p>Chargement de la partie…</p>
      </div>
    );
  }

  if (!monId) {
    return (
      <div className="page-lobby page-lobby--introuvable">
        <p>Connecte-toi pour entrer dans le lobby.</p>
        <Link to="/connexion">Connexion</Link>
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

  const vous = joueurs.find((joueur) => joueur.id === monId);
  const nombrePrets = joueurs.filter((joueur) => joueur.pret).length;
  const placesMax = game.joueursMax;
  const minimumPourLancer = game.mode === 'solo' ? 1 : 2;
<<<<<<< Updated upstream

=======
>>>>>>> Stashed changes
  const presentsPrets = joueurs.length > 0 && nombrePrets === joueurs.length;
  const assezDeJoueurs = joueurs.length >= minimumPourLancer;
  const estHote = monId === game.hote;
  const peutLancer = estHote && presentsPrets && assezDeJoueurs;

<<<<<<< Updated upstream
  const basculerMonStatut = () => basculerPret(monId);
=======
  const basculerMonStatut = () => {
    envoyerWs({ type: 'lobby_ready', ready: !vous?.pret });
  };

  const choisirPerso = (personnageId: string, classe: string) => {
    envoyerWs({ type: 'lobby_pick', personnageId, classe });
  };

  const envoyerMessage = (texte: string) => {
    envoyerWs({ type: 'lobby_chat', text: texte });
  };
>>>>>>> Stashed changes

  const lancerLaPartie = () => {
    if (!peutLancer) return;
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
          <p>{wsStatut}</p>
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
                      (joueur) => joueur.id !== monId && joueur.personnageId === personnage.id,
                    );
                    return (
                      <PersonnageCard
                        key={personnage.id}
                        personnage={personnage}
                        selectionne={vous?.personnageId === personnage.id}
                        pris={pris}
<<<<<<< Updated upstream
                        onSelectionner={() =>
                          choisirPersonnage(monId, personnage.id, personnage.classe)
                        }
=======
                        onSelectionner={() => choisirPerso(personnage.id, personnage.classe)}
>>>>>>> Stashed changes
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
                {joueurs.length}/{placesMax} joueurs · {nombrePrets} prêts
              </span>
            </div>

            <div className="panneau-joueurs__barre">
              <div
                className="panneau-joueurs__progression"
                style={{
                  width: `${placesMax === 0 ? 0 : (joueurs.length / placesMax) * 100}%`,
                }}
              />
            </div>

            <div className="panneau-joueurs__liste">
              {joueurs.map((joueur) => (
                <JoueurCard key={joueur.id} joueur={joueur} estHote={joueur.id === game.hote} />
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
              disabled={!peutLancer}
            >
              {peutLancer
                ? 'Lancer la partie'
                : !assezDeJoueurs
                  ? `Il faut au moins ${minimumPourLancer} joueurs (${joueurs.length}/${placesMax})`
                  : `En attente (${joueurs.length}/${placesMax} · ${nombrePrets} prêts)`}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}