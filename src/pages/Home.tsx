import React, { useEffect, useState, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Film, Zap, Shuffle, Sparkles, ChevronDown, X } from 'lucide-react'; 
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
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingState } from '../types';
import { analytics } from '../utils/analytics';
import * as gtag from '../utils/gtag';

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
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickCounter = usePickCounter();
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);

  const { 
    currentMovie, 
    loadingState, 
    pickCount,
    getRandomMovie, 
    error, 
    watchlist,
    resetPickCount,
    setPickCount
  } = useMovieContext();
  
  const { isLoading: isLoadingGenres } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchGenres,
  });

  const videoAd = useVideoAd({
    onClose: () => {
      pickCounter.reset();
      getRandomMovie()
        .catch(console.error);
    },
    onError: () => {
      getRandomMovie()
        .catch(console.error);
    },
    enableTestAds: false
  });

  // Preload video ad in background
  useVideoPreload('/ad_preview.mp4');

  useEffect(() => {
    if (!isLoadingGenres && !isInitialLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      handleInitialLoad();
    }
  }, [isLoadingGenres, isInitialLoading, hasInitiallyLoaded]);

  const handleInitialLoad = async () => {
    setHasUserInteracted(true);
    
    try {
      await getRandomMovie();
      if (currentMovie) {
        analytics.setLastMovie(currentMovie.id);
        gtag.trackMoviePick(currentMovie.id, currentMovie.title);
      }
    } catch (error) {
      console.error('Failed to get initial movie:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadingGenres) {
        setIsInitialLoading(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLoadingGenres]);

  useEffect(() => {
    if (hasUserInteracted && pickCount > 0 && !isInitialLoading) {
      videoAd.maybeShow(pickCounter.current());
    }
  }, [pickCount, hasUserInteracted, isInitialLoading]);

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
          // Start the cycle again
          setTimeout(() => {
            setIsDescriptionFading(true);
            setTimeout(() => {
              setIsHeaderVisible(false);
              setTimeout(() => {
                setShowDescriptionButton(true);
              }, 500); // Reduced from 1000ms
            }, 500);
          }, timers.headerVisibilityTimeout);
        }, 300);
      }, timers.headerVisibilityTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [isHeaderVisible, hasSeenDescription, showDescriptionButton]);

  useEffect(() => {
    if (!bottomRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && io.disconnect(),
      { threshold: 0.1 }
    );
    io.observe(bottomRef.current);
  }, []);

  if (isInitialLoading || isLoadingGenres) {
    return <LoadingOverlay message="Loading Movie Picker..." />;
  }

  const isInWatchlist = currentMovie 
    ? watchlist.some((movie) => movie.id === currentMovie.id)
    : false;

  const handleGetMovie = () => {
    setHasUserInteracted(true);
    const count = pickCounter.inc();
    
    if (count >= 5 && count % 10 === 0) {
      videoAd.maybeShow(count);
    } else if (!videoAd.visible) {
      getRandomMovie()
        .then(() => {
          if (currentMovie) {
            analytics.setLastMovie(currentMovie.id);
            gtag.trackMoviePick(currentMovie.id, currentMovie.title);
          }
        })
        .catch(console.error);
    }
  };

  const handleShowDescription = () => {
    setShowDescriptionButton(false);
    setIsHeaderVisible(true);
    setIsDescriptionFading(false);
  };

  const handleHideDescription = () => {
    setIsButtonFading(true);
    setTimeout(() => {
      setShowDescriptionButton(false);
      setIsButtonFading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden" itemScope itemType="https://schema.org/WebApplication">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/30 via-slate-900/30 to-gray-900/30 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <header className={`pt-6 md:pt-12 px-4 transition-all duration-500 ease-in-out ${
          isHeaderVisible ? 'pb-8 md:pb-12 opacity-100' : 'pb-4'
        }`}>
          <div className="max-w-6xl mx-auto relative">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Film size={32} className="text-white" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent" itemProp="name">
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
              <div className={`text-center mb-8 md:mb-12 transition-all duration-500 ease-out overflow-hidden ${
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

            {/* Show Description Button - Positioned above movie card */}
            {showDescriptionButton && !isHeaderVisible && (
              <div className={`flex justify-center mb-2.5 transition-all duration-300 ease-out ${
                isButtonFading ? 'animate-[slideUp_0.3s_ease-out_forwards]' : 'animate-[slideDown_0.3s_ease-out_forwards]'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShowDescription}
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
                    onClick={handleHideDescription}
                    className="p-1.5 text-gray-700 hover:text-gray-500 hover:bg-white/3 rounded-md
                             transition-all duration-200 ease-out"
                    aria-label="Hide button"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center">
              {/* Movie Card Section */}
              <div className="w-full mb-8">
                {loadingState === LoadingState.LOADING ? (
                  <MovieCardSkeleton />
                ) : error ? (
                  <NoMoviesFound />
                ) : currentMovie ? (
                  <MovieCard movie={currentMovie} isInWatchlist={isInWatchlist} />
                ) : (
                  <PlaceholderMovieCard />
                )}
              </div>

              {/* Action Button */}
              <div className="mb-8">
                <button
                  onClick={handleGetMovie}
                  disabled={loadingState === LoadingState.LOADING}
                  className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                           hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                           disabled:from-gray-600 disabled:to-gray-600
                           text-white font-bold px-8 py-4 rounded-2xl text-lg
                           shadow-2xl hover:shadow-purple-500/25
                           transform hover:scale-[1.05] active:scale-[0.95]
                           transition-all duration-300 ease-out
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                           min-w-[200px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-3">
                    {loadingState === LoadingState.LOADING ? (
                      <>
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Finding Movie...
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                        Get Random Movie
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Stats - Hidden for cleaner UI */}
              {/* {pickCount > 0 && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                    <Shuffle size={16} className="text-purple-400" />
                    <span className="text-sm font-medium">
                      {pickCount} movie{pickCount !== 1 ? 's' : ''} discovered
                    </span>
                  </div>
                </div>
              )} */}
            </div>
          </div>
        </main>

        <div ref={bottomRef} />
      </div>

      {/* Video Ad */}
      {videoAd.visible && (
        <VideoAd 
          onClose={videoAd.close}
          onError={videoAd.close}
          enableTestAds={false}
        />
      )}

      {/* Modals */}
      <CookieConsent />
      <PrivacyPolicy />
      <TermsOfService />
    </div>
  );
};

export default Home;