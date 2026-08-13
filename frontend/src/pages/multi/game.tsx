import { useParams } from 'react-router-dom'

export default function Game() {
  const { universeId, gameId } = useParams()
  return <div>Game : {universeId} / {gameId}</div>
}