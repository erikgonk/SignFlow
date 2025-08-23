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
  pdfFileName: string | null;
  pdfFileSize: number | null;
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

// Utility functions for localStorage persistence
const STORAGE_KEY = 'signflow-state';
function saveStateToStorage(state: Partial<SignFlowState>) {
  const data = {
    pdfDataUrl: state.pdfDataUrl,
    pdfFileName: state.pdfFileName,
    pdfFileSize: state.pdfFileSize,
    signatures: state.signatures,
    currentView: state.currentView,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function loadStateFromStorage(): Partial<SignFlowState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const useSignFlowStore = create<SignFlowState>((set) => ({
  // Initial state (restored from localStorage if available)
  ...{
    currentView: 'landing' as ViewState,
    pdfFile: null,
    pdfFileName: null,
    pdfFileSize: null,
    pdfDataUrl: null,
    pdfArrayBuffer: null,
    signatures: [],
    activeSignatureType: 'draw' as SignatureType,
    isPlacingSignature: false,
    selectedSignature: null,
    showSignaturePopup: false,
    popupPosition: null,
    drawnSignature: null,
    typedSignature: '',
    uploadedSignature: null,
  },
  ...(() => {
    const loaded = loadStateFromStorage();
    return {
      ...loaded,
      pdfFileSize: loaded.pdfFileSize ?? null,
    };
  })(),

  setCurrentView: (view: ViewState) => {
    set((state) => {
      const newState = { ...state, currentView: view };
      saveStateToStorage(newState);
      return { currentView: view };
    });
    let url = '/';
    if (view === 'signing') url = '/signing';
    else if (view === 'preview') url = '/preview';
    else if (view === 'landing') url = '/';
    window.history.pushState({}, '', url);
  },

  setPdfFile: (file: File | null) => {
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size too large. Please select a PDF smaller than 50MB.');
        return;
      }
      const dataUrlReader = new FileReader();
      const arrayBufferReader = new FileReader();
      let dataUrl: string | null = null;
      let arrayBuffer: ArrayBuffer | null = null;
      const fileName = file.name;
      const fileSize = file.size;
      const updateStore = () => {
        if (dataUrl && arrayBuffer) {
          const newState: SignFlowState = {
            pdfFile: file,
            pdfFileName: fileName,
            pdfFileSize: fileSize,
            pdfDataUrl: dataUrl,
            pdfArrayBuffer: arrayBuffer,
            signatures: [],
            activeSignatureType: 'draw',
            isPlacingSignature: false,
            selectedSignature: null,
            showSignaturePopup: false,
            popupPosition: null,
            drawnSignature: null,
            typedSignature: '',
            uploadedSignature: null,
            currentView: 'signing',
            setCurrentView: useSignFlowStore.getState().setCurrentView,
            setPdfFile: useSignFlowStore.getState().setPdfFile,
            addSignature: useSignFlowStore.getState().addSignature,
            updateSignature: useSignFlowStore.getState().updateSignature,
            removeSignature: useSignFlowStore.getState().removeSignature,
            setActiveSignatureType: useSignFlowStore.getState().setActiveSignatureType,
            setIsPlacingSignature: useSignFlowStore.getState().setIsPlacingSignature,
            setSelectedSignature: useSignFlowStore.getState().setSelectedSignature,
            setShowSignaturePopup: useSignFlowStore.getState().setShowSignaturePopup,
            setPopupPosition: useSignFlowStore.getState().setPopupPosition,
            setDrawnSignature: useSignFlowStore.getState().setDrawnSignature,
            setTypedSignature: useSignFlowStore.getState().setTypedSignature,
            setUploadedSignature: useSignFlowStore.getState().setUploadedSignature,
            reset: useSignFlowStore.getState().reset,
          };
          set(newState);
          saveStateToStorage(newState);
          useSignFlowStore.getState().setCurrentView('signing');
        }
      };
      dataUrlReader.onload = (e: ProgressEvent<FileReader>) => {
        dataUrl = e.target?.result as string;
        updateStore();
      };
      arrayBufferReader.onload = (e: ProgressEvent<FileReader>) => {
        arrayBuffer = e.target?.result as ArrayBuffer;
        updateStore();
      };
      dataUrlReader.onerror = arrayBufferReader.onerror = () => {
        alert('Failed to read the PDF file. Please try again.');
      };
      dataUrlReader.readAsDataURL(file);
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      const newState: Partial<SignFlowState> = {
        pdfFile: null,
        pdfFileName: null,
        pdfFileSize: null,
        pdfDataUrl: null,
        pdfArrayBuffer: null,
        signatures: [],
        currentView: 'landing',
      };
      set(newState);
      saveStateToStorage(newState);
    }
  },

  addSignature: (signature: Omit<Signature, 'id'>) => {
    const id = crypto.randomUUID();
    set((state) => {
      const newState = {
        ...state,
        signatures: [...state.signatures, { ...signature, id }],
        isPlacingSignature: false,
        selectedSignature: id,
      };
      saveStateToStorage(newState);
      return newState;
    });
  },

  updateSignature: (id: string, updates: Partial<Signature>) => {
    set((state) => {
      const newState = {
        ...state,
        signatures: state.signatures.map((sig) =>
          sig.id === id ? { ...sig, ...updates } : sig
        ),
      };
      saveStateToStorage(newState);
      return newState;
    });
  },

  removeSignature: (id: string) => {
    set((state) => {
      const newState = {
        ...state,
        signatures: state.signatures.filter((sig) => sig.id !== id),
        selectedSignature: state.selectedSignature === id ? null : state.selectedSignature,
      };
      saveStateToStorage(newState);
      return newState;
    });
  },

  setActiveSignatureType: (type: SignatureType) => set((state) => {
    const newState = { ...state, activeSignatureType: type };
    saveStateToStorage(newState);
    return newState;
  }),
  setIsPlacingSignature: (placing: boolean) => set((state) => {
    const newState = { ...state, isPlacingSignature: placing };
    saveStateToStorage(newState);
    return newState;
  }),
  setSelectedSignature: (id: string | null) => set((state) => {
    const newState = { ...state, selectedSignature: id };
    saveStateToStorage(newState);
    return newState;
  }),
  setShowSignaturePopup: (show: boolean) => set((state) => {
    const newState = { ...state, showSignaturePopup: show };
    saveStateToStorage(newState);
    return newState;
  }),
  setPopupPosition: (position: { x: number; y: number; pageNumber: number } | null) => set((state) => {
    const newState = { ...state, popupPosition: position };
    saveStateToStorage(newState);
    return newState;
  }),
  setDrawnSignature: (data: string | null) => set((state) => {
    const newState = { ...state, drawnSignature: data };
    saveStateToStorage(newState);
    return newState;
  }),
  setTypedSignature: (text: string) => set((state) => {
    const newState = { ...state, typedSignature: text };
    saveStateToStorage(newState);
    return newState;
  }),
  setUploadedSignature: (data: string | null) => set((state) => {
    const newState = { ...state, uploadedSignature: data };
    saveStateToStorage(newState);
    return newState;
  }),
  reset: () => {
    const newState: SignFlowState = {
      currentView: 'landing',
      pdfFile: null,
      pdfFileName: null,
      pdfFileSize: null,
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
      setCurrentView: useSignFlowStore.getState().setCurrentView,
      setPdfFile: useSignFlowStore.getState().setPdfFile,
      addSignature: useSignFlowStore.getState().addSignature,
      updateSignature: useSignFlowStore.getState().updateSignature,
      removeSignature: useSignFlowStore.getState().removeSignature,
      setActiveSignatureType: useSignFlowStore.getState().setActiveSignatureType,
      setIsPlacingSignature: useSignFlowStore.getState().setIsPlacingSignature,
      setSelectedSignature: useSignFlowStore.getState().setSelectedSignature,
      setShowSignaturePopup: useSignFlowStore.getState().setShowSignaturePopup,
      setPopupPosition: useSignFlowStore.getState().setPopupPosition,
      setDrawnSignature: useSignFlowStore.getState().setDrawnSignature,
      setTypedSignature: useSignFlowStore.getState().setTypedSignature,
      setUploadedSignature: useSignFlowStore.getState().setUploadedSignature,
      reset: useSignFlowStore.getState().reset,
    };
    set(newState);
    saveStateToStorage(newState);
    useSignFlowStore.getState().setCurrentView('landing');
  },
}));

export default useSignFlowStore;
