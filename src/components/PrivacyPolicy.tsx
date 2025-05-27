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
          >
            {""}
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="prose prose-invert max-w-none">
            <h3>Data Collection and Usage</h3>
            <p><strong>MovieNightPicker does NOT collect any personal data or user information.</strong></p>
            <p>Here's what we do and don't collect:</p>
            <ul>
              <li>❌ No personal information (names, emails, addresses)</li>
              <li>❌ No user tracking or behavior monitoring</li>
              <li>❌ No analytics or usage statistics</li>
              <li>❌ No server-side data storage</li>
              <li>✅ Local browser storage only (preferences, watchlist)</li>
              <li>✅ All data stays on your device</li>
            </ul>
            
            <p className="text-sm text-gray-400">Your privacy is completely protected - we simply don't collect any data about you.</p>
            
            <h3>Local Storage</h3>
            <p>MovieNightPicker uses only local browser storage for functionality:</p>
            <ul>
              <li>✅ Local storage for your movie preferences</li>
              <li>✅ Local storage for your watchlist</li>
              <li>✅ Local storage for filter settings</li>
              <li>❌ No tracking cookies</li>
              <li>❌ No analytics cookies</li>
              <li>❌ No third-party cookies</li>
            </ul>

            <h3>How Your Local Data Works</h3>
            <p>Since we don't collect any data, here's how your local data works:</p>
            <ul>
              <li>✅ All preferences stored locally in your browser</li>
              <li>✅ Your watchlist never leaves your device</li>
              <li>✅ Filter settings saved locally for convenience</li>
              <li>✅ You have full control over your data</li>
              <li>✅ Clear browser data to remove everything</li>
            </ul>

            <h3>Data Retention</h3>
            <p>Since no data is collected by us, all your preferences and watchlist data remains on your device until you choose to clear it through your browser settings.</p>

            <h3>Data Sharing</h3>
            <p><strong>We do not share any data because we don't collect any data.</strong></p>
            <ul>
              <li>❌ No data shared with analytics providers</li>
              <li>❌ No data shared with advertising partners</li>
              <li>❌ No data shared with third parties</li>
              <li>✅ Your data stays completely private</li>
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