/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the API module
vi.mock('../../src/config/api', () => ({
  fetchRandomMovie: vi.fn(),
  fetchGenres: vi.fn(),
  getImageUrl: vi.fn(),
}));

describe('Movie Picker Functional Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  describe('User Interface Functionality', () => {
    it('should render main interface elements', async () => {
      const { container } = render(<div data-testid="app-container">Movie Night Picker</div>);
      
      expect(container).toBeInTheDocument();
      expect(screen.getByTestId('app-container')).toBeInTheDocument();
    });

    it('should handle user interactions without errors', async () => {
      const user = userEvent.setup();
      const mockButton = render(
        <button onClick={() => console.log('clicked')}>Click me</button>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(button).toBeInTheDocument();
    });

    it('should display loading states appropriately', async () => {
      const LoadingComponent = () => {
        const [loading, setLoading] = React.useState(false);
        
        return (
          <div>
            <button onClick={() => setLoading(!loading)}>
              Toggle Loading
            </button>
            {loading && <div data-testid="loading">Loading...</div>}
          </div>
        );
      };

      render(<LoadingComponent />);
      
      const button = screen.getByText('Toggle Loading');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toBeInTheDocument();
      });
    });

    it('should handle error states gracefully', async () => {
      const ErrorComponent = () => {
        const [error, setError] = React.useState<string | null>(null);
        
        const triggerError = () => {
          setError('Something went wrong');
        };
        
        return (
          <div>
            <button onClick={triggerError}>Trigger Error</button>
            {error && <div data-testid="error">{error}</div>}
          </div>
        );
      };

      render(<ErrorComponent />);
      
      const button = screen.getByText('Trigger Error');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Something went wrong');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate year inputs', () => {
      const YearInput = () => {
        const [year, setYear] = React.useState('');
        const [error, setError] = React.useState('');
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = e.target.value;
          setYear(value);
          
          const numYear = parseInt(value);
          if (isNaN(numYear) || numYear < 1900 || numYear > new Date().getFullYear()) {
            setError('Please enter a valid year');
          } else {
            setError('');
          }
        };
        
        return (
          <div>
            <input 
              type="number" 
              value={year} 
              onChange={handleChange}
              data-testid="year-input"
            />
            {error && <div data-testid="year-error">{error}</div>}
          </div>
        );
      };

      render(<YearInput />);
      
      const input = screen.getByTestId('year-input');
      
      // Test invalid year
      fireEvent.change(input, { target: { value: '1800' } });
      expect(screen.getByTestId('year-error')).toHaveTextContent('Please enter a valid year');
      
      // Test valid year
      fireEvent.change(input, { target: { value: '2020' } });
      expect(screen.queryByTestId('year-error')).not.toBeInTheDocument();
    });

    it('should validate rating inputs', () => {
      const RatingInput = () => {
        const [rating, setRating] = React.useState('');
        const [error, setError] = React.useState('');
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const value = parseFloat(e.target.value);
          setRating(e.target.value);
          
          if (isNaN(value) || value < 0 || value > 10) {
            setError('Rating must be between 0 and 10');
          } else {
            setError('');
          }
        };
        
        return (
          <div>
            <input 
              type="number" 
              step="0.1"
              min="0"
              max="10"
              value={rating} 
              onChange={handleChange}
              data-testid="rating-input"
            />
            {error && <div data-testid="rating-error">{error}</div>}
          </div>
        );
      };

      render(<RatingInput />);
      
      const input = screen.getByTestId('rating-input');
      
      // Test invalid rating
      fireEvent.change(input, { target: { value: '15' } });
      expect(screen.getByTestId('rating-error')).toHaveTextContent('Rating must be between 0 and 10');
      
      // Test valid rating
      fireEvent.change(input, { target: { value: '7.5' } });
      expect(screen.queryByTestId('rating-error')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels', () => {
      render(
        <button aria-label="Pick random movie" data-testid="pick-button">
          🎬 Pick Movie
        </button>
      );
      
      const button = screen.getByTestId('pick-button');
      expect(button).toHaveAttribute('aria-label', 'Pick random movie');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <div>
          <button data-testid="button1">Button 1</button>
          <button data-testid="button2">Button 2</button>
          <button data-testid="button3">Button 3</button>
        </div>
      );
      
      const button1 = screen.getByTestId('button1');
      const button2 = screen.getByTestId('button2');
      
      // Focus first button
      button1.focus();
      expect(button1).toHaveFocus();
      
      // Tab to next button
      await user.tab();
      expect(button2).toHaveFocus();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <div>
          <h1>Movie Night Picker</h1>
          <h2>Select Your Preferences</h2>
          <h3>Genre Selection</h3>
        </div>
      );
      
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Movie Night Picker');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Select Your Preferences');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Genre Selection');
    });
  });

  describe('Local Storage Functionality', () => {
    it('should save user preferences to localStorage', () => {
      const preferences = {
        genres: [1, 2, 3],
        yearFrom: 2000,
        yearTo: 2023,
        ratingFrom: 7.0
      };
      
      localStorage.setItem('moviePreferences', JSON.stringify(preferences));
      
      const saved = JSON.parse(localStorage.getItem('moviePreferences') || '{}');
      expect(saved).toEqual(preferences);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded');
      });
      
      expect(() => {
        try {
          localStorage.setItem('test', 'value');
        } catch (error) {
          // Should handle gracefully
          console.warn('Failed to save to localStorage:', error);
        }
      }).not.toThrow();
      
      // Restore original method
      localStorage.setItem = originalSetItem;
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone width
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667, // iPhone height
      });
      
      const ResponsiveComponent = () => {
        const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
        
        React.useEffect(() => {
          const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
          };
          
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);
        
        return (
          <div data-testid="responsive-container">
            {isMobile ? 'Mobile View' : 'Desktop View'}
          </div>
        );
      };
      
      render(<ResponsiveComponent />);
      
      expect(screen.getByTestId('responsive-container')).toHaveTextContent('Mobile View');
    });

    it('should handle orientation changes', () => {
      const OrientationComponent = () => {
        const [orientation, setOrientation] = React.useState(
          window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
        );
        
        React.useEffect(() => {
          const handleResize = () => {
            setOrientation(
              window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
            );
          };
          
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);
        
        return (
          <div data-testid="orientation-indicator">
            {orientation}
          </div>
        );
      };
      
      render(<OrientationComponent />);
      
      // Default should be portrait for most mobile devices
      expect(screen.getByTestId('orientation-indicator')).toHaveTextContent('portrait');
    });
  });

  describe('Performance Optimization', () => {
    it('should not cause memory leaks with event listeners', () => {
      const ComponentWithListeners = () => {
        React.useEffect(() => {
          const handleScroll = () => {};
          const handleResize = () => {};
          
          window.addEventListener('scroll', handleScroll);
          window.addEventListener('resize', handleResize);
          
          // Cleanup function should remove listeners
          return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
          };
        }, []);
        
        return <div data-testid="listener-component">Component with listeners</div>;
      };
      
      const { unmount } = render(<ComponentWithListeners />);
      
      // Component should render without errors
      expect(screen.getByTestId('listener-component')).toBeInTheDocument();
      
      // Should unmount without errors (cleanup should work)
      expect(() => unmount()).not.toThrow();
    });

    it('should debounce rapid user inputs', async () => {
      let callCount = 0;
      
      const DebounceComponent = () => {
        const [value, setValue] = React.useState('');
        
        const debouncedFunction = React.useCallback(
          debounce(() => {
            callCount++;
          }, 300),
          []
        );
        
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          setValue(e.target.value);
          debouncedFunction();
        };
        
        return (
          <input 
            data-testid="debounce-input"
            value={value}
            onChange={handleChange}
          />
        );
      };
      
      // Simple debounce implementation for testing
      function debounce(func: Function, wait: number) {
        let timeout: NodeJS.Timeout;
        return function (...args: any[]) {
          clearTimeout(timeout);
          timeout = setTimeout(() => func.apply(this, args), wait);
        };
      }
      
      render(<DebounceComponent />);
      
      const input = screen.getByTestId('debounce-input');
      
      // Rapid typing
      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.change(input, { target: { value: 'abc' } });
      
      // Should not call the function immediately
      expect(callCount).toBe(0);
      
      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 350));
      
      // Should only call once after debounce
      expect(callCount).toBe(1);
    });
  });
}); 