import { Routes, Route } from 'react-router-dom'
import { useParams } from "react-router-dom";

import Home from './pages/Home'
import Connexion from './pages/Connexion'
import Registration from './pages/Registration'
import ConditionsGenerales from './pages/ConditionsGenerales'
import Profil from './pages/Profil'
import Aventure from './pages/Aventure'
import Hub from './pages/multi/hub'
import UniversePage from './pages/multi/universePage'
import Lobby from './pages/multi/lobby'
import Game from './pages/multi/game'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/Registration" element={<Registration />} />
      <Route path="/conditions-generales" element={<ConditionsGenerales />} />
      <Route path="/Profil" element={<Profil />} />
      <Route path="/Aventure" element={<Aventure />} />
      <Route path="/hub" element={<Hub />} />
      <Route path="/univers/:universeId" element={<UniversePage />} />
      <Route path="/univers/:universeId/partie/:gameId" element={<Lobby />} />
      <Route path="/univers/:universeId/partie/:gameId/jouer" element={<Game />} />
    </Routes>
  )
}

export default App