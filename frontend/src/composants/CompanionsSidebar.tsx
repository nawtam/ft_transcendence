import { Search, Mail, UserPlus } from 'lucide-react';
import '../css/CompanionsSidebar.css';

interface Compagnon {
  pseudo: string;
  niveau: number;
  enLigne: boolean;
  statut: string; 
  msg: number;
}

const compagnons: Compagnon[] = [
  { pseudo: "Milio", niveau: 12, enLigne: true, statut: "en ligne", msg: 0 },
  { pseudo: "Veigar", niveau: 15, enLigne: true, statut: "en ligne", msg: 3 },
  { pseudo: "Mordekaiser", niveau: 18, enLigne: true, statut: "en ligne", msg: 12 },
  { pseudo: "Seraphine", niveau: 9, enLigne: false, statut: "Inactif", msg: 3 },
  { pseudo: "Draven", niveau: 21, enLigne: false, statut: "Hors ligne", msg: 0 },

];

function CompanionsSidebar() {
  const enLigne = compagnons.filter(c => c.enLigne);
  const horsLigne = compagnons.filter(c => !c.enLigne);

  return (
    <aside className="companions-sidebar">
      <div className="companions-header">
        <span className="companions-title">Amis</span>
        <span className="companions-badge">{enLigne.length} en ligne</span>
      </div>

      <div className="companions-search">
        <Search className="search-icon" />
        <input type="text" placeholder="Rechercher un compagnon..." />
      </div>

      <div className="companions-list">
        {enLigne.map((c) => (
          <div className="companion-row" key={c.pseudo}>
            <div className="companion-avatar-wrapper">
              <div className="companion-avatar">{c.pseudo.charAt(0).toUpperCase()}</div>
              <span className="companion-dot online"></span>
            </div>
            <div className="companion-info">
              <span className="companion-name">{c.pseudo} <span className="companion-niveau">Nv.{c.niveau}</span></span>
              <span className="companion-statut">{c.statut}</span>
            </div>
            <div className="companion-mail-wrapper">
              <Mail className="companion-mail-icon" />
              {c.msg > 0 && <span className="companion-mail-badge">{c.msg}</span>}
            </div>
          </div>
        ))}

        <div className="companions-separator">Hors ligne</div>

        {horsLigne.map((c) => (
          <div className="companion-row" key={c.pseudo}>
            <div className="companion-avatar-wrapper">
              <div className="companion-avatar offline">{c.pseudo.charAt(0).toUpperCase()}</div>
              <span className="companion-dot offline"></span>
            </div>
            <div className="companion-info">
              <span
                className="companion-name companion-name-clickable"
                onClick={() => console.log(`Ouvrir profil de ${c.pseudo}`)}
              >
                {c.pseudo} <span className="companion-niveau">Nv.{c.niveau}</span>
              </span>
              <span className="companion-statut">{c.statut}</span>
            </div>
            <div className="companion-mail-wrapper">
              <Mail
                className="companion-mail-icon companion-mail-icon-clickable"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(`Ouvrir chat avec ${c.pseudo}`);
                }}
              />
              {c.msg > 0 && <span className="companion-mail-badge">{c.msg}</span>}
            </div>
          </div>
        ))}
      </div>

      <button className="companions-add">
        <UserPlus className="add-icon" />
        Ajouter un compagnon
      </button>
    </aside>
  );
}

export default CompanionsSidebar;