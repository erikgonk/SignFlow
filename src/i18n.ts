import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import appErrorBoundary_en from '../public/locales/en/appErrorBoundary.json';
import appErrorBoundary_es from '../public/locales/es/appErrorBoundary.json';
import createSamplePDF_en from '../public/locales/en/createSamplePDF.json';
import createSamplePDF_es from '../public/locales/es/createSamplePDF.json';
import debugPDF_en from '../public/locales/en/debugPDF.json';
import debugPDF_es from '../public/locales/es/debugPDF.json';
import landingView_en from '../public/locales/en/landingView.json';
import landingView_es from '../public/locales/es/landingView.json';
import PDFErrorBoundary_en from './components/PDFErrorBoundary';
import PDFErrorBoundary_es from './components/PDFErrorBoundary';
import pdfTest_en from '../public/locales/en/pdfTest.json';
import pdfTest_es from '../public/locales/es/pdfTest.json';
import PDFViewer_en from '../public/locales/en/pdfViewer.json';
import PDFViewer_es from '../public/locales/es/pdfViewer.json';
import previewView_en from '../public/locales/en/previewView.json';
import previewView_es from '../public/locales/es/previewView.json';
import signatureCreationModal_en from '../public/locales/en/signatureCreationModal.json';
import signatureCreationModal_es from '../public/locales/es/signatureCreationModal.json';
import signatureToolbar_en from '../public/locales/en/signatureToolbar.json';
import signatureToolbar_es from '../public/locales/es/signatureToolbar.json';
import signingView_en from '../public/locales/en/signingView.json';
import signingView_es from '../public/locales/es/signingView.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        appErrorBoundary: appErrorBoundary_en,
        createSamplePDF: createSamplePDF_en,
        debugPDF: debugPDF_en,
        landingView: landingView_en,
        PDFErrorBoundary: PDFErrorBoundary_en,
        pdfTest: pdfTest_en,
        PDFViewer: PDFViewer_en,
        previewView: previewView_en,
        signatureCreationModal: signatureCreationModal_en,
        signatureToolbar: signatureToolbar_en,
        signingView: signingView_en,
      },
      es: {
        appErrorBoundary: appErrorBoundary_es,
        createSamplePDF: createSamplePDF_es,
        debugPDF: debugPDF_es,
        landingView: landingView_es,
        PDFErrorBoundary: PDFErrorBoundary_es,
        pdfTest: pdfTest_es,
        PDFViewer: PDFViewer_es,
        previewView: previewView_es,
        signatureCreationModal: signatureCreationModal_es,
        signatureToolbar: signatureToolbar_es,
        signingView: signingView_es,
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
