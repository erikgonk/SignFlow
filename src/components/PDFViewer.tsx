import { useState, useCallback, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import useSignFlowStore from '../store/useSignFlowStore';
import type { Signature } from '../store/useSignFlowStore';
import PDFErrorBoundary from './PDFErrorBoundary';

interface PDFViewerProps {
  onPageClick: (x: number, y: number, pageNumber: number, event?: React.MouseEvent) => void;
  isPreviewMode?: boolean;
}

const PDFViewer = ({ onPageClick, isPreviewMode = false }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(600);
  
  const { pdfDataUrl, pdfFile, pdfArrayBuffer, signatures, selectedSignature, updateSignature, removeSignature, setSelectedSignature } = useSignFlowStore();

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    console.log('PDF loaded successfully with', numPages, 'pages');
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Failed to load PDF:', error);
  }, []);

  const handlePageClick = useCallback((event: React.MouseEvent<HTMLDivElement>, pageNumber: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate relative position (0-1)
    const relativeX = x / rect.width;
    const relativeY = y / rect.height;
    
    onPageClick(relativeX, relativeY, pageNumber, event);
  }, [onPageClick]);

  const handleSignatureMove = useCallback((sigId: string, newX: number, newY: number) => {
    updateSignature(sigId, { x: newX, y: newY });
  }, [updateSignature]);

  const handleSignatureResize = useCallback((sigId: string, newWidth: number, newHeight: number) => {
    updateSignature(sigId, { width: newWidth, height: newHeight });
  }, [updateSignature]);

  if (!pdfDataUrl && !pdfFile && !pdfArrayBuffer) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No PDF loaded</p>
      </div>
    );
  }

  console.log('Rendering PDF with data URL length:', pdfDataUrl?.length);
  console.log('PDF array buffer size:', pdfArrayBuffer?.byteLength);
  console.log('PDF file:', pdfFile?.name, pdfFile?.size);

  // Try to use ArrayBuffer first (most reliable), then data URL, then File object
  let pdfSource = null;
  
  if (pdfArrayBuffer && pdfArrayBuffer.byteLength > 0) {
    pdfSource = pdfArrayBuffer;
    console.log('Using ArrayBuffer as PDF source');
  } else if (pdfDataUrl && pdfDataUrl.length > 0) {
    pdfSource = pdfDataUrl;
    console.log('Using data URL as PDF source');
  } else if (pdfFile) {
    pdfSource = pdfFile;
    console.log('Using File object as PDF source');
  }
  
  if (!pdfSource) {
    console.error('No valid PDF source available');
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No valid PDF data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative bg-white shadow-lg rounded-lg overflow-hidden">
        <PDFErrorBoundary onRetry={() => window.location.reload()}>
          <Document
            file={pdfSource}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96 bg-gray-100">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200">
                <div className="text-center">
                  <p className="text-red-600 font-medium">Failed to load PDF file</p>
                  <p className="text-red-500 text-sm mt-1">The PDF file may be corrupted or invalid</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            }
          >
            {Array.from(new Array(numPages), (_, index) => {
              const pageNumber = index + 1;
              const hasSignatures = signatures.some(sig => sig.pageNumber === pageNumber);
              
              return (
                <div key={`page_${pageNumber}`} className="relative mb-4">
                  {/* Page number indicator */}
                  <div className="absolute -top-6 left-0 z-20 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    Page {pageNumber} of {numPages}
                  </div>
                  
                  <div
                    onClick={(e) => handlePageClick(e, pageNumber)}
                    className={`relative cursor-crosshair rounded shadow-sm ${
                      isPreviewMode && hasSignatures 
                        ? 'border-2 border-primary-500' 
                        : 'border border-gray-200'
                    }`}
                  >
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      onLoadSuccess={(page) => setPageWidth(page.width)}
                    />
                    
                    {/* Render signatures for this page */}
                    {signatures
                      .filter(sig => sig.pageNumber === pageNumber)
                      .map((signature) => (
                        <SignatureOverlay
                          key={signature.id}
                          signature={signature}
                          isSelected={selectedSignature === signature.id}
                          onSelect={() => setSelectedSignature(signature.id)}
                          onMove={(newX, newY) => handleSignatureMove(signature.id, newX, newY)}
                          onResize={(newWidth, newHeight) => handleSignatureResize(signature.id, newWidth, newHeight)}
                          onDelete={() => removeSignature(signature.id)}
                          onPageChange={(newPageNumber) => updateSignature(signature.id, { pageNumber: newPageNumber })}
                          containerWidth={pageWidth}
                          pageNumber={pageNumber}
                          totalPages={numPages}
                          isPreviewMode={isPreviewMode}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </Document>
        </PDFErrorBoundary>
      </div>
      
      {numPages > 1 && (
        <p className="text-gray-600 text-sm">
          Showing {numPages} page{numPages !== 1 ? 's' : ''} • Drag signatures between pages
        </p>
      )}
    </div>
  );
};

interface SignatureOverlayProps {
  signature: Signature;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (width: number, height: number) => void;
  onDelete: () => void;
  onPageChange: (newPageNumber: number) => void;
  containerWidth: number;
  pageNumber: number;
  totalPages: number;
  isPreviewMode?: boolean;
}

const SignatureOverlay = ({ 
  signature, 
  isSelected, 
  onSelect, 
  onMove, 
  onResize,
  onDelete,
  onPageChange,
  containerWidth,
  pageNumber,
  totalPages,
  isPreviewMode = false
}: SignatureOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeEdge, setActiveEdge] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialSignature, setInitialSignature] = useState({ 
    x: signature.x, 
    y: signature.y, 
    width: signature.width, 
    height: signature.height 
  });

  const edgeThreshold = 8; // Pixel area around edges for resize detection

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // In preview mode, only detect edges when hovering
    if (isPreviewMode && !isHovered) return;
    // In edit mode, only detect edges when selected
    if (!isPreviewMode && (!isSelected || isDragging || isResizing)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    
    const onTop = clientY < rect.top + edgeThreshold;
    const onBottom = clientY > rect.bottom - edgeThreshold;
    const onLeft = clientX < rect.left + edgeThreshold;
    const onRight = clientX > rect.right - edgeThreshold;

    let newActiveEdge = null;
    let cursor = 'grab';

    if (onTop && onLeft) { 
      newActiveEdge = 'top-left'; 
      cursor = 'nw-resize'; 
    } else if (onTop && onRight) { 
      newActiveEdge = 'top-right'; 
      cursor = 'ne-resize'; 
    } else if (onBottom && onLeft) { 
      newActiveEdge = 'bottom-left'; 
      cursor = 'sw-resize'; 
    } else if (onBottom && onRight) { 
      newActiveEdge = 'bottom-right'; 
      cursor = 'se-resize'; 
    } else if (onTop) { 
      newActiveEdge = 'top'; 
      cursor = 'n-resize'; 
    } else if (onBottom) { 
      newActiveEdge = 'bottom'; 
      cursor = 's-resize'; 
    } else if (onLeft) { 
      newActiveEdge = 'left'; 
      cursor = 'w-resize'; 
    } else if (onRight) { 
      newActiveEdge = 'right'; 
      cursor = 'e-resize'; 
    }

    setActiveEdge(newActiveEdge);
    
    // Update cursor only if not in preview mode or if hovering in preview mode
    if (!isPreviewMode || isHovered) {
      e.currentTarget.style.cursor = cursor;
    }
  }, [isPreviewMode, isHovered, isSelected, isDragging, isResizing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // In preview mode, always select on first interaction
    if (isPreviewMode) {
      onSelect();
    } else if (!isSelected) {
      onSelect();
      return; // Don't start drag/resize until selected
    }
    
    if (activeEdge) {
      // Start resizing
      setIsResizing(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialSignature({ 
        x: signature.x, 
        y: signature.y, 
        width: signature.width, 
        height: signature.height 
      });
    } else {
      // Start dragging
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialSignature({ 
        x: signature.x, 
        y: signature.y, 
        width: signature.width, 
        height: signature.height 
      });
    }
  };

  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // Handle dragging with cross-page support
      const deltaX = (e.clientX - dragStart.x) / containerWidth;
      const deltaY = (e.clientY - dragStart.y) / containerWidth;
      
      let newX = initialSignature.x + deltaX;
      let newY = initialSignature.y + deltaY;
      let targetPageNumber = pageNumber;
      
      // Check for page transitions
      if (newY < 0 && pageNumber > 1) {
        // Moving to previous page
        targetPageNumber = pageNumber - 1;
        newY = 1 + newY; // Wrap to bottom of previous page
      } else if (newY + signature.height > 1 && pageNumber < totalPages) {
        // Moving to next page
        targetPageNumber = pageNumber + 1;
        newY = newY - 1; // Wrap to top of next page
      }
      
      // Constrain within page bounds
      newX = Math.max(0, Math.min(1 - signature.width, newX));
      newY = Math.max(0, Math.min(1 - signature.height, newY));
      
      // If page changed, trigger page change
      if (targetPageNumber !== pageNumber) {
        onPageChange(targetPageNumber);
      }
      
      onMove(newX, newY);
    } else if (isResizing && activeEdge) {
      // Handle resizing (keep existing logic)
      const deltaX = (e.clientX - dragStart.x) / containerWidth;
      const deltaY = (e.clientY - dragStart.y) / containerWidth;
      
      let newX = initialSignature.x;
      let newY = initialSignature.y;
      let newWidth = initialSignature.width;
      let newHeight = initialSignature.height;
      
      const minSize = 0.05; // Minimum 5% of page width/height

      if (activeEdge.includes('right')) {
        newWidth = Math.max(minSize, Math.min(1 - newX, initialSignature.width + deltaX));
      }
      if (activeEdge.includes('bottom')) {
        newHeight = Math.max(minSize, Math.min(1 - newY, initialSignature.height + deltaY));
      }
      if (activeEdge.includes('left')) {
        const widthChange = -deltaX;
        const maxWidthChange = Math.min(widthChange, 1 - initialSignature.width);
        newWidth = Math.max(minSize, initialSignature.width + maxWidthChange);
        newX = Math.max(0, initialSignature.x - maxWidthChange);
      }
      if (activeEdge.includes('top')) {
        const heightChange = -deltaY;
        const maxHeightChange = Math.min(heightChange, 1 - initialSignature.height);
        newHeight = Math.max(minSize, initialSignature.height + maxHeightChange);
        newY = Math.max(0, initialSignature.y - maxHeightChange);
      }
      
      onMove(newX, newY);
      onResize(newWidth, newHeight);
    }
  }, [isDragging, isResizing, activeEdge, dragStart, initialSignature, signature, onMove, onResize, onPageChange, containerWidth, pageNumber, totalPages]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setActiveEdge(null);
  }, []);

  // Add global event listeners for dragging and resizing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault();
        onDelete();
      }
    };

    if (isSelected) {
      document.addEventListener('keydown', handleKeyDown);
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, isResizing, isSelected, handleGlobalMouseMove, handleGlobalMouseUp, onDelete]);

  const style = {
    position: 'absolute' as const,
    left: `${signature.x * 100}%`,
    top: `${signature.y * 100}%`,
    width: `${signature.width * 100}%`,
    height: `${signature.height * 100}%`,
    borderRadius: '4px',
    zIndex: isSelected ? 3 : isHovered ? 2 : 1,
    minWidth: '20px',
    minHeight: '10px',
    transform: isPreviewMode 
      ? 'scale(1)' 
      : isSelected 
      ? 'scale(1.02)' 
      : isHovered
      ? 'scale(1.01)'
      : 'scale(1)',
    transition: isDragging || isResizing ? 'none' : 'all 0.2s ease',
    cursor: isPreviewMode 
      ? 'default' 
      : isDragging 
      ? 'grabbing' 
      : isResizing 
      ? 'grabbing' 
      : 'grab',
  };

  return (
    <div
      style={style}
      onMouseDown={isPreviewMode ? (isHovered ? handleMouseDown : undefined) : handleMouseDown}
      onMouseMove={isPreviewMode ? (isHovered ? handleMouseMove : undefined) : handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-primary-500 shadow-lg' 
          : isHovered 
          ? 'border-primary-300 shadow-md' 
          : 'border-gray-300 border-opacity-60'
      }`}
      data-signature-overlay="true"
    >
      <img 
        src={signature.data} 
        alt="Signature"
        className="w-full h-full object-contain pointer-events-none"
        draggable={false}
      />
      
      {/* Show controls only on hover in signing mode, or when hovered in preview mode */}
      {(isPreviewMode ? isHovered : (isHovered || isSelected)) && (
        <>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 flex items-center justify-center shadow-lg transition-all duration-200 z-10"
            title="Delete signature"
            style={{ opacity: isHovered || isSelected ? 1 : 0 }}
          >
            ×
          </button>
          
          {/* Visual resize indicators */}
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-200"
            style={{ opacity: isHovered || isSelected ? 1 : 0 }}
          >
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-primary-500 border border-white rounded-full shadow-sm"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 border border-white rounded-full shadow-sm"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary-500 border border-white rounded-full shadow-sm"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary-500 border border-white rounded-full shadow-sm"></div>
          </div>
          
          {/* Hover instruction tooltip */}
          {isHovered && !isSelected && (
            <div 
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap transition-opacity duration-200 z-20"
              style={{ opacity: isHovered ? 1 : 0 }}
            >
              Click to edit • Drag to move • Resize from corners
            </div>
          )}
          
          {/* Page transition hints - only in edit mode when dragging */}
          {!isPreviewMode && isDragging && totalPages > 1 && (
            <>
              {pageNumber > 1 && (
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  ↑ Drag up to move to page {pageNumber - 1}
                </div>
              )}
              {pageNumber < totalPages && (
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  ↓ Drag down to move to page {pageNumber + 1}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default PDFViewer;
