import { useState } from 'react';

export interface LobbyPlayer {
  id: string;
  pseudo: string;
  classe: string;
  personnageId: string | null;
  pret: boolean;
}

export interface LobbyMessage {
  id: string;
  auteur: string;
  texte: string;
}

export interface LobbyStatePlayer {
  id: string;
  username: string;
  ready: boolean;
  personnageId: string | null;
  classe: string;
}

export interface LobbyStatePayload {
  type: 'lobby_state';
  gameId: string;
  hostUserId: string;
  started: boolean;
  players: LobbyStatePlayer[];
}

export function useLobby() {
  const [joueurs, setJoueurs] = useState<LobbyPlayer[]>([]);
  const [messages, setMessages] = useState<LobbyMessage[]>([]);

  function appliquerLobbyState(state: LobbyStatePayload, monId: string) {
    setJoueurs(
      state.players.map((p) => ({
        id: String(p.id),
        pseudo: String(p.id) === monId ? 'Vous' : p.username || String(p.id),
        classe: p.classe || '',
        personnageId: p.personnageId,
        pret: Boolean(p.ready),
      })),
    );
  }

  function ajouterLobbyChat(
    msg: { id: string; userId: string; username: string; text: string },
    monId: string,
  ) {
    setMessages((prev) => [
      ...prev,
      {
        id: msg.id,
        auteur: String(msg.userId) === monId ? 'Vous' : msg.username || msg.userId,
        texte: msg.text,
      },
    ]);
  }

  return {
    joueurs,
    messages,
    appliquerLobbyState,
    ajouterLobbyChat,
  };
}