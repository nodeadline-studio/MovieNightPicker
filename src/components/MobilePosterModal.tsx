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

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking on backdrop (not on modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] md:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))'
      }}
    >
      <div 
        className="relative w-full max-w-sm h-[80vh] overflow-hidden bg-gray-900 rounded-xl border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          aria-label="Close poster modal"
        >
          <X size={20} />
        </button>
        
        {/* Poster image */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl">
          <img
            className="w-full h-full object-cover rounded-xl"
            src={getImageUrl(movie.poster_path, 'original')}
            alt={`${movie.title} poster`}
          />
        </div>
      </div>
    </div>
  );
};

export default MobilePosterModal;
