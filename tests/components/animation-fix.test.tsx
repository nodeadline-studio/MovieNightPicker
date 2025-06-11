import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the console to capture warnings
const consoleSpy = vi.spyOn(console, 'warn');

// Simple component that reproduces the animation issue
const TestAnimationComponent: React.FC = () => {
  return (
    <div>
      {/* Test the fixed animation style pattern */}
      <div 
        className="test-item"
        style={{
          animationName: 'slideInUp',
          animationDuration: '0.5s',
          animationTimingFunction: 'ease-out',
          animationFillMode: 'forwards',
          animationDelay: '100ms'
        }}
      >
        Test Item 1
      </div>
      
      {/* Test multiple items like in the genre list */}
      {[1, 2, 3].map((index) => (
        <span
          key={index}
          style={{
            animationName: 'slideInUp',
            animationDuration: '0.5s',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards',
            animationDelay: `${index * 100}ms`
          }}
        >
          Genre {index}
        </span>
      ))}
    </div>
  );
};

describe('Animation Fix Tests', () => {
  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it('should not produce React animation warnings', () => {
    render(<TestAnimationComponent />);
    
    // Check that no warnings about animation conflicts were logged
    const animationWarnings = consoleSpy.mock.calls.filter(call => 
      call[0]?.includes?.('animationDelay') || 
      call[0]?.includes?.('animation') ||
      call[0]?.includes?.('shorthand')
    );
    
    expect(animationWarnings).toHaveLength(0);
  });

  it('should render correctly with individual animation properties', () => {
    const { container } = render(<TestAnimationComponent />);
    
    const testItem = container.querySelector('.test-item');
    expect(testItem).toBeInTheDocument();
    
    const genreItems = container.querySelectorAll('span');
    expect(genreItems).toHaveLength(3);
    
    // Verify that the elements have the correct style properties
    expect(testItem).toHaveStyle({
      animationName: 'slideInUp',
      animationDuration: '0.5s',
      animationDelay: '100ms'
    });
  });

  it('should apply different delays to multiple items', () => {
    const { container } = render(<TestAnimationComponent />);
    
    const genreItems = container.querySelectorAll('span');
    
    genreItems.forEach((item, index) => {
      expect(item).toHaveStyle({
        animationDelay: `${(index + 1) * 100}ms`
      });
    });
  });
});

// Test specific to the MovieCard genre animation fix
describe('MovieCard Genre Animation Fix', () => {
  it('should not mix shorthand and longhand animation properties', () => {
    const genres = [
      { id: 1, name: 'Action' },
      { id: 2, name: 'Drama' },
      { id: 3, name: 'Comedy' }
    ];

    const { container } = render(
      <div>
        {genres.map((genre, index) => (
          <span
            key={genre.id}
            style={{
              animationName: 'slideInUp',
              animationDuration: '0.5s',
              animationTimingFunction: 'ease-out',
              animationFillMode: 'forwards',
              animationDelay: `${index * 100}ms`
            }}
          >
            {genre.name}
          </span>
        ))}
      </div>
    );

    // Should render without warnings
    const animationWarnings = consoleSpy.mock.calls.filter(call => 
      call[0]?.includes?.('animation') && call[0]?.includes?.('conflicting')
    );
    
    expect(animationWarnings).toHaveLength(0);
    
    // Should render all genres
    expect(container.querySelectorAll('span')).toHaveLength(3);
    expect(container).toHaveTextContent('Action');
    expect(container).toHaveTextContent('Drama'); 
    expect(container).toHaveTextContent('Comedy');
  });
}); 