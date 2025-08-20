import React, { useState, useEffect, useCallback } from 'react';
import { 
  BookMarked, X, Share2, 
  Film, Tv, Star, Calendar, ExternalLink, Trash2, Eye, EyeOff 
} from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import { generateWatchlistImage } from '../utils/imageGenerator';
import * as gtag from '../utils/gtag';
import { fetchMovieDetails, getImageUrl } from '../config/api';
import { canUseNativeShare, canShareWithFiles, canUseClipboard } from '../utils/shareUtils';

const WatchlistPanel: React.FC = () => {
  const { watchlist, removeFromWatchlist } = useMovieContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [updatedMovies, setUpdatedMovies] = useState<Record<number, { vote_average: number; imdb_id: string | null }>>({});
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [previewMovie, setPreviewMovie] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Separate movies and TV shows
  const movies = watchlist.filter(item => item.contentType === 'movie');
  const tvShows = watchlist.filter(item => item.contentType === 'tv');
  
  // Handle legacy items without contentType (assume they are movies)
  const legacyItems = watchlist.filter(item => !item.contentType);
  const allMovies = [...movies, ...legacyItems];

  const getDisplayText = () => {
    const movieCount = allMovies.length;
    const tvCount = tvShows.length;
    
    if (movieCount === 0 && tvCount === 0) return '0 items';
    if (movieCount > 0 && tvCount === 0) return `${movieCount} movie${movieCount !== 1 ? 's' : ''}`;
    if (movieCount === 0 && tvCount > 0) return `${tvCount} show${tvCount !== 1 ? 's' : ''}`;
    return `${movieCount} movie${movieCount !== 1 ? 's' : ''}, ${tvCount} show${tvCount !== 1 ? 's' : ''}`;
  };

  useEffect(() => {
    if (isOpen && watchlist.length > 0) {
      // analytics.updateWatchlistSize(watchlist.length); // Method doesn't exist
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

  // Animation control - only animate once when panel opens
  useEffect(() => {
    if (isOpen && !hasAnimated) {
      setHasAnimated(true);
    } else if (!isOpen) {
      setHasAnimated(false);
    }
  }, [isOpen, hasAnimated]);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showShareMenu) {
        setShowShareMenu(false);
      }
    };

    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showShareMenu]);

  const togglePanel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(!isOpen);
  };

  const closePanel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsOpen(false);
  };

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const movie = watchlist.find(m => m.id === id);
    if (movie) {
      gtag.trackWatchlistRemove(movie.id, movie.title);
    }
    removeFromWatchlist(id);
  };

  const handlePreviewClick = (movieId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewMovie(previewMovie === movieId ? null : movieId);
  };

  const generateShareText = () => {
    if (watchlist.length === 0) return '';
    
    const titles = watchlist.slice(0, 5).map(movie => movie.title).join(', ');
    const moreText = watchlist.length > 5 ? ` and ${watchlist.length - 5} more` : '';
    
    return `🎬 My Watchlist: ${titles}${moreText}! Find your perfect movie or show tonight with MovieNightPicker`;
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
      link.download = `my-watchlist-${new Date().toISOString().split('T')[0]}.png`;
      link.href = imageDataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowShareMenu(false);
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
      const file = new File([blob], 'my-watchlist.png', { type: 'image/png' });
      
      const shareData = {
        title: '🎬 My Watchlist',
        text: shareText,
        url: url,
        files: [file]
      };
      
      if (canShareWithFiles([file])) {
        await navigator.share(shareData);
        setShowShareMenu(false);
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

  const handleClipboardShare = async () => {
    if (watchlist.length === 0) return;
    
    try {
      const shareText = generateShareText();
      const url = window.location.origin;
      const fullText = `${shareText}\n\n${url}`;
      
      // Generate image
      const imageDataUrl = await generateWatchlistImage({ 
        movies: watchlist,
        maxMovies: 6 
      });
      
      // Convert to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      
      // Try to copy both image and text if supported
      if (navigator.clipboard?.write) {
        try {
          // Create clipboard items with both text and image
          const clipboardItems = [
            new ClipboardItem({
              'text/plain': new Blob([fullText], { type: 'text/plain' }),
              'image/png': blob
            })
          ];
          
          await navigator.clipboard.write(clipboardItems);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        } catch (error) {
          console.warn('Failed to copy both text and image, trying text only:', error);
          // Fallback to text only
          await navigator.clipboard.writeText(fullText);
          setShowSuccessMessage(true);
          setTimeout(() => setShowSuccessMessage(false), 3000);
        }
      } else if (canUseClipboard()) {
        // Fallback to text only
        await navigator.clipboard.writeText(fullText);
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        throw new Error('Clipboard not supported');
      }
      
      setShowShareMenu(false);
      gtag.trackShare('clipboard', watchlist.length);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback to download
      await handleDownloadImage();
    }
  };

  const handleSmartShare = async () => {
    try {
      setIsGeneratingImage(true);
      
      // Mobile: Try native share first
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
        const file = new File([blob], 'my-watchlist.png', { type: 'image/png' });
        
        const shareData = {
          title: '🎬 My Watchlist',
          text: shareText,
          url: url,
          files: [file]
        };
        
        if (canShareWithFiles([file])) {
          await navigator.share(shareData);
          setShowShareMenu(false);
          gtag.trackShare('native', watchlist.length);
        } else {
          // Fallback to clipboard
          await handleClipboardShare();
        }
      } else {
        // Desktop: copy to clipboard with both text and image
        await handleClipboardShare();
      }
    } catch (error) {
      console.error('Error with smart share:', error);
      // Final fallback to download
      await handleDownloadImage();
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = useCallback(async (platform: 'twitter' | 'facebook' | 'copy' | 'download' | 'native' | 'smart') => {
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

    // Simple copy link functionality - DEPRECATED (now integrated into smart share)
    if (platform === 'copy') {
      await handleClipboardShare();
      return;
    }
    
    gtag.trackShare(platform, watchlist.length);
  }, [watchlist.length, handleClipboardShare, handleDownloadImage, handleNativeShare, handleSmartShare]);

  // Component for rendering a section of watchlist items
  const WatchlistSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    items: typeof watchlist;
  }> = ({ title, icon, items }) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-2">
          {icon}
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <span className="text-xs text-gray-400">({items.length})</span>
        </div>
        <div className="space-y-3">
          {items.map((movie, index) => (
            <div 
              key={movie.id} 
              className={`group relative bg-white/5 hover:bg-white/10 rounded-2xl p-4 
                         border border-white/5 hover:border-white/20
                         transition-all duration-200 ease-out
                         hover:shadow-lg hover:shadow-purple-500/10
                         ${hasAnimated ? '' : 'opacity-0 translate-y-4'}`}
              style={{
                ...(hasAnimated ? {} : {
                  animationName: 'slideInUp',
                  animationDuration: '0.5s',
                  animationTimingFunction: 'ease-out',
                  animationFillMode: 'forwards',
                  animationDelay: `${index * 50}ms`
                })
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
                  <h4 className="font-semibold text-white text-sm mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-400 group-hover:to-purple-400 transition-all duration-200">
                    {movie.title}
                  </h4>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                    
                    {(updatedMovies[movie.id]?.vote_average !== undefined ? updatedMovies[movie.id]?.vote_average : movie.vote_average) && (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        <span>{(updatedMovies[movie.id] && updatedMovies[movie.id].vote_average !== undefined ? updatedMovies[movie.id].vote_average : movie.vote_average).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handlePreviewClick(movie.id, e)}
                      className="text-indigo-400 hover:text-indigo-300 p-1 rounded transition-colors duration-200"
                      title={previewMovie === movie.id ? "Hide details" : "Show details"}
                    >
                      {previewMovie === movie.id ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    
                    {((updatedMovies[movie.id] && updatedMovies[movie.id].imdb_id) || movie.imdb_id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const imdbId = (updatedMovies[movie.id] && updatedMovies[movie.id].imdb_id) || movie.imdb_id;
                          if (imdbId) {
                            window.open(`https://www.imdb.com/title/${imdbId}`, '_blank');
                          }
                        }}
                        className="text-yellow-400 hover:text-yellow-300 p-1 rounded transition-colors duration-200"
                        title="View on IMDb"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => handleRemove(movie.id, e)}
                      className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200 ml-auto"
                      title="Remove from watchlist"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Preview */}
              {previewMovie === movie.id && (
                <MoviePreview movie={movie} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Movie Preview Component (inline expanded details)
  const MoviePreview: React.FC<{ movie: typeof watchlist[0] }> = ({ movie }) => {
    const getYear = (dateString: string): string => {
      return new Date(dateString).getFullYear().toString();
    };

    return (
      <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-slideInUp">
        <div className="flex gap-4">
          {/* Larger Poster */}
          <div className="flex-shrink-0">
            <img
              src={getImageUrl(movie.poster_path, 'w300')}
              alt={movie.title}
              className="w-32 h-48 object-cover rounded-2xl shadow-2xl"
            />
          </div>
          
          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                {movie.title}
              </h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{getYear(movie.release_date)}</span>
                </div>
              </div>
            </div>

            {movie.overview && (
              <div>
                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                  {movie.overview}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {((updatedMovies[movie.id] && updatedMovies[movie.id].imdb_id) || movie.imdb_id) && (
                <button
                  onClick={() => {
                    const imdbId = (updatedMovies[movie.id] && updatedMovies[movie.id].imdb_id) || movie.imdb_id;
                    if (imdbId) {
                      window.open(`https://www.imdb.com/title/${imdbId}`, '_blank');
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 
                           hover:from-yellow-400 hover:to-orange-400
                           text-black font-semibold py-2 px-3 rounded-xl
                           shadow-lg hover:shadow-xl hover:shadow-yellow-500/25
                           transition-all duration-150 ease-out hover:scale-[1.01]
                           flex items-center justify-center gap-2 text-sm"
                >
                  IMDb
                  <ExternalLink size={14} />
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(movie.id, e);
                  setPreviewMovie(null);
                }}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 
                         hover:from-red-400 hover:to-rose-400
                         text-white font-semibold py-2 px-3 rounded-xl
                         shadow-lg hover:shadow-xl hover:shadow-red-500/25
                         transition-all duration-150 ease-out hover:scale-[1.01]
                         flex items-center justify-center gap-2 text-sm"
              >
                Remove
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Modern Watchlist Button */}
      <button
        onClick={togglePanel}
        className="group fixed z-10 bottom-4 left-4 md:static
                   bg-transparent border-2 border-white/30 hover:border-white/50
                   text-white font-semibold px-6 py-3 rounded-2xl
                   hover:bg-white/10 backdrop-blur-sm
                   transition-all duration-150 ease-out hover:scale-[1.01]
                   flex items-center gap-3 select-none"
      >
        <div className="relative">
          <BookMarked size={20} className="group-hover:rotate-3 transition-transform duration-150 ease-out" />
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
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-200 ease-out ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closePanel}
          />
          
          {/* Panel */}
          <div className={`fixed bottom-0 left-0 right-0 md:absolute md:top-full md:right-0 md:left-auto md:w-96 z-50 md:mt-3 
                          transition-all duration-200 ease-out ${
            isOpen 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-full md:translate-y-4 opacity-0 scale-95'
          }`}>
            <div className="bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                           backdrop-blur-xl border border-white/10 
                           rounded-t-3xl md:rounded-3xl shadow-2xl
                           ring-1 ring-white/5
                           max-h-[calc(100vh-6rem)] md:max-h-[calc(80vh)]
                           flex flex-col">
              
              {/* Header with gradient */}
              <div className="relative p-6 border-b border-white/10 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 rounded-t-3xl md:rounded-t-3xl" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <BookMarked size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Your Watchlist</h3>
                      <p className="text-sm text-gray-400">{getDisplayText()}</p>
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
                            className="absolute top-full right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 min-w-[200px] z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="space-y-2">
                              {/* Share Button */}
                              <button
                                onClick={() => handleShare('smart')}
                                disabled={isGeneratingImage}
                                className="w-full flex items-center gap-3 p-3 text-left text-white hover:bg-white/10 hover:scale-[1.02] rounded-xl transition-all duration-200 disabled:opacity-50"
                              >
                                <div className="w-5 h-5 flex items-center justify-center">
                                  📋
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium">Share</span>
                                  <p className="text-xs text-gray-400 mt-0.5">Copy & share</p>
                                </div>
                              </button>
                              
                              {/* Download Button */}
                              <button
                                onClick={() => handleShare('download')}
                                disabled={isGeneratingImage}
                                className="w-full flex items-center gap-3 p-3 text-left text-white hover:bg-white/10 hover:scale-[1.02] rounded-xl transition-all duration-200 disabled:opacity-50"
                              >
                                <div className="w-5 h-5 flex items-center justify-center">
                                  {isGeneratingImage ? '⏳' : '💾'}
                                </div>
                                <div className="flex-1">
                                  <span className="font-medium">
                                    {isGeneratingImage ? 'Creating...' : 'Download'}
                                  </span>
                                  <p className="text-xs text-gray-400 mt-0.5">Save image</p>
                                </div>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={closePanel}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content - Scrollable Area */}
              <div className="flex-1 overflow-hidden">
                {watchlist.length === 0 ? (
                  <div className="p-6">
                    <div className="text-center py-12">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                          <BookMarked size={32} className="text-gray-500" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-xl" />
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">No items yet</h4>
                      <p className="text-gray-400 text-sm">
                        Start building your perfect watchlist
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-y-auto scrollbar-hide p-6">
                    <div className="space-y-4">
                      {allMovies.length > 0 && (
                        <WatchlistSection
                          title="Movies"
                          icon={<Film size={16} className="text-blue-400" />}
                          items={allMovies}
                        />
                      )}
                      
                      {allMovies.length > 0 && tvShows.length > 0 && (
                        <div className="border-t border-white/10 my-4"></div>
                      )}
                      
                      {tvShows.length > 0 && (
                        <WatchlistSection
                          title="TV Shows"
                          icon={<Tv size={16} className="text-purple-400" />}
                          items={tvShows}
                        />
                      )}
                    </div>
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
              <span className="font-medium">Copied to clipboard!</span>
            </div>
          </div>
        </div>
      )}

      {/* Copied Message */}
      {/* showCopiedMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-slideInUp">
          <div className="bg-blue-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl shadow-2xl border border-blue-400/20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                ✨
              </div>
              <span className="font-medium">Link copied to clipboard!</span>
            </div>
          </div>
        </div>
      ) */}
    </div>
  );
};

export default WatchlistPanel;