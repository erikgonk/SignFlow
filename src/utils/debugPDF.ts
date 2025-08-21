export const debugPDFGeneration = {
  log: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[PDF Debug ${timestamp}] ${message}`, data);
  },
  
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[PDF Error ${timestamp}] ${message}`, error);
  },
  
  validateSignatureData: (signature: any) => {
    const validationResult = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };
    
    if (!signature) {
      validationResult.isValid = false;
      validationResult.errors.push('Signature is null or undefined');
      return validationResult;
    }
    
    if (!signature.id) {
      validationResult.errors.push('Signature missing ID');
      validationResult.isValid = false;
    }
    
    if (!signature.data || typeof signature.data !== 'string') {
      validationResult.errors.push('Signature data is missing or not a string');
      validationResult.isValid = false;
    } else {
      if (!signature.data.startsWith('data:image/')) {
        validationResult.errors.push('Signature data is not a valid data URL');
        validationResult.isValid = false;
      }
      
      if (signature.data.length < 100) {
        validationResult.warnings.push('Signature data seems very short');
      }
    }
    
    if (typeof signature.x !== 'number' || typeof signature.y !== 'number') {
      validationResult.errors.push('Signature position coordinates are invalid');
      validationResult.isValid = false;
    }
    
    if (typeof signature.width !== 'number' || typeof signature.height !== 'number') {
      validationResult.errors.push('Signature dimensions are invalid');
      validationResult.isValid = false;
    }
    
    if (signature.width <= 0 || signature.height <= 0) {
      validationResult.errors.push('Signature dimensions must be positive');
      validationResult.isValid = false;
    }
    
    if (signature.x < 0 || signature.y < 0 || signature.x > 1 || signature.y > 1) {
      validationResult.warnings.push('Signature position is outside normal bounds (0-1)');
    }
    
    return validationResult;
  },
  
  validatePDFData: (pdfDataUrl: string | null, pdfFile: File | null) => {
    const validationResult = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };
    
    if (!pdfDataUrl && !pdfFile) {
      validationResult.isValid = false;
      validationResult.errors.push('No PDF data available');
      return validationResult;
    }
    
    if (pdfDataUrl) {
      if (!pdfDataUrl.startsWith('data:application/pdf;base64,')) {
        validationResult.warnings.push('PDF data URL format is unexpected');
      }
      
      if (pdfDataUrl.length < 1000) {
        validationResult.warnings.push('PDF data URL seems very short');
      }
    }
    
    if (pdfFile) {
      if (pdfFile.type !== 'application/pdf') {
        validationResult.errors.push('File is not a PDF');
        validationResult.isValid = false;
      }
      
      if (pdfFile.size === 0) {
        validationResult.errors.push('PDF file is empty');
        validationResult.isValid = false;
      }
      
      if (pdfFile.size > 50 * 1024 * 1024) {
        validationResult.warnings.push('PDF file is very large (>50MB)');
      }
    }
    
    return validationResult;
  },
  
  testImageEmbedding: async (imageDataUrl: string) => {
    try {
      // Test if the image can be loaded
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          debugPDFGeneration.log('Image test: Successfully loaded', {
            width: img.width,
            height: img.height,
            dataLength: imageDataUrl.length
          });
          resolve({
            success: true,
            width: img.width,
            height: img.height,
            dataLength: imageDataUrl.length
          });
        };
        
        img.onerror = (error) => {
          debugPDFGeneration.error('Image test: Failed to load', error);
          reject(new Error('Failed to load image'));
        };
        
        img.src = imageDataUrl;
      });
    } catch (error) {
      debugPDFGeneration.error('Image test: Exception thrown', error);
      throw error;
    }
  }
};
