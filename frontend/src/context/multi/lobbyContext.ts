import { useState } from 'react';

interface LobbyPlayer {
  id: string;
  pseudo: string;
  classe: string;
  pret: boolean;
}

interface LobbyMessage {
  id: string;
  auteur: string;
  texte: string;
}

export function useLobby() {
  const [joueurs, setJoueurs] = useState<LobbyPlayer[]>([
    { id: '1', pseudo: 'Vous', classe: 'Mage errant', pret: false },
    { id: '2', pseudo: 'Elyndra', classe: 'Mage céleste', pret: true },
  ]);

  const [messages, setMessages] = useState<LobbyMessage[]>([
    { id: '1', auteur: 'Elyndra', texte: 'Le sceau vibre déjà. Ne tardons pas.' },
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

  return { joueurs, messages, envoyerMessage, basculerPret };
}