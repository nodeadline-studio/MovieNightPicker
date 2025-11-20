import { useEffect, useRef } from 'react';

export const useVideoPreload = (videoSrc: string) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Create video element for preloading
    const video = document.createElement('video');
    video.src = videoSrc;
    video.preload = 'auto';
    video.muted = true; // Required for autoplay policies
    video.style.display = 'none';
    
    // Add to DOM to start preloading
    document.body.appendChild(video);
    videoRef.current = video;

    // Start loading
    video.load();

    return () => {
      // Cleanup
      if (videoRef.current && document.body.contains(videoRef.current)) {
        document.body.removeChild(videoRef.current);
      }
    };
  }, [videoSrc]);

  return videoRef.current;
}; 