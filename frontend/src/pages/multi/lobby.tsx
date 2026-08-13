import { useParams } from 'react-router-dom'

export default function Lobby() {
  const { universeId, gameId } = useParams()
  return <div>Lobby : {universeId} / {gameId}</div>
}