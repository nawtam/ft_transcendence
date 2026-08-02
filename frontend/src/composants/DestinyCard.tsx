interface DestinyCardProps {
  title: string
  description: string
}

function DestinyCard({ title, description }: DestinyCardProps) {
  return (
    <article className="card">
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
      <a href="#" className="card-link">Entrer →</a>
    </article>
  )
}

export default DestinyCard