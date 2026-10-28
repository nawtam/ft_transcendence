import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../../composants/Chatbox';
import type { LobbyMessage } from '../../context/multi/lobbyContext';
import { getMoi } from '../../context/authSession';

interface TurnState {
  type: 'turn_state';
  gameId: string;
  currentTurnUserId: string | null;
  busy: boolean;
  maxPa: number;
  paByUser: Record<string, number>;
}

interface PlayerState {
  hp: number;
  maxHp: number;
  location: string;
  inventory: string[];
}

export default function Game() {
  const { universeId, gameId } = useParams<{ universeId: string; gameId: string }>();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [statut, setStatut] = useState('Connexion…');
  const [monId, setMonId] = useState<string | null>(null);
  const [turn, setTurn] = useState<TurnState | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [fiche, setFiche] = useState<PlayerState | null>(null);

  useEffect(() => {
    let annule = false;
    getMoi()
      .then((moi) => {
        if (!annule) setMonId(moi.id);
      })
      .catch(() => {
        if (!annule) setMonId(null);
      });
    return () => {
      annule = true;
    };
  }, []);

  useEffect(() => {
    if (!gameId || !monId) {
      if (!gameId) setStatut('gameId manquant');
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/api/game?gameId=${encodeURIComponent(gameId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatut('Connecté');
      ws.send(JSON.stringify({ type: 'turn_sync' }));
      ws.send(JSON.stringify({ type: 'lobby_sync' }));
    };
    ws.onclose = () => setStatut('Déconnecté');
    ws.onerror = () => setStatut('Erreur WebSocket');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));

        if (data.type === 'error') {
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}-${prev.length}`, auteur: 'Erreur', texte: data.text || data.error },
          ]);
          return;
        }

        if (data.type === 'turn_state') {
          setTurn(data as TurnState);
          return;
        }

        if (data.type === 'history' && Array.isArray(data.messages)) {
          const historique = (data.messages as { role?: string; content?: unknown }[]).filter(
            (m): m is { role?: string; content: string } =>
              Boolean(m) && typeof m.content === 'string',
          );
          setMessages(
            historique.map((m, i) => ({
              id: `hist-${i}`,
              auteur: m.role === 'user' ? 'Vous' : 'MJ',
              texte: m.content,
            })),
          );
          return;
        }

        if (data.type === 'player_state') {
          setFiche({
            hp: Number(data.hp),
            maxHp: Number(data.maxHp),
            location: String(data.location || ''),
            inventory: Array.isArray(data.inventory) ? data.inventory.map(String) : [],
          });
          return;
        }

        if (data.type === 'lobby_state' || data.type === 'lobby_chat' || data.type === 'lobby_start') {
          return;
        }

        if (data.message && data.userId) {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-u-${prev.length}`,
              auteur: String(data.userId) === monId ? 'Vous' : `Joueur ${data.userId}`,
              texte: data.message,
            },
          ]);
        }

        const texte = data.text || null;
        if (texte) {
          setMessages((prev) => [
            ...prev,
            { id: `${Date.now()}-${prev.length}`, auteur: 'MJ', texte },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-${prev.length}`, auteur: 'Système', texte: String(event.data) },
        ]);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId, monId]);

  const monTour = Boolean(monId && turn && String(turn.currentTurnUserId) === monId);
  const mesPa = monId && turn ? turn.paByUser[monId] ?? 0 : 0;
  const peutAgir = monTour && !turn?.busy && mesPa > 0;

  const envoyerAction = (texte: string) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-err`, auteur: 'Erreur', texte: 'WebSocket non connecté.' },
      ]);
      return;
    }
    if (!peutAgir) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          auteur: 'Erreur',
          texte: !monTour
            ? "Ce n'est pas ton tour."
            : turn?.busy
              ? 'Action en cours…'
              : 'Plus de PA — termine ton tour.',
        },
      ]);
      return;
    }
    ws.send(JSON.stringify({ type: 'action', message: texte }));
  };

  const finirTour = () => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!monTour || turn?.busy) return;
    ws.send(JSON.stringify({ type: 'end_turn' }));
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1>Partie</h1>
      <p>
        {universeId} / {gameId}
      </p>
      <p>{statut}</p>
      <p>
        {turn
          ? monTour
            ? `Ton tour — PA ${mesPa}/${turn.maxPa}${turn.busy ? ' (résolution…)' : ''}`
            : `Tour de Joueur ${turn.currentTurnUserId} — tes PA ${mesPa}/${turn.maxPa}`
          : 'En attente de l’état du tour…'}
        {fiche
          ? ` — PV ${fiche.hp}/${fiche.maxHp} — ${fiche.location}${fiche.inventory.length ? ` — ${fiche.inventory.join(', ')}` : ''}`
          : ''}
      </p>
      <ChatBox
        messages={messages}
        onEnvoyer={envoyerAction}
        disabled={!peutAgir}
        placeholder={
          peutAgir
            ? 'Décrire une action…'
            : monTour
              ? 'Plus de PA — finis ton tour'
              : 'En attente de ton tour…'
        }
      />
      <button type="button" onClick={finirTour} disabled={!monTour || Boolean(turn?.busy)} style={{ marginTop: '0.75rem' }}>
        Finir mon tour
      </button>
    </div>
  );
}