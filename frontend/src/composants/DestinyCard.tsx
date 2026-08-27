import { Link } from 'react-router-dom'

interface DestinyCardProps {
  title: string
  description: string
  image: string
  href: string
}


function DestinyCard({ title, description, image, href }: DestinyCardProps) {
  return (
    <Link to={href} className="card">
      <div className="card-image" style={{ backgroundImage: `url(${image})` }} />
      <div className="card-overlay">
        <h2 className="card-title">{title}</h2>
        <p className="card-description">{description}</p>
        <span className="card-link">Entrer →</span>
      </div>
    </Link>
  )
}
 
export default DestinyCard
 