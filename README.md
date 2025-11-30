# MovieNightPicker

MovieNightPicker is a web application designed to help users quickly discover movies to watch. Instead of endless browsing through streaming platforms, MovieNightPicker randomly selects films based on user-defined filters.

## Features

File: src/pages/Home.tsx - Change pickCounter.count % 7 to pickCounter.count % 5

### Core Functionality
- **Random Movie Selection**: Get instant movie recommendations with a single click
- **Detailed Movie Information**: View posters, ratings, release dates, genres, and plot summaries
- **Watchlist Management**: Save interesting movies to a watchlist for later viewing
- **Advanced Filtering Options**:
  - By genre (Action, Comedy, Drama, etc.)
  - By release year
  - By minimum rating
  - By maximum runtime
  - In theaters only option
  - Adult content toggle with age verification

### User Experience
- **Responsive Design**: Works on both mobile and desktop devices
- **Intuitive Interface**: Clean, modern UI with easy-to-use controls
- **Fast Performance**: Instant movie recommendations without page reloads
- **Local Storage**: Filters and watchlist persist between sessions

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS
- **API**: TMDB (The Movie Database)
- **Build Tool**: Vite
- **State Management**: React Context API
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[Documentation Index](docs/README.md)** - Complete documentation guide
- **[Project Status](docs/STATUS.md)** - Current status, features, and roadmap
- **[Changelog](docs/CHANGELOG.md)** - Version history and changes
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines

For detailed documentation, see [docs/README.md](docs/README.md).

## Current Status

**Version**: 0.65.0  
**Status**: ✅ Production Ready - Ads Implementation Pending

### Recent Updates
- ✅ Fixed About button positioning (no layout shift)
- ✅ Fixed Get Movie button positioning
- ✅ Implemented interstitial ad pause functionality

See [docs/STATUS.md](docs/STATUS.md) for complete status and roadmap.

## Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```
git clone https://github.com/yourusername/MovieNightPicker.git
cd MovieNightPicker
```

2. Install dependencies
```
npm install
```

3. Start the development server
```
npm run dev
```

4. Build for production
```
npm run build
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start for Contributors

1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Check [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for development guidelines
3. Review [docs/TESTING.md](docs/TESTING.md) for testing requirements
4. Follow the pull request process outlined in CONTRIBUTING.md

## License

This project is licensed under the MIT License. 