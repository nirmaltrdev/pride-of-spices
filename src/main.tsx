import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { safeStorage } from './core/storage/safeStorage'

// Fix 1: Prevent Chrome from restoring a non-zero scroll position before GSAP
// ScrollTrigger computes its bounds. Runs synchronously before createRoot so the
// browser never hands a restored scroll position to the animation system.
if (typeof window !== 'undefined') {
  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
}

// Initialize fault-tolerant storage preferences immediately on app boot
safeStorage.initStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
