interface DestinyCardProps {
  title: string
  description: string
  image: string
}

function DestinyCard({ title, description, image }: DestinyCardProps) {
  return (
    <article className="card">
      <div
        className="card-image"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="card-overlay">
        <h2 className="card-title">{title}</h2>
        <p className="card-description">{description}</p>
        <a href="#" className="card-link">Entrer →</a>
      </div>
    </article>
  )
}
export default DestinyCard