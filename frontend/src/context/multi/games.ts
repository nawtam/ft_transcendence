export type GameMode = 'cooperatif' | 'chacunPourSoi' | 'equipeVsEquipe';

export type GameVisibility = 'public' | 'prive';

export const modeLabels: Record<GameMode, string> = {
  cooperatif: 'Coopératif',
  chacunPourSoi: 'Chacun pour soi',
  equipeVsEquipe: 'Équipe vs Équipe',
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
}

export const games: Game[] = [
  {
    gameId: 'sceau-dragon-celeste',
    universeId: 'fantastique',
    titre: 'Le Sceau du Dragon Céleste',
    hote: 'Elyndra',
    mode: 'cooperatif',
    visibilite: 'public',
    joueursActuels: 3,
    joueursMax: 4,
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
  },
];

export function getGamesByUniverse(universeId: string): Game[] {
  return games.filter((game) => game.universeId === universeId);
}

export function getGameById(gameId: string): Game | undefined {
  return games.find((game) => game.gameId === gameId);
}