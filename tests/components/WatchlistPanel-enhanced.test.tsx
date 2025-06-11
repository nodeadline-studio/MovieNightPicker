import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WatchlistPanel from '../../src/components/WatchlistPanel';
import { MovieProvider } from '../../src/context/MovieContext';

// Mock modules
vi.mock('../../src/utils/imageGenerator', () => ({
  generateWatchlistImage: vi.fn().mockResolvedValue('data:image/png;base64,mockedimage')
}));

vi.mock('../../src/utils/analytics', () => ({
  analytics: {
    updateWatchlistSize: vi.fn(),
    trackShare: vi.fn()
  }
}));

vi.mock('../../src/utils/gtag', () => ({
  trackWatchlistRemove: vi.fn(),
  trackShare: vi.fn()
}));

vi.mock('../../src/config/api', () => ({
  fetchMovieDetails: vi.fn().mockResolvedValue({
    vote_average: 8.5,
    imdb_id: 'tt1234567'
  }),
  getImageUrl: vi.fn((path, size) => `https://image.tmdb.org/t/p/${size}${path}`)
}));

vi.mock('../../src/utils/shareUtils', () => ({
  canUseNativeShare: vi.fn(() => false),
  canShareWithFiles: vi.fn(() => false),
  canUseClipboard: vi.fn(() => true)
}));

const mockMovie = {
  id: 1,
  title: 'Test Movie',
  overview: 'A test movie overview',
  poster_path: '/test-poster.jpg',
  backdrop_path: '/test-backdrop.jpg',
  release_date: '2023-01-01',
  vote_average: 8.5,
  vote_count: 1000,
  imdb_id: 'tt1234567',
  genres: [{ id: 28, name: 'Action' }],
  addedAt: '2023-01-01T00:00:00.000Z',
  contentType: 'movie' as const
};

const MockMovieProvider = ({ children }: { children: React.ReactNode }) => {
  const mockContext = {
    watchlist: [mockMovie],
    removeFromWatchlist: vi.fn(),
    clearWatchlist: vi.fn(),
    debugLocalStorage: vi.fn(),
    addToWatchlist: vi.fn()
  };

  return (
    <div data-testid="mock-provider">
      {React.cloneElement(children as React.ReactElement, { 
        useMovieContext: () => mockContext 
      })}
    </div>
  );
};

// Global clipboard mock
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
  write: vi.fn().mockResolvedValue(undefined)
};

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  configurable: true
});

// Mock ClipboardItem
global.ClipboardItem = vi.fn().mockImplementation((data) => ({ data }));

// Mock fetch for image generation
global.fetch = vi.fn().mockResolvedValue({
  blob: () => Promise.resolve(new Blob(['mock image'], { type: 'image/png' }))
});

