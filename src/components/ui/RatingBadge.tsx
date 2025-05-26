import React from 'react';

interface RatingBadgeProps {
  rating: string;
  description?: string;
  className?: string;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, description, className = '' }) => {
  const getBgColor = () => {
    switch (rating) {
      case 'G':
        return 'bg-green-600';
      case 'PG':
        return 'bg-blue-600';
      case 'PG-13':
        return 'bg-yellow-600';
      case 'R':
        return 'bg-red-600';
      case 'NC-17':
        return 'bg-purple-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span className={`${getBgColor()} text-white text-xs font-bold px-2 py-1 rounded`}>
        {rating}
      </span>
      {description && (
        <span className="text-xs text-gray-400">{description}</span>
      )}
    </div>
  );
};

export default RatingBadge;