// import '../css/Registration.css' ce fichier exite pas encore donc probleme de compilation, je met en commentaire ne attendant que tu le cree nono. (dsl)

function Connexion ()
{
    return (

    <div className="page">
      <header className="header">
        <span className="Transcendence">Transcendence</span>
        {/* <button className="btn-connexion">Connexion</button> */}
      </header>

      <Link to="/" className="btn-retour">← Retour</Link>

      <main className="box">
        <h1 className="box-title">Bienvenue</h1>
        <form className="form">
        <span className="id">Pseudo</span>
        <input type="text" placeholder="Nom d'aventurier" />

        <span className="mdp">Mot de passe</span>
        <input type="password" placeholder="••••••••" />

        <button className="btn-entrer" type="submit">Entrer</button>
        </form>

        <p className="sub">
    Nouveau parmi nous ? <Link to="/sub" className="sub-link">Créer un compte</Link>
        </p>
      </main>
    </div>
  )
}


export default Connexion