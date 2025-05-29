import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, Clapperboard, Star, Calendar, Trash2, ChevronRight, AlertTriangle, StarHalf, Shuffle, Sparkles, CheckSquare } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import Button from './ui/Button';
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
  const { 
    genres, 
    filterOptions, 
    updateFilterOptions, 
    getRandomMovie, 
    loadingState, 
    pickCount,
    applyRandomFilters
  } = useMovieContext();
  const [isApplyingAndPicking, setIsApplyingAndPicking] = useState(false);
  const [excludeWatchlist, setExcludeWatchlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaScore, setCaptchaScore] = useState<number | null>(null);
  const [mathProblem, setMathProblem] = useState<{ question: string; answer: number } | null>(null);
  const [showVideoAd, setShowVideoAd] = useState(false);

  const currentYear = new Date().getFullYear();
  
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

  const getActiveFilterCount = (): number => {
    let count = 0;
    if (filterOptions.genres.length > 0) count++;
    if (filterOptions.yearFrom !== 1990 || filterOptions.yearTo !== currentYear) count++;
    if (filterOptions.ratingFrom !== 6) count++;
    if (filterOptions.inTheatersOnly) count++;
    if (filterOptions.tvShowsOnly) count++;
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
    e.preventDefault();
    e.stopPropagation();
    
    const newGenres = filterOptions.genres.includes(genreId)
      ? filterOptions.genres.filter(id => id !== genreId)
      : [...filterOptions.genres, genreId];
    
    updateFilterOptions({ genres: newGenres });
  };

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updateFilterOptions({ ratingFrom: value });
  };

  const handleInTheatersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    updateFilterOptions({ 
      inTheatersOnly: isChecked,
      tvShowsOnly: isChecked ? false : filterOptions.tvShowsOnly,
      yearFrom: isChecked ? new Date().getFullYear() : 1990,
      yearTo: isChecked ? new Date().getFullYear() : currentYear
    });
  };

  const handleTvShowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    updateFilterOptions({ 
      tvShowsOnly: isChecked,
      inTheatersOnly: isChecked ? false : filterOptions.inTheatersOnly
    });
  };

  const resetFilters = async () => {
    updateFilterOptions({
      genres: [],
      yearFrom: 1990,
      yearTo: 2025,
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false
    });
  };

  const handleSurpriseMe = async () => {
    await applyRandomFilters();
  };

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
        className="group relative bg-transparent border-2 border-white/30 hover:border-white/50
                   text-white font-semibold px-6 py-3 rounded-2xl
                   hover:bg-white/10 backdrop-blur-sm
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
      <>
        {/* Overlay */}
        <div 
          className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ease-out pointer-events-none ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
          }`}
          onClick={closePanel}
        />
        
        {/* Panel */}
        <div className={`fixed top-0 right-0 h-[100dvh] w-full md:w-[420px] z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}>
          <div className="h-full bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-800/95 
                         backdrop-blur-xl border-l border-white/10 shadow-2xl
                         ring-1 ring-white/5 flex flex-col
                         pb-[env(safe-area-inset-bottom)]">
            
            {/* Header - Fixed Height */}
            <div className="relative p-3 md:p-4 border-b border-white/10 flex-shrink-0 h-16 md:h-20">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10" />
              <div className="relative flex justify-between items-center h-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                    <SlidersHorizontal size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">Movie Filters</h3>
                    <p className="text-xs md:text-sm text-gray-400">{getActiveFilterCount()} filters active</p>
                  </div>
                </div>
                <button
                onClick={closePanel}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                  <X size={20} />
                </button>
              </div>
            </div>
          
            {/* Tabs - Fixed Height */}
            <div className="flex border-b border-white/10 bg-white/5 flex-shrink-0 h-12">
              <button
                className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'basic'
                    ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Filters
              </button>
              <button
                className={`flex-1 py-2 md:py-3 text-xs md:text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'advanced'
                    ? 'text-white bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('advanced')}
              >
                Advanced
              </button>
          </div>

            {/* Content - Flexible Height */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 min-h-0">
            {activeTab === 'basic' ? (
                <div className="h-full flex flex-col gap-6">
                  {/* Time & Rating Filters */}
                  <div className="space-y-4">
                    {/* Year Range */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={16} className="text-blue-400" />
                        <h4 className="text-base font-semibold text-white">Release Year</h4>
                        <span className="text-sm text-gray-400 ml-auto">
                          {filterOptions.yearFrom} - {filterOptions.yearTo}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <TimelineSlider
                        min={1900}
                        max={currentYear}
                        value={[filterOptions.yearFrom, filterOptions.yearTo]}
                        onChange={([from, to]) => {
                          if (filterOptions.inTheatersOnly) return;
                          movieCache.clear();
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
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Star size={16} className="text-yellow-400" />
                        <h4 className="text-base font-semibold text-white">Minimum Rating</h4>
                        <span className="text-sm text-gray-400 ml-auto">{filterOptions.ratingFrom.toFixed(1)}</span>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <div className="relative w-full h-6 cursor-pointer">
                          <div className="absolute inset-y-2 inset-x-0 bg-white/10 rounded-full" />
                        <div 
                            className="absolute inset-y-2 left-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" 
                            style={{ width: `${(filterOptions.ratingFrom / 10) * 100}%` }} 
                        />
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-x-1/2 cursor-grab active:cursor-grabbing transition-transform hover:scale-110" 
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
                  </div>

                  {/* Content Options */}
                  <div>
                    <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                      <Clapperboard size={16} className="text-purple-400" />
                      Content Options
                    </h4>
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <label className={`flex items-start gap-3 ${filterOptions.tvShowsOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                        <div className="relative flex-shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={filterOptions.inTheatersOnly}
                        onChange={handleInTheatersChange}
                            disabled={filterOptions.tvShowsOnly}
                            className="sr-only peer"
                      />
                          <div className="w-5 h-5 bg-white/20 border-2 border-white/30 rounded transition-all duration-200 flex items-center justify-center peer-disabled:opacity-50 peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500 peer-checked:border-green-500">
                            <CheckSquare size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                        <div className="flex-1 min-h-[20px] flex flex-col justify-center">
                          <span className="text-white font-medium leading-tight">Now Playing in Theaters</span>
                          {filterOptions.inTheatersOnly && !filterOptions.tvShowsOnly && (
                            <p className="text-xs text-gray-400 mt-1">
                              Release dates locked to current year
                            </p>
                          )}
                          {filterOptions.tvShowsOnly && (
                            <p className="text-xs text-yellow-400 mt-1">
                              ⚠️ Not available for TV shows
                      </p>
                    )}
                        </div>
                      </label>
                    </div>
                  </div>
                  
                  {/* Quick Actions - At Bottom */}
                  <div className="mt-auto">
                    <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-pink-400" />
                      Quick Actions
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleSurpriseMe}
                        className="p-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white font-medium rounded-xl 
                                 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm"
                      >
                        <Shuffle size={16} className="inline mr-2" />
                        {filterOptions.tvShowsOnly ? 'Random Show' : 'Surprise Me'}
                      </button>
                      <button
                        onClick={resetFilters}
                        className="p-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl 
                                 transition-all duration-200 border border-white/20 hover:border-white/30 text-sm"
                      >
                        <Trash2 size={16} className="inline mr-2" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
            ) : (
                <div className="h-full flex flex-col gap-3">
                  {/* Genres - Flexible */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <Clapperboard size={16} className="text-purple-400" />
                      <h4 className="text-base font-semibold text-white">Genres</h4>
                      <span className="text-sm text-gray-400 ml-auto">
                        {filterOptions.genres.length} selected
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="grid gap-2 h-full content-start
                                    grid-cols-2 sm:grid-cols-3
                                    [@media(max-height:600px)]:grid-cols-3
                                    [@media(max-height:500px)]:grid-cols-4
                                    [@media(max-height:400px)]:grid-cols-5">
                        {genres.map((genre, index) => (
                      <button
                        key={genre.id}
                        onClick={(e) => handleGenreToggle(genre.id, e)}
                            className={`p-3 rounded-lg text-xs font-medium transition-all duration-200 
                                      min-h-[44px] flex items-center justify-center text-center
                                      [@media(max-height:600px)]:p-2 [@media(max-height:600px)]:min-h-[36px]
                                      [@media(max-height:500px)]:p-1.5 [@media(max-height:500px)]:min-h-[32px]
                                      [@media(max-height:400px)]:p-1 [@media(max-height:400px)]:min-h-[28px] [@media(max-height:400px)]:text-[10px]
                                      ${
                          filterOptions.genres.includes(genre.id)
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                                : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10'
                        }`}
                      >
                        <span className="leading-tight">{genre.name}</span>
                      </button>
                    ))}
                      </div>
                  </div>
                </div>

                  {/* Content Type - Fixed */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clapperboard size={16} className="text-blue-400" />
                      <h4 className="text-base font-semibold text-white">Content Type</h4>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                            checked={filterOptions.tvShowsOnly}
                            onChange={handleTvShowsChange}
                            className="sr-only peer"
                    />
                          <div className="w-5 h-5 bg-white/20 border-2 border-white/30 rounded transition-all duration-200 flex items-center justify-center peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-indigo-500 peer-checked:border-blue-500">
                            <CheckSquare size={12} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-200" />
                          </div>
                        </div>
                        <div className="flex-1 min-h-[20px] flex flex-col justify-center">
                          <span className="font-medium text-white leading-tight">Only TV shows</span>
                          {filterOptions.tvShowsOnly && (
                            <p className="text-xs text-gray-400 mt-1">
                              Searching TV shows instead of movies
                            </p>
                          )}
                        </div>
                  </label>
                    </div>
                  </div>
                </div>
            )}
            </div>

            {/* Footer - Fixed Height */}
            <div className="p-3 md:p-4 border-t border-white/10 bg-white/5 flex-shrink-0 h-20 md:h-24
                           pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:pb-4">
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
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                         text-sm md:text-base"
              >
                {isApplyingAndPicking || loadingState === LoadingState.LOADING ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {filterOptions.tvShowsOnly ? 'Finding Show...' : 'Finding Movie...'}
                  </div>
                ) : (
                  filterOptions.tvShowsOnly ? 'Pick Show' : 'Pick Movie'
                )}
              </button>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};

export default FilterPanel;