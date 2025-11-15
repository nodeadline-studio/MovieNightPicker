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

### Current Status & Development
- **Development Status**: See `docs/DEVELOPMENT_STATUS.md` for current state, known issues, and next steps
- **UI Validation**: See `docs/UI_VALIDATION_CHECKLIST.md` for pending UI/UX validation tasks
- **Ad Configuration**: See `docs/AD_CONFIGURATION_GUIDE.md` for Monetag ad setup instructions

### Monetization & Ads
- **Monetag Implementation**: See `docs/MONETAG_IMPLEMENTATION_SUMMARY.md` for ad integration details
- **Monetag Quick Setup**: See `docs/MONETAG_QUICK_SETUP.md` for quick reference
- **Ad Providers**: See `docs/AD_PROVIDERS_SETUP.md` for multi-provider architecture

### Testing & Quality
- **Testing Guidelines**: See `docs/prev/TESTING_GUIDELINES.md` for testing standards
- **Service Worker**: See `docs/dev/SERVICE_WORKER_EXPLANATION.md` for service worker info

## Current Status

**Version**: 0.65.0  
**Status**: Active Development

### ✅ Working
- Core functionality (movie discovery, filtering, watchlist)
- UI/UX layout and responsive design
- Build and lint passing

### ⚠️ Pending
- **Monetag Ads**: Script URLs need configuration (see `docs/AD_CONFIGURATION_GUIDE.md`)
- **UI Validation**: Recent fixes need visual validation (see `docs/UI_VALIDATION_CHECKLIST.md`)

For detailed status, see [`docs/DEVELOPMENT_STATUS.md`](docs/DEVELOPMENT_STATUS.md).

## Known Issues

- **Monetag Ads Not Loading**: Script URLs need to be updated from Monetag dashboard. See `docs/AD_CONFIGURATION_GUIDE.md` for instructions.
- **UI Fixes Pending Validation**: Recent UI improvements need user validation. See `docs/UI_VALIDATION_CHECKLIST.md`.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and development timeline.

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

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. **Clean up test files** - See [Testing Guidelines](docs/TESTING_GUIDELINES.md)
5. Submit a Pull Request

### Test Cleanup Policy

Before committing, always clean up temporary test files:
```bash
rm -f tests/qa/*.png && rm -rf test-results/
```

See [TESTING_GUIDELINES.md](docs/TESTING_GUIDELINES.md) for complete testing standards.

## License

This project is licensed under the MIT License. 