/**
 * Genre Similarity Matrix
 * Defines relationships between genres for intelligent matching
 * Based on research from NLP-based recommendation systems
 */

export interface GenreSimilarity {
  genreId: number;
  similarGenres: Array<{ id: number; similarity: number }>;
}

/**
 * Genre similarity matrix
 * Maps genre IDs to their similar genres with similarity scores (0.0-1.0)
 * Higher scores = more similar genres
 */
export const GENRE_SIMILARITY_MAP: Record<number, Array<{ id: number; similarity: number }>> = {
  // Action & Adventure
  28: [{ id: 12, similarity: 0.9 }, { id: 53, similarity: 0.7 }, { id: 80, similarity: 0.6 }], // Action -> Adventure, Thriller, Crime
  12: [{ id: 28, similarity: 0.9 }, { id: 14, similarity: 0.7 }, { id: 878, similarity: 0.6 }], // Adventure -> Action, Fantasy, Sci-Fi
  
  // Drama & Romance
  18: [{ id: 10749, similarity: 0.8 }, { id: 36, similarity: 0.6 }, { id: 99, similarity: 0.5 }], // Drama -> Romance, History, Documentary
  10749: [{ id: 18, similarity: 0.8 }, { id: 35, similarity: 0.7 }, { id: 10402, similarity: 0.5 }], // Romance -> Drama, Comedy, Music
  
  // Comedy
  35: [{ id: 10749, similarity: 0.7 }, { id: 10751, similarity: 0.6 }, { id: 18, similarity: 0.5 }], // Comedy -> Romance, Family, Drama
  10751: [{ id: 35, similarity: 0.7 }, { id: 16, similarity: 0.6 }, { id: 12, similarity: 0.5 }], // Family -> Comedy, Animation, Adventure
  
  // Thriller & Crime
  53: [{ id: 80, similarity: 0.9 }, { id: 28, similarity: 0.7 }, { id: 18, similarity: 0.6 }], // Thriller -> Crime, Action, Drama
  80: [{ id: 53, similarity: 0.9 }, { id: 28, similarity: 0.7 }, { id: 18, similarity: 0.6 }], // Crime -> Thriller, Action, Drama
  
  // Horror
  27: [{ id: 53, similarity: 0.8 }, { id: 9648, similarity: 0.7 }, { id: 14, similarity: 0.5 }], // Horror -> Thriller, Mystery, Fantasy
  9648: [{ id: 27, similarity: 0.7 }, { id: 53, similarity: 0.8 }, { id: 80, similarity: 0.6 }], // Mystery -> Horror, Thriller, Crime
  
  // Sci-Fi & Fantasy
  878: [{ id: 14, similarity: 0.9 }, { id: 28, similarity: 0.6 }, { id: 12, similarity: 0.6 }], // Sci-Fi -> Fantasy, Action, Adventure
  14: [{ id: 878, similarity: 0.9 }, { id: 12, similarity: 0.7 }, { id: 16, similarity: 0.6 }], // Fantasy -> Sci-Fi, Adventure, Animation
  
  // Animation
  16: [{ id: 10751, similarity: 0.8 }, { id: 35, similarity: 0.6 }, { id: 12, similarity: 0.6 }], // Animation -> Family, Comedy, Adventure
  
  // Documentary
  99: [{ id: 36, similarity: 0.7 }, { id: 18, similarity: 0.5 }], // Documentary -> History, Drama
  
  // History & War
  36: [{ id: 99, similarity: 0.7 }, { id: 18, similarity: 0.6 }, { id: 10752, similarity: 0.8 }], // History -> Documentary, Drama, War
  10752: [{ id: 36, similarity: 0.8 }, { id: 18, similarity: 0.7 }, { id: 28, similarity: 0.5 }], // War -> History, Drama, Action
};

/**
 * Get similarity score between a movie genre and requested genres
 * @param movieGenreId - The genre ID from the movie
 * @param requestedGenreIds - Array of requested genre IDs
 * @returns Similarity score (0.0-1.0), 1.0 for exact match
 */
export function getGenreSimilarity(
  movieGenreId: number,
  requestedGenreIds: number[]
): number {
  // Exact match
  if (requestedGenreIds.includes(movieGenreId)) {
    return 1.0;
  }
  
  // Check similarity matrix
  let maxSimilarity = 0.0;
  for (const requestedId of requestedGenreIds) {
    const similarGenres = GENRE_SIMILARITY_MAP[requestedId];
    if (similarGenres) {
      const match = similarGenres.find(sg => sg.id === movieGenreId);
      if (match && match.similarity > maxSimilarity) {
        maxSimilarity = match.similarity;
      }
    }
  }
  
  return maxSimilarity;
}

/**
 * Get best genre match score for a movie
 * @param movieGenreIds - Array of genre IDs from the movie
 * @param requestedGenreIds - Array of requested genre IDs
 * @returns Best similarity score (0.0-1.0)
 */
export function getBestGenreMatch(
  movieGenreIds: number[],
  requestedGenreIds: number[]
): number {
  if (requestedGenreIds.length === 0) {
    return 1.0; // No genre filter, perfect match
  }
  
  if (movieGenreIds.length === 0) {
    return 0.0; // Movie has no genres, no match
  }
  
  // Find the best match among all movie genres
  let bestScore = 0.0;
  for (const movieGenreId of movieGenreIds) {
    const similarity = getGenreSimilarity(movieGenreId, requestedGenreIds);
    if (similarity > bestScore) {
      bestScore = similarity;
    }
  }
  
  return bestScore;
}

/**
 * Expand genre filters with similar genres
 * @param genreIds - Original genre IDs
 * @param similarityThreshold - Minimum similarity to include (default 0.6)
 * @returns Expanded array of genre IDs with similarity scores
 */
export function expandGenres(
  genreIds: number[],
  similarityThreshold: number = 0.6
): Array<{ id: number; similarity: number }> {
  const expanded = new Map<number, number>();
  
  // Add original genres with full similarity
  for (const genreId of genreIds) {
    expanded.set(genreId, 1.0);
  }
  
  // Add similar genres
  for (const genreId of genreIds) {
    const similarGenres = GENRE_SIMILARITY_MAP[genreId];
    if (similarGenres) {
      for (const similar of similarGenres) {
        if (similar.similarity >= similarityThreshold) {
          const current = expanded.get(similar.id) || 0;
          // Take maximum similarity if genre appears multiple times
          expanded.set(similar.id, Math.max(current, similar.similarity * 0.7)); // Weight expanded genres lower
        }
      }
    }
  }
  
  return Array.from(expanded.entries()).map(([id, similarity]) => ({ id, similarity }));
}

