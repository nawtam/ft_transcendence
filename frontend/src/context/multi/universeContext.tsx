// context/multi/UniverseContext.tsx — le tuyau
import { createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { universes, UniverseId } from '../../data/multi/universes';

const UniverseContext = createContext(universes.fantastique);

export function UniverseProvider({ children }: { children: React.ReactNode }) {
  const { universeId } = useParams<{ universeId: UniverseId }>();
  const univers = universes[universeId!];
  return <UniverseContext.Provider value={univers}>{children}</UniverseContext.Provider>;
}

export const useUniverse = () => useContext(UniverseContext);