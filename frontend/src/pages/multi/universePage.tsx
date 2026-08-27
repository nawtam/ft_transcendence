import { useParams } from 'react-router-dom'

export default function UniversePage() {
  const { universeId } = useParams()
  return <div>UniversePage : {universeId}</div>
}