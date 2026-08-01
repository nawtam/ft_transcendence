import DestinyCard from '../composants/DestinyCard'

function Home() {
  return (
    <div>
      <header>
        <span>Logo</span>
        <button>Connexion</button>
      </header>

      <main>
        <p>Bienvenue, aventurier</p>
        <h1>Choisis ton destin</h1>

        <div>
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