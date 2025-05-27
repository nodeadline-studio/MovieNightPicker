import React, { useState, useEffect } from 'react';
import { BookMarked, X, Trash2, Star, Share2, Twitter, Facebook, Link, Download, Smartphone } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import { getImageUrl, fetchMovieDetails } from '../config/api';
import Button from './ui/Button';
import { analytics } from '../utils/analytics';
import * as gtag from '../utils/gtag';
import { generateWatchlistImage } from '../utils/imageGenerator';
import { canUseNativeShare, canUseClipboard, canShareWithFiles } from '../utils/shareUtils';

const WatchlistPanel: React.FC = () => {
  const { watchlist, removeFromWatchlist } = useMovieContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [updatedMovies, setUpdatedMovies] = useState<Record<number, { vote_average: number; imdb_id: string | null }>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (isOpen && watchlist.length > 0) {
      analytics.updateWatchlistSize(watchlist.length);
      watchlist.forEach(async (movie) => {
        try {
          const updatedMovie = await fetchMovieDetails(movie.id);
          if (updatedMovie) {
            setUpdatedMovies(prev => ({
              ...prev,
              [movie.id]: {
                vote_average: updatedMovie.vote_average,
                imdb_id: updatedMovie.imdb_id
              }
            }));
          }
        } catch (error) {
          console.error('Error updating movie score:', error);
        }
      });
    }
  }, [isOpen, watchlist]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showShareMenu]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const movie = watchlist.find(m => m.id === id);
    if (movie) {
      gtag.trackWatchlistRemove(movie.id, movie.title);
    }
    removeFromWatchlist(id);
  };

  const generateShareText = () => {
    if (watchlist.length === 0) return '';
    
    const movieTitles = watchlist.slice(0, 5).map(movie => movie.title).join(', ');
    const moreText = watchlist.length > 5 ? ` and ${watchlist.length - 5} more` : '';
    
    return `🎬 My Movie Watchlist: ${movieTitles}${moreText}! Find your perfect movie tonight with MovieNightPicker`;
  };

  const handleDownloadImage = async () => {
    if (watchlist.length === 0) return;
    
    setIsGeneratingImage(true);
    try {
      const imageDataUrl = await generateWatchlistImage({ 
        movies: watchlist,
        maxMovies: 6 
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `my-movie-watchlist-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowShareMenu(false);
      analytics.trackShare('download', watchlist.length);
      gtag.trackShare('download', watchlist.length);
    } catch (error) {
      console.error('Error generating watchlist image:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleNativeShare = async () => {
    if (!canUseNativeShare()) {
      // Fallback to download if native share not available
      await handleDownloadImage();
      return;
    }

    try {
      setIsGeneratingImage(true);
      const shareText = generateShareText();
      const url = window.location.origin;
      
      const imageDataUrl = await generateWatchlistImage({ 
        movies: watchlist,
        maxMovies: 6 
      });
      
      // Convert data URL to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'my-movie-watchlist.png', { type: 'image/png' });
      
      const shareData = {
        title: '🎬 My Movie Watchlist',
        text: shareText,
        url: url,
        files: [file]
      };
      
      if (canShareWithFiles([file])) {
        await navigator.share(shareData);
        setShowShareMenu(false);
        analytics.trackShare('native', watchlist.length);
        gtag.trackShare('native', watchlist.length);
      } else {
        // Fallback to download
        await handleDownloadImage();
      }
    } catch (error) {
      console.error('Error with native share:', error);
      // Fallback to download
      await handleDownloadImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSmartShare = async () => {
    try {
      setIsGeneratingImage(true);
      
      // Try native share first (mobile)
      if (canUseNativeShare()) {
        const shareText = generateShareText();
        const url = window.location.origin;
        
        const imageDataUrl = await generateWatchlistImage({ 
          movies: watchlist,
          maxMovies: 6 
        });
        
        // Convert data URL to blob
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'my-movie-watchlist.png', { type: 'image/png' });
        
        const shareData = {
          title: '🎬 My Movie Watchlist',
          text: shareText,
          url: url,
          files: [file]
        };
        
        if (canShareWithFiles([file])) {
          await navigator.share(shareData);
          setShowShareMenu(false);
          analytics.trackShare('smart', watchlist.length);
          gtag.trackShare('smart', watchlist.length);
          return;
        }
      }
      
      // Fallback: Copy to clipboard (desktop)
      if (canUseClipboard()) {
        const shareText = generateShareText();
        const imageDataUrl = await generateWatchlistImage({ 
          movies: watchlist,
          maxMovies: 6 
        });
        
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        
        // Also copy text to clipboard
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
        
        setShowShareMenu(false);
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        analytics.trackShare('smart', watchlist.length);
        gtag.trackShare('smart', watchlist.length);
        return;
      }
      
      // Final fallback: Download
      await handleDownloadImage();
      
    } catch (error) {
      console.error('Error with smart share:', error);
      // Ultimate fallback
      await handleDownloadImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'facebook' | 'copy' | 'download' | 'native' | 'smart') => {
    if (platform === 'download') {
      await handleDownloadImage();
      return;
    }

    if (platform === 'native') {
      await handleNativeShare();
      return;
    }

    if (platform === 'smart') {
      await handleSmartShare();
      return;
    }

    // Simple copy link functionality
    if (platform === 'copy') {
      const shareText = generateShareText();
      const url = window.location.origin;
      navigator.clipboard.writeText(`${shareText} ${url}`).then(() => {
        setShowShareMenu(false);
      });
    }
    
    analytics.trackShare(platform, watchlist.length);
    gtag.trackShare(platform, watchlist.length);
  };



  return (
    <div className="relative">
      {/* Modern Watchlist Button */}
             <button
         onClick={togglePanel}
         className="group fixed z-10 bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-4 md:static
                    bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                    hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                    text-white font-semibold px-6 py-3 rounded-2xl
                    shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                    transform hover:scale-[1.02] active:scale-[0.98]
                    transition-all duration-200 ease-out
                    flex items-center gap-3 select-none"
       >
                 <div className="relative">
           <BookMarked size={20} className="group-hover:rotate-6 transition-transform duration-200 ease-out" />
           {watchlist.length > 0 && (
             <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
               {watchlist.length}
             </div>
           )}
         </div>
        <span className="hidden md:block">Watchlist</span>
      </button>

             {/* Modern Dropdown Panel */}
       {isOpen && (
         <>
           {/* Overlay for all devices */}
           <div 
             className="fixed inset-0 bg-black/40 z-40"
             onClick={togglePanel}
           />
          
          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 md:absolute md:top-full md:right-0 md:left-auto md:w-96 z-50 md:mt-3">
            <div className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                           backdrop-blur-xl border border-white/10 
                           rounded-t-3xl md:rounded-3xl shadow-2xl
                           ring-1 ring-white/5">
              
              {/* Header with gradient */}
              <div className="relative p-6 border-b border-white/10">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-t-3xl md:rounded-t-3xl" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <BookMarked size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Watchlist</h3>
                      <p className="text-sm text-gray-400">{watchlist.length} movies saved</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Share Button */}
                    {watchlist.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowShareMenu(!showShareMenu);
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                        >
                          <Share2 size={20} />
                        </button>
                        
                        {/* Share Menu */}
                        {showShareMenu && (
                          <div 
                            className="absolute top-full right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 min-w-[220px] z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              {/* Smart Share - One button for all */}
                              <button
                                onClick={() => handleShare('smart')}
                                disabled={isGeneratingImage}
                                className="w-full flex items-center gap-3 p-3 text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                              >
                                <Share2 size={18} className="text-white" />
                                <span className="text-sm font-medium">
                                  {isGeneratingImage ? 'Preparing Image...' : 'Share with Image'}
                                </span>
                              </button>
                              
                              <div className="border-t border-white/10 my-2" />
                              
                              {/* Quick Options */}
                              <button
                                onClick={() => handleShare('copy')}
                                className="w-full flex items-center gap-3 p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                              >
                                <Link size={16} className="text-green-400" />
                                <span className="text-sm">Copy Link Only</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={togglePanel}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {watchlist.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                        <BookMarked size={32} className="text-gray-500" />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">No movies yet</h4>
                    <p className="text-gray-400 text-sm">
                      Start building your perfect movie collection
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {watchlist.map((movie, index) => (
                      <div 
                        key={movie.id} 
                        className="group relative bg-white/5 hover:bg-white/10 rounded-2xl p-4 
                                   border border-white/5 hover:border-white/20
                                   transition-all duration-300 ease-out
                                   hover:shadow-lg hover:shadow-purple-500/10"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animation: 'slideInUp 0.5s ease-out forwards'
                        }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Movie Poster */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={getImageUrl(movie.poster_path, 'w92')}
                              alt={movie.title}
                              className="w-16 h-24 object-cover rounded-xl shadow-lg"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-xl" />
                          </div>
                          
                          {/* Movie Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-sm mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all duration-300">
                              {movie.title}
                            </h4>
                            <p className="text-gray-400 text-xs mb-2">
                              {new Date(movie.release_date).getFullYear()}
                            </p>
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-yellow-400 fill-current" />
                              <span className="text-yellow-400 text-xs font-medium">
                                {(updatedMovies[movie.id]?.vote_average ?? movie.vote_average) > 0 
                                  ? (updatedMovies[movie.id]?.vote_average ?? movie.vote_average).toFixed(1)
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={(e) => handleRemove(movie.id, e)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 
                                     rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                            aria-label={`Remove ${movie.title} from watchlist`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-slideInUp">
          <div className="bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl border border-green-400/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                ✓
              </div>
              <span className="font-medium">Image and text copied to clipboard!</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WatchlistPanel;