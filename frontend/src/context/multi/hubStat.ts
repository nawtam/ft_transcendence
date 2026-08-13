// context/multi/useHubStats.ts
//
// Valeurs arbitraires en attendant le back. Le jour où l'API/websocket existe,
// on change uniquement l'intérieur de ce hook (fetch, subscription...) —
// aucun composant qui l'utilise n'a besoin de changer.

export interface HubStats {
  aventuriersEnLigne: number;
  partiesActives: number;
}

export function useHubStats(): HubStats {
  // TODO(back): remplacer par un appel API ou un websocket temps réel
  return {
    aventuriersEnLigne: 505,
    partiesActives: 52,
  };
}