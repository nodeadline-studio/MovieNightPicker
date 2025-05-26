import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Clapperboard, Star, Clock, Calendar, Trash2, ChevronRight, AlertTriangle, StarHalf, Shuffle, Sparkles, CheckSquare } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import Button from './ui/Button';
import BirthYearVerification from './BirthYearVerification';
import TimelineSlider from './ui/TimelineSlider';
import { movieCache } from '../utils/cache';
import { LoadingState } from '../types';
import { analytics } from '../utils/analytics';

interface FilterPanelProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ isOpen, setIsOpen }) => {
  const { genres, filterOptions, updateFilterOptions, getRandomMovie, loadingState, pickCount } = useMovieContext();
  const [hasConfirmedAdult, setHasConfirmedAdult] = useState(false);
  const [isApplyingAndPicking, setIsApplyingAndPicking] = useState(false);
  const [isRandomizerEnabled, setIsRandomizerEnabled] = useState(true);
  const [excludeWatchlist, setExcludeWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [showBirthYearModal, setShowBirthYearModal] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaScore, setCaptchaScore] = useState<number | null>(null);
  const [mathProblem, setMathProblem] = useState<{ question: string; answer: number } | null>(null);
  const [showVideoAd, setShowVideoAd] = useState(false);

  const currentYear = new Date().getFullYear();
  
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filterOptions.genres.length > 0) count++;
    if (filterOptions.yearFrom !== 1990 || filterOptions.yearTo !== currentYear) count++;
    if (filterOptions.ratingFrom !== 6) count++;
    if (filterOptions.maxRuntime !== 150) count++;
    if (filterOptions.inTheatersOnly) count++;
    if (filterOptions.includeAdult) count++;
    return count;
  };

  const generateMathProblem = (difficulty: number) => {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    let num1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
    let num2 = Math.floor(Math.random() * (10 * difficulty)) + 1;
    
    let answer: number;
    let question: string;
    
    switch (operator) {
      case '+':
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
        break;
      case '-':
        // Ensure the result is positive
        if (num2 > num1) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
        // Keep multiplication manageable
        num1 = Math.floor(num1 / difficulty);
        num2 = Math.floor(num2 / difficulty);
        answer = num1 * num2;
        question = `${num1} × ${num2}`;
        break;
      default:
        answer = num1 + num2;
        question = `${num1} + ${num2}`;
    }
    
    return { question, answer };
  };

  const handleGenreToggle = (genreId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent event bubbling
    e.stopPropagation();
    e.preventDefault();
    
    setIsRandomizerEnabled(false);
    const updatedGenres = filterOptions.genres.includes(genreId)
      ? filterOptions.genres.filter(id => id !== genreId)
      : [...filterOptions.genres, genreId];
    
    analytics.updateFilterPreferences({ genres: updatedGenres });
    updateFilterOptions({ genres: updatedGenres });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rating = parseFloat(e.target.value);
    analytics.updateFilterPreferences({ rating });
    if (!isNaN(rating) && rating >= 0 && rating <= 10) {
      setIsRandomizerEnabled(false);
      updateFilterOptions({ 
        ratingFrom: rating,
        includeAdult: rating === 0 ? true : filterOptions.includeAdult 
      });
    }
  };

  const handleAdultContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    if (!isChecked) {
      updateFilterOptions({ includeAdult: false });
      return;
    }

    if (!hasConfirmedAdult) {
      setShowBirthYearModal(true);
      e.target.checked = false;
    } else {
      updateFilterOptions({ includeAdult: true });
    }
  };

  const handleBirthYearConfirm = () => {
    setHasConfirmedAdult(true);
    updateFilterOptions({ includeAdult: true });
    setShowBirthYearModal(false);
  };

  const handleBirthYearCancel = () => {
    updateFilterOptions({ includeAdult: false });
    setShowBirthYearModal(false);
  };

  const handleInTheatersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsRandomizerEnabled(false);
    updateFilterOptions({
      inTheatersOnly: isChecked,
      yearFrom: isChecked ? new Date().getFullYear() : filterOptions.yearFrom,
      yearTo: isChecked ? new Date().getFullYear() : filterOptions.yearTo
    });
  };

  const handleRuntimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 60 && value <= 240) {
      setIsRandomizerEnabled(false);
      updateFilterOptions({ maxRuntime: value });
    }
  };

  const handleRuntimeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const value = Math.max(60, Math.min(240, Math.round(60 + percentage * (240 - 60))));
    setIsRandomizerEnabled(false);
    updateFilterOptions({ maxRuntime: value });
  };

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const resetFilters = () => {
    setIsRandomizerEnabled(false);
    updateFilterOptions({
      genres: [],
      yearFrom: 1990,
      yearTo: currentYear,
      ratingFrom: 6,
      includeAdult: false,
    });
  };

  const applyRandomFilters = () => {
    // Random genres (2-4 genres)
    const numGenres = Math.floor(Math.random() * 3) + 2;
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres).map(g => g.id);
    
    // Random year range (minimum 10 years span)
    const minYear = 1950;
    const yearFrom = Math.floor(Math.random() * (currentYear - minYear - 10)) + minYear;
    const yearTo = Math.floor(Math.random() * (currentYear - yearFrom - 10)) + yearFrom + 10;
    
    // Random rating (5-8)
    const rating = Math.floor(Math.random() * 3) + 5;
    
    // Random runtime (90-180 minutes)
    const runtime = Math.floor(Math.random() * 90) + 90;
    
    updateFilterOptions({
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      maxRuntime: runtime,
      inTheatersOnly: false, // Never enable theaters only when randomizing
      includeAdult: false // Keep adult content off for safety
    });
  };

  useEffect(() => {
    if (isOpen && isRandomizerEnabled) {
      applyRandomFilters();
    }
  }, [isOpen, isRandomizerEnabled]);

  const handleSurpriseMe = () => {
    if (isRandomizerEnabled) return; // Skip if randomizer is enabled
    applyRandomFilters();
  };

  const handleApplyChanges = () => {
    setIsOpen(false);
  };

  const isCaptchaRequired = pickCount > 0 && (pickCount + 1) % 10 === 0;

  const handlePickMovie = async () => {
    // Show captcha every 10 picks
    if (pickCount > 0 && (pickCount + 1) % 10 === 0 && !captchaVerified) {
      // Initialize score if it's null (first time)
      if (captchaScore === null) {
        setCaptchaScore(100);
      }
      const difficulty = Math.min(5, Math.floor(pickCount / 10) + 1);
      setMathProblem(generateMathProblem(difficulty));
      setCaptchaVerified(false);
      return;
    }

    // Show ad every 10 picks
    if (pickCount >= 9 && (pickCount + 1) % 10 === 0) {
      setShowVideoAd(true);
      return;
    }

    try {
      // Batch state updates
      const updates = {
        isApplyingAndPicking: true,
        isOpen: false,
      };
      setIsApplyingAndPicking(updates.isApplyingAndPicking);
      setIsOpen(updates.isOpen);
      await getRandomMovie();
    } catch (error) {
      console.error('Error picking movie:', error);
      setIsOpen(true); // Reopen the panel to show the warning
    } finally {
      setIsApplyingAndPicking(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="relative"
        icon={
          <>
            <SlidersHorizontal size={18} />
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {getActiveFilterCount()}
              </span>
            )}
          </>
        }
        onClick={togglePanel}
      >
        Filters
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            animation: 'overlayFadeIn 500ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
            pointerEvents: 'auto'
          }}
          onClick={togglePanel}
        ></div>
      )}

      <div className={`fixed top-0 right-0 h-screen w-full md:w-[400px] bg-gray-900/95 backdrop-blur-sm shadow-2xl border-l border-gray-800 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-[100dvh] pointer-events-auto">
          <div className="border-b border-gray-800 rounded-t-xl flex-shrink-0">
            <div className="pt-safe p-3 flex justify-between items-center backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white">Movie Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePanel}
                icon={<X size={20} />}
                aria-label="Close filters panel"
              >
                <span className="sr-only">Close</span>
              </Button>
            </div>
          
            <div className="flex border-t border-gray-800">
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Filters
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'advanced'
                    ? 'text-blue-500 border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced Filters
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 space-y-4 relative z-20">
            {activeTab === 'basic' ? (
              <>
                  <div className="p-4 bg-gray-800 rounded-lg relative pointer-events-auto">
                    <div className="flex items-center text-gray-300 mb-2">
                      <Calendar size={16} className="mr-2" />
                      <span className={`font-medium ${filterOptions.inTheatersOnly ? 'opacity-50' : ''}`}>Release Year Range</span>
                    </div>
                    <TimelineSlider
                      min={1900}
                      max={currentYear}
                      value={[filterOptions.yearFrom, filterOptions.yearTo]}
                      onChange={([from, to]) => {
                        if (filterOptions.inTheatersOnly) return;
                        movieCache.clear();
                        setIsRandomizerEnabled(false);
                        updateFilterOptions({
                          yearFrom: Math.min(from, to),
                          yearTo: Math.max(from, to)
                        });
                      }}
                      disabled={filterOptions.inTheatersOnly}
                    />
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg relative pointer-events-auto">
                    <div className="flex items-center text-gray-300 mb-2">
                      <StarHalf size={16} className="mr-2 text-yellow-500" />
                      <span className="font-medium">Minimum Rating: {filterOptions.ratingFrom.toFixed(1)}</span>
                    </div>
                    <div className="relative w-full h-8 mt-2 cursor-pointer z-10 pointer-events-auto">
                      {/* Background track */}
                      <div className="absolute inset-y-3 inset-x-0 bg-gray-700/50 rounded-full" />
                      
                      {/* Colored track */}
                      <div 
                        className="absolute inset-y-3 left-0 bg-gradient-to-r from-red-600 via-yellow-500 to-green-500 rounded-full" 
                        style={{ 
                          width: `${(filterOptions.ratingFrom / 10) * 100}%`,
                        }} 
                      />
                      
                      {/* Slider thumb */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110 z-10" 
                        style={{ 
                          left: `${(filterOptions.ratingFrom / 10) * 100}%` 
                        }}
                      />
                      
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={filterOptions.ratingFrom}
                        onChange={handleRatingChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none z-20"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg relative pointer-events-auto">
                    <div className="flex items-center text-gray-300 mb-2">
                      <Clock size={16} className="mr-2" />
                      <span className="font-medium">Maximum Runtime: {formatRuntime(filterOptions.maxRuntime)}</span>
                    </div>
                    <div className="relative w-full h-8 mt-2 cursor-pointer z-10 pointer-events-auto">
                      <div className="absolute inset-y-3 inset-x-0 bg-gray-700/50 rounded-full" />
                      <div 
                        className="absolute inset-y-3 left-0 bg-red-600 rounded-full" 
                        style={{ 
                          width: `${((Math.min(240, filterOptions.maxRuntime) - 60) / (240 - 60)) * 100}%`,
                        }} 
                      />
                      
                      {/* Slider thumb */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110 z-10" 
                        style={{ 
                          left: `${((Math.min(240, filterOptions.maxRuntime) - 60) / (240 - 60)) * 100}%` 
                        }}
                      />
                      
                      <input
                        type="range"
                        min="60"
                        max="240"
                        step="15"
                        value={filterOptions.maxRuntime}
                        onChange={handleRuntimeChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer touch-none z-30"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-800 rounded-lg relative pointer-events-auto">
                    <div className="flex items-center text-gray-300 mb-2">
                      <Clapperboard size={16} className="mr-2 text-green-500" />
                      <span className="font-medium">Now Playing</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer z-20 pointer-events-auto">
                      <input
                        type="checkbox"
                        checked={filterOptions.inTheatersOnly}
                        onChange={handleInTheatersChange}
                        className="sr-only peer z-30"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                      <span className="ms-3 text-sm font-medium text-gray-300">Only show movies in theaters</span>
                    </label>
                    {filterOptions.inTheatersOnly && (
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        Release dates are locked to current year for theater releases
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex flex-col items-center gap-4">
                      <Button
                        variant="primary"
                        onClick={handleSurpriseMe}
                        className={`w-full bg-gradient-to-r from-yellow-500 to-green-500 hover:from-yellow-600 hover:to-green-600 text-black font-medium py-3 z-20 ${
                          isRandomizerEnabled ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={isRandomizerEnabled}
                      >
                        <Sparkles size={16} className="mr-2" />
                        Surprise Me!
                      </Button>
                      <label className="relative flex items-center gap-3 cursor-pointer bg-gray-800/50 px-4 py-3 rounded-lg w-full justify-center group z-20">
                        <input
                          type="checkbox"
                          checked={isRandomizerEnabled}
                          onChange={(e) => setIsRandomizerEnabled(e.target.checked)}
                          className="sr-only peer z-30"
                        />
                        <div className="w-6 h-6 border-2 border-gray-600 rounded flex items-center justify-center peer-checked:bg-green-500 peer-checked:border-green-500 transition-colors group-hover:border-gray-400">
                          <CheckSquare size={16} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Always randomize</span>
                      </label>
                    </div>
                  </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-gray-300 font-medium mb-2 relative z-10">Genres</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 relative z-20">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={(e) => handleGenreToggle(genre.id, e)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors relative z-30 cursor-pointer pointer-events-auto ${
                          filterOptions.genres.includes(genre.id)
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 relative z-20">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterOptions.includeAdult}
                      onChange={handleAdultContentChange}
                      className="sr-only peer z-30"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    <span className="ms-3 text-sm font-medium text-gray-300">Include adult content</span>
                  </label>
                </div>

              </>
            )}
            </div>

            {/* Desktop buttons */}
            <div className="mt-4 hidden md:block space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  fullWidth
                  icon={<Trash2 size={16} />}
                >
                  Reset All
                </Button>

                <Button
                  variant="primary"
                  onClick={handleApplyChanges}
                  fullWidth
                >
                  Apply Changes
                </Button>
              </div>
              
              <Button
                variant="secondary"
                onClick={handlePickMovie}
                disabled={isApplyingAndPicking || loadingState === LoadingState.LOADING || isCaptchaRequired}
                fullWidth
                icon={<Shuffle size={16} />}
              >
                {isCaptchaRequired 
                  ? 'Complete Captcha First'
                  : isApplyingAndPicking || loadingState === LoadingState.LOADING 
                    ? 'Finding Movie...' 
                    : 'Apply & Pick Movie'
                }
              </Button>
            </div>
          </div>
          
          {/* Mobile buttons - fixed to bottom */}
          <div className="md:hidden flex-shrink-0 p-3 pb-safe bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 space-y-2">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetFilters}
                fullWidth
                icon={<Trash2 size={16} />}
              >
                Reset All
              </Button>

              <Button
                variant="primary"
                onClick={handleApplyChanges}
                fullWidth
              >
                Apply Changes
              </Button>
            </div>
            
            <Button
              variant="secondary"
              onClick={handlePickMovie}
              disabled={isApplyingAndPicking || loadingState === LoadingState.LOADING}
              fullWidth
              icon={<Shuffle size={16} />}
            >
              {isCaptchaRequired 
                ? 'Complete Captcha First'
                : isApplyingAndPicking || loadingState === LoadingState.LOADING 
                    ? 'Finding Movie...' 
                    : 'Apply & Pick Movie'
              }
            </Button>
          </div>
        </div>
        <BirthYearVerification
          isOpen={showBirthYearModal}
          onConfirm={handleBirthYearConfirm}
          onCancel={handleBirthYearCancel}
        />
      </div>
    </div>
  );
};

export default FilterPanel;