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

export interface LobbyChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
}

export interface LobbyStatePayload {
  type: 'lobby_state';
  gameId: string;
  hostUserId: string;
  started: boolean;
  players: LobbyStatePlayer[];
  messages?: LobbyChatMessage[];
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

    if (Array.isArray(state.messages)) {
      setMessages(
        state.messages.map((msg) => ({
          id: msg.id,
          auteur: String(msg.userId) === monId ? 'Vous' : msg.username || msg.userId,
          texte: msg.text,
        })),
      );
    }
  }

  function ajouterLobbyChat(msg: LobbyChatMessage, monId: string) {
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