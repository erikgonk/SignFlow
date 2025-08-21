import { motion, AnimatePresence } from 'framer-motion';
import useSignFlowStore from './store/useSignFlowStore';
import LandingView from './components/LandingView';
import SigningView from './components/SigningView';
import PreviewView from './components/PreviewView';
import AppErrorBoundary from './components/AppErrorBoundary';
import { PDFTest } from './components/PDFTest';

function App() {
  const currentView = useSignFlowStore((state) => state.currentView);

  // Temporarily show test component
  const showTest = false; // Set to true to test PDF loading

  if (showTest) {
    return <PDFTest />;
  }

  const pageVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: [0.4, 0, 0.2, 1] as const,
    duration: 0.4
  };

  return (
    <AppErrorBoundary onRetry={() => useSignFlowStore.getState().reset()}>
      <div className="min-h-screen bg-gray-50">
        <AnimatePresence mode="wait">
          {currentView === 'landing' && (
            <motion.div
              key="landing"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <LandingView />
            </motion.div>
          )}
          
          {currentView === 'signing' && (
            <motion.div
              key="signing"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <SigningView />
            </motion.div>
          )}
          
          {currentView === 'preview' && (
            <motion.div
              key="preview"
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <PreviewView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppErrorBoundary>
  );
}

export default App;
