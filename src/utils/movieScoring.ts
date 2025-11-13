/**
 * Movie Scoring System
 * Composite feature vector scoring based on research from open source projects
 * Combines multiple filter attributes into a single relevance score
 */

import { Movie, FilterOptions } from '../types';
import { getBestGenreMatch } from '../config/genreSimilarity';

export interface MovieScore {
  movie: Movie;
  score: number;
  breakdown: {
    genre: number;
    year: number;
    rating: number;
    runtime: number;
    popularity: number;
  };
}

/**
 * Calculate year match score
 * @param releaseYear - Movie release year
 * @param yearFrom - Filter year from
 * @param yearTo - Filter year to
 * @returns Score 0.0-1.0
 */
function calculateYearScore(
  releaseYear: number,
  yearFrom: number,
  yearTo: number
): number {
  if (releaseYear >= yearFrom && releaseYear <= yearTo) {
    // Within range - perfect score
    return 1.0;
  }
  
  // Outside range - calculate distance penalty
  const range = yearTo - yearFrom;
  let distance: number;
  
  if (releaseYear < yearFrom) {
    distance = yearFrom - releaseYear;
  } else {
    distance = releaseYear - yearTo;
  }
  
  // Penalty: lose 0.1 per year outside range, but cap at 0.0
  const penalty = Math.min(distance * 0.1, 1.0);
  return Math.max(0.0, 1.0 - penalty);
}

/**
 * Calculate rating match score
 * @param movieRating - Movie rating
 * @param minRating - Minimum requested rating
 * @returns Score 0.0-1.0
 */
function calculateRatingScore(
  movieRating: number,
  minRating: number
): number {
  if (movieRating >= minRating) {
    // Above minimum - calculate bonus for exceeding
    const excess = movieRating - minRating;
    // Bonus: up to 0.2 for exceeding by 2+ points
    const bonus = Math.min(excess * 0.1, 0.2);
    return Math.min(1.0 + bonus, 1.2); // Can exceed 1.0 for bonus
  }
  
  // Below minimum - calculate penalty
  const deficit = minRating - movieRating;
  // Penalty: lose 0.2 per point below minimum
  const penalty = Math.min(deficit * 0.2, 1.0);
  return Math.max(0.0, 1.0 - penalty);
}

/**
 * Calculate runtime match score
 * @param runtime - Movie runtime in minutes
 * @param maxRuntime - Maximum requested runtime
 * @returns Score 0.0-1.0
 */
function calculateRuntimeScore(
  runtime: number,
  maxRuntime: number
): number {
  if (maxRuntime >= 240) {
    // No runtime limit - perfect score
    return 1.0;
  }
  
  if (runtime <= maxRuntime) {
    // Within limit - perfect score
    return 1.0;
  }
  
  // Exceeds limit - calculate penalty
  const excess = runtime - maxRuntime;
  // Penalty: lose 0.05 per minute over limit, cap at 0.0
  const penalty = Math.min(excess * 0.05, 1.0);
  return Math.max(0.0, 1.0 - penalty);
}

/**
 * Calculate popularity bonus
 * @param popularity - Movie popularity (from TMDB)
 * @returns Score 0.0-0.1 (bonus)
 */
function calculatePopularityBonus(popularity: number | undefined): number {
  if (!popularity) {
    return 0.0;
  }
  
  // Normalize popularity (TMDB popularity is typically 0-100+)
  // Give bonus for popularity > 50
  if (popularity > 50) {
    return 0.1; // Maximum bonus
  }
  
  // Linear scale from 0-50
  return (popularity / 50) * 0.1;
}

/**
 * Calculate composite score for a movie based on filters
 * @param movie - Movie to score
 * @param filters - Filter options
 * @returns MovieScore with total score and breakdown
 */
export function calculateMovieScore(
  movie: Movie,
  filters: FilterOptions
): MovieScore {
  // Extract movie data
  const releaseYear = movie.release_date 
    ? new Date(movie.release_date).getFullYear()
    : 0;
  const movieGenreIds = movie.genres?.map(g => typeof g === 'number' ? g : g.id) || [];
  const runtime = (movie as any).runtime || 0;
  const popularity = (movie as any).popularity;
  
  // Calculate individual scores
  const genreScore = getBestGenreMatch(movieGenreIds, filters.genres);
  const yearScore = calculateYearScore(releaseYear, filters.yearFrom, filters.yearTo);
  const ratingScore = calculateRatingScore(movie.vote_average, filters.ratingFrom);
  const runtimeScore = calculateRuntimeScore(runtime, filters.maxRuntime);
  const popularityBonus = calculatePopularityBonus(popularity);
  
  // Composite score with weights
  // genreMatch * 0.4 + yearMatch * 0.2 + ratingMatch * 0.2 + runtimeMatch * 0.1 + popularityBonus * 0.1
  const totalScore = 
    (genreScore * 0.4) +
    (yearScore * 0.2) +
    (ratingScore * 0.2) +
    (runtimeScore * 0.1) +
    (popularityBonus * 0.1);
  
  return {
    movie,
    score: Math.min(1.0, totalScore), // Cap at 1.0
    breakdown: {
      genre: genreScore,
      year: yearScore,
      rating: ratingScore,
      runtime: runtimeScore,
      popularity: popularityBonus,
    },
  };
}

/**
 * Weighted random selection from scored movies
 * Uses squared weights to favor higher scores more
 * @param scoredMovies - Array of scored movies
 * @returns Selected movie
 */
export function weightedRandomSelect(scoredMovies: MovieScore[]): Movie {
  if (scoredMovies.length === 0) {
    throw new Error('No movies to select from');
  }
  
  if (scoredMovies.length === 1) {
    return scoredMovies[0].movie;
  }
  
  // Calculate weights (squared to favor high scores more)
  const weights = scoredMovies.map(sm => Math.pow(sm.score, 2));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Normalize weights
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Cumulative distribution
  const cumulative: number[] = [];
  let sum = 0;
  for (const weight of normalizedWeights) {
    sum += weight;
    cumulative.push(sum);
  }
  
  // Random selection
  const random = Math.random();
  for (let i = 0; i < cumulative.length; i++) {
    if (random <= cumulative[i]) {
      return scoredMovies[i].movie;
    }
  }
  
  // Fallback to last item (shouldn't happen)
  return scoredMovies[scoredMovies.length - 1].movie;
}

/**
 * Sort movies by score (highest first)
 * @param scoredMovies - Array of scored movies
 * @returns Sorted array
 */
export function sortByScore(scoredMovies: MovieScore[]): MovieScore[] {
  return [...scoredMovies].sort((a, b) => b.score - a.score);
}

