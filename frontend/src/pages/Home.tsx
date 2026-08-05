import DestinyCard from '../composants/DestinyCard'
import soloImage from '../assets/home/solo.jpg'
import multiImage from '../assets/home/multi.jpg'
import { Link } from 'react-router-dom'
import { useState } from "react";
import '../css/Home.css'

interface Joueur {
  pseudo: string;
  niveau: number;
  classe: string;
  xpActuel: number;
  xpTotal: number;
  or: number;
  mana: number;
  manaMax: number;
}

function Home() {
  const [joueur, setJoueur] = useState<Joueur | null>({
    pseudo: "NONO",
    niveau: 67,
    classe: "chat noir",
    xpActuel: 667,
    xpTotal: 667,
    or: 2026,
    mana: 80,
    manaMax: 100,
  });
  return (
    <div className="page">
      <header className="header">
        <span className="Transcendence">Transcendence</span>
        <Link to="/connexion" className="btn-connexion">Connexion</Link>      </header>

      <main className="hero">
        <p className="eyebrow">Bienvenue, aventurier</p>
        <h1 className="title">Choisis ton destin</h1>

        <div className="cards">
          <DestinyCard
            title="Aventure Solo"
            description="Plonge dans une saga narrative dont tu es le héro."
            image={soloImage}
            href="#"
          />
          <DestinyCard
            title="Multijoueur"
            description="Rejoins un univers avec des compagnons"
            image={multiImage}
            href="#"
          />
        </div>
      </main>
    </div>
  )
}

export default Home