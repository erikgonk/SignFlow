import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Type, Upload, X, Check } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import useSignFlowStore from '../store/useSignFlowStore';
import { useTranslation } from 'react-i18next';

interface SignatureCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  clickPosition: { x: number; y: number; pageNumber: number } | null;
}

const SignatureCreationModal = ({ 
  isOpen, 
  onClose, 
  clickPosition 
}: SignatureCreationModalProps) => {
  const { t } = useTranslation('signatureCreationModal');
  const {
    typedSignature,
    setTypedSignature,
    addSignature,
    activeSignatureType,
    setUploadedSignature,
    setIsPlacingSignature,
  } = useSignFlowStore();

  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  // Store last 3 drawn signatures (base64 strings)
  const [recentDrawnSignatures, setRecentDrawnSignatures] = useState<string[]>([]);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State to track if signature is valid for enabling button
  const [isSignatureValid, setIsSignatureValid] = useState(false);

  // Check validity for draw and type tabs
  // Helper to check if draw canvas has content
  const checkDrawSignatureValid = () => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current.getCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel !== 0);
        setIsSignatureValid(hasContent);
      } else {
        setIsSignatureValid(false);
      }
    } else {
      setIsSignatureValid(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'draw') {
      checkDrawSignatureValid();
    } else if (activeTab === 'type') {
      setIsSignatureValid(!!typedSignature.trim());
    } else {
      setIsSignatureValid(false);
    }
  }, [activeTab, typedSignature]);

  // Sync activeTab with store's activeSignatureType when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(activeSignatureType);
    }
  }, [isOpen, activeSignatureType]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle enter key to add signature if enabled
  useEffect(() => {
    if (!isOpen) return;
    const handleEnter = (event: KeyboardEvent) => {
      if ((event.key === 'Enter' || event.key === 'NumpadEnter') && isSignatureValid && activeTab !== 'upload') {
        event.preventDefault();
        handleSave();
      }
    };
    document.addEventListener('keydown', handleEnter);
    return () => document.removeEventListener('keydown', handleEnter);
  }, [isOpen, isSignatureValid, activeTab]);

  const handleSave = () => {
    let signatureData = '';
    if (activeTab === 'draw' && !isSignatureValid) {
      alert(t('alert_draw_before_save'));
      return;
    }
    switch (activeTab) {
      case 'draw':
        if (signatureCanvasRef.current) {
          const canvas = signatureCanvasRef.current.getCanvas();
          const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
          const hasContent = imageData?.data.some((pixel, index) => index % 4 === 3 && pixel !== 0);
          if (!hasContent) {
            alert(t('alert_draw_before_save'));
            return;
          }
          try {
            signatureData = canvas.toDataURL('image/png');
            if (!signatureData || !signatureData.startsWith('data:image/png;base64,')) {
              throw new Error('Invalid signature data generated');
            }
            // Save to recent signatures (max 3)
            setRecentDrawnSignatures(prev => {
              const updated = [signatureData, ...prev.filter(sig => sig !== signatureData)].slice(0, 3);
              return updated;
            });
          } catch (error) {
            console.error('Error saving drawn signature:', error);
            alert(t('alert_failed_save'));
            return;
          }
        }
        break;
      case 'type':
        if (!typedSignature.trim()) {
          alert(t('alert_enter_text'));
          return;
        }
        try {
          // Create a canvas to render the typed signature
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not create canvas context');
          }
          // Use a more natural aspect ratio for typed signatures
          canvas.width = 400;
          canvas.height = 150;
          // Clear background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw text
          ctx.fillStyle = 'black';
          ctx.font = '32px cursive';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(typedSignature.trim(), canvas.width / 2, canvas.height / 2);
          signatureData = canvas.toDataURL('image/png');
          if (!signatureData || !signatureData.startsWith('data:image/png;base64,')) {
            throw new Error('Invalid signature data generated');
          }
        } catch (error) {
          console.error('Error saving typed signature:', error);
          alert(t('alert_failed_typed'));
          return;
        }
        break;
      case 'upload':
        alert(t('alert_select_image_first'));
        return;
    }

    if (signatureData) {
      // Always add signature immediately
      const position = clickPosition || { x: 0.4, y: 0.45, pageNumber: 1 };
      addSignature({
        type: activeTab,
        x: position.x - 0.1,
        y: position.y - 0.05,
        width: 0.2,
        height: 0.1,
        data: signatureData,
        pageNumber: position.pageNumber,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    // Reset state
    setActiveTab('draw');
    setTypedSignature('');
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    setIsSignatureValid(false);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert(t('alert_select_image_type'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t('alert_image_too_large'));
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        if (!dataURL || !dataURL.startsWith('data:image/')) {
          alert(t('alert_invalid_image'));
          return;
        }
        if (clickPosition) {
          addSignature({
            type: 'upload',
            x: clickPosition.x - 0.1,
            y: clickPosition.y - 0.05,
            width: 0.2,
            height: 0.1,
            data: dataURL,
            pageNumber: clickPosition.pageNumber,
          });
          handleClose();
        } else {
          // Store uploaded signature and enable placement mode
          setUploadedSignature(dataURL);
          setIsPlacingSignature(true);
          handleClose();
        }
      };
      reader.onerror = () => {
        alert(t('alert_failed_read_image'));
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert(t('alert_failed_process_image'));
    }
  };

  useEffect(() => {
    // Reset signature validity when switching tabs
    if (activeTab === 'draw' || activeTab === 'type') {
      setIsSignatureValid(false);
    }
  }, [activeTab]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('create_signature')}</h2>
              {clickPosition && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('for_page', { pageNumber: clickPosition.pageNumber })}
                </p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('draw')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 ${
                activeTab === 'draw'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 border-none'
                  : 'text-gray-500 hover:text-gray-700 border-none'
              }`}
              style={{ boxShadow: 'none' }}
            >
              <PenTool className="w-4 h-4 mx-auto mb-1" />
              {t('draw')}
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 ${
                activeTab === 'type'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 border-none'
                  : 'text-gray-500 hover:text-gray-700 border-none' 
              }`}
              style={{ boxShadow: 'none' }}
            >
              <Type className="w-4 h-4 mx-auto mb-1" />
              {t('type')}
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-0 active:outline-none active:ring-0 ${
                activeTab === 'upload'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 border-none'
                  : 'text-gray-500 hover:text-gray-700 border-none'
              }`}
              style={{ boxShadow: 'none' }}
            >
              <Upload className="w-4 h-4 mx-auto mb-1" />
              {t('upload')}
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'draw' && (
              <div className="space-y-4">
                <div className="border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                  <SignatureCanvas
                    ref={signatureCanvasRef}
                    canvasProps={{
                      width: 450,
                      height: 200,
                      className: 'signature-canvas w-full h-48'
                    }}
                    backgroundColor="white"
                    onEnd={() => {
                      if (signatureCanvasRef.current) {
                        const canvas = signatureCanvasRef.current.getCanvas();
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                          const hasContent = imageData.data.some((pixel, index) => index % 4 === 3 && pixel !== 0);
                          setIsSignatureValid(hasContent);
                        } else {
                          setIsSignatureValid(false);
                        }
                      } else {
                        setIsSignatureValid(false);
                      }
                    }}
                  />
                </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (signatureCanvasRef.current) {
                      signatureCanvasRef.current.clear();
                      setIsSignatureValid(false);
                    }
                  }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('clear')}
                </button>
                {/* Recent signatures preview */}
                {recentDrawnSignatures.map((sig, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      // Load this signature into the canvas
                      if (signatureCanvasRef.current) {
                        const canvas = signatureCanvasRef.current.getCanvas();
                        const ctx = canvas.getContext('2d');
                        const img = new window.Image();
                        img.onload = () => {
                          ctx?.clearRect(0, 0, canvas.width, canvas.height);
                          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                          setIsSignatureValid(true);
                        };
                        img.src = sig;
                      }
                    }}
                    className="border border-gray-300 rounded-lg w-12 h-8 bg-white flex items-center justify-center hover:border-primary-400 transition-all"
                    title={`Use previous signature #${idx+1}`}
                  >
                    <img src={sig} alt={`Recent signature ${idx+1}`} className="max-w-full max-h-full" />
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500 self-center">
                {t('draw_above')}
              </p>
            </div>
              </div>
            )}

            {activeTab === 'type' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('enter_signature')}
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder={t('your_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {typedSignature && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">{t('preview')}</p>
                    <div 
                      className="text-2xl text-center py-4"
                      style={{ fontFamily: 'cursive' }}
                    >
                      {typedSignature}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  className="border-2 border-gray-300 border-dashed rounded-lg p-8 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">{t('click_to_upload')}</p>
                  <p className="text-sm text-gray-500">{t('png_jpeg_hint')}</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            {activeTab !== 'upload' && (
              <button
                onClick={handleSave}
                disabled={!isSignatureValid}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all
                  ${isSignatureValid
                    ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
                `}
              >
                <Check className="w-4 h-4" />
                {t('add_signature')}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SignatureCreationModal;
