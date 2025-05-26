import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import { useEffect } from 'react';
import Home from './pages/Home'; 
import Roadmap from './pages/Roadmap'; 

function App() {
  useEffect(() => {
    // Load AdSense script if not already loaded
    if (!(window as any).adsbygoogleLoaded) {
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8912589351325590';
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      (window as any).adsbygoogleLoaded = true;
    }
  }, []);

  return (
    <MovieProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </Router>
    </MovieProvider>
  );
}

export default App;