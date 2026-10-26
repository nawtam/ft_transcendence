import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ensureMoi } from './authSession';

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

const JOUEUR_DEFAUT: Joueur = {
  pseudo: '',
  niveau: 1,
  classe: 'Aventurier',
  xpActuel: 0,
  xpTotal: 100,
  or: 0,
  action: 0,
  actionMax: 100,
  rank: '—',
  force: 0,
  agilite: 0,
  endurance: 0,
  intelligence: 0,
  pv: 100,
  pvMax: 100,
  energie: 100,
  energieMax: 100,
  lieuActuel: 'Le village',
  victoires: 0,
  defaites: 0,
};

interface JoueurContextType {
  joueur: Joueur;
  setJoueur: React.Dispatch<React.SetStateAction<Joueur>>;
  pret: boolean;
}

const JoueurContext = createContext<JoueurContextType | null>(null);

export function JoueurProvider({ children }: { children: ReactNode }) {
  const [joueur, setJoueur] = useState<Joueur>(JOUEUR_DEFAUT);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureMoi().then((moi) => {
      if (cancelled) return;
      if (moi) {
        setJoueur((j) => ({ ...j, pseudo: moi.username }));
      }
      setPret(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <JoueurContext.Provider value={{ joueur, setJoueur, pret }}>
      {children}
    </JoueurContext.Provider>
  );
}

export function useJoueur() {
  const ctx = useContext(JoueurContext);
  if (!ctx) throw new Error('useJoueur doit être utilisé sous JoueurProvider');
  return ctx;
}