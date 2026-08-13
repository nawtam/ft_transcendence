// context/multi/universes.ts
//
// Config statique de chaque univers : thème visuel + contenu éditorial.
// Ces données ne viendront jamais du back — c'est un choix de design produit,
// pas une donnée métier. À enrichir librement (image de fond, etc.) sans
// jamais avoir à toucher aux composants qui consomment ce fichier.

export type UniverseId =
  | 'fantastique'
  | 'medieval'
  | 'cyberpunk'
  | 'pirate'
  | 'western'
  | 'apocalyptique'
  | 'spatial'
  | 'hextech';

export type UniverseIcon =
  | 'sparkles'
  | 'castle'
  | 'cpu'
  | 'anchor'
  | 'sun'
  | 'skull'
  | 'rocket'
  | 'zap';

export interface Universe {
  id: UniverseId;
  nom: string;
  categorie: string;
  description: string;
  icone: UniverseIcon;
  couleurs: {
    degradeDebut: string;
    degradeFin: string;
    accent: string;
  };
  disponible: boolean;
  /** null tant que l'univers n'est pas ouvert aux joueurs */
  joueursEnLigne: number | null;
  langues: string[];
}

export const universes: Record<UniverseId, Universe> = {
  fantastique: {
    id: 'fantastique',
    nom: 'Fantastique',
    categorie: 'Âge des arcanes',
    description: 'Magie, dragons et royaumes enchantés.',
    icone: 'sparkles',
    couleurs: { degradeDebut: '#3a2166', degradeFin: '#7c3aed', accent: '#e8b768' },
    disponible: true,
    joueursEnLigne: 148,
    langues: ['FR', 'EN', 'DE', 'TH'],
  },
  medieval: {
    id: 'medieval',
    nom: 'Médiéval',
    categorie: 'Royaumes de fer',
    description: 'Chevaliers, châteaux et intrigues royales.',
    icone: 'castle',
    couleurs: { degradeDebut: '#5c3a12', degradeFin: '#b3720f', accent: '#e8b768' },
    disponible: true,
    joueursEnLigne: 96,
    langues: ['EN', 'FR', 'ES'],
  },
  cyberpunk: {
    id: 'cyberpunk',
    nom: 'Cyberpunk',
    categorie: 'Néon // x89',
    description: 'Néons, hackers et corporations obscures.',
    icone: 'cpu',
    couleurs: { degradeDebut: '#4a0f56', degradeFin: '#d6249f', accent: '#22d3ee' },
    disponible: true,
    joueursEnLigne: 114,
    langues: ['EN', 'FR', 'JA'],
  },
  pirate: {
    id: 'pirate',
    nom: 'Pirate',
    categorie: 'Mer de sable',
    description: 'Voiles noires, trésors et mers déchaînées.',
    icone: 'anchor',
    couleurs: { degradeDebut: '#0d3b3b', degradeFin: '#0f766e', accent: '#e8b768' },
    disponible: true,
    joueursEnLigne: 67,
    langues: ['EN', 'FR', 'ES'],
  },
  western: {
    id: 'western',
    nom: 'Western',
    categorie: 'Frontier',
    description: 'Poussière, duels et villes fantômes.',
    icone: 'sun',
    couleurs: { degradeDebut: '#2a2a2a', degradeFin: '#1c1c1c', accent: '#8a7d6c' },
    disponible: false,
    joueursEnLigne: null,
    langues: [],
  },
  apocalyptique: {
    id: 'apocalyptique',
    nom: 'Apocalyptique',
    categorie: 'Cendres',
    description: 'Ruines, survie et espoirs brisés.',
    icone: 'skull',
    couleurs: { degradeDebut: '#2a2a2a', degradeFin: '#1c1c1c', accent: '#8a7d6c' },
    disponible: false,
    joueursEnLigne: null,
    langues: [],
  },
  spatial: {
    id: 'spatial',
    nom: 'Spatial',
    categorie: 'Cycle stellaire',
    description: 'Étoiles, flottes et civilisations perdues.',
    icone: 'rocket',
    couleurs: { degradeDebut: '#2a2a2a', degradeFin: '#1c1c1c', accent: '#8a7d6c' },
    disponible: false,
    joueursEnLigne: null,
    langues: [],
  },
  hextech: {
    id: 'hextech',
    nom: 'Hextech',
    categorie: 'Révolution de cuivre',
    description: 'Magie et machinerie fusionnées.',
    icone: 'zap',
    couleurs: { degradeDebut: '#2a2a2a', degradeFin: '#1c1c1c', accent: '#8a7d6c' },
    disponible: false,
    joueursEnLigne: null,
    langues: [],
  },
};

export const universeList: Universe[] = Object.values(universes);