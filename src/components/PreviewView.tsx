import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, RotateCcw, CheckCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import useSignFlowStore from '../store/useSignFlowStore';
import PDFViewer from './PDFViewer';
import { debugPDFGeneration } from '../utils/debugPDF';

const formatFileSize = (size: number | null) => {
  if (size == null) return '';
  const mb = size / (1024 * 1024);
  let formatted = mb.toFixed(2);
  // If the value is exactly 0.00, show 0.000
  if (formatted === '0.00') {
    formatted = mb.toFixed(3);
  }
  return `${formatted} MB`;
};

const PreviewView = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  
  const {
    pdfFile,
    pdfFileName,
    pdfDataUrl,
    signatures,
    setCurrentView,
    reset
  } = useSignFlowStore();

  const handleBackToSigning = () => {
    setCurrentView('signing');
  };

  const handleStartOver = () => {
    reset();
  };

  const handleDownload = async () => {
    if (!pdfDataUrl) {
      console.error('No PDF data available for download');
      alert('No PDF file available. Please upload a PDF first.');
      return;
    }
      
    setIsGenerating(true);
    
    try {
      debugPDFGeneration.log('Starting PDF generation process');
      
      // Validate input data
      const pdfValidation = debugPDFGeneration.validatePDFData(pdfDataUrl, pdfFile);
      if (!pdfValidation.isValid) {
        throw new Error(`PDF validation failed: ${pdfValidation.errors.join(', ')}`);
      }
      
      if (pdfValidation.warnings.length > 0) {
        debugPDFGeneration.log('PDF validation warnings', pdfValidation.warnings);
      }
      
      debugPDFGeneration.log('Signatures to process', { count: signatures.length, signatures });
      
      // Validate signatures
      for (const signature of signatures) {
        const sigValidation = debugPDFGeneration.validateSignatureData(signature);
        if (!sigValidation.isValid) {
          debugPDFGeneration.error(`Invalid signature ${signature.id}`, sigValidation.errors);
          throw new Error(`Signature validation failed: ${sigValidation.errors.join(', ')}`);
        }
        
        if (sigValidation.warnings.length > 0) {
          debugPDFGeneration.log(`Signature ${signature.id} warnings`, sigValidation.warnings);
        }
        
        // Test if signature image can be loaded
        try {
          await debugPDFGeneration.testImageEmbedding(signature.data);
        } catch (error) {
          debugPDFGeneration.error(`Signature ${signature.id} image test failed`, error);
          throw new Error(`Signature image is invalid: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      debugPDFGeneration.log('Loading original PDF');
      
      // Load the original PDF using ArrayBuffer for better reliability
      const existingPdfBytes = await fetch(pdfDataUrl).then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
        }
        return res.arrayBuffer();
      });
      
      debugPDFGeneration.log('Original PDF loaded', { size: existingPdfBytes.byteLength });
      
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      
      if (pages.length === 0) {
        throw new Error('PDF has no pages');
      }
      
      debugPDFGeneration.log('PDF document loaded', { pageCount: pages.length });
      
      // Add signatures to the PDF
      for (const signature of signatures) {
        debugPDFGeneration.log('Processing signature', { id: signature.id, type: signature.type });
        
        if (signature.pageNumber > pages.length) {
          debugPDFGeneration.log(`Signature ${signature.id} targets page ${signature.pageNumber}, but PDF only has ${pages.length} pages - skipping`);
          continue;
        }
        
        const page = pages[signature.pageNumber - 1];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        debugPDFGeneration.log('Page dimensions', { width: pageWidth, height: pageHeight });
        
        try {
          // Validate signature data
          if (!signature.data || typeof signature.data !== 'string') {
            throw new Error('Invalid signature data');
          }
          
          let imageBytes: ArrayBuffer;
          
          if (signature.data.startsWith('data:image/')) {
            try {
              // Extract base64 data from data URL
              const [, base64Data] = signature.data.split(',');
              
              if (!base64Data) {
                throw new Error('No base64 data found');
              }
              
              // Validate base64
              const binaryString = atob(base64Data);
              const bytes = new Uint8Array(binaryString.length);
              
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              imageBytes = bytes.buffer;
              debugPDFGeneration.log('Signature data decoded', { id: signature.id, size: imageBytes.byteLength });
            } catch (error) {
              debugPDFGeneration.error('Failed to decode base64 data URL', error);
              throw new Error(`Failed to decode signature data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          } else {
            throw new Error('Signature data is not a valid data URL');
          }
          
          if (imageBytes.byteLength === 0) {
            throw new Error('Signature image data is empty');
          }
          
          // Determine image format and embed
          let image;
          try {
            if (signature.data.includes('data:image/png')) {
              debugPDFGeneration.log('Embedding as PNG', signature.id);
              image = await pdfDoc.embedPng(imageBytes);
            } else if (signature.data.includes('data:image/jpeg') || signature.data.includes('data:image/jpg')) {
              debugPDFGeneration.log('Embedding as JPEG', signature.id);
              image = await pdfDoc.embedJpg(imageBytes);
            } else {
              // Default to PNG for canvas-generated images (most signatures)
              debugPDFGeneration.log('Embedding as PNG (default)', signature.id);
              image = await pdfDoc.embedPng(imageBytes);
            }
            debugPDFGeneration.log('Image embedded successfully', { id: signature.id, dimensions: image.scale(1) });
          } catch (embedError) {
            debugPDFGeneration.error('Failed to embed image, trying PNG fallback', embedError);
            
            // Try PNG as fallback
            try {
              image = await pdfDoc.embedPng(imageBytes);
              debugPDFGeneration.log('Successfully embedded as PNG on retry', signature.id);
            } catch (retryError) {
              debugPDFGeneration.error('Failed to embed image even as PNG', retryError);
              throw new Error(`Failed to embed signature image: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
            }
          }
          
          // Calculate position and size with bounds checking
          const x = Math.max(0, Math.min(signature.x * pageWidth, pageWidth - 10));
          const y = Math.max(0, pageHeight - (signature.y * pageHeight) - (signature.height * pageHeight));
          const width = Math.min(signature.width * pageWidth, pageWidth - x);
          const height = Math.min(signature.height * pageHeight, pageHeight - y);
          
          if (width <= 0 || height <= 0) {
            debugPDFGeneration.log('Invalid calculated dimensions, skipping signature', { 
              id: signature.id, 
              calculated: { width, height, x, y },
              original: { width: signature.width, height: signature.height, x: signature.x, y: signature.y }
            });
            continue;
          }
          
          debugPDFGeneration.log('Drawing signature on page', { 
            id: signature.id,
            position: { x, y, width, height }
          });
          
          // Draw the signature on the page
          page.drawImage(image, {
            x,
            y,
            width,
            height,
          });
          
          debugPDFGeneration.log(`Successfully placed signature ${signature.id}`);
          
        } catch (error) {
          debugPDFGeneration.error('Failed to process signature', { id: signature.id, error });
          throw new Error(`Failed to process signature ${signature.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      debugPDFGeneration.log('Generating final PDF document');
      
      // Generate the final PDF
      const pdfBytes = await pdfDoc.save();
      
      debugPDFGeneration.log('PDF generated successfully', { outputSize: pdfBytes.length });
      
      // Create download link
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const fileName = pdfFile?.name || pdfFileName || 'document.pdf';
      
      // Safari workaround (only for Safari, not all iOS browsers)
      const isSafari = /^((?!chrome|android|crios|fxios|edgios|brave).)*safari/i.test(navigator.userAgent);
      if (isSafari) {
        // Use hidden iframe for download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = url;
        document.body.appendChild(iframe);
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(url);
        }, 2000);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `signed_${fileName}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      setDownloadComplete(true);
      setTimeout(() => setDownloadComplete(false), 3000);
      
      debugPDFGeneration.log('Download initiated successfully');
      
    } catch (error) {
      debugPDFGeneration.error('PDF generation failed', error);
      
      let errorMessage = 'Failed to generate signed PDF. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage += 'Could not load the original PDF file.';
        } else if (error.message.includes('embed')) {
          errorMessage += 'Could not embed signatures into the PDF.';
        } else if (error.message.includes('validation')) {
          errorMessage += 'Invalid data detected.';
        } else {
          errorMessage += `Error: ${error.message}`;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Mobile Header */}
      <div className="md:hidden pt-4 pb-2 flex items-center justify-center px-6 relative">
        <button
          onClick={handleStartOver}
          className="absolute left-6 top-4 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 bg-white shadow-sm border border-gray-200"
        >
          <RotateCcw size={18} />
        </button>
        <div className="flex-1 flex justify-center">
          <h1 className="text-2xl md:text-4xl font-bold select-none text-center" style={{ letterSpacing: '-0.02em' }}>
            <span className="text-gray-900">Sign</span><span className="text-primary-600">Flow</span>
          </h1>
        </div>
      </div>
      {/* Desktop Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 p-4 hidden md:block"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToSigning}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 select-none" style={{ letterSpacing: '-0.02em' }}>
                Sign<span className="text-primary-600">Flow</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleStartOver}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Start Over</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating || signatures.length === 0}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                downloadComplete
                  ? 'bg-green-600 text-white'
                  : isGenerating
                  ? 'bg-gray-400 text-white cursor-wait'
                  : signatures.length > 0
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              title={signatures.length === 0 ? 'Add Signature to enable Download' : 'Download signed PDF'}
            >
              {downloadComplete ? (
                <>
                  <CheckCircle size={16} />
                  <span>Downloaded!</span>
                </>
              ) : isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download size={16} />
                  <span>Download</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      {/* Main Content */}
      <div className="w-full max-w-full sm:max-w-6xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Document Ready
                  </h3>
                  <p className="text-gray-600">
                    {signatures.length} signature{signatures.length !== 1 ? 's' : ''} applied
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">File size</div>
                <div className="font-medium text-gray-900">
                  {pdfFile && formatFileSize(pdfFile.size)}
                </div>
              </div>
            </div>
          </div>
          {/* PDF Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <PDFViewer onPageClick={() => {}} isPreviewMode={true} />
            </div>
          </div>
        </motion.div>
      </div>
      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-7 left-0 right-0 z-50 md:hidden px-6 flex items-center justify-between pointer-events-none">
        <button
          onClick={handleBackToSigning}
          className="pointer-events-auto p-3 rounded-lg bg-primary-500 hover:bg-primary-00 backdrop-blur-md text-white/80 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-0 focus:border-none focus:border-transparent"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={handleDownload}
          disabled={isGenerating || signatures.length === 0}
          className={`pointer-events-auto p-3 rounded-lg bg-primary-500 hover:bg-primary-00 backdrop-blur-md text-white/80 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-0 focus:border-none focus:border-transparent ${signatures.length > 0 ? 'hover:bg-primary-700 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}
          title={signatures.length === 0 ? 'Add Signature to enable Download' : 'Download signed PDF'}
        >
          <Download size={20} />
        </button>
      </div>
      {/* Notification message (if needed) */}
      {/* ...existing code for notification... */}
    </div>
  );
};

export default PreviewView;
