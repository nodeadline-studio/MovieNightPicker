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

    // Separate movies and TV shows
    const movieItems = movies.filter(item => item.contentType === 'movie' || !item.contentType);
    const tvItems = movies.filter(item => item.contentType === 'tv');
    
    // Create stunning background with multiple layers
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#0f0f23'); // Deep dark blue
    bgGradient.addColorStop(0.3, '#1a1a2e'); // Dark purple
    bgGradient.addColorStop(0.6, '#16213e'); // Navy blue
    bgGradient.addColorStop(1, '#0f3460'); // Deep blue
    
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add animated gradient overlay
    const overlayGradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/1.5);
    overlayGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)'); // Purple center
    overlayGradient.addColorStop(0.4, 'rgba(59, 130, 246, 0.2)'); // Blue
    overlayGradient.addColorStop(0.7, 'rgba(236, 72, 153, 0.15)'); // Pink
    overlayGradient.addColorStop(1, 'rgba(16, 185, 129, 0.1)'); // Green edge
    
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Add geometric patterns
    ctx.save();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 100 + 50;
      
      ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Add subtle noise texture for depth
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.05})`;
      ctx.fillRect(x, y, size, size);
    }

    // Header section with enhanced styling
    const headerHeight = 140;
    
    // Add header background with gradient
    const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
    headerGradient.addColorStop(0, 'rgba(139, 92, 246, 0.2)');
    headerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(0, 0, width, headerHeight);
    
    // Logo/Title area with enhanced typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    
    // Add multiple text shadows for depth
    ctx.shadowColor = 'rgba(139, 92, 246, 0.8)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Dynamic title with emoji based on content
    const hasMovies = movieItems.length > 0;
    const hasTvShows = tvItems.length > 0;
    let title = '🎬✨ My Watchlist ✨📺';
    
    if (hasMovies && hasTvShows) {
      title = '🎬✨ My Watchlist ✨📺';
    } else if (hasMovies) {
      title = '🎬✨ My Movie Collection ✨';
    } else if (hasTvShows) {
      title = '📺✨ My TV Show Collection ✨';
    }
    
    ctx.fillText(title, width / 2, 70);
    
    // Reset shadow for subtitle
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Enhanced subtitle with better formatting
    ctx.fillStyle = '#e2e8f0'; // Light gray
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    
    let subtitle = '';
    if (movieItems.length > 0 && tvItems.length > 0) {
      const totalShown = Math.min(maxMovies, movies.length);
      subtitle = movies.length > maxMovies 
        ? `${totalShown} of ${movies.length} items • ${movieItems.length} movies • ${tvItems.length} shows`
        : `${movieItems.length} movie${movieItems.length !== 1 ? 's' : ''} • ${tvItems.length} show${tvItems.length !== 1 ? 's' : ''}`;
    } else if (movieItems.length > 0) {
      subtitle = movies.length > maxMovies 
        ? `${Math.min(maxMovies, movieItems.length)} of ${movieItems.length} movies`
        : `${movieItems.length} movie${movieItems.length !== 1 ? 's' : ''}`;
    } else if (tvItems.length > 0) {
      subtitle = movies.length > maxMovies 
        ? `${Math.min(maxMovies, tvItems.length)} of ${tvItems.length} shows`
        : `${tvItems.length} show${tvItems.length !== 1 ? 's' : ''}`;
    }
    
    ctx.fillText(subtitle, width / 2, 110);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Enhanced movie poster section
    const moviesToShow = movies.slice(0, maxMovies);
    const posterWidth = 150;
    const posterHeight = 225;
    const spacing = 25;
    const totalMovieWidth = moviesToShow.length * posterWidth + (moviesToShow.length - 1) * spacing;
    const startX = (width - totalMovieWidth) / 2;
    const startY = headerHeight + 50;

    let loadedImages = 0;
    const totalImages = moviesToShow.length;

    if (totalImages === 0) {
      // Enhanced no movies case
      const emptyGradient = ctx.createLinearGradient(0, height/2 - 50, 0, height/2 + 50);
      emptyGradient.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
      emptyGradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
      
      ctx.fillStyle = emptyGradient;
      ctx.fillRect(width/2 - 200, height/2 - 50, 400, 100);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 Start Building Your Collection! 📺', width / 2, height / 2);
      
      // Footer
      drawEnhancedFooter(ctx, width, height);
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        drawEnhancedFooter(ctx, width, height);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    const onImageError = () => {
      loadedImages++;
      if (loadedImages === totalImages) {
        drawEnhancedFooter(ctx, width, height);
        resolve(canvas.toDataURL('image/png'));
      }
    };

    // Load and draw movie posters with enhanced styling
    moviesToShow.forEach((movie, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const timeout = setTimeout(() => {
        onImageError();
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        const x = startX + index * (posterWidth + spacing);
        const y = startY;
        
        // Add glow effect behind poster
        ctx.save();
        ctx.shadowColor = movie.contentType === 'tv' ? 'rgba(139, 92, 246, 0.6)' : 'rgba(59, 130, 246, 0.6)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 10;
        
        // Draw poster with enhanced rounded corners and effects
        drawEnhancedRoundedImage(ctx, img, x, y, posterWidth, posterHeight, 15);
        
        ctx.restore();
        
        // Add content type indicator with enhanced styling
        const isMovie = movie.contentType === 'movie' || !movie.contentType;
        const indicatorColor = isMovie ? '#3b82f6' : '#8b5cf6';
        const indicator = isMovie ? '🎬' : '📺';
        
        // Enhanced indicator background
        ctx.fillStyle = indicatorColor;
        ctx.beginPath();
        ctx.roundRect(x + 8, y + 8, 32, 24, 8);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(indicator, x + 24, y + 24);
        
        // Enhanced movie title with better styling
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        
        // Add text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        let title = movie.title;
        const maxTitleWidth = posterWidth;
        const titleMetrics = ctx.measureText(title);
        
        if (titleMetrics.width > maxTitleWidth) {
          while (ctx.measureText(title + '...').width > maxTitleWidth && title.length > 0) {
            title = title.slice(0, -1);
          }
          title += '...';
        }
        
        ctx.fillText(title, x + posterWidth / 2, y + posterHeight + 30);
        
        // Enhanced year with rating
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 16px Inter, system-ui, sans-serif';
        const year = movie.release_date ? new Date(movie.release_date).getFullYear().toString() : '';
        const rating = movie.vote_average > 0 ? ` • ⭐${movie.vote_average.toFixed(1)}` : '';
        ctx.fillText(`${year}${rating}`, x + posterWidth / 2, y + posterHeight + 55);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        onImageLoad();
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        drawEnhancedMoviePlaceholder(ctx, movie, index, startX, startY, posterWidth, posterHeight, spacing);
        onImageError();
      };
      
      if (movie.poster_path) {
        img.src = getImageUrl(movie.poster_path, 'w342');
      } else {
        drawEnhancedMoviePlaceholder(ctx, movie, index, startX, startY, posterWidth, posterHeight, spacing);
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
  
  // Content type indicator and placeholder icon
  const isMovie = movie.contentType === 'movie' || !movie.contentType;
  const indicator = isMovie ? '🎬' : '📺';
  
  // Add content type indicator in corner
  ctx.fillStyle = isMovie ? '#3b82f6' : '#8b5cf6'; // blue for movies, purple for TV shows
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(indicator, x + 8, y + 20);
  
  // Placeholder icon in center
  ctx.fillStyle = '#6b7280'; // gray-500
  ctx.font = '48px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(indicator, x + posterWidth / 2, y + posterHeight / 2 + 16);
  
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

const drawEnhancedRoundedImage = (
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

const drawEnhancedMoviePlaceholder = (
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
  
  // Content type indicator and placeholder icon
  const isMovie = movie.contentType === 'movie' || !movie.contentType;
  const indicator = isMovie ? '🎬' : '📺';
  
  // Add content type indicator in corner
  ctx.fillStyle = isMovie ? '#3b82f6' : '#8b5cf6'; // blue for movies, purple for TV shows
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(indicator, x + 8, y + 20);
  
  // Placeholder icon in center
  ctx.fillStyle = '#6b7280'; // gray-500
  ctx.font = '48px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(indicator, x + posterWidth / 2, y + posterHeight / 2 + 16);
  
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

const drawEnhancedFooter = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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