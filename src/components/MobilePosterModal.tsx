import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Movie } from '../types';
import { getImageUrl } from '../config/api';

interface MobilePosterModalProps {
  movie: Movie;
  isOpen: boolean;
  onClose: () => void;
}

const MobilePosterModal: React.FC<MobilePosterModalProps> = ({ movie, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-sm h-[80vh] overflow-hidden bg-gray-900 rounded-xl border border-gray-700">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Close poster modal"
        >
          <X size={20} />
        </button>
        
        {/* Poster image */}
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <img
            className="w-full h-full object-contain rounded-lg"
            src={getImageUrl(movie.poster_path, 'original')}
            alt={`${movie.title} poster`}
          />
        </div>
      </div>
    </div>
  );
};

export default MobilePosterModal;
