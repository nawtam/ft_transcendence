import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Connexion from './pages/Connexion'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/connexion" element={<Connexion />} />
    </Routes>
  )
}

export default App