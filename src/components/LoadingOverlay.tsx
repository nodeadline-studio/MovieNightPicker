import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center z-50">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-red-600 mx-auto mb-4" />
        <p className="text-gray-400">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;