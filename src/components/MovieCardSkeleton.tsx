import React from 'react';

const MovieCardSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-xl animate-pulse animate-in fade-in duration-300">
      <div className="md:flex">
        <div className="md:w-1/3 relative">
          {/* Mobile: reduced height, Desktop: full height */}
          <div className="w-full h-[280px] md:h-full bg-gray-800" />
        </div>
        <div className="md:w-2/3 p-4 md:p-6 lg:p-8">
          <div className="flex justify-between items-start mb-3 md:mb-4">
            <div className="w-3/4">
              <div className="h-6 md:h-8 bg-gray-800 rounded-lg mb-2" />
              <div className="flex items-center mt-2 space-x-3 md:space-x-4">
                <div className="h-3 md:h-4 w-24 md:w-32 bg-gray-800 rounded-full" />
                <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-800 rounded-full" />
                <div className="h-3 md:h-4 w-20 md:w-24 bg-gray-800 rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="mb-4 md:mb-6">
            <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 md:h-6 w-16 md:w-20 bg-gray-800 rounded-full" />
              ))}
            </div>
            <div className="space-y-2">
              <div className="h-3 md:h-4 bg-gray-800 rounded w-full" />
              <div className="h-3 md:h-4 bg-gray-800 rounded w-5/6" />
              <div className="h-3 md:h-4 bg-gray-800 rounded w-4/6" />
            </div>
          </div>
          
          <div className="flex space-x-2 md:space-x-3 mt-auto">
            <div className="h-8 md:h-10 w-28 md:w-32 bg-gray-800 rounded-full" />
            <div className="h-8 md:h-10 w-40 md:w-48 bg-gray-800 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCardSkeleton;