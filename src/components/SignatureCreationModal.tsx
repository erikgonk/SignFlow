import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, Type, Upload, X, Check } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import useSignFlowStore from '../store/useSignFlowStore';

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
  const {
    typedSignature,
    setTypedSignature,
    addSignature,
    activeSignatureType,
    setDrawnSignature,
    setUploadedSignature,
    setIsPlacingSignature,
  } = useSignFlowStore();

  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    let signatureData = '';

    switch (activeTab) {
      case 'draw':
        if (signatureCanvasRef.current) {
          const canvas = signatureCanvasRef.current.getCanvas();
          
          // Check if canvas has any content
          const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
          const hasContent = imageData?.data.some((pixel, index) => index % 4 === 3 && pixel !== 0);
          
          if (!hasContent) {
            alert('Please draw your signature before saving.');
            return;
          }
          
          try {
            signatureData = canvas.toDataURL('image/png');
            
            if (!signatureData || !signatureData.startsWith('data:image/png;base64,')) {
              throw new Error('Invalid signature data generated');
            }
          } catch (error) {
            console.error('Error saving drawn signature:', error);
            alert('Failed to save signature. Please try again.');
            return;
          }
        }
        break;

      case 'type':
        if (!typedSignature.trim()) {
          alert('Please enter your signature text.');
          return;
        }
        
        try {
          // Create a canvas to render the typed signature
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            throw new Error('Could not create canvas context');
          }
          
          canvas.width = 400;
          canvas.height = 100;
          
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
          alert('Failed to create typed signature. Please try again.');
          return;
        }
        break;

      case 'upload':
        // This will be handled by the file input change event
        alert('Please select an image file first.');
        return;
    }

    if (signatureData) {
      if (clickPosition) {
        // Place signature immediately at the clicked position
        addSignature({
          type: activeTab,
          x: clickPosition.x - 0.1,
          y: clickPosition.y - 0.05,
          width: 0.2,
          height: 0.1,
          data: signatureData,
          pageNumber: clickPosition.pageNumber,
        });
        handleClose();
      } else {
        // Store signature data and enable placement mode
        if (activeTab === 'draw' || activeTab === 'type') {
          setDrawnSignature(signatureData);
        } else if (activeTab === 'upload') {
          setUploadedSignature(signatureData);
        }
        setIsPlacingSignature(true);
        handleClose();
      }
    }
  };

  const handleClose = () => {
    // Reset state
    setActiveTab('draw');
    setTypedSignature('');
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
    onClose();
  };

  const clearDrawnSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, etc.).');
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file too large. Please select an image smaller than 5MB.');
      return;
    }
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataURL = e.target?.result as string;
        if (!dataURL || !dataURL.startsWith('data:image/')) {
          alert('Invalid image file. Please try another image.');
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
        alert('Failed to read the image file. Please try again.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling file upload:', error);
      alert('Failed to process the image file. Please try again.');
    }
  };

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
              <h2 className="text-xl font-semibold text-gray-900">Create Signature</h2>
              {clickPosition && (
                <p className="text-sm text-gray-500 mt-1">
                  For page {clickPosition.pageNumber}
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
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'draw'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <PenTool className="w-4 h-4 mx-auto mb-1" />
              Draw
            </button>
            <button
              onClick={() => setActiveTab('type')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'type'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Type className="w-4 h-4 mx-auto mb-1" />
              Type
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Upload className="w-4 h-4 mx-auto mb-1" />
              Upload
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
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={clearDrawnSignature}
                    className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear
                  </button>
                  <p className="text-sm text-gray-500 self-center">
                    Draw your signature above
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'type' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your signature
                  </label>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                {typedSignature && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
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
                  <p className="text-gray-600 mb-2">Click to upload signature image</p>
                  <p className="text-sm text-gray-500">PNG, JPEG up to 5MB</p>
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
              Cancel
            </button>
            {activeTab !== 'upload' && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Add Signature
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SignatureCreationModal;
