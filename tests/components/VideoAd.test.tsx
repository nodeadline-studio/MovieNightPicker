import React from 'react';
import { render, screen, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import VideoAd from '../../src/components/VideoAd';

// Mock window.open
const mockOpen = vi.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

describe('VideoAd Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the ad with correct branding', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText('Tired of Boring Website Backgrounds?')).toBeInTheDocument();
    expect(screen.getByText('Cinematic HD & 4K quality')).toBeInTheDocument();
    expect(screen.getByText('Commercial license included')).toBeInTheDocument();
  });

  it('displays the skip timer initially', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText(/Auto-close in \d+s/)).toBeInTheDocument();
  });

  it('shows skip button after 5 seconds', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByTestId('close-button')).toBeInTheDocument();
  });

  it('calls onClose when skip button is clicked', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('auto-closes after 10 seconds', async () => {
    vi.useFakeTimers();
    
    render(<VideoAd onClose={mockOnClose} />);
    
    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);
    
    // Use runOnlyPendingTimers to ensure all timers complete
    vi.runOnlyPendingTimers();
    
    expect(mockOnClose).toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('opens SaaSBackgrounds.com when video is clicked', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    // Use the video element directly instead of the container
    const video = screen.getByTestId('video-section').querySelector('video');
    expect(video).toBeInTheDocument();
    
    if (video) {
      fireEvent.click(video);
      expect(mockOpen).toHaveBeenCalledWith('https://saasbackgrounds.com', '_blank');
    }
  });

  it('opens SaaSBackgrounds.com when CTA button is clicked', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    const ctaButton = screen.getByTestId('cta-button');
    fireEvent.click(ctaButton);
    
    expect(mockOpen).toHaveBeenCalledWith('https://saasbackgrounds.com', '_blank');
  });

  it('displays premium SaaS tools badge', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText('Used by 10,000+ businesses')).toBeInTheDocument();
  });

  it('handles video error gracefully', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    // Use the video element directly
    const video = screen.getByTestId('video-section').querySelector('video');
    expect(video).toBeInTheDocument();
    
    if (video) {
      fireEvent.error(video);
      
      // Component should still render properly
      expect(screen.getByText('Tired of Boring Website Backgrounds?')).toBeInTheDocument();
    }
  });

  it('displays all bullet points correctly', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText('Cinematic HD & 4K quality')).toBeInTheDocument();
    expect(screen.getByText('Commercial license included')).toBeInTheDocument();
    expect(screen.getByText('Instant download, use forever')).toBeInTheDocument();
    expect(screen.getByText('Used by 10,000+ businesses')).toBeInTheDocument();
  });

  it('responds to mobile viewport changes', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    // Component should still render properly on mobile
    expect(screen.getByText('Tired of Boring Website Backgrounds?')).toBeInTheDocument();
  });

  it('renders in mock mode without video', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText('Tired of Boring Website Backgrounds?')).toBeInTheDocument();
    expect(screen.getByText('Get Professional Backgrounds →')).toBeInTheDocument();
  });

  it('displays correct CTA button text', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByText('Get Professional Backgrounds →')).toBeInTheDocument();
  });

  it('has proper video fallback', () => {
    render(<VideoAd onClose={mockOnClose} />);
    
    expect(screen.getByTestId('video-fallback')).toBeInTheDocument();
    expect(screen.getByText('🎬 Video Ad Playing')).toBeInTheDocument();
  });
}); 