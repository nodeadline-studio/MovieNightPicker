import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Movie } from '../types';
import { getImageUrl, isInTheaters } from '../config/api';
import { Heart, Star, Calendar, Clapperboard, ExternalLink, Sparkles, Shuffle, ChevronDown, X, Film } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import { usePickCounter } from '../hooks/usePickCounter';
import * as gtag from '../utils/gtag';
import MobilePosterModal from './MobilePosterModal';
import { preloadInterstitialAd } from '../utils/monetagAds';

interface PropellerAdsHook {
  visible: boolean;
  showInterstitial: (count: number) => void;
  close: () => void;
}

interface MovieCardProps {
  movie: Movie;
  isInWatchlist?: boolean;
  propellerAds: PropellerAdsHook;
  showDescriptionButton?: boolean;
  isButtonFading?: boolean;
  onShowDescription?: () => void;
  onHideDescription?: () => void;
  renderButtonOutside?: boolean;
  onButtonRender?: (button: React.ReactNode) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  movie, 
  isInWatchlist = false, 
  propellerAds, 
  showDescriptionButton = false, 
  isButtonFading = false, 
  onShowDescription, 
  onHideDescription,
  renderButtonOutside = false,
  onButtonRender
}) => {
  const { addToWatchlist, removeFromWatchlist, getRandomMovie, filterOptions } = useMovieContext();
  const pickCounter = usePickCounter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [isPosterLoading, setIsPosterLoading] = useState(true);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [shouldShowTextExpansion, setShouldShowTextExpansion] = useState(false);
  const buttonElementRef = useRef<React.ReactNode>(null);
  const lastButtonRef = useRef<React.ReactNode>(null);

  // Smart text expansion logic - only expand if text > 10% of screen height
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const checkTextExpansion = () => {
      if (typeof window !== 'undefined' && movie.overview) {
        // Use a more efficient approach - estimate based on text length
        const textLength = movie.overview.length;
        const screenHeight = window.innerHeight;
        const estimatedLines = Math.ceil(textLength / 80); // ~80 chars per line
        const estimatedHeight = estimatedLines * 21; // ~21px per line
        const mobileCollapsedHeight = 100; // Reduced from 120px to show more before expansion
        const expansionThreshold = mobileCollapsedHeight + 20; // ~1 row more (100px total)
        
        setShouldShowTextExpansion(estimatedHeight > expansionThreshold);
      }
    };
    
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkTextExpansion, 100);
    };
    
    checkTextExpansion();
    window.addEventListener('resize', debouncedCheck);
    return () => {
      window.removeEventListener('resize', debouncedCheck);
      clearTimeout(timeoutId);
    };
  }, [movie.overview]);

  // Reset poster loading state when movie changes
  useEffect(() => {
    setIsPosterLoading(true);
  }, [movie.id]);
  
  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      removeFromWatchlist(movie.id);
      gtag.trackWatchlistRemove(movie.id, movie.title);
    } else {
      addToWatchlist(movie);
      gtag.trackWatchlistAdd(movie.id, movie.title);
    }
  };

  const handleGetRandomMovie = async () => {
    try {
      // Don't allow new movie if ad is currently showing
      if (propellerAds.visible && propellerAds.adType === 'interstitial') {
        return; // Block movie loading until ad is closed
      }

      const count = pickCounter.inc();
      
      // Preload interstitial ad before 5th reroll (when count is 4, before showing)
      if (count === 4) {
        preloadInterstitialAd();
      }
      
      // Show interstitial ad every 5 picks (after 5th reroll)
      if (count >= 5 && count % 5 === 0) {
        propellerAds.showInterstitial(count);
        // Don't load new movie - wait for ad to be closed
        return;
      }
      
      // Get new movie only if no ad is showing
      if (!propellerAds.visible) {
        await getRandomMovie();
      }
    } catch (error) {
      console.error('Error getting random movie:', error);
    }
  };

  // Handle button rendering outside component (for desktop layout)
  // Always update button when movie changes - button should be available immediately when movie loads
  // This ensures button is visible as soon as movie is loaded, not waiting for About button
  useEffect(() => {
    // Create button element immediately when movie is available
    if (renderButtonOutside && onButtonRender && movie.id && buttonElementRef.current) {
      // Use requestAnimationFrame to avoid setState during render warning
      requestAnimationFrame(() => {
        if (buttonElementRef.current) {
          onButtonRender(buttonElementRef.current);
      lastButtonRef.current = buttonElementRef.current;
    }
      });
    }
  }, [renderButtonOutside, onButtonRender, movie.id]); // Removed showDescriptionButton - button should always be available
  
  // Dynamic text container height calculation for desktop
  // Strategy: Use minimal text size (text-sm), calculate actual text height, fit without overflow
  // Only allow scrolling if text absolutely cannot fit
  const textContainerHeight = useMemo(() => {
    if (typeof window === 'undefined' || isMobile || isTextExpanded) return 'auto';
    
    const viewportHeight = window.innerHeight;
    // Reserve space more accurately:
    // - Header: ~80px
    // - About button: ~44px (when visible)
    // - Card padding: ~32px (top + bottom)
    // - Title + meta: ~120px
    // - Genres: ~40px
    // - Action buttons: ~80px (height + margin)
    // - Footer: ~60px
    // - Spacing between elements: ~40px
    // Total: ~496px, use 500px for safety
    const reserved = 500;
    const available = viewportHeight - reserved;
    
    // Calculate text requirements with minimal font size (text-sm = 14px base, leading-relaxed = 1.625)
    const textLength = movie.overview?.length || 0;
    const charsPerLine = 85; // Characters per line at text-sm on desktop
    const lineHeight = 14 * 1.625; // ~22.75px per line
    const estimatedLines = Math.ceil(textLength / charsPerLine);
    const estimatedContentHeight = estimatedLines * lineHeight;
    
    // Available space for text (after reserving for other elements)
    // Use 95% of available to ensure buttons don't overlap
    const textAvailableSpace = Math.max(available * 0.95, 200); // 95% of available, minimum 200px
    
    // If content fits in available space, use content height; otherwise use available space (will scroll only if needed)
    return `${Math.min(estimatedContentHeight, textAvailableSpace)}px`;
  }, [isMobile, isTextExpanded, movie.overview]);

  // Dynamic font sizing: Use minimal text size (text-sm) for desktop to maximize content fit
  // Only increase size if there's plenty of space
  const textSizeClasses = useMemo(() => {
    if (typeof window === 'undefined' || isMobile) {
      return 'text-sm md:text-base lg:text-lg';
    }
    
    // Desktop: Always use text-sm (minimal) to fit maximum content
    // This ensures text block height calculation is accurate
    return 'text-sm';
  }, [isMobile]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const getYear = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).getFullYear().toString();
  };

  // Calculate max height for desktop movie card - ensure it fits viewport without scrolling
  const desktopCardMaxHeight = useMemo(() => {
    if (typeof window === 'undefined' || isMobile) return 'none';
    const viewportHeight = window.innerHeight;
    // Reserve: header (~80px) + About button (~44px when visible) + button (~60px) + footer (~60px) + spacing (~40px) = ~284px
    // Use 92% of available space to ensure everything fits
    const reserved = 284;
    const available = viewportHeight - reserved;
    return available > 400 ? `${available * 0.92}px` : 'none';
  }, [isMobile]);

  // Button component to avoid duplication
  const AboutButton = () => (
    <div className={`flex justify-center transition-all duration-300 ease-out pointer-events-none ${
      isButtonFading ? 'animate-[slideUp_0.3s_ease-out_forwards]' : 'animate-[slideDown_0.3s_ease-out_forwards]'
    }`}>
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onShowDescription}
          className="group inline-flex items-center gap-2 px-3 py-1.5 
                   bg-gradient-to-r from-slate-900/30 via-gray-900/20 to-slate-800/30
                   hover:from-slate-800/40 hover:via-gray-800/30 hover:to-slate-700/40
                   border border-white/5 hover:border-white/10 rounded-lg
                   text-gray-600 hover:text-gray-400 text-xs font-medium
                   transition-all duration-300 ease-out
                   hover:scale-105 active:scale-95 backdrop-blur-sm whitespace-nowrap"
        >
          <span>What's all about?</span>
          <ChevronDown size={12} className="group-hover:translate-y-0.5 transition-transform duration-200" />
        </button>
        <button 
          onClick={onHideDescription}
          className="p-1.5 text-gray-700 hover:text-gray-500 hover:bg-white/3 rounded-md
                   transition-all duration-200 ease-out"
          aria-label="Hide button"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[95vw] md:max-w-5xl lg:max-w-6xl mx-auto space-y-2 md:space-y-4 relative animate-[fadeIn_0.3s_ease-out]">
      {/* About Button - Desktop: Positioned 10-20px above card, maintaining minimal distance without overlapping */}
      {/* Use padding-top on container to reserve space, then position button absolutely within that space */}
      <div className="relative" style={{ paddingTop: showDescriptionButton && !isMobile ? '44px' : '0' }}>
      {showDescriptionButton && !isMobile && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto">
          <AboutButton />
        </div>
      )}
      
        {/* Movie Card - constant position, doesn't shift when About button appears */}
      <div className="relative group">
        {/* Background glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
        
        <div className="relative bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                       backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden 
                       shadow-2xl ring-1 ring-white/5 transform transition-transform duration-300 
                       hover:scale-[1.01] flex flex-col md:flex-row"
                       style={!isMobile ? { maxHeight: desktopCardMaxHeight, overflow: 'hidden' } : {}}
        >
          
          {/* About Button - Mobile: Positioned inside card */}
          {showDescriptionButton && isMobile && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
              <AboutButton />
            </div>
          )}
          
          <div className="flex flex-col md:flex-row h-full md:h-auto md:items-stretch">
            {/* Movie Poster - Maintain 2:3 ratio on desktop, fit by height without cutting */}
            <div className="w-full md:w-1/3 relative aspect-[2/3] max-h-[38vh] sm:max-h-[42vh] md:aspect-[2/3] md:h-auto md:max-h-full md:flex-shrink-0 md:flex md:flex-col">
              {/* Now Playing Badge - Top-left on desktop, bottom-right on mobile - ABOVE poster */}
              {isInTheaters(movie.release_date) && (
                <div className="absolute bottom-2 right-2 md:top-4 md:left-4 md:bottom-auto md:right-auto bg-gradient-to-r from-green-500 to-emerald-500 
                               text-white text-xs font-bold px-2 md:px-3 py-1 md:py-2 rounded-xl md:rounded-2xl z-[100] 
                               flex items-center gap-1 md:gap-2 shadow-lg backdrop-blur-sm pointer-events-none">
                  <Clapperboard size={10} className="md:hidden" aria-hidden="true" />
                  <Clapperboard size={12} className="hidden md:block" aria-hidden="true" />
                  <span className="text-xs">Now Playing</span>
                </div>
              )}
              
              {/* Poster Image - wrapper to match image bounds on desktop */}
              <div 
                className="relative w-full h-full flex items-start cursor-pointer md:cursor-default md:flex md:items-stretch"
                onClick={(e) => {
                  e.stopPropagation();
                  // Use CSS media query approach for better mobile detection
                  const isMobile = window.matchMedia('(max-width: 767px)').matches;
                  if (isMobile) {
                    e.preventDefault();
                    setIsPosterModalOpen(true);
                  }
                }}
              >
                {/* Image wrapper - matches image bounds on desktop with object-contain, fit by height */}
                <div className="relative h-full w-full md:h-full md:w-auto md:flex-shrink-0 overflow-hidden">
                {/* Loading state with icon - shown while poster is loading */}
                  {isPosterLoading && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center pointer-events-none z-10">
                      <div className="flex flex-col items-center gap-3">
                        <Film size={48} className="text-gray-500 animate-pulse" />
                        <div className="text-gray-500 text-sm">Loading...</div>
                      </div>
                    </div>
                  )}
                
                <img
                    className="w-full h-full object-cover md:object-contain md:h-full md:w-auto transition-opacity duration-300 group-hover:scale-105 relative z-0 pointer-events-auto"
                  src={getImageUrl(movie.poster_path)}
                  alt={`Movie poster for ${movie.title}`}
                  loading="lazy"
                    decoding="async"
                  itemProp="image"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use CSS media query approach for better mobile detection
                    const isMobile = window.matchMedia('(max-width: 767px)').matches;
                    if (isMobile) {
                        e.preventDefault();
                      setIsPosterModalOpen(true);
                    }
                  }}
                  onLoad={(e) => {
                    setIsPosterLoading(false);
                    const target = e.target as HTMLImageElement;
                    target.style.opacity = '1';
                  }}
                  onError={(e) => {
                    setIsPosterLoading(false);
                    const target = e.target as HTMLImageElement;
                    // Hide the image and show error state
                    target.style.display = 'none';
                    const loadingState = target.previousElementSibling as HTMLElement;
                    if (loadingState) {
                      loadingState.innerHTML = `
                        <div class="flex flex-col items-center justify-center text-gray-400">
                          <div class="w-16 h-16 bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                            </svg>
                          </div>
                          <span class="text-sm">No Image</span>
                        </div>
                      `;
                    }
                  }}
                  style={{
                      objectPosition: isMobile ? 'center 20%' : 'center center',
                    opacity: isPosterLoading ? 0 : 1,
                    transition: 'opacity 0.3s ease-in-out'
                  }}
                />
                  {/* Overlay - matches poster image bounds (only covers image, not empty space) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20" />
                  
                  {/* Watchlist Button - positioned inside image wrapper on desktop */}
                  {!isMobile && (
                    <div className="absolute top-2 md:top-4 right-2 md:right-4 z-30">
                <button
                  onClick={handleWatchlistToggle}
                  className={`p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg ${
                    isInWatchlist 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                      : 'bg-black/60 text-white hover:bg-black/80'
                  }`}
                  aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300 hover:scale-110`} size={16} />
                </button>
              </div>
                  )}
                </div>
                
                {/* Watchlist Button - on mobile, positioned outside image wrapper */}
                {isMobile && (
                  <div className="absolute top-2 md:top-4 right-2 md:right-2 z-30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleWatchlistToggle();
                      }}
                      className={`p-2 md:p-3 rounded-xl md:rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg ${
                        isInWatchlist 
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' 
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      aria-label={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300 hover:scale-110`} size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Rating Badge - 15% bigger on desktop, aligned to poster bottom-left, on top of overlay */}
              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 bg-black/80 backdrop-blur-sm p-2 md:p-3 rounded-xl md:rounded-2xl shadow-lg z-30" style={{ left: isMobile ? '0.5rem' : '0.75rem' }}>
                <div className="flex items-center gap-1 md:gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDb"
                    className="h-3 md:h-[4.6px]"
                  />
                  <span className="text-yellow-400 font-bold flex items-center gap-1 text-xs md:text-[13.8px]">
                    <Star size={12} className="md:hidden fill-current" />
                    <Star size={16} className="hidden md:block fill-current" />
                    {movie.vote_average > 0 ? (movie.vote_average).toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              
            </div>
            
            {/* Movie Details - aligned relative to poster on desktop */}
            <div className="md:w-2/3 md:ml-0 p-3 md:p-6 lg:p-8 flex flex-col flex-1 min-h-0 overflow-y-auto scrollbar-hide">
              {/* Header */}
              <div className="mb-3 md:mb-6">
                <h2 className="text-lg md:text-2xl lg:text-4xl font-bold text-white leading-tight mb-2 md:mb-3 
                             bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                    {movie.title}
                  {movie.release_date && (
                    <span className="text-gray-400 ml-2 md:ml-3 text-base md:text-xl lg:text-2xl">
                      ({getYear(movie.release_date)})
                          </span>
                        )}
                </h2>
                
                {/* Movie Meta */}
                <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Calendar size={12} className="md:hidden text-blue-400" />
                    <Calendar size={16} className="hidden md:block text-blue-400" />
                    <span className="text-xs md:text-sm">{formatDate(movie.release_date)}</span>
                    </div>
                  
                  <div className="flex items-center gap-1 md:gap-2 bg-white/5 px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl">
                    <Star size={12} className="md:hidden text-yellow-400" />
                    <Star size={16} className="hidden md:block text-yellow-400" />
                    <span className="text-xs md:text-sm">{movie.vote_average > 0 ? `${movie.vote_average.toFixed(1)}/10` : 'Not rated'}</span>
                  </div>
                </div>
              </div>
              
              {/* Genres */}
              <div className="mb-3 md:mb-4">
                <div className="flex flex-wrap gap-1 md:gap-2 items-center">
                  {movie.genres && movie.genres.slice(0, 4).map((genre, index) => (
                    <span
                      key={genre.id}
                      className="inline-flex px-2 md:px-3 py-1 md:py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 
                               text-xs md:text-sm text-gray-300 rounded-lg md:rounded-xl border border-white/10
                               hover:from-indigo-500/30 hover:to-purple-500/30 transition-all duration-200 whitespace-nowrap"
                      style={{
                        animationName: 'slideInUp',
                        animationDuration: '0.5s',
                        animationTimingFunction: 'ease-out',
                        animationFillMode: 'forwards',
                        animationDelay: `${index * 100}ms`
                      }}
                    >
                      {genre.name}
                    </span>
                  ))}
                  {movie.genres && movie.genres.length > 4 && (
                    <span className="inline-flex px-2 md:px-3 py-1 md:py-2 bg-white/5 text-xs md:text-sm text-gray-400 rounded-lg md:rounded-xl whitespace-nowrap">
                      +{movie.genres.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              
                {/* Overview */}
                <div className="flex-1 min-h-0 mb-2 md:mb-4">
                  <div 
                    className="flex flex-col transition-all duration-300 ease-out"
                    style={{
                      transformOrigin: 'top center',
                      ...(isMobile ? {} : { 
                        // Desktop: use calculated height to fit text without overflowing buttons
                        maxHeight: isTextExpanded ? 'none' : textContainerHeight,
                        overflow: isTextExpanded ? 'visible' : 'auto', // Allow scroll only if text doesn't fit
                        overflowY: isTextExpanded ? 'visible' : 'auto',
                        // Ensure minimum spacing from buttons below
                        marginBottom: isTextExpanded ? '0' : '0.5rem',
                      })
                    }}
                  >
                    <p 
                      className={`text-gray-300 ${textSizeClasses} leading-relaxed ${
                        isTextExpanded 
                          ? '' 
                          : isMobile && shouldShowTextExpansion
                            ? 'line-clamp-4' // Use line-clamp for reliable truncation
                            : ''
                      }`}
                      onClick={isMobile && shouldShowTextExpansion ? (e) => {
                      e.stopPropagation();
                      setIsTextExpanded(!isTextExpanded);
                      } : undefined}
                      style={isMobile && shouldShowTextExpansion ? { cursor: 'pointer' } : {}}
                >
                    {movie.overview}
                  </p>
                    
                    {/* Label inline after text (mobile only) - positioned below text, not overlapping */}
                    {shouldShowTextExpansion && isMobile && (
                      <div 
                        className="text-right mt-2 text-xs text-indigo-400/80 pointer-events-none"
                        onClick={isMobile && shouldShowTextExpansion ? (e) => {
                          e.stopPropagation();
                          setIsTextExpanded(!isTextExpanded);
                        } : undefined}
                        style={isMobile && shouldShowTextExpansion ? { cursor: 'pointer', pointerEvents: 'auto' } : {}}
                      >
                        {isTextExpanded ? 'Show less' : 'Show more'}
                      </div>
                    )}
                  </div>
                </div>
              
              {/* Action Buttons - Horizontal Layout */}
              <div className="flex flex-row gap-2 md:gap-3 mt-2 md:mt-3 flex-shrink-0">
                <button
                  onClick={() => window.open(`https://www.imdb.com/title/${movie.imdb_id}`, '_blank')}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 
                           hover:from-yellow-400 hover:to-orange-400
                           text-black font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl
                           shadow-lg hover:shadow-xl hover:shadow-yellow-500/25
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200 ease-out
                           flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base"
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2016.svg"
                    alt="IMDb"
                    className="h-4 md:h-5"
                  />
                  <span className="hidden md:inline">View on IMDb</span>
                  <span className="md:hidden">IMDb</span>
                  <ExternalLink size={16} className="md:hidden" />
                  <ExternalLink size={18} className="hidden md:block" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWatchlistToggle();
                  }}
                  className={`flex-1 font-semibold py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl
                            shadow-lg hover:shadow-xl
                            transform hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200 ease-out
                            flex items-center justify-center gap-2 md:gap-3 text-sm md:text-base ${
                    isInWatchlist
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white hover:shadow-pink-500/25'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
                  }`}
                >
                  <Heart className={`${isInWatchlist ? 'fill-current' : ''} transition-transform duration-300`} size={16} />
                  <span className="hidden md:inline">{isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}</span>
                  <span className="md:hidden">{isInWatchlist ? 'Remove' : 'Add'}</span>
                </button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Random Movie/Show Button - Full width on mobile */}
      {(() => {
        const buttonElement = (
      <div className="flex justify-center">
        <button
          onClick={handleGetRandomMovie}
              className="group relative text-white font-semibold py-[22px] lg:py-5 px-9 lg:px-10 rounded-2xl
                   shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                   transform hover:scale-[1.02] active:scale-[0.98]
                   transition-all duration-200 ease-out
                   flex items-center justify-center gap-3 text-sm md:text-base
                       overflow-hidden w-auto min-w-[200px] md:min-w-[240px] lg:min-w-[280px]
                   bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 
                   hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-3">
            <Shuffle size={18} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="hidden sm:inline">
              {filterOptions.tvShowsOnly ? 'Get Another Show' : 'Get Another Movie'}
            </span>
            <span className="sm:hidden">
              {filterOptions.tvShowsOnly ? 'Another Show' : 'Another Movie'}
            </span>
            <Sparkles size={16} className="group-hover:scale-110 transition-transform duration-300" />
          </div>
        </button>
      </div>
        );
        
        // Store button element in ref for useEffect - always store
        buttonElementRef.current = buttonElement;
        
        // On mobile, render button inside component
        // On desktop, button will be rendered outside via useEffect callback
        if (renderButtonOutside) {
          return null;
        }
        
        return buttonElement;
      })()}


      {/* Mobile Poster Modal */}
      <MobilePosterModal 
        movie={movie} 
        isOpen={isPosterModalOpen} 
        onClose={() => setIsPosterModalOpen(false)} 
      />
    </div>
  );
};

// Memoize MovieCard to prevent unnecessary re-renders
export default React.memo(MovieCard, (prevProps, nextProps) => {
  return prevProps.movie.id === nextProps.movie.id &&
         prevProps.isInWatchlist === nextProps.isInWatchlist &&
         prevProps.showDescriptionButton === nextProps.showDescriptionButton &&
         prevProps.isButtonFading === nextProps.isButtonFading;
});