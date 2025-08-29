import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Film, ChevronDown, X } from 'lucide-react'; 
import { useMovieContext } from '../context/MovieContext';
import { usePickCounter } from '../hooks/usePickCounter';
import { timers } from '../utils/timers';
import { useVideoAd } from '../hooks/useVideoAd';
import { useVideoPreload } from '../hooks/useVideoPreload';
import { useQuery } from '@tanstack/react-query';
import { fetchGenres } from '../config/api';
import MovieCard from '../components/MovieCard';
import MovieCardSkeleton from '../components/MovieCardSkeleton';
import FilterPanel from '../components/FilterPanel';
import WatchlistPanel from '../components/WatchlistPanel';
import NoMoviesFound from '../components/NoMoviesFound';
import CookieConsent from '../components/CookieConsent';
import PrivacyPolicy from '../components/PrivacyPolicy';
import TermsOfService from '../components/TermsOfService';
import PlaceholderMovieCard from '../components/PlaceholderMovieCard';
import VideoAd from '../components/VideoAd';
import GoogleVideoAd from '../components/GoogleVideoAd';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingState } from '../types';

const Desktop = ({ children }: { children: React.ReactNode }) =>
  useMediaQuery({ minWidth: 1200 }) ? children : null;
const Mobile = ({ children }: { children: React.ReactNode }) =>
  useMediaQuery({ maxWidth: 767 }) ? children : null;

const generateMathProblem = (difficulty: number = 1) => {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];
  let num1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
  let num2 = Math.floor(Math.random() * (10 * difficulty)) + 1;
  
  let answer;
  switch (operation) {
    case '+':
      answer = num1 + num2;
      break;
    case '-':
      if (num2 > num1) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      break;
    case '*':
      num1 = Math.floor(Math.random() * (5 * difficulty)) + 1;
      num2 = Math.floor(Math.random() * (5 * difficulty)) + 1;
      answer = num1 * num2;
      break;
    default:
      answer = num1 + num2;
  }
  
  return { num1, num2, operation, answer };
};

