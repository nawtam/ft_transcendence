import type { UniverseId } from './universe';

export interface Personnage {
  id: string;
  nom: string;
  classe: string;
  asset: string;
}

// Mock en attendant le back. Rien à l'extérieur de ce fichier n'accède à ce
// tableau directement — seul getPersonnagesByUniverse() est exporté, donc le
// jour où le back existe, seul le corps de cette fonction change.
const personnagesMockes: Record<UniverseId, Personnage[]> = {
  medieval: [
    { id: 'sire-aldwin', nom: 'Sire Aldwin', classe: 'Chevalier', asset: '/personnages/medieval/sire-aldwin.jpg' },
    { id: 'dame-yseult', nom: 'Dame Yseult', classe: 'Voleuse', asset: '/personnages/medieval/dame-yseult.jpg' },
    { id: 'morvan', nom: 'Morvan', classe: 'Mage', asset: '/personnages/medieval/morvan.jpg' },
    { id: 'brianne', nom: 'Brianne', classe: 'Prêtresse', asset: '/personnages/medieval/brianne.jpg' },
  ],
  // TODO : à compléter quand les personnages et assets de ces univers seront prêts.
  fantastique: [],
  cyberpunk: [],
  pirate: [],
  western: [],
  apocalyptique: [],
  spatial: [],
  greceAntique: [],
};

// Signature déjà async : quand l'API existera, remplacer le corps par
// fetch(`/api/univers/${universeId}/personnages`) — les appelants (lobby.tsx)
// traitent déjà ça comme une Promise, rien d'autre à changer.
export async function getPersonnagesByUniverse(universeId: UniverseId): Promise<Personnage[]> {
  return personnagesMockes[universeId] ?? [];
}