import React, { useState, useEffect } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import { analytics } from '../utils/analytics';

interface BirthYearVerificationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const BirthYearVerification: React.FC<BirthYearVerificationProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [year, setYear] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    setYear('');
    setIsValid(null);
  }, [isOpen]);
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 4);
    setYear(value);

    if (value.length === 4) {
      const birthYear = parseInt(value);
      const age = new Date().getFullYear() - birthYear;
      const isAgeValid = age >= 18 && age <= 100;
      setIsValid(isAgeValid && birthYear >= 1900 && birthYear <= new Date().getFullYear());
    } else {
      setIsValid(null);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      const birthYear = parseInt(year);
      analytics.setBirthYear(birthYear);
      onConfirm();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-start md:items-center justify-center z-50 animate-fadeIn p-4 pt-8 md:pt-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl overflow-hidden">
        <div className="bg-gray-800/50 p-6 border-b border-gray-800">
          <div className="flex items-center justify-center">
            <ShieldCheck size={32} className="text-blue-500 mr-3" />
            <h3 className="text-2xl font-bold text-white">Age Verification</h3>
          </div>
        </div>

        <div className="p-6">
        <div className="text-center mb-6">
          <p className="text-gray-300 leading-relaxed">
            To access adult content, please verify that you are 18 years or older by entering your birth year.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                  Year:
                </div>
                <input 
                  inputMode="numeric"
                  pattern="\d*"
                  value={year}
                  onChange={handleYearChange}
                  placeholder="YYYY"
                  className={`w-full bg-gray-800 border fixed-input ${
                    isValid === null 
                      ? 'border-gray-700' 
                      : isValid 
                        ? 'border-green-500' 
                        : 'border-red-500'
                  } rounded-lg pl-16 pr-24 py-4 text-center text-2xl font-medium tracking-wider focus:outline-none focus:ring-2 ${
                    isValid === null 
                      ? 'focus:ring-blue-500/20' 
                      : isValid 
                        ? 'focus:ring-green-500/20' 
                        : 'focus:ring-red-500/20'
                  }`}
                  autoFocus
                />
                {isValid !== null && (
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium ${
                    isValid ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isValid ? '✓ Valid' : '✗ Must be 18-100 years old'}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter a valid birth year between 1900 and {new Date().getFullYear()}
              </p>
              
              {isValid === false && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start">
                  <AlertCircle size={20} className="text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">
                    You must be between 18 and 100 years old to access adult content.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="border-t border-gray-800 p-6 bg-gray-800/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!isValid}
              fullWidth
            >
              Verify Age
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthYearVerification;