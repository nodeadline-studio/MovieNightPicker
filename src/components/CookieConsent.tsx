import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import Button from './ui/Button';
import { analytics } from '../utils/analytics';
import { isEuropeanUser } from '../utils/geo';

const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isEU, setIsEU] = useState(true); // Default to true for safety
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const consent = localStorage.getItem('cookie-consent');
      if (!consent) {
        const isEuropean = await isEuropeanUser();
        setIsEU(isEuropean);
        setIsVisible(true);
      }
    };
    
    checkConsent();
  }, []);

  const handleConsent = (type: 'all' | 'essential') => {
    setIsClosing(true);
    setTimeout(() => {
      localStorage.setItem('cookie-consent', type);
      analytics.updateCookiePreferences(type === 'all', isEU);
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-auto md:max-w-md
                  bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                  backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl
                  ring-1 ring-white/5 p-6 z-[60] transition-all duration-500 ease-out ${
        isClosing ? 'translate-y-full opacity-0 scale-95' : 'translate-y-0 opacity-100 scale-100'
      }`}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <Cookie size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Cookie Preferences</h3>
        </div>
        
        {/* Content */}
        <div className="space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">
            {isEU ? (
              'We use cookies to enhance your experience. Under GDPR, we need your consent for non-essential cookies.'
            ) : (
              'We use cookies to enhance your experience and improve our service.'
            )}
          </p>
          <p className="text-xs text-gray-400">
            Read our{' '}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Privacy Policy
            </button>
            {' '}and{' '}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Terms of Service
            </button>
          </p>
        </div>
        
        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleConsent('essential')}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2.5 px-4 rounded-xl 
                     transition-all duration-200 border border-white/20 hover:border-white/30 text-sm"
          >
            {isEU ? 'Essential' : 'Decline'}
          </button>
          <button
            onClick={() => handleConsent('all')}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500
                     text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200
                     shadow-lg hover:shadow-xl hover:shadow-blue-500/25 text-sm"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;