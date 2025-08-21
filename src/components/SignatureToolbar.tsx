import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { PenTool, Type, Upload, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import useSignFlowStore from '../store/useSignFlowStore';

const SignatureToolbar = () => {
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const signatureCanvasRef = useRef<SignatureCanvas>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    activeSignatureType,
    setActiveSignatureType,
    setIsPlacingSignature,
    isPlacingSignature,
    drawnSignature,
    setDrawnSignature,
    typedSignature,
    setTypedSignature,
    uploadedSignature,
    setUploadedSignature
  } = useSignFlowStore();

  const handleDrawSignature = () => {
    setActiveSignatureType('draw');
    setShowDrawModal(true);
  };

  const handleTypeSignature = () => {
    setActiveSignatureType('type');
    setShowTypeModal(true);
  };

  const handleUploadSignature = () => {
    setActiveSignatureType('upload');
    setShowUploadModal(true);
  };

  const saveDrawnSignature = () => {
    if (signatureCanvasRef.current) {
      const canvas = signatureCanvasRef.current.getCanvas();
      
      // Check if canvas has any content
      const imageData = signatureCanvasRef.current.getCanvas().getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData?.data.some((pixel, index) => index % 4 === 3 && pixel !== 0);
      
      if (!hasContent) {
        alert('Please draw your signature before saving.');
        return;
      }
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        
        // Validate the data URL
        if (!dataURL || !dataURL.startsWith('data:image/png;base64,')) {
          throw new Error('Invalid signature data generated');
        }
        
        setDrawnSignature(dataURL);
        setShowDrawModal(false);
        setIsPlacingSignature(true);
        console.log('Drawn signature saved successfully');
      } catch (error) {
        console.error('Error saving drawn signature:', error);
        alert('Failed to save signature. Please try again.');
      }
    }
  };

  const clearDrawnSignature = () => {
    if (signatureCanvasRef.current) {
      signatureCanvasRef.current.clear();
    }
  };

  const saveTypedSignature = () => {
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
      
      const dataURL = canvas.toDataURL('image/png');
      
      // Validate the data URL
      if (!dataURL || !dataURL.startsWith('data:image/png;base64,')) {
        throw new Error('Invalid signature data generated');
      }
      
      setDrawnSignature(dataURL); // Reuse the drawn signature store
      setShowTypeModal(false);
      setIsPlacingSignature(true);
      console.log('Typed signature saved successfully');
    } catch (error) {
      console.error('Error saving typed signature:', error);
      alert('Failed to create typed signature. Please try again.');
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
        
        // Validate the data URL
        if (!dataURL || !dataURL.startsWith('data:image/')) {
          alert('Invalid image file. Please try a different image.');
          return;
        }
        
        setUploadedSignature(dataURL);
        setDrawnSignature(dataURL); // Reuse the drawn signature store
        setShowUploadModal(false);
        setIsPlacingSignature(true);
        console.log('Uploaded signature saved successfully');
      };
      
      reader.onerror = () => {
        alert('Failed to read the image file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading signature:', error);
      alert('Failed to upload signature. Please try again.');
    }
    
    // Reset the input
    event.target.value = '';
  };

  const getCurrentSignatureData = () => {
    switch (activeSignatureType) {
      case 'draw':
        return drawnSignature;
      case 'type':
        return drawnSignature; // Typed signature is converted to drawn format
      case 'upload':
        return uploadedSignature;
      default:
        return null;
    }
  };

  const currentSignatureData = getCurrentSignatureData();

  return (
    <>
      <div className="bg-white shadow-lg border-t border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Signature</h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleDrawSignature}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    activeSignatureType === 'draw' 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PenTool size={16} />
                  <span>Draw</span>
                </button>
                
                <button
                  onClick={handleTypeSignature}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    activeSignatureType === 'type' 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Type size={16} />
                  <span>Type</span>
                </button>
                
                <button
                  onClick={handleUploadSignature}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    activeSignatureType === 'upload' 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Upload size={16} />
                  <span>Upload</span>
                </button>
              </div>
            </div>
            
            {currentSignatureData && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-8 border border-gray-200 rounded bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={currentSignatureData} 
                      alt="Preview" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <span className="text-sm text-gray-600">
                    {isPlacingSignature ? 'Click on the PDF to place signature' : 'Signature ready'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Draw Signature Modal */}
      {showDrawModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Draw Your Signature</h3>
              <button onClick={() => setShowDrawModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg mb-4">
              <SignatureCanvas
                ref={signatureCanvasRef}
                canvasProps={{
                  width: 400,
                  height: 150,
                  className: 'signature-canvas'
                }}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={clearDrawnSignature}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={saveDrawnSignature}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save Signature
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Type Signature Modal */}
      {showTypeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Type Your Signature</h3>
              <button onClick={() => setShowTypeModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-2xl font-cursive text-center"
                style={{ fontFamily: 'cursive' }}
                autoFocus
              />
            </div>
            
            {typedSignature && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <div className="text-3xl font-cursive text-center" style={{ fontFamily: 'cursive' }}>
                  {typedSignature}
                </div>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowTypeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveTypedSignature}
                disabled={!typedSignature.trim()}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Signature
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Upload Signature Modal */}
      {showUploadModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 max-w-lg w-full mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Signature Image</h3>
              <button onClick={() => setShowUploadModal(false)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
              >
                <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Click to upload signature image</p>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, or GIF files</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            
            <button
              onClick={() => setShowUploadModal(false)}
              className="w-full px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default SignatureToolbar;
