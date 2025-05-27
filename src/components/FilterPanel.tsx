import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Clapperboard, Star, Clock, Calendar, Trash2, ChevronRight, AlertTriangle, StarHalf, Shuffle, Sparkles, CheckSquare } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import Button from './ui/Button';
import BirthYearVerification from './BirthYearVerification';
import TimelineSlider from './ui/TimelineSlider';
import { movieCache } from '../utils/cache';
import { LoadingState } from '../types';
import { analytics } from '../utils/analytics';
import * as gtag from '../utils/gtag';

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
        if (num2 > num1) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        question = `${num1} - ${num2}`;
        break;
      case '*':
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
    e.stopPropagation();
    e.preventDefault();
    
    setIsRandomizerEnabled(false);
    const updatedGenres = filterOptions.genres.includes(genreId)
      ? filterOptions.genres.filter(id => id !== genreId)
      : [...filterOptions.genres, genreId];
    
    analytics.updateFilterPreferences({ genres: updatedGenres });
    gtag.trackFilterUse('genres', updatedGenres.length);
    updateFilterOptions({ genres: updatedGenres });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rating = parseFloat(e.target.value);
    analytics.updateFilterPreferences({ rating });
    gtag.trackFilterUse('rating', rating);
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
    updateFilterOptions({ 
      includeAdult: true,
      inTheatersOnly: false // Disable theaters when enabling adult content
    });
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
      yearTo: isChecked ? new Date().getFullYear() : filterOptions.yearTo,
      includeAdult: isChecked ? false : filterOptions.includeAdult // Disable adult content when in theaters
    });
  };

  const handleRuntimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 60 && value <= 240) {
      setIsRandomizerEnabled(false);
      updateFilterOptions({ maxRuntime: value });
    }
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
    const numGenres = Math.floor(Math.random() * 3) + 2;
    const shuffledGenres = [...genres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres).map(g => g.id);
    
    const minYear = 1950;
    const yearFrom = Math.floor(Math.random() * (currentYear - minYear - 10)) + minYear;
    const yearTo = Math.floor(Math.random() * (currentYear - yearFrom - 10)) + yearFrom + 10;
    
    const rating = Math.floor(Math.random() * 3) + 5;
    const runtime = Math.floor(Math.random() * 90) + 90;
    
    updateFilterOptions({
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      maxRuntime: runtime,
      inTheatersOnly: false,
      includeAdult: false
    });
  };

  // Removed auto-randomization on panel open
  // useEffect(() => {
  //   if (isOpen && isRandomizerEnabled) {
  //     applyRandomFilters();
  //   }
  // }, [isOpen, isRandomizerEnabled]);

  const handleSurpriseMe = () => {
    if (isRandomizerEnabled) return;
    applyRandomFilters();
  };

  const handleApplyChanges = () => {
    setIsOpen(false);
  };

  const isCaptchaRequired = pickCount > 0 && (pickCount + 1) % 10 === 0;

  const handlePickMovie = async () => {
    if (pickCount > 0 && (pickCount + 1) % 10 === 0 && !captchaVerified) {
      if (captchaScore === null) {
        setCaptchaScore(100);
      }
      const difficulty = Math.min(5, Math.floor(pickCount / 10) + 1);
      setMathProblem(generateMathProblem(difficulty));
      setCaptchaVerified(false);
      return;
    }

    if (pickCount >= 9 && (pickCount + 1) % 10 === 0) {
      setShowVideoAd(true);
      return;
    }

    try {
      setIsApplyingAndPicking(true);
      setIsOpen(false);
      await getRandomMovie();
    } catch (error) {
      console.error('Error picking movie:', error);
      setIsOpen(true);
    } finally {
      setIsApplyingAndPicking(false);
    }
  };

  return (
    <div className="relative">
      {/* Modern Filters Button */}
      <button
        onClick={togglePanel}
        className="group relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                   hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                   text-white font-semibold px-6 py-3 rounded-2xl
                   shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                   transform hover:scale-[1.02] active:scale-[0.98]
                   transition-all duration-200 ease-out
                   flex items-center gap-3 select-none"
      >
        <div className="relative">
          <SlidersHorizontal size={20} className="group-hover:rotate-6 transition-transform duration-200 ease-out" />
          {getActiveFilterCount() > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
              {getActiveFilterCount()}
            </div>
          )}
        </div>
        <span className="hidden md:block">Filters</span>
      </button>

      {/* Modern Filter Panel */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 z-40"
            onClick={togglePanel}
          />
          
          {/* Panel */}
          <div className={`fixed top-0 right-0 h-[100dvh] w-full md:w-[420px] z-50 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                           backdrop-blur-xl border-l border-white/10 shadow-2xl
                           ring-1 ring-white/5 flex flex-col max-h-[100dvh] filter-panel-mobile">
              
              {/* Header */}
              <div className="relative p-4 md:p-6 border-b border-white/10 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10" />
                <div className="relative flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                      <SlidersHorizontal size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Movie Filters</h3>
                      <p className="text-sm text-gray-400">{getActiveFilterCount()} filters active</p>
                    </div>
                  </div>
                  <button
                    onClick={togglePanel}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-white/10 bg-white/5 flex-shrink-0">
                <button
                  className={`flex-1 py-2 md:py-3 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'basic'
                      ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setActiveTab('basic')}
                >
                  Basic Filters
                </button>
                <button
                  className={`flex-1 py-2 md:py-3 text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'advanced'
                      ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setActiveTab('advanced')}
                >
                  Advanced
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 min-h-0 filter-content-mobile">
                {activeTab === 'basic' ? (
                  <div className="space-y-3 md:space-y-4">
                    {/* Year Range */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400" />
                        <h4 className="text-base md:text-lg font-semibold text-white">Release Year</h4>
                        <span className="text-sm text-gray-400">
                          {filterOptions.yearFrom} - {filterOptions.yearTo}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
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
                    </div>

                    {/* Rating */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Star size={18} className="text-yellow-400" />
                        <h4 className="text-base md:text-lg font-semibold text-white">Minimum Rating</h4>
                        <span className="text-sm text-gray-400">{filterOptions.ratingFrom.toFixed(1)}</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
                        <div className="relative w-full h-8 cursor-pointer">
                          <div className="absolute inset-y-3 inset-x-0 bg-white/10 rounded-full" />
                          <div 
                            className="absolute inset-y-3 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" 
                            style={{ width: `${(filterOptions.ratingFrom / 10) * 100}%` }} 
                          />
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110" 
                            style={{ left: `${(filterOptions.ratingFrom / 10) * 100}%` }}
                          />
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={filterOptions.ratingFrom}
                            onChange={handleRatingChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Runtime Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock size={18} className="text-green-400" />
                        <h4 className="text-base md:text-lg font-semibold text-white">Maximum Runtime</h4>
                        <span className="text-sm text-gray-400">{formatRuntime(filterOptions.maxRuntime)}</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
                        <div className="relative w-full h-8 cursor-pointer">
                          <div className="absolute inset-y-3 inset-x-0 bg-white/10 rounded-full" />
                          <div 
                            className="absolute inset-y-3 left-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full" 
                            style={{ width: `${((Math.min(240, filterOptions.maxRuntime) - 60) / (240 - 60)) * 100}%` }} 
                          />
                          <div 
                            className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110" 
                            style={{ left: `${((Math.min(240, filterOptions.maxRuntime) - 60) / (240 - 60)) * 100}%` }}
                          />
                          <input
                            type="range"
                            min="60"
                            max="240"
                            step="15"
                            value={filterOptions.maxRuntime}
                            onChange={handleRuntimeChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Now Playing */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clapperboard size={18} className="text-green-400" />
                        <h4 className="text-base md:text-lg font-semibold text-white">Now Playing</h4>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 md:p-4 border border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={filterOptions.inTheatersOnly}
                              onChange={handleInTheatersChange}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500" />
                          </div>
                          <span className="text-white font-medium">Only show movies in theaters</span>
                        </label>
                        {filterOptions.inTheatersOnly && (
                          <p className="mt-2 text-xs text-gray-400">
                            Release dates are locked to current year for theater releases. Adult content is disabled.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                      <h4 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-pink-400" />
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleSurpriseMe}
                          className="p-2 md:p-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 
                                   text-white font-medium rounded-xl transition-all duration-200 
                                   transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm"
                        >
                          <Shuffle size={16} className="inline mr-2" />
                          Surprise Me
                        </button>
                        <button
                          onClick={resetFilters}
                          className="p-2 md:p-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl 
                                   transition-all duration-200 border border-white/20 hover:border-white/30 text-sm"
                        >
                          <Trash2 size={16} className="inline mr-2" />
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {/* Genres */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clapperboard size={16} className="text-purple-400" />
                        <h4 className="text-sm font-semibold text-white">Genres</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {genres.map((genre, index) => (
                          <button
                            key={genre.id}
                            onClick={(e) => handleGenreToggle(genre.id, e)}
                            className={`p-1.5 md:p-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${
                              filterOptions.genres.includes(genre.id)
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                            style={{
                              animationDelay: `${index * 30}ms`,
                              animation: 'slideInUp 0.3s ease-out forwards'
                            }}
                          >
                            {genre.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Adult Content Filter */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-400" />
                        <h4 className="text-sm font-semibold text-white">Adult Content</h4>
                      </div>
                      <div className="bg-white/5 rounded-xl p-2 md:p-3 border border-white/10">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={filterOptions.includeAdult}
                              onChange={handleAdultContentChange}
                              className="sr-only peer"
                              disabled={filterOptions.inTheatersOnly}
                            />
                            <div className={`w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-red-500 ${filterOptions.inTheatersOnly ? 'opacity-50 cursor-not-allowed' : ''}`} />
                          </div>
                          <span className={`font-medium ${filterOptions.inTheatersOnly ? 'text-gray-500' : 'text-white'}`}>Include adult content</span>
                        </label>
                        {filterOptions.includeAdult && (
                          <p className="mt-1 text-[10px] md:text-xs text-gray-400">
                            Theater releases disabled
                          </p>
                        )}
                        {filterOptions.inTheatersOnly && (
                          <p className="mt-1 text-[10px] md:text-xs text-gray-500">
                            Adult content unavailable
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 md:p-6 border-t border-white/10 bg-white/5 flex-shrink-0 pb-safe">
                <button
                  onClick={handlePickMovie}
                  disabled={isApplyingAndPicking || loadingState === LoadingState.LOADING}
                  className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                           hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500
                           disabled:from-gray-600 disabled:to-gray-600
                           text-white font-semibold py-3 md:py-4 rounded-2xl
                           shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                           transform hover:scale-[1.02] active:scale-[0.98]
                           transition-all duration-200 ease-out
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isApplyingAndPicking || loadingState === LoadingState.LOADING ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Finding Movie...
                    </div>
                  ) : (
                    'Pick Movie'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Birth Year Modal */}
      {showBirthYearModal && (
        <BirthYearVerification
          isOpen={showBirthYearModal}
          onConfirm={handleBirthYearConfirm}
          onCancel={handleBirthYearCancel}
        />
      )}
    </div>
  );
};

export default FilterPanel;