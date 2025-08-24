import { motion } from 'framer-motion';
import { PenTool, Type, Upload } from 'lucide-react';
import { useRef } from 'react';
import useSignFlowStore from '../store/useSignFlowStore';

const SignatureToolbar = () => {
  const {
    setShowSignaturePopup,
    setActiveSignatureType,
    addSignature,
  } = useSignFlowStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToolbarButtonClick = (type: 'draw' | 'type' | 'upload') => {
    if (type === 'upload') {
      fileInputRef.current?.click();
    } else {
      setActiveSignatureType(type);
      setShowSignaturePopup(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file too large. Please select an image smaller than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataURL = ev.target?.result as string;
      if (!dataURL || !dataURL.startsWith('data:image/')) {
        alert('Invalid image file. Please try another image.');
        return;
      }
      // Default placement: center of first page
      addSignature({
        type: 'upload',
        x: 0.4,
        y: 0.45,
        width: 0.2,
        height: 0.1,
        data: dataURL,
        pageNumber: 1,
      });
    };
    reader.onerror = () => {
      alert('Failed to read the image file. Please try again.');
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const toolbarButtons = [
    {
      id: 'draw',
      label: 'Draw',
      icon: PenTool,
      description: 'Draw your signature',
    },
    {
      id: 'type',
      label: 'Type',
      icon: Type,
      description: 'Type your signature',
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      description: 'Upload signature image',
    },
  ] as const;

  return (
    <div className="flex justify-center mb-6">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-secondary-600 rounded-lg backdrop-blur-md px-2 py-2 flex items-center space-x-2.5 pointer-events-auto"
        style={{ boxShadow: '0 0 10px 2px rgba(0,0,0,0.30)' }}
      >
        {toolbarButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <motion.button
              key={button.id}
              onClick={() => handleToolbarButtonClick(button.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative group p-3 rounded-lg 
                        bg-black/50 backdrop-blur-md
                        text-white/80 
                        hover:bg-black/65 hover:shadow-lg
                        transition-all duration-200 
                        min-w-[44px] min-h-[44px]
                        flex items-center justify-center
                        "
                title={button.description}
            >
              <IconComponent size={18} strokeWidth={2} />
              
              {/* Hover tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/65 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                {button.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black/65"></div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SignatureToolbar;
