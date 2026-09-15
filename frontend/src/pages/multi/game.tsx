import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../../composants/Chatbox';
import type { LobbyMessage } from '../../context/multi/lobbyContext';

const USER_ID = 'dev-user';

export default function Game() {
  const { universeId, gameId } = useParams<{ universeId: string; gameId: string }>();
  const [messages, setMessages] = useState<LobbyMessage[]>([]);
  const [statut, setStatut] = useState('Connexion…');
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!gameId) {
      setStatut('gameId manquant');
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${window.location.host}/api/game?gameId=${encodeURIComponent(gameId)}&userId=${encodeURIComponent(USER_ID)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatut('Connecté');
    ws.onclose = () => setStatut('Déconnecté');
    ws.onerror = () => setStatut('Erreur WebSocket');

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(String(event.data));
        const texte =
          data.text ||
          data.error ||
          (typeof data === 'string' ? data : JSON.stringify(data));
        const auteur =
          data.type === 'error' ? 'Erreur' : data.type === 'clarification' ? 'MJ' : 'MJ';

        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-${prev.length}`, auteur, texte },
        ]);
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
  }, [gameId]);

  const envoyerAction = (texte: string) => {
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-you`, auteur: 'Vous', texte },
    ]);

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-err`, auteur: 'Erreur', texte: 'WebSocket non connecté.' },
      ]);
      return;
    }

    ws.send(JSON.stringify({ type: 'action', message: texte }));
  };

  return (
    <div style={{ maxWidth: 720, margin: '2rem auto', padding: '1rem' }}>
      <h1>Partie</h1>
      <p>
        {universeId} / {gameId}
      </p>
      <p>{statut}</p>
      <ChatBox messages={messages} onEnvoyer={envoyerAction} />
    </div>
  );
}