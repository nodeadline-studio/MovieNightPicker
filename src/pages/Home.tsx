import React, { useEffect, useState, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Film, Zap, Shuffle } from 'lucide-react'; 
import { useMovieContext } from '../context/MovieContext';
import { usePickCounter } from '../hooks/usePickCounter';
import { timers } from '../utils/timers';
import { useVideoAd } from '../hooks/useVideoAd';
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
import SettingsDrawer from '../components/SettingsDrawer';
import AdUnit from '../components/AdUnit';
import VideoAd from '../components/VideoAd';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingState } from '../types';
import { analytics } from '../utils/analytics';

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
      // Ensure positive result
      if (num2 > num1) [num1, num2] = [num2, num1];
      answer = num1 - num2;
      break;
    case '*':
      // Keep multiplication manageable
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
  // Group all useState hooks together at the top
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasSeenDescription, setHasSeenDescription] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(false); // Start with ads disabled
  const [adKey, setAdKey] = useState(0);
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
    getMovieFromCache,
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
        .then(() => setPickCount(prev => prev + 1))
        .catch(console.error);
    },
    onError: () => {
      getRandomMovie()
        .then(() => setPickCount(prev => prev + 1))
        .catch(console.error);
    },
    enableTestAds: false
  });

  // Auto-pick movie on initial load
  useEffect(() => {
    if (!isLoadingGenres && !isInitialLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      handleInitialLoad();
      // Don't enable ads yet - wait for content
    }
  }, [isLoadingGenres, isInitialLoading, hasInitiallyLoaded]);

  const handleInitialLoad = async () => {
    setHasUserInteracted(true);
    // Disable ads during initial loading
    setAdsEnabled(false);
    
    try {
      await getRandomMovie();
      if (currentMovie) {
        analytics.setLastMovie(currentMovie.id);
      }
      // Ads will be enabled by the useEffect when content loads successfully
    } catch (error) {
      console.error('Failed to get initial movie:', error);
    }
  };

  // Group all useEffect hooks together
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadingGenres) {
        setIsInitialLoading(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLoadingGenres]);

  useEffect(() => {
    // Don't show ads on initial load
    if (hasUserInteracted && pickCount > 0 && !isInitialLoading) {
      videoAd.maybeShow(pickCounter.current());
    }
  }, [pickCount, hasUserInteracted, isInitialLoading]);

  // Enable ads only when we have content (successful movie load)
  useEffect(() => {
    if (hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie) {
      setAdsEnabled(true);
    } else if (hasUserInteracted && (loadingState === LoadingState.LOADING || loadingState === LoadingState.ERROR)) {
      // Disable ads during loading or error states
      setAdsEnabled(false);
    }
  }, [hasUserInteracted, loadingState, currentMovie]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHeaderVisible(false);
      setHasSeenDescription(true);
    }, timers.headerVisibilityTimeout);
    
    return () => clearTimeout(timer);
  }, []);

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
    // Disable ads during loading to prevent showing on empty content
    setAdsEnabled(false);
    setAdKey(k => k + 1); // Force new ad instance
    const count = pickCounter.inc();
    
    // Show ad every 10 picks
    if (count >= 5 && count % 10 === 0) {
      videoAd.maybeShow(count);
    } else if (!videoAd.visible) {
      getRandomMovie()
        .then(() => {
          if (currentMovie) {
            analytics.setLastMovie(currentMovie.id);
          }
          // Ads will be enabled by the useEffect when content loads successfully
        })
        .catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white relative flex flex-col">
      {/* sidebars - only show when there's content */}
      {hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie && (
        <Desktop>
          {!filterPanelOpen && (
            <>
              <aside className="fixed left-0 top-[120px] z-20">
                <div className="w-full flex justify-center my-2">
                  <AdUnit slot="6047638216" width={300} height={600} enabled={adsEnabled} />
                </div>
              </aside>
              <aside className="fixed right-0 top-[120px] z-20">
                <div className="w-full flex justify-center my-2">
                  <AdUnit slot="1111840457" width={300} height={600} enabled={adsEnabled} />
                </div>
              </aside>
            </>
          )}
        </Desktop>
      )}
      
      <div className="sticky top-0 z-10 bg-gray-950">
        <header className={`bg-gradient-to-b from-black to-transparent pt-4 md:pt-8 px-4 transition-all duration-500 ease-in-out ${
          isHeaderVisible ? 'pb-6 md:pb-8 opacity-100' : 'pb-0'
        }`}>
          <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <div className="flex items-center">
              <Film size={30} className="text-red-600 mr-2" aria-hidden="true" />
              <h1 className="text-xl md:text-2xl font-bold" itemProp="name">MovieNightPicker</h1>
            </div>
            <div className="flex space-x-2 sticky top-4 z-50">
              <WatchlistPanel />
              <FilterPanel isOpen={filterPanelOpen} setIsOpen={setFilterPanelOpen} />
            </div>
          </div>
          
          <div 
            className={`text-center transition-all duration-500 ease-in-out overflow-hidden ${
              isHeaderVisible ? 'h-44 md:h-36 opacity-100 mb-4' : 'h-0 opacity-0 mb-0'
            }`}
          >
            <button 
              onClick={() => setIsHeaderVisible(false)} 
              className="text-gray-400 hover:text-white text-sm mb-3">Hide Description</button>
            <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3" itemProp="description">
              Discover Your Next Movie Night Pick
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base px-4 leading-relaxed mb-2" itemProp="about">
              Instantly find the perfect movie to watch tonight with our random movie picker.
              Apply filters, save to your watchlist, and never waste time browsing again.
            </p>
          </div>
        </div>
        {!isHeaderVisible && (
          <button 
            onClick={() => setIsHeaderVisible(true)}
            className="absolute bottom-1 left-1/2 -translate-x-1/2 text-gray-400/50 hover:text-white text-sm"
          >
            Show Description
          </button>
        )}
        </header>
      </div>

      <main className="max-w-6xl w-full mx-auto px-2 md:px-4 flex flex-col flex-1">
        {/* mobile top ad - only show when there's content */}
        {hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie && (
          <Mobile>
            <div className="w-full flex justify-center my-2">
              <AdUnit
                slot="8008421293"
                width={320}
                height={100}
                enabled={adsEnabled}
              />
            </div>
          </Mobile>
        )}
        
        <div className="flex justify-center my-4 mb-8 md:mb-4">
            <Button
              variant="primary"
              size="lg"
              icon={loadingState === LoadingState.LOADING ? (
                <Spinner size="sm" className="mr-1" />
              ) : (
                <Shuffle size={18} className="md:w-5 md:h-5" />
              )}
              onClick={handleGetMovie}
              className={`w-full max-w-md md:w-auto bg-red-600 hover:bg-red-700 ${loadingState !== LoadingState.LOADING && 'animate-pulse-slow'} mb-safe`}
              disabled={loadingState === LoadingState.LOADING}
            >
              <span className="text-sm md:text-base">
                {loadingState === LoadingState.LOADING ? (
                  <span className="inline-flex items-center">Finding Movie...</span>
                ) : (
                  'Pick Another Movie'
                )}
              </span>
            </Button>
        </div>

        <div className="w-full flex flex-col items-center">
          <div className="w-full">
            {!hasUserInteracted && (
              <PlaceholderMovieCard />
            )}
            {hasUserInteracted && loadingState === LoadingState.LOADING && (
              <MovieCardSkeleton />
            )}

            {hasUserInteracted && loadingState === LoadingState.ERROR && (
              <div className="text-center bg-gray-900 p-8 rounded-xl max-w-md">
                <Zap size={48} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-400 mb-4">{error || 'Failed to find a movie. Please try again.'}</p>
                <Button variant="primary" onClick={handleGetMovie}>Try Again</Button>
              </div>
            )}

            {hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie && (
              <MovieCard movie={currentMovie} isInWatchlist={isInWatchlist} />
            )}
            {/* Billboard ad under movie card */}
            {hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie && (
              <Desktop>
                <div className="mx-auto mt-10 max-w-[970px]">
                  <AdUnit
                    slot="3718732625"
                    width={970}
                    height={250}
                    format="horizontal"
                    enabled={adsEnabled}
                  />
                </div>
              </Desktop>
            )}
          </div>
        </div>

        {/* mobile bottom ad - only show when there's content */}
        {hasUserInteracted && loadingState === LoadingState.SUCCESS && currentMovie && (
          <Mobile>
            <div className="w-full flex justify-center my-4">
              <AdUnit 
                slot="9568914971"
                width={320}
                height={100}
                format="horizontal"
                enabled={adsEnabled}
              />
            </div>
          </Mobile>
        )}

        {/* Video Ad Modal */}
        {videoAd.visible && (
          <VideoAd
            onClose={videoAd.close}
            onError={videoAd.close}
            enableTestAds={false}
            mockMode={false}
          />
        )}

      </main>

      <footer className="py-3 border-t border-gray-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-xs md:text-sm">
          <p>© 2025 MovieNightPicker by <a href="https://nodeadline.studio" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 transition-colors">nodeadline.studio</a>. All movie data provided by TMDB.</p>
          <p className="mt-0.5 space-x-2">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('show-privacy'))}
              className="underline hover:text-gray-400 transition-colors"
            >
              Privacy Policy
            </button>
            <span>|</span>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('show-terms'))}
              className="underline hover:text-gray-400 transition-colors"
            >
              Terms of Service
            </button>
          </p>
        </div>
      </footer>
      <CookieConsent />
      <PrivacyPolicy />
      <TermsOfService />
    </div>
  );
};

export default Home;