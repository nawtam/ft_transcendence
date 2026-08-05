import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Connexion from './pages/Connexion'
import Registration from './pages/Registration'
import ConditionsGenerales from './pages/ConditionsGenerales'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/Registration" element={<Registration />} />
<Route path="/conditions-generales" element={<ConditionsGenerales />} />    </Routes>
  )
}

export default App