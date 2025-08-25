import { motion } from 'framer-motion';
import { ArrowLeft, Download } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSignFlowStore from '../store/useSignFlowStore';
import PDFViewer from './PDFViewer';
import SignatureToolbar from './SignatureToolbar';
import SignatureCreationModal from './SignatureCreationModal';

const SigningView = () => {
  const { t } = useTranslation('signingView');
  const {
    signatures,
    showSignaturePopup,
    popupPosition,
    isPlacingSignature,
    activeSignatureType,
    drawnSignature,
    uploadedSignature,
    setCurrentView,
    setShowSignaturePopup,
    setPopupPosition,
    setIsPlacingSignature,
    addSignature,
  } = useSignFlowStore();

  const [isSignatureActive, setIsSignatureActive] = useState(false);

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleProceedToPreview = () => {
    setCurrentView('preview');
  };

  const handlePageClick = (x: number, y: number, pageNumber: number, event?: React.MouseEvent) => {
    // Block popup if dragging/resizing a signature
    if (isSignatureActive) return;

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
    <div className="min-h-screen bg-gray-50 px-2 sm:px-0">
      {/* Desktop Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200 p-4 hidden md:block"
      >
        <div className="w-full max-w-full sm:max-w-6xl mx-auto flex items-center justify-between px-2 sm:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToLanding}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>{t('back')}</span>
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 select-none" style={{ letterSpacing: '-0.02em' }}>
                {t('signflow')}<span className="text-primary-600">Flow</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
              <span>{t('preview_download')}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Mobile Header */}
      <div className="md:hidden pt-4 pb-2 flex flex-col items-center">
        <h1 className="text-2xl md:text-4xl font-bold select-none text-center" style={{ letterSpacing: '-0.02em' }}>
          <span className="text-gray-900">{t('signflow')}</span><span className="text-primary-600">Flow</span>
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 pb-32">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Instructions */}
            <div className="px-0 sm:px-6 py-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {isPlacingSignature
                    ? 1
                    : signatures.length > 0
                    ? 2
                    : 1
                  }</div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {isPlacingSignature
                      ? t('instructions_place_signature')
                      : signatures.length > 0
                      ? t('instructions_manage_signatures')
                      : t('instructions_add_signature')
                  }
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isPlacingSignature
                      ? t('desc_place_signature')
                      : signatures.length > 0
                      ? t('desc_manage_signatures')
                      : t('desc_add_signature')
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="px-0 sm:px-6 py-6">
              {/* File size display removed, only show on preview screen */}
              <PDFViewer onPageClick={handlePageClick} onSignatureActiveChange={setIsSignatureActive} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden px-8 flex items-center justify-between pointer-events-none">
        <button
          onClick={handleBackToLanding}
          className="pointer-events-auto p-3 rounded-lg bg-primary-500 hover:bg-primary-00 backdrop-blur-md text-white/80 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-0 focus:border-none focus:border-transparent"
          title={t('go_back')}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 mt-6 flex justify-center pointer-events-auto">
          <SignatureToolbar />
        </div>
        <button
          onClick={handleProceedToPreview}
          disabled={!canProceed}
          className={`pointer-events-auto p-3 rounded-lg bg-primary-500 hover:bg-primary-700 backdrop-blur-md text-white/80 min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-0 focus:border-none focus:border-transparent ${canProceed ? 'hover:bg-primary-700 hover:shadow-lg' : 'opacity-50 cursor-not-allowed'}`}
          title={signatures.length === 0
      ? t('add_signature_to_enable_download')
      : t('preview_download')}
        >
          {/* Reverse style: visually matches back button, icon points right */}
          <div className="flex items-center justify-center rotate-180">
            <ArrowLeft size={20} />
          </div>
        </button>
      </div>

      {/* Desktop Signature Toolbar */}
      <div className="fixed bottom-6 left-0 right-0 z-50 hidden md:block pointer-events-none">
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
