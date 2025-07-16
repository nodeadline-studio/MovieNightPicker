import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress console messages in production
if (import.meta.env.MODE === 'production') {
  // Override console methods to reduce noise
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    // Suppress React Router future flag warnings
    if (typeof message === 'string' && message.includes('React Router Future Flag Warning')) {
      return;
    }
    // Suppress React DevTools messages
    if (typeof message === 'string' && message.includes('React DevTools')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  const originalLog = console.log;
  console.log = (...args) => {
    const message = args[0];
    // Suppress React DevTools messages
    if (typeof message === 'string' && message.includes('React DevTools')) {
      return;
    }
    originalLog.apply(console, args);
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)