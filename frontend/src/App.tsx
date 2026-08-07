import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Connexion from './pages/Connexion'
import Registration from './pages/Registration'
import ConditionsGenerales from './pages/ConditionsGenerales'
import Profil from './pages/Profil'


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/Registration" element={<Registration />} />
      <Route path="/conditions-generales" element={<ConditionsGenerales />} />
      <Route path="/Profil" element={<Profil />} />

          </Routes>
  )
}

export default App