import { useParams } from "react-router-dom";
import { games, type GameMode, type GameVisibility } from './games';

export function useLobby() {
    const { gameId } = useParams<{ gameId: gameId }>();
    return(games[gameId]);
}