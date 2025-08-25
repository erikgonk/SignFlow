import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Document, Page, pdfjs } from 'react-pdf';
import { downloadSamplePDF } from '../utils/createSamplePDF';

// Use local worker file
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

console.log('PDF.js version being used:', pdfjs.version);

export const PDFTest = () => {
  const { t } = useTranslation('pdfTest');
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string>('');

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
      setFile(selectedFile);
      setError('');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setError('');
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError(t('error_load_pdf', { message: error.message }));
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl mb-4">{t('title')}</h2>
      <div className="mb-4">
        <button 
          onClick={downloadSamplePDF}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          {t('download_sample_pdf')}
        </button>
        <span className="text-gray-600">{t('no_pdf_hint')}</span>
      </div>
      <input 
        type="file" 
        accept=".pdf" 
        onChange={onFileChange}
        className="mb-4 block"
      />
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {file && (
        <div className="border border-gray-300 p-4">
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div>{t('loading_pdf')}</div>}
          >
            {numPages > 0 && (
              <Page 
                pageNumber={1} 
                width={600}
                loading={<div>{t('loading_page')}</div>}
              />
            )}
          </Document>
        </div>
      )}
    </div>
  );
};
