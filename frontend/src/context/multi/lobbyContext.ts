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
export const ID_JOUEUR_LOCAL = '1';

export function useLobby() {
  const [joueurs, setJoueurs] = useState<LobbyPlayer[]>([
    { id: '1', pseudo: 'Vous', classe: '', personnageId: null, pret: false },
    { id: '2', pseudo: 'Sire Aldwin', classe: 'Chevalier', personnageId: 'sire-aldwin', pret: true },
    { id: '3', pseudo: 'Dame Yseult', classe: 'Voleuse', personnageId: 'dame-yseult', pret: true },
    { id: '4', pseudo: 'Morvan', classe: 'Mage', personnageId: 'morvan', pret: true },
  ]);

  const [messages, setMessages] = useState<LobbyMessage[]>([
    { id: '1', auteur: 'Sire Aldwin', texte: 'Le baron n\'attendra pas éternellement. Choisissez vite.' },
  ]);

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

  return { joueurs, messages, envoyerMessage, basculerPret, choisirPersonnage };
}