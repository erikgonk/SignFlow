import { motion, AnimatePresence } from 'framer-motion';
import useSignFlowStore from './store/useSignFlowStore';
import LandingView from './components/LandingView';
import SigningView from './components/SigningView';
import PreviewView from './components/PreviewView';
import AppErrorBoundary from './components/AppErrorBoundary';
import { PDFTest } from './components/PDFTest';
import { useEffect } from 'react';

function App() {
  const currentView = useSignFlowStore((state) => state.currentView);

  useEffect(() => {
    // Listen for browser navigation (back/forward)
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/signing' || currentPath === '/preview') {
        let newView: 'landing' | 'signing' | 'preview';
        if (currentPath === '/') newView = 'landing';
        else if (currentPath === '/signing') newView = 'signing';
        else newView = 'preview';
        useSignFlowStore.getState().setCurrentView(newView);
      } else {
        // Redirect to landing page for any unknown route
        useSignFlowStore.getState().setCurrentView('landing');
        window.history.replaceState({}, '', '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // On app load, ensure URL matches the current view
  useEffect(() => {
    // On app load and view change, redirect to landing if path is unknown
    const validPaths = ['/', '/signing', '/preview'];
    const expectedPath = currentView === 'landing' ? '/' :
      currentView === 'signing' ? '/signing' : '/preview';
    if (!validPaths.includes(window.location.pathname)) {
      window.history.replaceState({}, '', '/');
      useSignFlowStore.getState().setCurrentView('landing');
    } else if (window.location.pathname !== expectedPath) {
      window.history.replaceState({}, '', expectedPath);
    }
  }, [currentView]);
  // Push new history entry when view changes (except on initial load)
  useEffect(() => {
    const expectedPath = currentView === 'landing' ? '/' :
      currentView === 'signing' ? '/signing' : '/preview';
    if (window.location.pathname !== expectedPath) {
      window.history.pushState({}, '', expectedPath);
    }
  }, [currentView]);

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
