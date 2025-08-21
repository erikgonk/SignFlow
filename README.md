# SignFlow

A modern, secure, and fast PDF signing micro-SaaS built as a TypeScript single-page application.

## 🎯 Features

- **Upload PDF Documents** - Simple drag-and-drop or click to upload
- **Multiple Signature Options**:
  - ✏️ **Draw** signatures with mouse/touch
  - ⌨️ **Type** signatures with custom fonts
  - 📁 **Upload** signature images (PNG, JPG, GIF)
- **Interactive PDF Viewer** - Place signatures anywhere on the document
- **Real-time Preview** - Move, resize, and delete signatures before finalizing
- **Instant Download** - Get your signed PDF immediately
- **100% Client-Side** - No server uploads, complete privacy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm, pnpm, or yarn

### Installation

```bash
# Navigate to the project directory
cd SignFlow

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
# Build the project
npm run build

# Preview the build
npm run preview
```

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion for smooth transitions
- **PDF Processing**: 
  - `react-pdf` for PDF viewing
  - `pdf-lib` for PDF manipulation and signature embedding
- **Signatures**: `react-signature-canvas` for drawing signatures
- **State Management**: Zustand for lightweight, type-safe state
- **Icons**: Lucide React for beautiful, consistent icons

## 📱 User Experience

### 1. Landing View
- Clean, professional hero section
- Prominent PDF upload button
- Feature showcase with icons
- Trust indicators emphasizing security

### 2. Signing View
- Split-screen PDF viewer and signature toolbar
- Three signature creation methods
- Click-to-place signature functionality
- Signature management (move, resize, delete)
- Real-time preview of signature placement

### 3. Preview & Download View
- Final document preview
- Download signed PDF with one click
- Security notice about client-side processing
- Option to start over or go back to editing

## 🔒 Security & Privacy

- **No Server Required**: All processing happens in the browser
- **No Data Storage**: Files are never uploaded or stored
- **Memory Only**: PDFs and signatures exist only in browser memory
- **Instant Processing**: No network requests for document processing
- **Complete Privacy**: Your documents never leave your device

## 🌐 Deployment

The app can be deployed to any static hosting service:

```bash
# Build for production
npm run build

# Deploy the 'dist' folder to:
# - Vercel, Netlify, GitHub Pages
# - AWS S3 + CloudFront
# - Any static hosting service
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**SignFlow** - Simple, secure, and fast PDF signing in your browser. ✨
