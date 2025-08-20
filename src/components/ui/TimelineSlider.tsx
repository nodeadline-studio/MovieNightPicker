import React, { useRef, useEffect, useState, useCallback } from 'react';

interface TimelineSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  disabled?: boolean;
  step?: number;
}

const TimelineSlider: React.FC<TimelineSliderProps> = ({
  min,
  max,
  value,
  onChange,
  disabled = false,
  step = 1,
}) => {
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [activeDot, setActiveDot] = useState<'left' | 'right' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [leftValue, rightValue] = value;
  const [showTooltip, setShowTooltip] = useState(false);

  const snapToStep = (value: number): number => {
    const steps = Math.round((value - min) / step);
    return Math.min(max, Math.max(min, min + (steps * step)));
  };

  const handleSliderClick = (e: React.MouseEvent) => {
    if (isDragging || disabled) return;
    
    const clickPosition = calculatePosition(e.clientX);
    const distanceToLeft = Math.abs(clickPosition - leftValue);
    const distanceToRight = Math.abs(clickPosition - rightValue);
    
    if (distanceToLeft < distanceToRight) {
      onChange([snapToStep(clickPosition), rightValue]);
    } else {
      onChange([leftValue, snapToStep(clickPosition)]);
    }
  };

  const calculatePosition = useCallback((clientX: number): number => {
    if (!sliderRef.current) return 0;
    const rect = sliderRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * (max - min) + min;
    return snapToStep(Math.max(min, Math.min(max, position)));
  }, [max, min, snapToStep]);

  const handleMouseDown = (e: React.MouseEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(handle);
    setActiveDot(handle);
    setShowTooltip(true);
  };

  const handleTouchStart = (e: React.TouchEvent, handle: 'left' | 'right') => {
    e.preventDefault();
    setIsDragging(handle);
    setActiveDot(handle);
    setShowTooltip(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newPosition = calculatePosition(e.clientX);
      
      if (isDragging === 'left') {
        onChange([Math.min(newPosition, rightValue), rightValue]);
      } else {
        onChange([leftValue, Math.max(newPosition, leftValue)]);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
      setActiveDot(null);
      setTimeout(() => setShowTooltip(false), 1000);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, leftValue, rightValue, onChange, max, min, calculatePosition]);

  const leftPercent = ((leftValue - min) / (max - min)) * 100;
  const rightPercent = ((rightValue - min) / (max - min)) * 100;

  return (
    <div className="relative pt-8 pb-4 select-none">
      <div
        ref={sliderRef}
        className={`h-2 bg-gray-700 rounded-lg relative ${disabled ? 'opacity-50 cursor-not-allowed' : ''} select-none`}
        onClick={handleSliderClick}
      >
        {/* Selected range */}
        <div
          className="absolute h-full bg-red-600 rounded-lg transition-all duration-200"
          style={{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
          }}
        />
        
        {/* Range label */}
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full px-3 py-1 text-sm font-medium text-white whitespace-nowrap">
          {leftValue} - {rightValue}
        </div>
        
        {/* Left handle */}
        <div
          className={`absolute w-5 h-5 bg-white rounded-full -ml-2.5 top-1/2 -translate-y-1/2 cursor-pointer shadow-lg transform transition-transform ${
            (isDragging === 'left' || activeDot === 'left') ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 z-20' : 'hover:scale-110 z-10'} ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          } touch-none`}
          style={{ left: `${leftPercent}%` }}
          onMouseDown={(e) => !disabled && handleMouseDown(e, 'left')}
          onTouchStart={(e) => !disabled && handleTouchStart(e, 'left')}
        >
          {showTooltip && isDragging === 'left' && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {leftValue}
            </div>
          )}
        </div>
        
        {/* Right handle */}
        <div
          className={`absolute w-5 h-5 bg-white rounded-full -ml-2.5 top-1/2 -translate-y-1/2 cursor-pointer shadow-lg transform transition-transform ${
            (isDragging === 'right' || activeDot === 'right') ? 'scale-125 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 z-20' : 'hover:scale-110 z-10'} ${
            disabled ? 'cursor-not-allowed opacity-50' : ''
          } touch-none`}
          style={{ left: `${rightPercent}%` }}
          onMouseDown={(e) => !disabled && handleMouseDown(e, 'right')}
          onTouchStart={(e) => !disabled && handleTouchStart(e, 'right')}
        >
          {showTooltip && isDragging === 'right' && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {rightValue}
            </div>
          )}
        </div>
      </div>

      {/* Timeline markers */}
      <div className="absolute left-0 right-0 bottom-0 flex justify-between text-[10px] text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default TimelineSlider;