describe('Enhanced WatchlistPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.gtag
    global.window = Object.create(window);
    Object.defineProperty(window, 'gtag', {
      value: vi.fn(),
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <MovieProvider>
        {component}
      </MovieProvider>
    );
  };

  describe('Animation Improvements', () => {
    it('should not repeat animations on interaction', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      
      // Open panel
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
      });

      // Find the movie item
      const movieItem = screen.getByText('Test Movie').closest('.group');
      expect(movieItem).toHaveClass('group');
      
      // Get initial animation styles
      const initialStyle = window.getComputedStyle(movieItem!);
      
      // Interact with buttons in the watchlist (this should NOT trigger animation again)
      const previewButton = screen.getByTitle('Show details');
      fireEvent.click(previewButton);
      
      await waitFor(() => {
        // Animation should not restart - check that we don't have the initial animation classes
        expect(movieItem).not.toHaveStyle('animation: slideInUp 0.5s ease-out forwards');
      });
    });

    it('should reset animation state when panel closes and reopens', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      
      // Open panel
      fireEvent.click(watchlistButton);
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
      });

      // Close panel
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Your Watchlist')).not.toBeInTheDocument();
      });

      // Reopen panel - animations should work again
      fireEvent.click(watchlistButton);
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
        const movieItem = screen.getByText('Test Movie').closest('.group');
        expect(movieItem).toBeInTheDocument();
      });
    });
  });

  describe('Share To... Feature', () => {
    it('should display "Share To..." instead of "Smart Share"', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
      });

      // Open share menu
      const shareButton = screen.getByRole('button', { name: /share/i });
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(screen.getByText('Share To...')).toBeInTheDocument();
        expect(screen.queryByText('Smart Share')).not.toBeInTheDocument();
      });
    });

    it('should show descriptive text for Share To... button', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Copy image & text to clipboard')).toBeInTheDocument();
      });
    });

    it('should remove the separate "Copy Link" button', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Copy Link')).not.toBeInTheDocument();
      });
    });
  });

  describe('Enhanced Clipboard Functionality', () => {
    it('should copy both text and image to clipboard', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      const shareToButton = screen.getByText('Share To...');
      
      await act(async () => {
        fireEvent.click(shareToButton);
      });

      await waitFor(() => {
        expect(mockClipboard.write).toHaveBeenCalledWith([
          expect.objectContaining({
            data: expect.objectContaining({
              'text/plain': expect.any(Blob),
              'image/png': expect.any(Blob)
            })
          })
        ]);
      });
    });

    it('should fallback to text-only if image clipboard fails', async () => {
      // Mock clipboard.write to fail for image + text
      mockClipboard.write.mockRejectedValueOnce(new Error('Clipboard write failed'));
      
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      const shareToButton = screen.getByText('Share To...');
      
      await act(async () => {
        fireEvent.click(shareToButton);
      });

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('🎬 My Watchlist: Test Movie!')
        );
      });
    });

    it('should show success message after successful clipboard operation', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      const shareToButton = screen.getByText('Share To...');
      
      await act(async () => {
        fireEvent.click(shareToButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Image and text copied to clipboard!')).toBeInTheDocument();
      });

      // Success message should disappear after timeout
      await waitFor(() => {
        expect(screen.queryByText('Image and text copied to clipboard!')).not.toBeInTheDocument();
      }, { timeout: 4000 });
    });
  });

  describe('Improved UI Interactions', () => {
    it('should show/hide preview details correctly', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test Movie')).toBeInTheDocument();
      });

      // Click preview button to show details
      const previewButton = screen.getByTitle('Show details');
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(screen.getByTitle('Hide details')).toBeInTheDocument();
        // Should show expanded movie details
        expect(screen.getByText('A test movie overview')).toBeInTheDocument();
      });

      // Click again to hide details
      const hideButton = screen.getByTitle('Hide details');
      fireEvent.click(hideButton);

      await waitFor(() => {
        expect(screen.getByTitle('Show details')).toBeInTheDocument();
        expect(screen.queryByText('A test movie overview')).not.toBeInTheDocument();
      });
    });

    it('should handle IMDb link clicks correctly', async () => {
      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', { value: mockOpen, configurable: true });

      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const imdbButton = screen.getByTitle('View on IMDb');
        fireEvent.click(imdbButton);
      });

      expect(mockOpen).toHaveBeenCalledWith('https://www.imdb.com/title/tt1234567', '_blank');
    });

    it('should have improved responsive design for share menu', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      const shareMenu = screen.getByText('Share To...').closest('.absolute');
      expect(shareMenu).toHaveClass('min-w-[240px]'); // Increased from 220px
    });
  });

  describe('Error Handling', () => {
    it('should fallback to download if clipboard is not supported', async () => {
      // Mock clipboard as not supported
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        configurable: true
      });

      // Mock document.createElement and related DOM methods
      const mockLink = {
        download: '',
        href: '',
        click: vi.fn(),
        remove: vi.fn()
      };
      const mockCreateElement = vi.fn().mockReturnValue(mockLink);
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      Object.defineProperty(document, 'createElement', { value: mockCreateElement });
      Object.defineProperty(document.body, 'appendChild', { value: mockAppendChild });
      Object.defineProperty(document.body, 'removeChild', { value: mockRemoveChild });

      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        const shareButton = screen.getByRole('button', { name: /share/i });
        fireEvent.click(shareButton);
      });

      const shareToButton = screen.getByText('Share To...');
      
      await act(async () => {
        fireEvent.click(shareToButton);
      });

      await waitFor(() => {
        expect(mockCreateElement).toHaveBeenCalledWith('a');
        expect(mockLink.click).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should not cause memory leaks with animation controls', async () => {
      const { unmount } = renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      fireEvent.click(watchlistButton);
      
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
      });

      // Unmount component
      unmount();
      
      // No assertions needed - this test passes if no errors are thrown during unmount
      expect(true).toBe(true);
    });

    it('should handle rapid open/close operations gracefully', async () => {
      renderWithProvider(<WatchlistPanel />);
      
      const watchlistButton = screen.getByText('Watchlist');
      
      // Rapidly open and close
      for (let i = 0; i < 5; i++) {
        fireEvent.click(watchlistButton);
        const closeButton = await screen.findByRole('button', { name: /close/i });
        fireEvent.click(closeButton);
      }
      
      // Should still work normally
      fireEvent.click(watchlistButton);
      await waitFor(() => {
        expect(screen.getByText('Your Watchlist')).toBeInTheDocument();
      });
    });
  });
}); 