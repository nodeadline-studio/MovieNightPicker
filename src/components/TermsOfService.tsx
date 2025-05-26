import React, { useState, useEffect } from 'react';
import { Scale, X } from 'lucide-react';
import Button from './ui/Button';

const TermsOfService: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleShow = () => setIsOpen(true);
    window.addEventListener('show-terms', handleShow);
    return () => window.removeEventListener('show-terms', handleShow);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-800">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center">
            <Scale className="text-blue-500 mr-2" size={24} />
            <h2 className="text-xl font-bold text-white">Terms of Service</h2>
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
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using MovieNightPicker, you accept and agree to be bound by the terms and provision of this agreement.</p>

            <h3>2. Data Collection Consent</h3>
            <p>By using our service, you consent to:</p>
            <ul>
              <li>The collection of anonymous usage data as outlined in our Privacy Policy</li>
              <li>The use of cookies and local storage for functionality and analytics</li>
              <li>The processing of your anonymous data for service improvement</li>
            </ul>

            <h3>3. Use License</h3>
            <p>Permission is granted to temporarily access the materials (information or software) on NightMoviePicker for personal, non-commercial transitory viewing only.</p>

            <h3>4. Disclaimer</h3>
            <p>The materials on MovieNightPicker are provided on an 'as is' basis. MovieNightPicker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

            <h3>5. Limitations</h3>
            <p>In no event shall MovieNightPicker or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MovieNightPicker.</p>

            <h3>6. Revisions and Errata</h3>
            <p>The materials appearing on MovieNightPicker could include technical, typographical, or photographic errors. MovieNightPicker does not warrant that any of the materials on its website are accurate, complete or current.</p>

            <h3>7. Data Usage Rights</h3>
            <p>You grant NightMoviePicker the right to:</p>
            <ul>
              <li>Collect and analyze anonymous usage data</li>
              <li>Use aggregated data for service improvement</li>
              <li>Share anonymous statistics with partners</li>
              <li>Store your preferences and watchlist data locally</li>
            </ul>
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

export default TermsOfService;