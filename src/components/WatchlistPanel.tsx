import React, { useState, useEffect } from 'react';
import { BookMarked, X, Trash2 } from 'lucide-react';
import { useMovieContext } from '../context/MovieContext';
import { getImageUrl, fetchMovieDetails } from '../config/api';
import Button from './ui/Button';
import { analytics } from '../utils/analytics';

const WatchlistPanel: React.FC = () => {
  const { watchlist, removeFromWatchlist } = useMovieContext();
  const [isOpen, setIsOpen] = useState(false);
  const [updatedScores, setUpdatedScores] = useState<Record<number, number>>({});
  const [updatedMovies, setUpdatedMovies] = useState<Record<number, { vote_average: number; imdb_id: string | null }>>({});

  useEffect(() => {
    if (isOpen && watchlist.length > 0) {
      analytics.updateWatchlistSize(watchlist.length);
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

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleRemove = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromWatchlist(id);
  };

  const handleMovieClick = (e: React.MouseEvent) => {
    // Prevent click from bubbling up to parent elements
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="fixed z-10 bottom-[calc(env(safe-area-inset-bottom)+2rem)] left-4 md:static"
        icon={<BookMarked size={18} />}
        onClick={togglePanel}
      >
        Watchlist ({watchlist.length})
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-20 md:hidden"
          onClick={togglePanel}
        ></div>
      )}

      <div className={`fixed bottom-0 right-0 left-0 md:absolute md:top-full md:left-0 md:right-auto md:w-96 bg-gray-900/95 backdrop-blur-sm shadow-2xl rounded-t-xl md:rounded-xl border border-gray-800 transition-all duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-y-0 pb-safe' : 'translate-y-full md:-translate-y-4 md:opacity-0 md:invisible'
      } md:mt-2`}>
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">Your Watchlist</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePanel}
            icon={<X size={20} className="text-gray-300" />}
            className="hover:bg-red-500/10 hover:text-red-500"
            aria-label="Close watchlist panel"
          />
        </div>

        <div className="p-4 max-h-[80vh] md:max-h-[600px] overflow-y-auto">
          {watchlist.length === 0 ? (
            <div className="text-center py-8">
              <BookMarked size={48} className="mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">Your watchlist is empty</p>
              <p className="text-gray-500 text-sm mt-2">
                Save movies you want to watch later
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {watchlist.map((movie) => (
                <li 
                  key={movie.id} 
                  className="bg-gray-800/40 backdrop-blur-md rounded-lg overflow-hidden flex items-center hover:bg-gray-800/60 transition-all border border-gray-700/30 shadow-lg cursor-default"
                  onClick={handleMovieClick}
                >
                  <img
                    src={getImageUrl(movie.poster_path, 'w92')}
                    alt={movie.title}
                    className="w-16 h-24 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 p-3 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-white truncate">{movie.title}</h4>
                      <button
                        onClick={(e) => handleRemove(movie.id, e)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-500/10 flex-shrink-0"
                        aria-label={`Remove ${movie.title} from watchlist`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">
                      {new Date(movie.release_date).getFullYear()}
                    </p>
                    <div className="mt-auto flex items-center">
                      <span className="text-yellow-500 text-sm flex items-center">
                        ★ {(updatedMovies[movie.id]?.vote_average ?? movie.vote_average) > 0 
                            ? (updatedMovies[movie.id]?.vote_average ?? movie.vote_average).toFixed(1)
                            : 'N/A'}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistPanel;