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
      className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 p-4 md:p-6 z-[60] transition-all duration-300 ${
        isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center flex-1">
          <Cookie size={24} className="text-blue-500 mr-3 flex-shrink-0 mt-1 md:mt-0" />
          <div className="space-y-2 flex-1">
            <p className="text-sm text-gray-300 leading-relaxed">
              {isEU ? (
                <>
                  This website uses cookies and similar technologies to help provide you with the best possible online experience. 
                  Under the GDPR and similar regulations, we need your consent to use non-essential cookies.
                </>
              ) : (
                'We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.'
              )}
            </p>
            <p className="text-sm text-gray-400">
              Learn more in our{' '}
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}
                className="text-blue-500 hover:underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto items-center">
          <Button
            variant="outline"
            onClick={() => handleConsent('essential')}
            fullWidth
            className="md:w-auto"
          >
            {isEU ? 'Essential Only' : 'Decline Optional'}
          </Button>
          <Button
            variant="primary"
            onClick={() => handleConsent('all')}
            fullWidth
            className="md:w-auto"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;