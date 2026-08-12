// src/context/MultiJoueurContext.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface Univers {
  id: string;
  nom: string;
  theme: string;
  description: string;
  image: string;
  statut: 'actif' | 'bientot';
  joueursEnLigne: number; // affiché sur la carte, 0 pour les univers "bientôt"
}

export interface StatsGlobales {
  joueursEnLigne: number;
  partiesActives: number;
}

// Donnée statique — en dehors du composant, jamais recréée à chaque render
const universMock: Univers[] = [
  { id: 'fantastique', nom: 'Fantastique', theme: 'Âge des Arcanes', description: 'Magie, dragons et royaumes enchantés.', image: '/images/univers-fantastique.jpg', statut: 'actif', joueursEnLigne: 18 },
  { id: 'medieval', nom: 'Médiéval', theme: 'Royaumes de fer', description: 'Chevaliers, châteaux et batailles épiques.', image: '/images/univers-medieval.jpg', statut: 'actif', joueursEnLigne: 32 },
  { id: 'cyberpunk', nom: 'Cyberpunk', theme: 'Néon high-tech', description: 'Néons, hackers et corporations obscures.', image: '/images/univers-cyberpunk.jpg', statut: 'actif', joueursEnLigne: 24 },
  { id: 'pirate', nom: 'Pirate', theme: 'Mer de sable', description: 'Voiles sombres, trésors et mers déchaînées.', image: '/images/univers-pirate.jpg', statut: 'actif', joueursEnLigne: 47 },
  { id: 'western', nom: 'Western', theme: 'Frontier', description: 'Poussière, duels et villes fantômes.', image: '/images/univers-western.jpg', statut: 'bientot', joueursEnLigne: 0 },
  { id: 'apocalyptique', nom: 'Apocalyptique', theme: 'Cendres', description: 'Ruines, survie et espoirs brisés.', image: '/images/univers-apocalyptique.jpg', statut: 'bientot', joueursEnLigne: 0 },
  { id: 'spatial', nom: 'Spatial', theme: 'Cycle stellaire', description: 'Étoiles, flottes et civilisations perdues.', image: '/images/univers-spatial.jpg', statut: 'bientot', joueursEnLigne: 0 },
  { id: 'hextech', nom: 'Hextech', theme: 'Révolution de cuivre', description: 'Magie et machinerie fantaisiste.', image: '/images/univers-hextech.jpg', statut: 'bientot', joueursEnLigne: 0 },
];

interface MultiJoueurContextType {
  univers: Univers[];
  stats: StatsGlobales;
}

const MultiJoueurContext = createContext<MultiJoueurContextType | undefined>(undefined);

export function MultiJoueurProvider({ children }: { children: ReactNode }) {
  const [univers] = useState<Univers[]>(universMock);
  const [stats, setStats] = useState<StatsGlobales>({ joueursEnLigne: 505, partiesActives: 52 });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats({
        joueursEnLigne: 480 + Math.floor(Math.random() * 40),
        partiesActives: 45 + Math.floor(Math.random() * 15),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <MultiJoueurContext.Provider value={{ univers, stats }}>
      {children}
    </MultiJoueurContext.Provider>
  );
}

export function useMultiJoueur() {
  const context = useContext(MultiJoueurContext);
  if (!context) {
    throw new Error("useMultiJoueur doit être utilisé à l'intérieur de MultiJoueurProvider");
  }
  return context;
}