const Home: React.FC = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasSeenDescription, setHasSeenDescription] = useState(false);
  const [isDescriptionFading, setIsDescriptionFading] = useState(false);
  const [showDescriptionButton, setShowDescriptionButton] = useState(false);
  const [isButtonFading, setIsButtonFading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickCounter = usePickCounter();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const { 
    currentMovie, 
    loadingState, 
    getRandomMovieSafe,
    error, 
    watchlist
  } = useMovieContext();
  
  const { isLoading: isLoadingGenres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  });

  const videoAd = useVideoAd({
    onClose: () => {
      pickCounter.reset();
      getRandomMovieSafe()
        .catch(console.error);
    },
    onError: () => {
      getRandomMovieSafe()
        .catch(console.error);
    },
    enableTestAds: false
  });

  // Preload video ad in background
  useVideoPreload('/ad_preview.mp4');

  const handleInitialLoad = useCallback(async () => {
    
    try {
      await getRandomMovieSafe();
      if (currentMovie) {
        // analytics.setLastMovie(currentMovie.id); // Removed analytics import
        // gtag.trackMoviePick(currentMovie.id, currentMovie.title); // Removed gtag import
      }
      // Reset transition state after successful load
      setIsTransitioning(false);
    } catch (error) {
      console.error('Failed to get initial movie:', error);
      // Reset transition state even on error
      setIsTransitioning(false);
    }
  }, [getRandomMovieSafe, currentMovie]);

  useEffect(() => {
    if (!isLoadingGenres && !isInitialLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      setIsTransitioning(true); // Mark as transitioning
      handleInitialLoad();
    }
  }, [isLoadingGenres, isInitialLoading, hasInitiallyLoaded, handleInitialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadingGenres) {
        setIsInitialLoading(false);
      }
    }, 300); // Reduced from 500ms for faster transition
    return () => clearTimeout(timer);
  }, [isLoadingGenres]);

  // Keep showing loading until we have a movie or an error
  // Also prevent showing placeholder during initial load or transitions
  const shouldShowLoading = isInitialLoading || 
                           loadingState === LoadingState.LOADING || 
                           isTransitioning ||
                           (!currentMovie && !error && !hasInitiallyLoaded);

  // Reset transition state when loading completes
  useEffect(() => {
    if (loadingState === LoadingState.SUCCESS && currentMovie) {
      setIsTransitioning(false);
    }
  }, [loadingState, currentMovie]);

  // REMOVED: Automatic video ad trigger on pickCount change
  // This was causing ads to show immediately on page load
  // Video ads are now only triggered by explicit user button clicks in MovieCard

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDescriptionFading(true);
      // Wait for fade animation to complete before hiding
      setTimeout(() => {
      setIsHeaderVisible(false);
      setHasSeenDescription(true);
        // Show the button to reveal description again after a delay
        setTimeout(() => {
          setShowDescriptionButton(true);
        }, 500); // Reduced from 1000ms
      }, 500); // Match animation duration
    }, timers.headerVisibilityTimeout);
    
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide description button after showing description
  useEffect(() => {
    if (isHeaderVisible && hasSeenDescription && showDescriptionButton) {
      const timer = setTimeout(() => {
        setIsButtonFading(true);
        setTimeout(() => {
          setShowDescriptionButton(false);
          setIsButtonFading(false);
        }, 300);
      }, timers.headerVisibilityTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [isHeaderVisible, hasSeenDescription, showDescriptionButton]);

  // Auto-hide manually opened description after 5 seconds
  useEffect(() => {
    if (isHeaderVisible && isManuallyOpened) {
      const timer = setTimeout(() => {
        setIsDescriptionFading(true);
        setTimeout(() => {
          setIsHeaderVisible(false);
          setIsManuallyOpened(false);
          setTimeout(() => {
            setShowDescriptionButton(true);
          }, 500);
        }, 500);
      }, 5000); // 5 seconds for manually opened description
      
      return () => clearTimeout(timer);
    }
  }, [isHeaderVisible, isManuallyOpened]);

  // All handlers defined before any conditional returns
  const handleGetMovie = useCallback(() => {
    
    if (!videoAd.visible) {
      getRandomMovieSafe()
        .then(() => {
          if (currentMovie) {
            // analytics.setLastMovie(currentMovie.id); // Removed analytics import
            // gtag.trackMoviePick(currentMovie.id, currentMovie.title); // Removed gtag import
          }
        })
        .catch(console.error);
    }
  }, [pickCounter, videoAd.visible, getRandomMovieSafe, currentMovie]);

  const handleShowDescription = useCallback(() => {
    setShowDescriptionButton(false);
    setIsHeaderVisible(true);
    setIsDescriptionFading(false);
    setIsManuallyOpened(true);
  }, []);

  const handleHideDescription = useCallback(() => {
    setIsButtonFading(true);
    setTimeout(() => {
      setShowDescriptionButton(false);
      setIsButtonFading(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (!bottomRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && io.disconnect(),
      { threshold: 0.1 }
    );
    io.observe(bottomRef.current);
  }, []);

  // Early return after all hooks are defined
  if (isInitialLoading || isLoadingGenres) {
    return <LoadingOverlay message="Loading Movie Picker..." />;
  }

  const isInWatchlist = currentMovie 
    ? watchlist.some((movie) => movie.id === currentMovie.id)
    : false;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden" itemScope itemType="https://schema.org/WebApplication">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-slate-900/30 to-gray-900/30 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <header className={`pt-2 md:pt-8 px-4 transition-all duration-500 ease-in-out ${
          isHeaderVisible ? 'pb-1 md:pb-8 opacity-100' : 'pb-0'
        }`}>
          <div className="max-w-6xl mx-auto relative">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Film size={32} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent relative z-30 mobile-title-above-about" itemProp="name">
                    MovieNightPicker
                  </h1>
                  <p className="text-sm text-gray-400 hidden md:block">Discover your next favorite movie</p>
                </div>
            </div>
              
              <div className="flex items-center gap-3">
              <WatchlistPanel />
              <FilterPanel isOpen={filterPanelOpen} setIsOpen={setFilterPanelOpen} />
            </div>
          </div>
          
            {isHeaderVisible && (
              <div className={`text-center mb-4 md:mb-12 transition-all duration-500 ease-out overflow-hidden ${
                isDescriptionFading ? 'animate-[fadeOut_0.5s_ease-out_forwards]' : 'animate-fadeIn'
              }`}>
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-semibold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Can't decide what to watch?
            </h2>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed" itemProp="description">
                    Let our smart movie picker help you discover your next favorite film. 
                    Filter by genre, year, rating and more to find the perfect movie for your mood.
            </p>
          </div>
        </div>
            )}
          </div>
        </header>

        {/* Fixed Description Button - Completely outside header structure */}
        {showDescriptionButton && !isHeaderVisible && (
          <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
            <div className="max-w-6xl mx-auto px-4 pointer-events-none">
                            <div className={`flex items-center justify-center pt-[41px] md:pt-[76px] ml-[10px] md:ml-0 transition-all duration-300 ease-out pointer-events-none ${
                isButtonFading ? 'animate-[slideUp_0.3s_ease-out_forwards]' : 'animate-[slideDown_0.3s_ease-out_forwards]'
              }`}>
                
                {/* About Button - No blur effect on mobile */}
                <div className="flex items-center gap-2 pointer-events-auto">
                  <button
                    onClick={handleShowDescription}
                    className="group inline-flex items-center gap-2 px-3 py-1.5 
                             bg-gradient-to-r from-slate-900/30 via-gray-900/20 to-slate-800/30
                             hover:from-slate-800/40 hover:via-gray-800/30 hover:to-slate-700/40
                             border border-white/5 hover:border-white/10 rounded-lg
                             text-gray-600 hover:text-gray-400 text-xs font-medium
                             transition-all duration-300 ease-out
                             hover:scale-105 active:scale-95 md:backdrop-blur-sm backdrop-blur-none whitespace-nowrap"
                  >
                    <span>What's all about?</span>
                    <ChevronDown size={12} className="group-hover:translate-y-0.5 transition-transform duration-200" />
                  </button>
                  <button 
                    onClick={handleHideDescription}
                    className="p-1.5 text-gray-700 hover:text-gray-500 hover:bg-white/3 rounded-md
                             transition-all duration-200 ease-out"
                    aria-label="Hide button"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 py-0 md:py-2 -mt-2 md:mt-0">
          <div className="max-w-6xl mx-auto h-full">
            <div className="flex flex-col items-center h-full">
              {/* Movie Card Section - Mobile optimized for single screen */}
              <div className={`w-full flex-1 flex items-center justify-center min-h-0 movie-card-container content-stable ${shouldShowLoading ? 'loading-transition loading' : 'loading-transition loaded'}`}>
                {shouldShowLoading ? (
                  <MovieCardSkeleton />
                ) : error ? (
                  <NoMoviesFound />
                ) : currentMovie ? (
                  <MovieCard movie={currentMovie} isInWatchlist={isInWatchlist} videoAd={videoAd} />
                ) : (
                  <PlaceholderMovieCard />
                )}
              </div>
            </div>
          </div>
        </main>

        <div ref={bottomRef} />
        
        {/* Footer - Split into 2 horizontal lines, equal spacing */}
        <footer className="mt-2 py-3 md:py-4 px-4 border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-slate-900/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-4 text-xs md:text-sm text-gray-400">
              {/* First line: Copyright and Creator */}
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4">
                <span>© 2025 MovieNightPicker</span>
                <span>•</span>
                <a
                  href="https://nodeadline.studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors hover:bg-white/5 px-2 py-1 rounded-md"
                >
                  <span>by nodeadline.studio</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-3 md:h-3">
                    <path d="M7 17L17 7M17 7H7M17 7V17"/>
                  </svg>
                </a>
              </div>
              {/* Second line: Privacy and Terms */}
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-4">
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}
                  className="hover:text-white transition-colors hover:bg-white/5 px-2 py-1 rounded-md"
                >
                  Privacy
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}
                  className="hover:text-white transition-colors hover:bg-white/5 px-2 py-1 rounded-md"
                >
                  Terms
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Video Ad */}
      {videoAd.visible && (
        <>
          {videoAd.adType === 'video' && (
            <VideoAd
              onClose={videoAd.close}
            />
          )}
          {videoAd.adType === 'google' && (
            <GoogleVideoAd
              onClose={videoAd.close}
              onError={videoAd.close}
            />
          )}
        </>
      )}

      {/* Modals */}
      <CookieConsent />
      <PrivacyPolicy />
      <TermsOfService />
    </div>
  );
};

export default Home;