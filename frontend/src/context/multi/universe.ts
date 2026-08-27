
import fantastiqueImg from '../../assets/univers/cover/fantastique.jpg';
import medievalImg from '../../assets/univers/cover/medieval.jpg';
import cyberpunkImg from '../../assets/univers/cover/cyberpunk.jpg';
import pirateImg from '../../assets/univers/cover/pirate.jpg';
import westernImg from '../../assets/univers/cover/western.jpg';
import apocalyptiqueImg from '../../assets/univers/cover/apocalyptique.jpg';
import spatialImg from '../../assets/univers/cover/spatial.jpg';
import greceAntiqueImg from '../../assets/univers/cover/greceAntique.jpg';


export type UniverseId =
  | 'fantastique'
  | 'medieval'
  | 'cyberpunk'
  | 'pirate'
  | 'western'
  | 'apocalyptique'
  | 'spatial'
  | 'greceAntique';

export interface Universe {
  id: UniverseId;
  nom: string;
  description: string;
  cover: string;
  disponible: boolean;
  joueursEnLigne: number | null;
}

export const universes: Record<UniverseId, Universe> = {
  fantastique: {
    id: 'fantastique',
    nom: 'Fantastique',
    description: 'Magie, dragons et royaumes enchantés.',
    cover: fantastiqueImg,
    disponible: true,
    joueursEnLigne: 148,
  },
  medieval: {
    id: 'medieval',
    nom: 'Médiéval',
    description: 'Chevaliers, châteaux et intrigues royales.',
    cover: medievalImg,
    disponible: true,
    joueursEnLigne: 96,
  },
  cyberpunk: {
    id: 'cyberpunk',
    nom: 'Cyberpunk',
    description: 'Néons, hackers et corporations obscures.',
    cover: cyberpunkImg,
    disponible: true,
    joueursEnLigne: 114,
  },
  pirate: {
    id: 'pirate',
    nom: 'Pirate',
    description: 'Voiles noires, trésors et mers déchaînées.',
    cover: pirateImg,
    disponible: true,
    joueursEnLigne: 67,
  },
  western: {
    id: 'western',
    nom: 'Western',
    description: 'Poussière, duels et villes fantômes.',
    cover: westernImg,
    disponible: false,
    joueursEnLigne: null,
  },
  apocalyptique: {
    id: 'apocalyptique',
    nom: 'Apocalyptique',
    description: 'Ruines, survie et espoirs brisés.',
    cover: apocalyptiqueImg,
    disponible: false,
    joueursEnLigne: null,
  },
  spatial: {
    id: 'spatial',
    nom: 'Spatial',
    description: 'Étoiles, flottes et civilisations perdues.',
    cover: spatialImg,
    disponible: false,
    joueursEnLigne: null,
  },
  greceAntique: {
    id: 'greceAntique',
    nom: 'Grèce Antique',
    description: 'Magie et machinerie fusionnées.',
    cover: greceAntiqueImg,
    disponible: false,
    joueursEnLigne: null,
  },
};

export const universeList: Universe[] = Object.values(universes);