import { PDFDocument, rgb } from 'pdf-lib';

export const createSamplePDF = async (): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  
  const { height } = page.getSize();
  
  page.drawText('Sample PDF for Testing', {
    x: 50,
    y: height - 100,
    size: 24,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('This is a test PDF document for SignFlow.', {
    x: 50,
    y: height - 150,
    size: 14,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  page.drawText('You can use this to test PDF loading and signing.', {
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
  link.download = 'sample-document.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
