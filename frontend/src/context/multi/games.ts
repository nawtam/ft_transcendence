export type GameMode = 'cooperatif' | 'chacunPourSoi' | 'equipeVsEquipe';

export type GameVisibility = 'public' | 'prive';

export const modeLabels: Record<GameMode, string> = {
  cooperatif: 'Coopératif',
  chacunPourSoi: 'Chacun pour soi',
  equipeVsEquipe: 'Équipe vs Équipe',
};

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
  difficulte: number;
}

const API = '/api/game';
const DEFAULT_USER_ID = 'dev-user';

type GameApi = {
  gameId: string;
  mode: GameMode;
  maxPlayers: number;
  hostUserId: string;
  visibilite: GameVisibility;
  playerIds: string[];
  titre?: string;
  universeId?: string | null;
  hasPassword?: boolean;
  createdAt?: string;
};

function mapGame(raw: GameApi, universeIdFallback?: string): Game {
  return {
    gameId: raw.gameId,
    universeId: raw.universeId || universeIdFallback || 'fantastique',
    titre: raw.titre || `Partie ${raw.gameId}`,
    hote: raw.hostUserId,
    mode: raw.mode,
    visibilite: raw.visibilite,
    joueursActuels: raw.playerIds?.length ?? 0,
    joueursMax: raw.maxPlayers,
    narration: 'Le briefing sera généré par l\'IA.',
    recompensePA: 0,
    recompenseXP: 0,
    difficulte: 1,
  };
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

export interface NouvellePartie {
  titre: string;
  mode: GameMode;
  visibilite: GameVisibility;
  joueursMax: number;
  password?: string;
}

export async function getGamesByUniverse(universeId: string): Promise<Game[]> {
  const res = await fetch(`${API}/games`);
  if (!res.ok) throw new Error(await readError(res));
  const data = await res.json();
  return (data.games as GameApi[])
    .map((g) => mapGame(g, universeId))
    .filter((g) => !g.universeId || g.universeId === universeId);
}

export async function getGameById(
  gameId: string,
  universeId?: string,
): Promise<Game | undefined> {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameId)}`);
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(await readError(res));
  return mapGame(await res.json(), universeId);
}

export async function creerPartie(
  universeId: string,
  donnees: NouvellePartie,
  hostUserId = DEFAULT_USER_ID,
): Promise<Game> {
  const res = await fetch(`${API}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: donnees.mode,
      maxPlayers: donnees.joueursMax,
      visibilite: donnees.visibilite,
      password: donnees.visibilite === 'prive' ? donnees.password : null,
      hostUserId,
      titre: donnees.titre,
      universeId,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return mapGame(await res.json(), universeId);
}

export async function rejoindrePartie(
  gameId: string,
  options: { userId?: string; password?: string; universeId?: string } = {},
): Promise<Game> {
  const res = await fetch(`${API}/games/${encodeURIComponent(gameId)}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: options.userId || DEFAULT_USER_ID,
      password: options.password ?? null,
    }),
  });
  if (!res.ok) throw new Error(await readError(res));
  return mapGame(await res.json(), options.universeId);
}

/** Code = gameId. Join + retourne la partie. */
export async function rejoindreParCode(
  code: string,
  password?: string,
  userId = DEFAULT_USER_ID,
): Promise<Game | undefined> {
  const gameId = code.trim();
  if (!gameId) return undefined;
  const existing = await getGameById(gameId);
  if (!existing) return undefined;
  return rejoindrePartie(gameId, {
    userId,
    password,
    universeId: existing.universeId,
  });
}