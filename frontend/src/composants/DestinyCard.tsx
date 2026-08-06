interface DestinyCardProps {
  title: string
  description: string
  image: string
  category: string
  href: string
}

function DestinyCard({ title, description, image, category, icon, href }: DestinyCardProps) {
  return (
    <a href={href} className="card">
      <div className="card-image" style={{ backgroundImage: `url(${image})` }} />
      <div className="card-overlay">
        <span className="card-category">{category}</span>
        <h2 className="card-title">{title}</h2>
        <p className="card-description">{description}</p>
        <span className="card-link">Entrer →</span>
      </div>
    </a>
  )
}

export default DestinyCard