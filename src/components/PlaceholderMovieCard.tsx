import React from 'react';
import { Film, Star, Calendar, Clock } from 'lucide-react';
import Button from './ui/Button';

const PlaceholderMovieCard: React.FC = () => {
  return (
    <div className="w-full max-w-[95vw] md:max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-xl border border-gray-800 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row h-full">
        <div className="w-full md:w-1/3 relative h-[400px] md:h-[600px] bg-gray-800 flex items-center justify-center">
          <Film size={80} className="text-gray-700" />
        </div>
        <div className="md:w-2/3 p-5 md:p-8 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700 leading-tight">
                Your Next Movie Awaits
              </h2>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span>Release Date</span>
                </div>
                <div className="flex items-center">
                  <Star size={16} className="mr-1" />
                  <span>Rating</span>
                </div>
                <div className="flex items-center">
                  <Clock size={16} className="mr-1" />
                  <span>Runtime</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 flex-1">
            <div className="flex flex-wrap gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-800 text-sm text-gray-600 rounded-full"
                >
                  Genre {i}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-full" />
              <div className="h-4 bg-gray-800 rounded w-5/6" />
              <div className="h-4 bg-gray-800 rounded w-4/6" />
            </div>
          </div>
          
          <div className="flex flex-row gap-3 mt-4 md:mt-auto">
            <Button
              variant="primary"
              disabled
              className="bg-gray-800 hover:bg-gray-800 cursor-not-allowed flex-1"
            >
              View on IMDb
            </Button>
            <Button
              variant="secondary"
              disabled
              className="bg-gray-800 hover:bg-gray-800 cursor-not-allowed flex-1"
            >
              Add to Watchlist
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderMovieCard;