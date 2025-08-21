import { createRoot } from 'react-dom/client'
import './utils/pdfSetup' // Initialize PDF.js early
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)
