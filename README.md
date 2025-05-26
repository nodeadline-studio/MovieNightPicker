# MovieNightPicker

MovieNightPicker is a web application designed to help users quickly discover movies to watch. Instead of endless browsing through streaming platforms, MovieNightPicker randomly selects films based on user-defined filters.

## Features

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

## Known Issues

- **Filter Selection on Desktop**: There are currently issues with clicking filter elements on desktop devices. This affects the user experience when trying to select genres, adjust ratings, or modify other filter settings.
- **Advertisements**: The advertisement functionality is currently not working and requires fixing. This includes both display ads and video ads that are integrated into the application.

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

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License. 