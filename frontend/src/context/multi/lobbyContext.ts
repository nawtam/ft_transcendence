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

<<<<<<< Updated upstream
=======
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

>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  function choisirPersonnage(id: string, personnageId: string, classe: string) {
    const dejaPris = joueurs.some(
      (joueur) => joueur.id !== id && joueur.personnageId === personnageId
    );
    if (dejaPris) return;

    setJoueurs(
      joueurs.map((joueur) =>
        joueur.id === id ? { ...joueur, personnageId, classe } : joueur
      )
    );
  }

  function synchroniserJoueurs(playerIds: string[], monId: string) {
    setJoueurs((anciens) =>
      playerIds.map((id) => {
        const dejaLa = anciens.find((j) => j.id === id);
        if (dejaLa) return dejaLa;

        return {
          id,
          pseudo: id === monId ? 'Vous' : id,
          classe: '',
          personnageId: null,
          pret: false,
        };
      }),
    );
=======
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
>>>>>>> Stashed changes
  }

  return {
    joueurs,
    messages,
    appliquerLobbyState,
    ajouterLobbyChat,
  };
}