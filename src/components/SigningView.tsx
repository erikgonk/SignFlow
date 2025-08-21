import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import useSignFlowStore from '../store/useSignFlowStore';
import PDFViewer from './PDFViewer';
import SignatureToolbar from './SignatureToolbar';
import SignatureCreationModal from './SignatureCreationModal';

const SigningView = () => {
  const {
    pdfFile,
    signatures,
    showSignaturePopup,
    popupPosition,
    isPlacingSignature,
    activeSignatureType,
    drawnSignature,
    typedSignature,
    uploadedSignature,
    setCurrentView,
    setShowSignaturePopup,
    setPopupPosition,
    setIsPlacingSignature,
    addSignature,
  } = useSignFlowStore();

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleProceedToPreview = () => {
    setCurrentView('preview');
  };

  const handlePageClick = (x: number, y: number, pageNumber: number, event?: React.MouseEvent) => {
    // Check if click is on an existing signature
    const target = event?.target as HTMLElement;
    const isClickingOnSignature = target?.closest('[data-signature-overlay]') !== null;
    
    if (isClickingOnSignature) {
      // Don't show popup if clicking on existing signature
      return;
    }

    // Check if we're in placement mode (signature created from toolbar)
    if (isPlacingSignature) {
      let signatureData = '';
      
      // Get the appropriate signature data based on the active type
      if (activeSignatureType === 'draw' || activeSignatureType === 'type') {
        signatureData = drawnSignature || '';
      } else if (activeSignatureType === 'upload') {
        signatureData = uploadedSignature || '';
      }
      
      if (signatureData) {
        // Place the signature at the clicked position
        addSignature({
          type: activeSignatureType,
          x: x - 0.1,
          y: y - 0.05,
          width: 0.2,
          height: 0.1,
          data: signatureData,
          pageNumber: pageNumber,
        });
        
        // Exit placement mode
        setIsPlacingSignature(false);
        return;
      }
    }

    // Normal mode: Set popup position and show it
    setPopupPosition({ 
      x, 
      y, 
      pageNumber 
    });
    setShowSignaturePopup(true);
  };

  const handleClosePopup = () => {
    setShowSignaturePopup(false);
    setPopupPosition(null);
    // Reset placement mode when closing popup
    if (isPlacingSignature) {
      setIsPlacingSignature(false);
    }
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
      <div className="flex-1 pb-32">
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
                <div>                <h3 className="font-medium text-gray-900 mb-1">
                  {isPlacingSignature
                    ? 'Click on the PDF to place your signature'
                    : signatures.length > 0
                    ? 'Manage your signatures'
                    : 'Add your signature to the document'
                  }
                </h3>
                <p className="text-sm text-gray-600">
                  {isPlacingSignature
                    ? 'Click anywhere on the document to place your prepared signature at that location.'
                    : signatures.length > 0
                    ? 'Click on any signature to select it. Drag to move, use the resize handle in the bottom-right corner, or click the × to delete. Use the toolbar below to add more signatures.'
                    : 'Use the toolbar buttons below to create your signature, or click directly on the document to open the signature creation popup.'
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
      <div className="fixed bottom-6 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto">
          <SignatureToolbar />
        </div>
      </div>

      {/* Signature Creation Modal */}
      <SignatureCreationModal
        isOpen={showSignaturePopup}
        onClose={handleClosePopup}
        clickPosition={popupPosition}
      />
    </div>
  );
};

export default SigningView;
