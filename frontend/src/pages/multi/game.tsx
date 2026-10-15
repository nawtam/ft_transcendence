import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatBox from '../../composants/Chatbox';
import type { LobbyMessage } from '../../context/multi/lobbyContext';

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
    const url = `${proto}://${window.location.host}/api/game?gameId=${encodeURIComponent(gameId)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setStatut('Connecté');
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

        if (data.message && data.userId) {
          setMessages((prev) => [
            ...prev,
            {
              id: `${Date.now()}-u-${prev.length}`,
              auteur: `Joueur ${data.userId}`,
              texte: data.message,
            },
          ]);
        }

        const texte = data.text || (typeof data === 'string' ? data : null);
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
  }, [gameId]);

  const envoyerAction = (texte: string) => {
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