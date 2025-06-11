import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import VideoAd from '../../src/components/VideoAd';
import * as gtag from '../../src/utils/gtag';

// Mock gtag module
vi.mock('../../src/utils/gtag', () => ({
  trackVideoAdClick: vi.fn(),
}));

// Mock window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  configurable: true,
});

describe('VideoAd Component', () => {
  const mockOnClose = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the ad with correct SaaSBackground branding', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    expect(screen.getByText('SaaSBackground')).toBeInTheDocument();
    expect(screen.getByText('Premium SaaS Solutions')).toBeInTheDocument();
    expect(screen.getByText('Accelerate your SaaS development with enterprise-grade solutions')).toBeInTheDocument();
    expect(screen.getByText('Visit SaaSBackground.com')).toBeInTheDocument();
  });

  it('displays the skip timer initially', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    expect(screen.getByText('Skip in 15s')).toBeInTheDocument();
  });

  it('shows skip button after 5 seconds', async () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Skip ad')).toBeInTheDocument();
    });
  });

  it('calls onClose when skip button is clicked', async () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    // Fast-forward to show skip button
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      const skipButton = screen.getByLabelText('Skip ad');
      fireEvent.click(skipButton);
    });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-closes after 15 seconds', async () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    // Fast-forward 15 seconds
    vi.advanceTimersByTime(15000);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('opens SaaSBackground.com when video is clicked', async () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    const video = screen.getByRole('presentation'); // video element
    fireEvent.click(video);
    
    expect(gtag.trackVideoAdClick).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith('https://saasbackground.com', '_blank');
  });

  it('opens SaaSBackground.com when CTA button is clicked', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    const ctaButton = screen.getByText('Visit SaaSBackground.com');
    fireEvent.click(ctaButton);
    
    expect(gtag.trackVideoAdClick).toHaveBeenCalledTimes(1);
    expect(mockWindowOpen).toHaveBeenCalledWith('https://saasbackground.com', '_blank');
  });

  it('displays premium SaaS features correctly', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    expect(screen.getByText('Enterprise Grade')).toBeInTheDocument();
    expect(screen.getByText('Instant Setup')).toBeInTheDocument();
    expect(screen.getByText('24/7 Support')).toBeInTheDocument();
    expect(screen.getByText('Full Scalability')).toBeInTheDocument();
  });

  it('displays premium SaaS tools badge', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    expect(screen.getByText('PREMIUM SAAS TOOLS')).toBeInTheDocument();
  });

  it('handles video error gracefully', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    const video = screen.getByRole('presentation');
    fireEvent.error(video);
    
    // Should show play button overlay when video fails
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('responds to mobile viewport changes', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile width
    });

    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    // Trigger resize event
    fireEvent.resize(window);
    
    // Component should still render properly on mobile
    expect(screen.getByText('SaaSBackground')).toBeInTheDocument();
  });

  it('handles backdrop click when skip is available', async () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} />);
    
    // Fast-forward to enable skip
    vi.advanceTimersByTime(5000);
    
    await waitFor(() => {
      const backdrop = document.querySelector('.bg-black\\/80');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
    });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders in mock mode without video', () => {
    render(<VideoAd onClose={mockOnClose} onError={mockOnError} mockMode={true} />);
    
    expect(screen.getByText('SaaSBackground')).toBeInTheDocument();
    expect(screen.getByText('Visit SaaSBackground.com')).toBeInTheDocument();
  });
}); 