interface DestinyCardProps {
  title: string
  description: string
}


function DestinyCard({ title, description }: DestinyCardProps) {
  return (
    <article>
      <h2>{title}</h2>
      <p>{description}</p>
      <a href="#">Entrer →</a>
    </article>
  )
}

export default DestinyCard