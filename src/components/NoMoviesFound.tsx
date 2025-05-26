import React, { useState } from 'react';
import { AlertTriangle, Sliders, ChevronDown } from 'lucide-react';
import Button from './ui/Button';
import { useMovieContext } from '../context/MovieContext';

const NoMoviesFound: React.FC = () => {
  const { filterOptions, updateFilterOptions, genres } = useMovieContext();
  const currentYear = new Date().getFullYear();
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const resetFilters = () => {
    updateFilterOptions({
      genres: [],
      yearFrom: 1990,
      yearTo: currentYear,
      ratingFrom: 6,
      maxRuntime: 150,
      inTheatersOnly: false,
      includeAdult: false,
    });
  };

  const getActiveFilters = () => {
    const filters = [];
    
    // Get genre names for display
    const genreNames = genres.filter(g => filterOptions.genres.includes(g.id))
      .map(g => g.name);
    
    if (filterOptions.genres.length > 0) {
      filters.push({
        name: 'Genres',
        value: `${genreNames.length} selected: ${genreNames.join(', ')}`,
        suggestion: genreNames.length > 2 
          ? 'Multiple genres greatly restrict results. Try selecting 1-2 main genres.'
          : 'Consider trying different genre combinations'
      });
    }
    
    if (filterOptions.yearFrom !== 1990 || filterOptions.yearTo !== currentYear) {
      filters.push({
        name: 'Year Range',
        value: `${filterOptions.yearFrom} - ${filterOptions.yearTo}`,
        suggestion: filterOptions.yearTo - filterOptions.yearFrom < 20
          ? 'A narrow year range limits options. Try expanding by a decade or more.'
          : 'Consider including more years to find hidden gems'
      });
    }
    
    if (filterOptions.ratingFrom > 0) {
      filters.push({
        name: 'Minimum Rating',
        value: `${filterOptions.ratingFrom} / 10`,
        suggestion: filterOptions.ratingFrom > 8
          ? 'Very few movies rate above 8. Try lowering your expectations!'
          : filterOptions.ratingFrom > 7
            ? 'High ratings are rare. Consider going down to 6-7 for more variety.'
            : filterOptions.ratingFrom > 6
              ? 'Many good movies have modest ratings. Try lowering this slightly.'
              : undefined
      });
    }
    
    if (filterOptions.maxRuntime < 240) {
      filters.push({
        name: 'Maximum Runtime',
        value: `${filterOptions.maxRuntime} minutes`,
        suggestion: filterOptions.maxRuntime < 90
          ? 'Very few movies are this short. Try increasing to at least 90 minutes.'
          : filterOptions.maxRuntime < 120
            ? 'Most movies run 90-150 minutes. Consider increasing this limit.'
            : undefined
      });
    }
    
    if (filterOptions.inTheatersOnly) {
      filters.push({
        name: 'Now Playing',
        value: 'Only showing movies in theaters',
        suggestion: 'Current releases are limited. Disable this to see all movies.'
      });
    }
    
    return filters;
  };

  const activeFilters = getActiveFilters();

  return (
    <div className="w-full max-w-[95vw] md:max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 p-6 md:p-12">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 md:w-16 md:h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 md:mb-6">
          <AlertTriangle size={24} className="text-yellow-500 md:w-8 md:h-8" />
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">No Movies Found</h3>
        
        <p className="text-gray-400 mb-4 md:mb-6 max-w-lg text-sm md:text-base">
          We couldn't find any movies matching your current filters. Try adjusting your filters to see more results.
        </p>

        {activeFilters.length > 0 && (
          <div className="w-full max-w-md mb-6 md:mb-8">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 mb-2 md:mb-3">
              <Sliders size={16} />
              <span>Active Filters:</span>
            </div>
            <ul className="space-y-2">
              {activeFilters.map((filter) => (
                <li 
                  key={filter.name}
                  className={`bg-gray-800/50 text-xs md:text-sm text-gray-300 py-2 px-3 md:px-4 rounded-lg transition-all cursor-pointer ${
                    expandedFilter === filter.name ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => setExpandedFilter(
                    expandedFilter === filter.name ? null : filter.name
                  )}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-medium">{filter.name}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-gray-400 truncate max-w-[150px] md:max-w-none">{filter.value}</span>
                      <ChevronDown 
                        size={14}
                        className={`flex-shrink-0 transition-transform ${
                          expandedFilter === filter.name ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>
                  {expandedFilter === filter.name && filter.suggestion && (
                    <p className="mt-2 text-[11px] md:text-xs text-yellow-500/80 border-t border-gray-700/50 pt-2">
                      💡 {filter.suggestion}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="primary"
          onClick={resetFilters}
          size="md"
          className="w-full md:w-auto md:min-w-[200px] text-sm md:text-base"
        >
          Reset All Filters
        </Button>
      </div>
    </div>
  );
};

export default NoMoviesFound;