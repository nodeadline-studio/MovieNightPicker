import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Film } from 'lucide-react'; 
import { useMovieContext } from '../context/MovieContext';
import { usePickCounter } from '../hooks/usePickCounter';
import { timers } from '../utils/timers';
import { usePropellerAds } from '../hooks/usePropellerAds';
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
import { MonetagBannerAd } from '../components/MonetagBannerAd';
import { MonetagMultiTagBanner } from '../components/MonetagMultiTagBanner';
import { MonetagInterstitialAd } from '../components/MonetagInterstitialAd';
import { useMonetagAds } from '../hooks/useMonetagAds';
import LoadingOverlay from '../components/LoadingOverlay';
import { LoadingState } from '../types';
import { analytics } from '../utils/analytics';
import * as gtag from '../utils/gtag';


const Home: React.FC = () => {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasSeenDescription, setHasSeenDescription] = useState(false);
  const [isDescriptionFading, setIsDescriptionFading] = useState(false);
  const [showDescriptionButton, setShowDescriptionButton] = useState(false);
  const [isButtonFading, setIsButtonFading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [isManuallyOpened, setIsManuallyOpened] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickCounter = usePickCounter();
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [externalButton, setExternalButton] = useState<React.ReactNode>(null);
  const isDesktop = useMediaQuery({ minWidth: 768 });
  
  // Toggle for mobile ad/button order: true = ad above button (desktop-like), false = button above ad
  const MOBILE_AD_ABOVE_BUTTON = true;

  // Monetag Zone IDs - Configured based on your dashboard
  // IMPORTANT: Get exact script formats from Monetag dashboard → Zone → "Get tag"
  // Update src/config/monetagScripts.ts with exact script URLs
  const MONETAG_MULTITAG_ZONE_ID = MONETAG_ZONES.MULTITAG; // In-Page Push zone (MULTI) - best for static banner
  const MONETAG_INTERSTITIAL_ZONE_ID = MONETAG_ZONES.INTERSTITIAL; // Native Banner Interstitial (MULTI) - or create dedicated Interstitial zone
  const USE_MULTITAG_FOR_BANNER = true; // Using MultiTag for banner (includes In-Page Push/Vignette Banner)

  // Memoize button render callback to prevent infinite loop
  const handleButtonRender = useCallback((button: React.ReactNode) => {
    setExternalButton(button);
  }, []);

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

  // Monetag ads - interstitial every 5 rerolls (configurable)
  const monetagAds = useMonetagAds({
    onClose: () => {
      pickCounter.reset();
      getRandomMovieSafe()
        .catch(console.error);
    },
    onError: () => {
      getRandomMovieSafe()
        .catch(console.error);
    },
    pickCounter,
    frequency: 5 // Show interstitial every 5 rerolls
  });

  // Legacy PropellerAds hook (kept for compatibility, but not used)
  const propellerAds = usePropellerAds({
    onClose: () => {
      pickCounter.reset();
      getRandomMovieSafe()
        .catch(console.error);
    },
    onError: () => {
      getRandomMovieSafe()
        .catch(console.error);
    },
    enableTestAds: false,
    pickCounter
  });

  const handleInitialLoad = useCallback(async () => {
    setHasUserInteracted(true);
    
    try {
      await getRandomMovieSafe();
      if (currentMovie) {
        analytics.setLastMovie(currentMovie.id);
        gtag.trackMoviePick(currentMovie.id, currentMovie.title);
      }
    } catch (error) {
      console.error('Failed to get initial movie:', error);
    }
  }, [getRandomMovieSafe, currentMovie]);

  useEffect(() => {
    if (!isLoadingGenres && !isInitialLoading && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true);
      handleInitialLoad();
    }
  }, [isLoadingGenres, isInitialLoading, hasInitiallyLoaded, handleInitialLoad]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoadingGenres) {
        setIsInitialLoading(false);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLoadingGenres]);

  // Monitor pick count and show Monetag interstitial every 5 rerolls
  // Trigger when movie changes (which happens after pickCounter increments)
  useEffect(() => {
    if (currentMovie) {
      const currentCount = pickCounter.current();
      if (currentCount > 0) {
        monetagAds.showInterstitial(currentCount);
      }
    }
  }, [currentMovie?.id]); // Only depend on movie ID change, not pickCounter/monetagAds

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
    <div className="min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden" style={{ minHeight: '100vh' }} itemScope itemType="https://schema.org/WebApplication">
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
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
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
              <div className={`text-center mb-4 md:mb-12 transition-all duration-500 ease-out overflow-hidden ${
                isDescriptionFading ? 'animate-[fadeOut_0.5s_ease-out_forwards]' : 'animate-fadeIn'
              }`}>
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-xl md:text-2xl font-semibold mb-4 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Can't decide what to watch?
            </h2>
                  <p className="text-gray-300 text-[0.875rem] md:text-lg leading-relaxed" itemProp="description">
                    Let our smart movie picker help you discover your next favorite film. 
                    Filter by genre, year, rating and more to find the perfect movie for your mood.
            </p>
          </div>
        </div>
            )}
          </div>
        </header>


        <main className="flex-1 px-4 py-0 md:py-1 flex flex-col" style={{ minHeight: 0, flex: '1 0 auto' }}>
          <div className="max-w-6xl mx-auto flex-1 flex flex-col w-full" style={{ minHeight: 0 }}>
            <div className="flex flex-col items-center flex-1 w-full" style={{ minHeight: 0 }}>
              {/* Movie Card Section - Mobile optimized for single screen */}
              <div className="w-full flex-1 flex items-center justify-center min-h-0 -mt-[10px] md:mt-0">
                {loadingState === LoadingState.LOADING ? (
                  <MovieCardSkeleton />
                ) : error ? (
                  <NoMoviesFound />
                ) : currentMovie ? (
                  <div className="w-full flex flex-col flex-1" style={{ maxHeight: '100%', minHeight: 0 }}>
                    {/* Mobile: Ensure content fits above footer - adjust maxHeight to account for footer */}
                    <div className="flex-1 min-h-0" style={{ maxHeight: 'calc(100% - 9rem)' }}>
                      <MovieCard 
                        movie={currentMovie} 
                        isInWatchlist={isInWatchlist} 
                        propellerAds={propellerAds}
                        showDescriptionButton={showDescriptionButton}
                        isButtonFading={isButtonFading}
                        onShowDescription={handleShowDescription}
                        onHideDescription={handleHideDescription}
                        renderButtonOutside={true}
                        onButtonRender={handleButtonRender}
                      />
                    </div>
                    
                    {/* Desktop Layout: Movie Card → Banner Ad → Button → Footer */}
                    {/* Banner Ad - Under movie card on desktop */}
                    {/* Use MultiTag for banner (includes In-Page Push/Vignette Banner) or regular banner */}
                    <div className="w-full hidden md:block flex-shrink-0 mt-3">
                      {USE_MULTITAG_FOR_BANNER ? (
                        <MonetagMultiTagBanner 
                          zoneId={MONETAG_MULTITAG_ZONE_ID}
                          className="w-full"
                          onLoad={() => console.log('Monetag MultiTag banner loaded successfully')}
                          onError={() => console.log('Monetag MultiTag banner failed to load')}
                        />
                      ) : (
                        <MonetagBannerAd 
                          className="w-full"
                          onLoad={() => console.log('Monetag banner ad loaded successfully')}
                          onError={() => console.log('Monetag banner ad failed to load')}
                        />
                      )}
                    </div>
                    
                    {/* Desktop: Button - Centered horizontally and vertically between ad and footer when ad present, or 30px under card when no ad */}
                    {externalButton && (
                      <div 
                        className="hidden md:flex flex-shrink-0 w-full justify-center items-center"
                        style={{ 
                          marginTop: 'auto',
                          marginBottom: 'auto',
                          minHeight: '60px', // Ensure button has space
                          paddingTop: '1rem',
                          paddingBottom: '1rem'
                        }}
                      >
                        {externalButton}
                      </div>
                    )}
                    
                    {/* Mobile Layout: Movie Card → Ad → Button (or Button → Ad based on MOBILE_AD_ABOVE_BUTTON) */}
                    {MOBILE_AD_ABOVE_BUTTON ? (
                      <>
                        {/* Mobile: Ad above button */}
                        <div className="w-full mt-3 block md:hidden flex-shrink-0">
                          {USE_MULTITAG_FOR_BANNER ? (
                            <MonetagMultiTagBanner 
                              zoneId={MONETAG_MULTITAG_ZONE_ID}
                              className="w-full"
                              onLoad={() => console.log('Monetag MultiTag banner loaded successfully')}
                              onError={() => console.log('Monetag MultiTag banner failed to load')}
                            />
                          ) : (
                            <MonetagBannerAd 
                              className="w-full"
                              onLoad={() => console.log('Monetag banner ad loaded successfully')}
                              onError={() => console.log('Monetag banner ad failed to load')}
                            />
                          )}
                        </div>
                        
                        {/* Mobile: Button below ad - centered */}
                        {externalButton && (
                          <div className="block md:hidden mt-3 flex-shrink-0 w-full flex justify-center">
                            {externalButton}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Mobile: Button below movie card - centered */}
                        {externalButton && (
                          <div className="block md:hidden mt-3 flex-shrink-0 w-full flex justify-center">
                            {externalButton}
                          </div>
                        )}
                        
                        {/* Mobile: Ad below button */}
                        <div className="w-full mt-3 block md:hidden flex-shrink-0">
                          {USE_MULTITAG_FOR_BANNER ? (
                            <MonetagMultiTagBanner 
                              zoneId={MONETAG_MULTITAG_ZONE_ID}
                              className="w-full"
                              onLoad={() => console.log('Monetag MultiTag banner loaded successfully')}
                              onError={() => console.log('Monetag MultiTag banner failed to load')}
                            />
                          ) : (
                            <MonetagBannerAd 
                              className="w-full"
                              onLoad={() => console.log('Monetag banner ad loaded successfully')}
                              onError={() => console.log('Monetag banner ad failed to load')}
                            />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <PlaceholderMovieCard />
                )}
              </div>
            </div>
          </div>
        </main>

        <div ref={bottomRef} />
        
        {/* Footer - Aligned to bottom on desktop, split into 2 horizontal lines, equal spacing */}
        <footer className="mt-auto py-3 md:py-4 px-4 border-t border-white/10 bg-gradient-to-r from-gray-900/50 to-slate-900/50 backdrop-blur-sm flex-shrink-0">
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

      {/* Monetag Interstitial Ad - Shows every 5 rerolls */}
      {monetagAds.visible && (
        <MonetagInterstitialAd
          zoneId={MONETAG_INTERSTITIAL_ZONE_ID}
          onClose={monetagAds.close}
          onError={monetagAds.close}
          onSuccess={() => console.log('Monetag interstitial loaded successfully')}
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