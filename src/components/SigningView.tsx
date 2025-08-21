import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import useSignFlowStore from '../store/useSignFlowStore';
import PDFViewer from './PDFViewer';
import SignatureToolbar from './SignatureToolbar';

const SigningView = () => {
  const {
    pdfFile,
    signatures,
    setCurrentView,
    addSignature,
    activeSignatureType,
    isPlacingSignature,
    drawnSignature,
    uploadedSignature
  } = useSignFlowStore();

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleProceedToPreview = () => {
    setCurrentView('preview');
  };

  const handlePageClick = (x: number, y: number, pageNumber: number) => {
    if (!isPlacingSignature) return;
    
    let signatureData = '';
    
    switch (activeSignatureType) {
      case 'draw':
      case 'type':
        signatureData = drawnSignature || '';
        break;
      case 'upload':
        signatureData = uploadedSignature || '';
        break;
    }
    
    if (!signatureData) return;
    
    addSignature({
      type: activeSignatureType,
      x: x - 0.1, // Offset to center the signature
      y: y - 0.05,
      width: 0.2, // Default width as proportion of page
      height: 0.1, // Default height as proportion of page
      data: signatureData,
      pageNumber,
    });
  };

  const canProceed = signatures.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 p-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToLanding}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Sign Document
              </h1>
              {pdfFile && (
                <p className="text-sm text-gray-600">{pdfFile.name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {signatures.length} signature{signatures.length !== 1 ? 's' : ''} placed
            </div>
            
            <button
              onClick={handleProceedToPreview}
              disabled={!canProceed}
              className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
                canProceed
                  ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download size={16} />
              <span>Preview & Download</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Instructions */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {isPlacingSignature 
                      ? 'Click anywhere on the PDF to place your signature'
                      : signatures.length > 0
                      ? 'Click signatures to move, resize, or delete them'
                      : 'Choose a signature type and create your signature'
                    }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isPlacingSignature
                      ? 'Your signature will be placed where you click. You can move, resize, or delete it after placement.'
                      : signatures.length > 0
                      ? 'Click on any signature to select it. Drag to move, use the resize handle in the bottom-right corner, or click the × to delete.'
                      : 'Select Draw to draw with your mouse, Type to create a text signature, or Upload to use an image.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="p-6">
              <PDFViewer onPageClick={handlePageClick} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Signature Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed bottom-0 left-0 right-0"
      >
        <SignatureToolbar />
      </motion.div>
    </div>
  );
};

export default SigningView;
