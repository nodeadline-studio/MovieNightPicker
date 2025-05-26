import React, { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';
import Button from './ui/Button';

const PrivacyPolicy: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('show-privacy', handleShow);
    return () => window.removeEventListener('show-privacy', handleShow);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="text-blue-500 mr-2" size={24} />
            <h2 className="text-xl font-bold text-white">Privacy Policy</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={20} />}
            onClick={() => setIsOpen(false)}
          />
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="prose prose-invert max-w-none">
            <h3>Data Collection and Usage</h3>
            <p>We collect and process the following anonymous data to improve our service:</p>
            <ul>
              <li>Anonymous user identifier (randomly generated)</li>
              <li>Birth year (if provided for age verification)</li>
              <li>Movie preferences and viewing history</li>
              <li>Watchlist information</li>
              <li>Filter preferences (genres, years, ratings)</li>
              <li>Usage metrics (movies viewed, captcha interactions)</li>
            </ul>
            
            <p className="text-sm text-gray-400">Note: All data is collected anonymously and cannot be traced back to individual users.</p>
            
            <h3>Cookies</h3>
            <p>We use cookies to enhance your experience and analyze our traffic. These include:</p>
            <ul>
              <li>Essential cookies for site functionality</li>
              <li>Analytics cookies to understand usage</li>
              <li>Preference cookies to remember your settings</li>
              <li>Anonymous session tracking cookies</li>
            </ul>

            <h3>How We Use Your Information</h3>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Personalize your experience</li>
              <li>Analyze how our services are used</li>
              <li>Generate anonymous usage statistics</li>
              <li>Improve our recommendation algorithms</li>
              <li>Enhance user experience based on aggregate data</li>
            </ul>

            <h3>Data Retention</h3>
            <p>Anonymous usage data is retained for up to 12 months. You can clear your local data at any time through your browser settings.</p>

            <h3>Data Sharing</h3>
            <p>We may share anonymous, aggregated data with:</p>
            <ul>
              <li>Analytics service providers</li>
              <li>Research partners for movie trend analysis</li>
              <li>Advertising partners for targeting improvement</li>
            </ul>

            <h3>Contact Us</h3>
            <p>If you have any questions about this Privacy Policy, please contact us.</p>
          </div>
        </div>
        <div className="p-6 border-t border-gray-800">
          <Button variant="primary" onClick={() => setIsOpen(false)} fullWidth>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;