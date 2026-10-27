import { useParams } from "react-router-dom";
import { universes, type UniverseId } from './universe';

export function useUniverse() {
  const { universeId } = useParams<{ universeId: UniverseId }>();

  if (!universeId) {
    return undefined;
  }

  return universes[universeId];
}