import DestinyCard from '../composants/DestinyCard'

function Home() {
  return (
    <div className="page">
      <header className="header">
        <span className="logo">Logo</span>
        <button className="btn-connexion">Connexion</button>
      </header>

      <main className="hero">
        <p className="eyebrow">Bienvenue, aventurier</p>
        <h1 className="title">Choisis ton destin</h1>

        <div className="cards">
          <DestinyCard
            title="Aventure Solo"
            description="Plonge dans une saga narrative dont tu es le héro."
          />
          <DestinyCard
            title="Multijoueur"
            description="Rejoins un univers avec des compagnons"
          />
        </div>
      </main>
    </div>
  )
}

export default Home