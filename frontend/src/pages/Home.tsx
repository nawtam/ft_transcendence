import DestinyCard from '../composants/DestinyCard';
import soloImage from '../assets/home/solo.jpg';
import multiImage from '../assets/home/multi.jpg';
import Header from '../composants/Header';
import { Link } from 'react-router-dom';
import CompanionsSidebar from '../composants/CompanionsSidebar';
import { useEffect, useState } from 'react';
import { ensureMoi, logout } from '../context/authSession';
import '../css/Home.css';

interface Joueur {
  pseudo: string;
  niveau: number;
  classe: string;
  xpActuel: number;
  xpTotal: number;
  or: number;
  mana: number;
  manaMax: number;
  rank: string;
  force: number;
  agilite: number;
  endurance: number;
  inteligence: number;
}

function Home() {
  const [joueur, setJoueur] = useState<Joueur | null>(null);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureMoi().then((moi) => {
      if (cancelled) return;
      if (!moi) {
        setJoueur(null);
      } else {
        setJoueur({
          pseudo: moi.username,
          niveau: 1,
          classe: 'Aventurier',
          xpActuel: 0,
          xpTotal: 100,
          or: 0,
          mana: 0,
          manaMax: 100,
          force: 0,
          agilite: 0,
          endurance: 0,
          inteligence: 0,
          rank: '—',
        });
      }
      setPret(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function deconnexion() {
    await logout();
    setJoueur(null);
  }

  if (!pret) return null;

  return (
    <div>
      {joueur ? (
        <Header joueur={joueur} onDeconnexion={deconnexion} />
      ) : (
        <header className="header">
          <span className="Transcendence">Transcendence</span>
          <Link to="/connexion" className="btn-connexion">
            Connexion
          </Link>
        </header>
      )}
      <div className="page">
        <div className="page-body">
          {joueur ? <CompanionsSidebar /> : <div className="sidebar-placeholder" />}
          <main className="hero">
            <p className="eyebrow">Bienvenue, aventurier</p>
            <h1 className="title">Choisis ton destin</h1>
            <div className="cards">
              <DestinyCard
                title="Aventure Solo"
                description="Plonge dans une saga narrative dont tu es le héro."
                image={soloImage}
                href="/Aventure"
              />
              <DestinyCard
                title="Multijoueur"
                description="Rejoins un univers avec des compagnons"
                image={multiImage}
                href="/hub"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default Home;