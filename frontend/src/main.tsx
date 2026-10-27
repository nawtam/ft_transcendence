import './css/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { JoueurProvider } from './context/JoueurContext.tsx'
import { MondeProvider } from './context/MondeContext.tsx'

import App from './App.tsx'
 
createRoot(document.getElementById('root')!).render(
  <JoueurProvider>
  <MondeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MondeProvider>
  </JoueurProvider>
)