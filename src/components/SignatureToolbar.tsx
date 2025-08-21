import { motion } from 'framer-motion';
import { PenTool, Type, Upload } from 'lucide-react';
import useSignFlowStore from '../store/useSignFlowStore';

const SignatureToolbar = () => {
  const {
    setShowSignaturePopup,
    setActiveSignatureType,
  } = useSignFlowStore();

  const handleToolbarButtonClick = (type: 'draw' | 'type' | 'upload') => {
    setActiveSignatureType(type);
    setShowSignaturePopup(true);
  };

  const toolbarButtons = [
    {
      id: 'draw',
      label: 'Draw',
      icon: PenTool,
      description: 'Draw your signature',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      id: 'type',
      label: 'Type',
      icon: Type,
      description: 'Type your signature',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      description: 'Upload signature image',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white shadow-lg border-t border-gray-200"
    >
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <div className="text-sm text-gray-600 mr-6">
            Add signature:
          </div>
          
          {toolbarButtons.map((button) => {
            const IconComponent = button.icon;
            return (
              <motion.button
                key={button.id}
                onClick={() => handleToolbarButtonClick(button.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium transition-all ${button.color} shadow-sm hover:shadow-md`}
                title={button.description}
              >
                <IconComponent size={18} />
                <span>{button.label}</span>
              </motion.button>
            );
          })}
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-gray-500">
            Click a button to open the signature creator, or click directly on the PDF to add a signature
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default SignatureToolbar;
