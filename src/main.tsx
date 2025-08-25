import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { createRoot } from 'react-dom/client'
import './utils/pdfSetup' // Initialize PDF.js early
import './index.css'
import App from './App.tsx'
import './i18n';

createRoot(document.getElementById('root')!).render(
  <App />
)
