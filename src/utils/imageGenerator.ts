import { WatchlistMovie } from '../types';
import { getImageUrl } from '../config/api';

interface WatchlistImageOptions {
  movies: WatchlistMovie[];
  maxMovies?: number;
  width?: number;
  height?: number;
}

export const generateWatchlistImage = async ({
  movies,
  maxMovies = 6,
  width = 1200,
  height = 630
}: WatchlistImageOptions): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(0.5, '#1e293b'); // slate-800
    gradient.addColorStop(1, '#334155'); // slate-700
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(99, 102, 241, 0.05)'; // indigo overlay
    ctx.fillRect(0, 0, width, height);

    // Header section
    const headerHeight = 120;
    
    // Logo/Title area
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎬 My Movie Watchlist', width / 2, 60);
    
    // Subtitle
    ctx.fillStyle = '#94a3b8'; // slate-400
    ctx.font = '24px Inter, system-ui, sans-serif';
    const subtitle = movies.length > maxMovies 
      ? `${maxMovies} of ${movies.length} movies` 
      : `${movies.length} movie${movies.length !== 1 ? 's' : ''}`;
    ctx.fillText(subtitle, width / 2, 95);

    // Movies section
    const moviesToShow = movies.slice(0, maxMovies);
    const posterWidth = 140;
    const posterHeight = 210;
    const spacing = 20;
    const totalMovieWidth = moviesToShow.length * posterWidth + (moviesToShow.length - 1) * spacing;
    const startX = (width - totalMovieWidth) / 2;
    const startY = headerHeight + 40;

    let loadedImages = 0;
    const totalImages = moviesToShow.length;

    if (totalImages === 0) {
      // No movies case
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '32px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No movies in watchlist yet', width / 2, height / 2);
      
      // Footer
      drawFooter(ctx, width, height);
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        // All images loaded, draw footer and resolve
        drawFooter(ctx, width, height);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    const onImageError = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        drawFooter(ctx, width, height);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    // Load and draw movie posters with timeout
    moviesToShow.forEach((movie, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Set timeout for image loading
      const timeout = setTimeout(() => {
        onImageError();
      }, 5000); // 5 second timeout
      
      img.onload = () => {
        clearTimeout(timeout);
        const x = startX + index * (posterWidth + spacing);
        const y = startY;
        
        // Draw poster with rounded corners
        drawRoundedImage(ctx, img, x, y, posterWidth, posterHeight, 12);
        
        // Movie title below poster
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        
        // Truncate long titles
        const maxTitleWidth = posterWidth;
        let title = movie.title;
        ctx.fillStyle = '#ffffff';
        const titleMetrics = ctx.measureText(title);
        
        if (titleMetrics.width > maxTitleWidth) {
          while (ctx.measureText(title + '...').width > maxTitleWidth && title.length > 0) {
            title = title.slice(0, -1);
          }
          title += '...';
        }
        
        ctx.fillText(title, x + posterWidth / 2, y + posterHeight + 25);
        
        // Year
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.font = '14px Inter, system-ui, sans-serif';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
        ctx.fillText(year, x + posterWidth / 2, y + posterHeight + 45);
        
        onImageLoad();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        drawMoviePlaceholder(ctx, movie, index, startX, startY, posterWidth, posterHeight, spacing);
        onImageError();
      };
      
      // Try different image sizes if poster_path exists
      if (movie.poster_path) {
        img.src = getImageUrl(movie.poster_path, 'w342');
      } else {
        // No poster available, draw placeholder immediately
        drawMoviePlaceholder(ctx, movie, index, startX, startY, posterWidth, posterHeight, spacing);
        onImageError();
      }
    });
  });
};

const drawRoundedImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.save();
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, width, height);
  ctx.restore();
  
  // Add subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
};

const drawMoviePlaceholder = (
  ctx: CanvasRenderingContext2D,
  movie: WatchlistMovie,
  index: number,
  startX: number,
  startY: number,
  posterWidth: number,
  posterHeight: number,
  spacing: number
) => {
  const x = startX + index * (posterWidth + spacing);
  const y = startY;
  
  // Placeholder rectangle with rounded corners
  ctx.save();
  drawRoundedRect(ctx, x, y, posterWidth, posterHeight, 12);
  ctx.fillStyle = '#374151'; // gray-700
  ctx.fill();
  ctx.restore();
  
  // Placeholder icon
  ctx.fillStyle = '#6b7280'; // gray-500
  ctx.font = '48px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎬', x + posterWidth / 2, y + posterHeight / 2 + 16);
  
  // Movie title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Inter, system-ui, sans-serif';
  let title = movie.title;
  const titleMetrics = ctx.measureText(title);
  
  if (titleMetrics.width > posterWidth) {
    while (ctx.measureText(title + '...').width > posterWidth && title.length > 0) {
      title = title.slice(0, -1);
    }
    title += '...';
  }
  
  ctx.fillText(title, x + posterWidth / 2, y + posterHeight + 25);
  
  // Year
  ctx.fillStyle = '#94a3b8'; // slate-400
  ctx.font = '14px Inter, system-ui, sans-serif';
  const year = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
  ctx.fillText(year, x + posterWidth / 2, y + posterHeight + 45);
};

const drawFooter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  // Footer background
  const footerHeight = 80;
  const footerY = height - footerHeight;
  
  const footerGradient = ctx.createLinearGradient(0, footerY, 0, height);
  footerGradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
  footerGradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
  
  ctx.fillStyle = footerGradient;
  ctx.fillRect(0, footerY, width, footerHeight);
  
  // Footer text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MovieNightPicker.com', width / 2, footerY + 35);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px Inter, system-ui, sans-serif';
  ctx.fillText('Find your perfect movie tonight', width / 2, footerY + 58);
};

// Custom roundRect implementation
const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}; 