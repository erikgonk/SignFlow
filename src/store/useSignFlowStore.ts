import { create } from 'zustand';

export type ViewState = 'landing' | 'signing' | 'preview';

export type SignatureType = 'draw' | 'type' | 'upload';

export interface Signature {
  id: string;
  type: SignatureType;
  x: number;
  y: number;
  width: number;
  height: number;
  data: string; // base64 data URL
  pageNumber: number;
}

export interface SignFlowState {
  // Current view
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  
  // PDF handling
  pdfFile: File | null;
  pdfDataUrl: string | null;
  pdfArrayBuffer: ArrayBuffer | null;
  setPdfFile: (file: File | null) => void;
  
  // Signatures
  signatures: Signature[];
  activeSignatureType: SignatureType;
  isPlacingSignature: boolean;
  selectedSignature: string | null;
  
  // Signature popup
  showSignaturePopup: boolean;
  popupPosition: { x: number; y: number; pageNumber: number } | null;
  
  addSignature: (signature: Omit<Signature, 'id'>) => void;
  updateSignature: (id: string, updates: Partial<Signature>) => void;
  removeSignature: (id: string) => void;
  setActiveSignatureType: (type: SignatureType) => void;
  setIsPlacingSignature: (placing: boolean) => void;
  setSelectedSignature: (id: string | null) => void;
  setShowSignaturePopup: (show: boolean) => void;
  setPopupPosition: (position: { x: number; y: number; pageNumber: number } | null) => void;
  
  // Signature input data
  drawnSignature: string | null;
  typedSignature: string;
  uploadedSignature: string | null;
  
  setDrawnSignature: (data: string | null) => void;
  setTypedSignature: (text: string) => void;
  setUploadedSignature: (data: string | null) => void;
  
  // Actions
  reset: () => void;
}

const useSignFlowStore = create<SignFlowState>((set) => ({
  // Initial state
  currentView: 'landing',
  pdfFile: null,
  pdfDataUrl: null,
  pdfArrayBuffer: null,
  signatures: [],
  activeSignatureType: 'draw',
  isPlacingSignature: false,
  selectedSignature: null,
  showSignaturePopup: false,
  popupPosition: null,
  drawnSignature: null,
  typedSignature: '',
  uploadedSignature: null,
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  
  setPdfFile: (file) => {
    if (file) {
      console.log('Setting PDF file:', file.name, file.type, file.size);
      
      // Validate file type and size
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert('File size too large. Please select a PDF smaller than 50MB.');
        return;
      }
      
      // Read file as both ArrayBuffer and data URL for maximum compatibility
      const dataUrlReader = new FileReader();
      const arrayBufferReader = new FileReader();
      
      let dataUrl: string | null = null;
      let arrayBuffer: ArrayBuffer | null = null;
      
      const updateStore = () => {
        if (dataUrl && arrayBuffer) {
          console.log('Both formats read successfully');
          set({ 
            pdfFile: file, 
            pdfDataUrl: dataUrl,
            pdfArrayBuffer: arrayBuffer,
            currentView: 'signing'
          });
        }
      };
      
      dataUrlReader.onload = (e) => {
        dataUrl = e.target?.result as string;
        console.log('PDF data URL read successfully, length:', dataUrl?.length);
        updateStore();
      };
      
      arrayBufferReader.onload = (e) => {
        arrayBuffer = e.target?.result as ArrayBuffer;
        console.log('PDF array buffer read successfully, size:', arrayBuffer?.byteLength);
        updateStore();
      };
      
      dataUrlReader.onerror = arrayBufferReader.onerror = (e) => {
        console.error('Error reading PDF file:', e);
        alert('Failed to read the PDF file. Please try again.');
      };
      
      dataUrlReader.readAsDataURL(file);
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      set({ pdfFile: null, pdfDataUrl: null, pdfArrayBuffer: null });
    }
  },
  
  addSignature: (signature) => {
    const id = crypto.randomUUID();
    set((state) => ({
      signatures: [...state.signatures, { ...signature, id }],
      isPlacingSignature: false,
      selectedSignature: id,
    }));
  },
  
  updateSignature: (id, updates) => {
    set((state) => ({
      signatures: state.signatures.map((sig) =>
        sig.id === id ? { ...sig, ...updates } : sig
      ),
    }));
  },
  
  removeSignature: (id) => {
    set((state) => ({
      signatures: state.signatures.filter((sig) => sig.id !== id),
      selectedSignature: state.selectedSignature === id ? null : state.selectedSignature,
    }));
  },
  
  setActiveSignatureType: (type) => set({ activeSignatureType: type }),
  setIsPlacingSignature: (placing) => set({ isPlacingSignature: placing }),
  setSelectedSignature: (id) => set({ selectedSignature: id }),
  setShowSignaturePopup: (show) => set({ showSignaturePopup: show }),
  setPopupPosition: (position) => set({ popupPosition: position }),
  
  setDrawnSignature: (data) => set({ drawnSignature: data }),
  setTypedSignature: (text) => set({ typedSignature: text }),
  setUploadedSignature: (data) => set({ uploadedSignature: data }),
  
  reset: () => set({
    currentView: 'landing',
    pdfFile: null,
    pdfDataUrl: null,
    pdfArrayBuffer: null,
    signatures: [],
    activeSignatureType: 'draw',
    isPlacingSignature: false,
    selectedSignature: null,
    showSignaturePopup: false,
    popupPosition: null,
    drawnSignature: null,
    typedSignature: '',
    uploadedSignature: null,
  }),
}));

export default useSignFlowStore;
