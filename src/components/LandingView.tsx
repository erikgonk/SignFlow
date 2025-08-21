import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, PenTool, Download, TestTube } from 'lucide-react';
import useSignFlowStore from '../store/useSignFlowStore';
import { createSamplePDF } from '../utils/createSamplePDF';

const LandingView = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setPdfFile = useSignFlowStore((state) => state.setPdfFile);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.type, file.size);
    setPdfFile(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCreateSamplePDF = async () => {
    try {
      console.log('Creating sample PDF...');
      const pdfBytes = await createSamplePDF();
      
      // Create a File object from the PDF bytes
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const file = new File([blob], 'sample-document.pdf', { type: 'application/pdf' });
      
      console.log('Sample PDF created, loading...');
      setPdfFile(file);
    } catch (error) {
      console.error('Error creating sample PDF:', error);
      alert('Failed to create sample PDF. Please try again.');
    }
  };

  const features = [
    {
      icon: Upload,
      title: 'Upload PDF',
      description: 'Simply upload your PDF document to get started'
    },
    {
      icon: PenTool,
      title: 'Add Signature',
      description: 'Draw, type, or upload your signature with ease'
    },
    {
      icon: FileText,
      title: 'Preview Document',
      description: 'Review your signed document before downloading'
    },
    {
      icon: Download,
      title: 'Download',
      description: 'Get your signed PDF instantly'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Header */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Sign<span className="text-primary-600">Flow</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            The fastest way to add your signature to PDF documents. 
            Upload, sign, and download in seconds - completely secure and private.
          </motion.p>
        </div>

        {/* Upload Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleUploadClick}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3"
            >
              <Upload size={24} />
              Upload Your PDF
            </button>
            
            <span className="text-gray-400 text-sm">or</span>
            
            <button
              onClick={handleCreateSamplePDF}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-4 px-6 rounded-xl text-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 flex items-center gap-3"
            >
              <TestTube size={20} />
              Try with Sample PDF
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <p className="text-gray-500 mt-4 text-sm">
            Upload your own PDF or use our sample document to test the signing process
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <feature.icon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm mb-4">
            🔒 Your documents are processed securely in your browser
          </p>
          <p className="text-gray-400 text-xs">
            No uploads to servers • Complete privacy • Instant processing
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LandingView;
