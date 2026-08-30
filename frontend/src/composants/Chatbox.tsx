import { useState } from 'react';
import type { LobbyMessage } from '../context/multi/lobbyContext';
import '../css/multi/Chatbox.css';

interface ChatBoxProps {
  messages: LobbyMessage[];
  onEnvoyer: (texte: string) => void;
}

export default function ChatBox({ messages, onEnvoyer }: ChatBoxProps) {
  const [brouillon, setBrouillon] = useState('');

  const envoyer = () => {
    const texte = brouillon.trim();
    if (!texte) return;
    onEnvoyer(texte);
    setBrouillon('');
  };

  return (
    <div className="chat-box">
      <div className="chat-box__messages">
        {messages.map((message) => (
          <p key={message.id} className="chat-box__message">
            <span className="chat-box__auteur">{message.auteur} :</span> {message.texte}
          </p>
        ))}
      </div>
      <div className="chat-box__saisie">
        <input
          type="text"
          value={brouillon}
          onChange={(event) => setBrouillon(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') envoyer();
          }}
          placeholder="Écrire un message…"
        />
        <button type="button" onClick={envoyer}>
          Envoyer
        </button>
      </div>
    </div>
  );
}