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

export function useLobby() {
  const [joueurs, setJoueurs] = useState<LobbyPlayer[]>([]);
  const [messages, setMessages] = useState<LobbyMessage[]>([]);

  function envoyerMessage(texte: string) {
    const nouveauMessage: LobbyMessage = {
      id: Date.now().toString(),
      auteur: 'Vous',
      texte,
    };
    setMessages([...messages, nouveauMessage]);
  }

  function basculerPret(id: string) {
    setJoueurs(
      joueurs.map((joueur) =>
        joueur.id === id ? { ...joueur, pret: !joueur.pret } : joueur
      )
    );
  }

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
  }

  return {
    joueurs,
    messages,
    envoyerMessage,
    basculerPret,
    choisirPersonnage,
    synchroniserJoueurs,
  };
}