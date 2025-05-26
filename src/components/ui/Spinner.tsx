import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${className}`}>
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-red-600 ${sizeStyles[size]}`}></div>
    </div>
  );
};

export default Spinner;