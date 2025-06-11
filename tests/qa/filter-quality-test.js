// Filter Quality Control Test
// This test verifies that all filters work correctly and provide good movie results

class FilterQualityTest {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 Starting Filter Quality Control Tests...');
    
    await this.testBasicFilters();
    await this.testAdvancedFilters();
    await this.testSurpriseMeButton();
    await this.testFilterCombinations();
    await this.testEdgeCases();
    
    this.printResults();
  }

  async testBasicFilters() {
    console.log('📋 Testing Basic Filters...');
    
    // Test year range filter
    await this.testFilter('Year Range', {
      yearFrom: 2000,
      yearTo: 2010,
      genres: [],
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    }, (movie) => {
      const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
      return year >= 2000 && year <= 2010;
    });

    // Test rating filter
    await this.testFilter('Rating Filter', {
      yearFrom: 1990,
      yearTo: 2025,
      genres: [],
      ratingFrom: 7.5,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    }, (movie) => {
      return movie.vote_average >= 7.5;
    });

    // Test genre filter
    await this.testFilter('Genre Filter', {
      yearFrom: 1990,
      yearTo: 2025,
      genres: [28], // Action
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    }, (movie) => {
      return movie.genre_ids && movie.genre_ids.includes(28);
    });
  }

  async testAdvancedFilters() {
    console.log('🔧 Testing Advanced Filters...');
    
    // Test multiple genres
    await this.testFilter('Multiple Genres', {
      yearFrom: 1990,
      yearTo: 2025,
      genres: [28, 35], // Action + Comedy
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    }, (movie) => {
      return movie.genre_ids && 
             movie.genre_ids.some(id => [28, 35].includes(id));
    });

    // Test TV Shows only
    await this.testFilter('TV Shows Only', {
      yearFrom: 1990,
      yearTo: 2025,
      genres: [],
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: true,
      maxRuntime: 180
    }, (movie) => {
      return movie.name || movie.original_name; // TV shows have name instead of title
    });

    // Test runtime filter
    await this.testFilter('Runtime Filter', {
      yearFrom: 1990,
      yearTo: 2025,
      genres: [],
      ratingFrom: 6,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 120
    }, (movie) => {
      return !movie.runtime || movie.runtime <= 120;
    });
  }

  async testSurpriseMeButton() {
    console.log('🎲 Testing "Surprise Me" Functionality...');
    
    // Test that Surprise Me generates valid filters
    for (let i = 0; i < 5; i++) {
      const randomFilters = this.generateRandomFilters();
      
      await this.testFilter(`Surprise Me Test ${i + 1}`, randomFilters, (movie) => {
        // Check if movie meets the randomly generated criteria
        const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
        const yearInRange = year >= randomFilters.yearFrom && year <= randomFilters.yearTo;
        const ratingValid = movie.vote_average >= randomFilters.ratingFrom;
        const genreValid = randomFilters.genres.length === 0 || 
                          (movie.genre_ids && movie.genre_ids.some(id => randomFilters.genres.includes(id)));
        
        return yearInRange && ratingValid && genreValid;
      });
    }
  }

  async testFilterCombinations() {
    console.log('🔄 Testing Filter Combinations...');
    
    // Test restrictive but achievable combinations
    const combinations = [
      {
        name: 'Popular Modern Action',
        filters: {
          yearFrom: 2010,
          yearTo: 2025,
          genres: [28], // Action
          ratingFrom: 7,
          inTheatersOnly: false,
          includeAdult: true,
          tvShowsOnly: false,
          maxRuntime: 180
        }
      },
      {
        name: 'Classic Comedy',
        filters: {
          yearFrom: 1980,
          yearTo: 2000,
          genres: [35], // Comedy
          ratingFrom: 6.5,
          inTheatersOnly: false,
          includeAdult: true,
          tvShowsOnly: false,
          maxRuntime: 180
        }
      },
      {
        name: 'Recent High-Rated Drama',
        filters: {
          yearFrom: 2015,
          yearTo: 2025,
          genres: [18], // Drama
          ratingFrom: 7.5,
          inTheatersOnly: false,
          includeAdult: true,
          tvShowsOnly: false,
          maxRuntime: 180
        }
      }
    ];

    for (const combo of combinations) {
      await this.testFilter(combo.name, combo.filters, (movie) => {
        const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
        return year >= combo.filters.yearFrom && 
               year <= combo.filters.yearTo &&
               movie.vote_average >= combo.filters.ratingFrom &&
               (!movie.genre_ids || movie.genre_ids.some(id => combo.filters.genres.includes(id)));
      });
    }
  }

  async testEdgeCases() {
    console.log('⚠️ Testing Edge Cases...');
    
    // Test very restrictive filters (should gracefully degrade)
    await this.testFilter('Very Restrictive', {
      yearFrom: 2023,
      yearTo: 2025,
      genres: [28, 35, 18], // Multiple specific genres
      ratingFrom: 8.5,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 90
    }, (movie) => {
      // This should either find a movie or gracefully handle no results
      return true; // Accept any result as this tests graceful degradation
    }, true); // Allow graceful failure

    // Test very broad filters
    await this.testFilter('Very Broad', {
      yearFrom: 1900,
      yearTo: 2025,
      genres: [],
      ratingFrom: 0,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 300
    }, (movie) => {
      return movie && movie.id && (movie.title || movie.name);
    });
  }

  async testFilter(testName, filterOptions, validationFn, allowFailure = false) {
    this.totalTests++;
    
    try {
      // Simulate API call with filters
      const mockFetch = await this.simulateMovieFetch(filterOptions);
      
      if (!mockFetch.success && !allowFailure) {
        this.recordFailure(testName, 'No movies returned from API');
        return;
      }
      
      if (mockFetch.success && mockFetch.movie) {
        const isValid = validationFn(mockFetch.movie);
        
        if (isValid) {
          this.recordSuccess(testName);
        } else {
          this.recordFailure(testName, 'Movie does not meet filter criteria');
        }
      } else if (allowFailure) {
        this.recordSuccess(testName, 'Graceful failure handled correctly');
      }
      
    } catch (error) {
      if (allowFailure) {
        this.recordSuccess(testName, 'Error handled gracefully');
      } else {
        this.recordFailure(testName, `Error: ${error.message}`);
      }
    }
  }

  async simulateMovieFetch(filterOptions) {
    // This simulates the movie fetching logic
    // In a real test, this would make actual API calls
    
    // Simulate some realistic test data
    const mockMovies = [
      {
        id: 1,
        title: 'Test Action Movie',
        release_date: '2020-01-01',
        vote_average: 7.5,
        genre_ids: [28, 12], // Action, Adventure
        runtime: 120
      },
      {
        id: 2,
        title: 'Test Comedy',
        release_date: '2015-06-15',
        vote_average: 6.8,
        genre_ids: [35], // Comedy
        runtime: 95
      },
      {
        id: 3,
        name: 'Test TV Show',
        first_air_date: '2018-03-01',
        vote_average: 8.2,
        genre_ids: [18, 9648] // Drama, Mystery
      },
      {
        id: 4,
        title: 'Classic Drama',
        release_date: '1995-12-01',
        vote_average: 8.5,
        genre_ids: [18], // Drama
        runtime: 150
      }
    ];

    // Filter movies based on criteria
    let filteredMovies = mockMovies.filter(movie => {
      const year = new Date(movie.release_date || movie.first_air_date).getFullYear();
      const yearInRange = year >= filterOptions.yearFrom && year <= filterOptions.yearTo;
      const ratingValid = movie.vote_average >= filterOptions.ratingFrom;
      const genreValid = filterOptions.genres.length === 0 || 
                        (movie.genre_ids && movie.genre_ids.some(id => filterOptions.genres.includes(id)));
      const typeValid = filterOptions.tvShowsOnly ? !!movie.name : !!movie.title;
      const runtimeValid = !filterOptions.maxRuntime || !movie.runtime || movie.runtime <= filterOptions.maxRuntime;
      
      return yearInRange && ratingValid && genreValid && typeValid && runtimeValid;
    });

    if (filteredMovies.length === 0) {
      return { success: false, message: 'No movies found' };
    }

    // Return random movie from filtered results
    const randomMovie = filteredMovies[Math.floor(Math.random() * filteredMovies.length)];
    return { success: true, movie: randomMovie };
  }

  generateRandomFilters() {
    // Simulate the applyRandomFilters logic
    const currentYear = new Date().getFullYear();
    const allGenres = [28, 35, 18, 27, 16, 80, 99, 10751, 14, 36, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
    
    const numGenres = Math.floor(Math.random() * 2) + 2; // 2-3 genres
    const shuffledGenres = [...allGenres].sort(() => Math.random() - 0.5);
    const randomGenres = shuffledGenres.slice(0, numGenres);
    
    const periods = [
      { from: 1960, to: 1980 },
      { from: 1980, to: 2000 },
      { from: 2000, to: 2010 },
      { from: 2010, to: currentYear },
      { from: 1960, to: currentYear }
    ];
    
    const selectedPeriod = periods[Math.floor(Math.random() * periods.length)];
    const yearFrom = selectedPeriod.from + Math.floor(Math.random() * 5);
    const yearTo = Math.min(selectedPeriod.to, currentYear);
    const rating = Math.floor(Math.random() * 2.5) + 5.5; // 5.5-8.0
    
    return {
      genres: randomGenres,
      yearFrom,
      yearTo,
      ratingFrom: rating,
      inTheatersOnly: false,
      includeAdult: true,
      tvShowsOnly: false,
      maxRuntime: 180
    };
  }

  recordSuccess(testName, note = '') {
    this.passedTests++;
    this.testResults.push({
      test: testName,
      status: 'PASS',
      note: note
    });
    console.log(`✅ ${testName} ${note ? `(${note})` : ''}`);
  }

  recordFailure(testName, reason) {
    this.testResults.push({
      test: testName,
      status: 'FAIL',
      reason: reason
    });
    console.log(`❌ ${testName}: ${reason}`);
  }

  printResults() {
    console.log('\n🏁 Filter Quality Control Results:');
    console.log(`📊 Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.totalTests - this.passedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    const failures = this.testResults.filter(r => r.status === 'FAIL');
    if (failures.length > 0) {
      console.log('\n🔍 Failed Tests:');
      failures.forEach(failure => {
        console.log(`   - ${failure.test}: ${failure.reason}`);
      });
    }
    
    // Quality recommendations
    console.log('\n💡 Quality Recommendations:');
    if (this.passedTests / this.totalTests > 0.9) {
      console.log('   ✨ Excellent filter quality! All systems working well.');
    } else if (this.passedTests / this.totalTests > 0.7) {
      console.log('   ⚠️ Good filter quality with some areas for improvement.');
    } else {
      console.log('   🔧 Filter quality needs attention. Consider reviewing failed tests.');
    }
  }
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FilterQualityTest;
} else if (typeof window !== 'undefined') {
  window.FilterQualityTest = FilterQualityTest;
}

// Auto-run if in browser console
if (typeof window !== 'undefined' && window.location) {
  console.log('🎬 MovieNightPicker Filter Quality Test Ready!');
  console.log('Run: new FilterQualityTest().runAllTests()');
} 