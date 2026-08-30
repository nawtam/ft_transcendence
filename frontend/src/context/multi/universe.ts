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
  // Phrase d'ambiance affichée en haut du lobby, sous le nom de l'univers.
  ambiance: string;
}

export const universes: Record<UniverseId, Universe> = {
  fantastique: {
    id: 'fantastique',
    nom: 'Fantastique',
    description: 'Magie, dragons et royaumes enchantés.',
    cover: fantastiqueImg,
    disponible: true,
    joueursEnLigne: 148,
    ambiance: 'Le vent porte une odeur de magie et de poussière d\'étoiles.',
  },
  medieval: {
    id: 'medieval',
    nom: 'Médiéval',
    description: 'Chevaliers, châteaux et intrigues royales.',
    cover: medievalImg,
    disponible: true,
    joueursEnLigne: 96,
    ambiance: 'Les torches crépitent le long des bannières. Un héraut attend votre serment.',
  },
  cyberpunk: {
    id: 'cyberpunk',
    nom: 'Cyberpunk',
    description: 'Néons, hackers et corporations obscures.',
    cover: cyberpunkImg,
    disponible: true,
    joueursEnLigne: 114,
    ambiance: 'La pluie efface les néons. Le réseau, lui, ne dort jamais.',
  },
  pirate: {
    id: 'pirate',
    nom: 'Pirate',
    description: 'Voiles noires, trésors et mers déchaînées.',
    cover: pirateImg,
    disponible: true,
    joueursEnLigne: 67,
    ambiance: 'Le vent tourne, les voiles se tendent. L\'horizon vous attend.',
  },
  western: {
    id: 'western',
    nom: 'Western',
    description: 'Poussière, duels et villes fantômes.',
    cover: westernImg,
    disponible: false,
    joueursEnLigne: null,
    ambiance: 'La poussière retombe lentement sur la grand-rue déserte.',
  },
  apocalyptique: {
    id: 'apocalyptique',
    nom: 'Apocalyptique',
    description: 'Ruines, survie et espoirs brisés.',
    cover: apocalyptiqueImg,
    disponible: false,
    joueursEnLigne: null,
    ambiance: 'Le silence a englouti les villes. Seuls les braves osent encore avancer.',
  },
  spatial: {
    id: 'spatial',
    nom: 'Spatial',
    description: 'Étoiles, flottes et civilisations perdues.',
    cover: spatialImg,
    disponible: false,
    joueursEnLigne: null,
    ambiance: 'Les étoiles regardent, indifférentes, la flotte se rassembler.',
  },
  greceAntique: {
    id: 'greceAntique',
    nom: 'Grèce Antique',
    description: 'Magie et machinerie fusionnées.',
    cover: greceAntiqueImg,
    disponible: false,
    joueursEnLigne: null,
    ambiance: 'Les colonnes de marbre gardent encore l\'écho des oracles.',
  },
};

export const universeList: Universe[] = Object.values(universes);