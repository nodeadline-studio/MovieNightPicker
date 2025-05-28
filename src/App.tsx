import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MovieProvider } from './context/MovieContext';
import Home from './pages/Home'; 
import SEOHead from './components/SEOHead'; 

function App() {
  return (
    <MovieProvider>
      <SEOHead />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </Router>
    </MovieProvider>
  );
}

export default App;