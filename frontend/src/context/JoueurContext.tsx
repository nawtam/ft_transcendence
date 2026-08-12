// src/context/JoueurContext.tsx
// -----------------------------------------------------------------
// Un seul état "joueur", partagé par toutes les pages qui en ont besoin
// (Profil, Aventure, plus tard le HUD en jeu, etc.)

import { createContext, useContext, useState, ReactNode } from "react";

export interface Joueur {
  pseudo: string;
  niveau: number;
  classe: string;
  xpActuel: number;
  xpTotal: number;
  or: number;
  action: number;
  actionMax: number;
  rank: string;
  force: number;
  agilite: number;
  endurance: number;
  intelligence: number;
  pv: number;
  pvMax: number;
  energie: number;
  energieMax: number;
  lieuActuel: string;
  victoires: number;
  defaites: number;
}

interface JoueurContextType {
  joueur: Joueur;
  setJoueur: React.Dispatch<React.SetStateAction<Joueur>>;
}

const JoueurContext = createContext<JoueurContextType | null>(null);

export function JoueurProvider({ children }: { children: ReactNode }) {
  const [joueur, setJoueur] = useState<Joueur>({
    pseudo: "NONO",
    niveau: 67,
    classe: "chat noir",
    xpActuel: 100,
    xpTotal: 667,
    or: 2026,
    action: 80,
    actionMax: 100,
    rank: "Or II",
    force: 42,
    agilite: 58,
    endurance: 67,
    intelligence: 74,
    pv: 780,
    energie: 420,
    pvMax: 1000,
    energieMax: 1000,
    lieuActuel: "Le village",
    victoires: 58,
    defaites: 41,
  });

  return (
    <JoueurContext.Provider value={{ joueur, setJoueur }}>
      {children}
    </JoueurContext.Provider>
  );
}

// Le hook que tes pages utiliseront à la place de useState
export function useJoueur() {
  const ctx = useContext(JoueurContext);
  if (!ctx) throw new Error("useJoueur doit être utilisé sous JoueurProvider");
  return ctx;
}