export type GameMode = 'cooperatif' | 'chacunPourSoi' | 'equipeVsEquipe';

export type GameVisibility = 'public' | 'prive';

export const modeLabels: Record<GameMode, string> = {
  cooperatif: 'Coopératif',
  chacunPourSoi: 'Chacun pour soi',
  equipeVsEquipe: 'Équipe vs Équipe',
};

// Descriptions courtes affichées dans le lobby, à côté du mode figé de la partie.
export const modeDescriptions: Record<GameMode, string> = {
  cooperatif: 'Le groupe partage un objectif commun — vous gagnez ensemble.',
  chacunPourSoi: 'Un seul héros triomphe. Les récompenses sont personnelles.',
  equipeVsEquipe: 'Deux factions s\'affrontent pour la même relique.',
};

export interface Game {
  gameId: string;
  universeId: string;
  titre: string;
  hote: string;
  mode: GameMode;
  visibilite: GameVisibility;
  joueursActuels: number;
  joueursMax: number;
  narration: string;
  recompensePA: number;
  recompenseXP: number;
  difficulte: number; // sur 5
}

// Mock en attendant le back. Non exporté — seules getGamesByUniverse() et
// getGameById() sortent de ce fichier, donc le jour où l'API existe, seul le
// corps de ces deux fonctions change (fetch au lieu de filter/find sur ce
// tableau), rien côté appelants (universePage.tsx, lobby.tsx).
const gamesMockees: Game[] = [
  {
    gameId: 'sceau-dragon-celeste',
    universeId: 'fantastique',
    titre: 'Le Sceau du Dragon Céleste',
    hote: 'Elyndra',
    mode: 'cooperatif',
    visibilite: 'public',
    joueursActuels: 3,
    joueursMax: 4,
    narration: 'Un sceau ancestral retient un dragon endormi sous la citadelle. Une prophétie parle de son réveil imminent.',
    recompensePA: 50,
    recompenseXP: 350,
    difficulte: 3,
  },
  {
    gameId: 'duel-des-arcanes',
    universeId: 'fantastique',
    titre: 'Duel des Arcanes',
    hote: 'Theron',
    mode: 'chacunPourSoi',
    visibilite: 'public',
    joueursActuels: 4,
    joueursMax: 6,
    narration: 'Un tournoi de sorciers où seule la ruse magique décide du vainqueur.',
    recompensePA: 40,
    recompenseXP: 300,
    difficulte: 2,
  },
  {
    gameId: 'cercle-prive-de-lyra',
    universeId: 'fantastique',
    titre: 'Cercle Privé de Lyra',
    hote: 'Lyra',
    mode: 'equipeVsEquipe',
    visibilite: 'prive',
    joueursActuels: 2,
    joueursMax: 8,
    narration: 'Une conjuration discrète se prépare dans l\'ombre d\'une tour oubliée.',
    recompensePA: 70,
    recompenseXP: 450,
    difficulte: 4,
  },
  {
    gameId: 'la-faille-de-valor',
    universeId: 'fantastique',
    titre: 'La Faille de Valor',
    hote: 'Yola',
    mode: 'cooperatif',
    visibilite: 'public',
    joueursActuels: 4,
    joueursMax: 4,
    narration: 'Une faille dimensionnelle menace d\'engloutir le royaume de Valor.',
    recompensePA: 60,
    recompenseXP: 400,
    difficulte: 3,
  },
  {
    gameId: 'trahison-blackreach',
    universeId: 'medieval',
    titre: 'La Trahison de Blackreach',
    hote: 'Vous',
    mode: 'cooperatif',
    visibilite: 'public',
    joueursActuels: 4,
    joueursMax: 4,
    narration:
      'Le baron Aldric a été assassiné dans son propre donjon. Vous êtes convoqués pour démêler complots, alliances brisées et poignards dans le dos — et découvrir qui régnera sur Blackreach à l\'aube.',
    recompensePA: 65,
    recompenseXP: 400,
    difficulte: 2,
  },
];



// TODO backend : remplacer par fetch(`/api/univers/${universeId}/parties`)
export async function getGamesByUniverse(universeId: string): Promise<Game[]> {
  return gamesMockees.filter((game) => game.universeId === universeId);
}
 
// TODO backend : remplacer par fetch(`/api/parties/${gameId}`)
export async function getGameById(gameId: string): Promise<Game | undefined> {
  return gamesMockees.find((game) => game.gameId === gameId);
}
 
// Champs qu'un hôte choisit réellement à la création — le reste (narration,
// récompenses, difficulté) sera généré par le service IA côté back.
export interface NouvellePartie {
  titre: string;
  mode: GameMode;
  visibilite: GameVisibility;
  joueursMax: number;
}
 
// TODO backend : remplacer par un vrai POST /api/univers/{universeId}/parties.
// Le hote est codé en dur en attendant le branchement sur le contexte joueur
// global (JoueurContext) mentionné dans l'archi existante.
export async function creerPartie(universeId: string, donnees: NouvellePartie): Promise<Game> {
  const nouvellePartie: Game = {
    gameId: `partie-${Date.now()}`,
    universeId,
    titre: donnees.titre,
    hote: 'Vous',
    mode: donnees.mode,
    visibilite: donnees.visibilite,
    joueursActuels: 1,
    joueursMax: donnees.joueursMax,
    narration: 'Le briefing sera généré par l\'IA à la création de la partie.',
    recompensePA: 0,
    recompenseXP: 0,
    difficulte: 1,
  };
 
  gamesMockees.push(nouvellePartie);
  return nouvellePartie;
}
 
// TODO backend : remplacer par un vrai GET /api/parties/code/{code} (ou
// équivalent selon comment le back identifie une partie privée par code).
export async function rejoindreParCode(code: string): Promise<Game | undefined> {
  return gamesMockees.find((game) => game.gameId === code.trim());
}