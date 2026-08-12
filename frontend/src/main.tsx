import './css/index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { JoueurProvider } from './context/JoueurContext.tsx'
import { MondeProvider } from './context/MondeContext.tsx'
import { MultiJoueurProvider } from './context/MultiContext.tsx'

import App from './App.tsx'
 
createRoot(document.getElementById('root')!).render(
  <JoueurProvider>
  <MultiJoueurProvider>
  <MondeProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </MondeProvider>
  </MultiJoueurProvider>
  </JoueurProvider>
)