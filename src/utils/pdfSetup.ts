import { pdfjs } from 'react-pdf';

// Set up PDF.js worker using local file
if (typeof window !== 'undefined') {
  // Use local worker file for reliability
  const workerSrc = '/pdf.worker.min.js';
  
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  
  console.log('PDF.js version detected:', pdfjs.version);
  console.log('PDF.js worker configured:', workerSrc);
}
