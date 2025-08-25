import { PDFDocument, rgb } from 'pdf-lib';
import i18n from '../i18n';

export const createSamplePDF = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  const { height } = page.getSize();
  
  page.drawText(i18n.t('createSamplePDF:sample_pdf_title'), {
    x: 50,
    y: height - 100,
    size: 24,
    color: rgb(0, 0, 0),
  });

  page.drawText(i18n.t('createSamplePDF:sample_pdf_description'), {
    x: 50,
    y: height - 150,
    size: 14,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(i18n.t('createSamplePDF:sample_pdf_author'), {
    x: 50,
    y: height - 180,
    size: 14,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const downloadSamplePDF = async () => {
  const pdfBytes = await createSamplePDF();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = i18n.t('createSamplePDF:sample-document'); 
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
