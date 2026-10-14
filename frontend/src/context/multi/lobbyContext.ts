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

// Id fixe représentant "Vous" (le joueur local) dans les données mockées.
// Permet à lobby.tsx d'identifier sa propre ligne sans comparer des pseudos.
export const ID_JOUEUR_LOCAL = 'dev-user';

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

  // Refuse silencieusement si un autre joueur a déjà ce personnage.
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

  function synchroniserJoueurs(playerIds: string[]) {
    setJoueurs((anciens) =>
      playerIds.map((id) => {
        const dejaLa = anciens.find((j) => j.id === id);
        if (dejaLa) return dejaLa;
  
        return {
          id,
          pseudo: id === ID_JOUEUR_LOCAL ? 'Vous' : id,
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