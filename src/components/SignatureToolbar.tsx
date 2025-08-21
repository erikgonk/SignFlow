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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 rounded-full shadow-2xl px-2 py-2 flex items-center space-x-1"
      >
        {toolbarButtons.map((button) => {
          const IconComponent = button.icon;
          return (
            <motion.button
              key={button.id}
              onClick={() => handleToolbarButtonClick(button.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="relative group p-3 rounded-full bg-transparent hover:bg-gray-700 text-white transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={button.description}
            >
              <IconComponent size={18} strokeWidth={2} />
              
              {/* Hover tooltip */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none z-50">
                {button.label}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
};

export default SignatureToolbar;
