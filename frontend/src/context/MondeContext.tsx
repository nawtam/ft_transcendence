
import { createContext, useContext, useState, ReactNode } from "react";
 
export interface Lieu {
  id: string;
  nom: string;
  description: string;
  decouvert: boolean;
}
 
export interface QueteAventure {
  id: string;
  titre: string;
  type: "Principale" | "Secondaire";
  description: string;
  decouverte: boolean;
}
 
interface MondeContextType {
  lieux: Lieu[];
  quetesAventure: QueteAventure[];
  decouvrirLieu: (id: string) => void;
  decouvrirQuete: (id: string) => void;
}
 
const MondeContext = createContext<MondeContextType | null>(null);
 
export function MondeProvider({ children }: { children: ReactNode }) {
  const [lieux, setLieux] = useState<Lieu[]>([
    { id: "l1", nom: "Le Village", description: "Point de départ paisible, refuge des voyageurs.", decouvert: true },
    { id: "l2", nom: "Forêt Sombre", description: "Une forêt dense où la lumière peine à percer.", decouvert: true },
    { id: "l3", nom: "Ruines de Vareth", description: "D'anciennes ruines chargées de magie.", decouvert: true },
    { id: "l4", nom: "????", description: "????", decouvert: false },
    { id: "l5", nom: "????", description: "????", decouvert: false },
  ]);
 
  const [quetesAventure, setQuetesAventure] = useState<QueteAventure[]>([
    { id: "q1", titre: "L'Éveil", type: "Principale", description: "Découvrir l'origine de la prophécie qui te lie au village.", decouverte: true },
    { id: "q2", titre: "Le Marchand disparu", type: "Secondaire", description: "Retrouver le marchand porté disparu près de la forêt.", decouverte: true },
    { id: "q3", titre: "????", type: "Secondaire", description: "????", decouverte: false },
    { id: "q4", titre: "????", type: "Principale", description: "????", decouverte: false },
  ]);
 
  function decouvrirLieu(id: string) {
    setLieux((prev) => prev.map((l) => (l.id === id ? { ...l, decouvert: true } : l)));
  }
 
  function decouvrirQuete(id: string) {
    setQuetesAventure((prev) => prev.map((q) => (q.id === id ? { ...q, decouverte: true } : q)));
  }
 
  return (
    <MondeContext.Provider value={{ lieux, quetesAventure, decouvrirLieu, decouvrirQuete }}>
      {children}
    </MondeContext.Provider>
  );
}
 
export function useMonde() {
  const ctx = useContext(MondeContext);
  if (!ctx) throw new Error("useMonde doit être utilisé sous MondeProvider");
  return ctx;
}