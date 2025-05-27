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
          >
            {""}
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="prose prose-invert max-w-none">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using MovieNightPicker, you accept and agree to be bound by the terms and provision of this agreement.</p>

            <h3>2. Privacy and Data Collection</h3>
            <p><strong>MovieNightPicker is committed to complete user privacy:</strong></p>
            <ul>
              <li>❌ No personal information collected (names, emails, addresses)</li>
              <li>❌ No user tracking, analytics, or behavior monitoring</li>
              <li>❌ No cookies for tracking or advertising purposes</li>
              <li>❌ No server-side data storage or transmission</li>
              <li>✅ Only local browser storage for functionality</li>
              <li>✅ All preferences and watchlist data stays on your device</li>
              <li>✅ Complete user control over local data</li>
              <li>✅ No third-party data sharing whatsoever</li>
            </ul>
            <p className="text-sm text-gray-400">Your privacy is our priority - we simply don't collect any data about you.</p>

            <h3>3. Use License</h3>
            <p>Permission is granted to temporarily access the materials (information or software) on NightMoviePicker for personal, non-commercial transitory viewing only.</p>

            <h3>4. Disclaimer</h3>
            <p>The materials on MovieNightPicker are provided on an 'as is' basis. MovieNightPicker makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

            <h3>5. Limitations</h3>
            <p>In no event shall MovieNightPicker or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on MovieNightPicker.</p>

            <h3>6. Revisions and Errata</h3>
            <p>The materials appearing on MovieNightPicker could include technical, typographical, or photographic errors. MovieNightPicker does not warrant that any of the materials on its website are accurate, complete or current.</p>

            <h3>7. Monetization Rights</h3>
            <p><strong>MovieNightPicker reserves comprehensive monetization rights:</strong></p>
            
            <h4>Advertising Rights:</h4>
            <ul>
              <li>✅ Display video advertisements between movie selections</li>
              <li>✅ Show banner advertisements in designated areas</li>
              <li>✅ Include sponsored movie recommendations</li>
              <li>✅ Feature promotional content from partners</li>
              <li>✅ Implement interstitial ads during user interactions</li>
            </ul>
            
            <h4>Premium Features:</h4>
            <ul>
              <li>✅ Introduce subscription-based premium tiers</li>
              <li>✅ Offer ad-free experiences for subscribers</li>
              <li>✅ Provide exclusive features for paying users</li>
              <li>✅ Implement freemium model limitations</li>
              <li>✅ Create VIP access to new features</li>
            </ul>
            
            <h4>Partnership Rights:</h4>
            <ul>
              <li>✅ Partner with streaming services for referrals</li>
              <li>✅ Integrate third-party monetization platforms</li>
              <li>✅ Collaborate with movie studios for promotions</li>
              <li>✅ Implement affiliate marketing programs</li>
            </ul>
            
            <p className="text-sm text-gray-400">Users will be notified of significant monetization changes through the service interface. Continued use constitutes acceptance of new monetization features.</p>
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