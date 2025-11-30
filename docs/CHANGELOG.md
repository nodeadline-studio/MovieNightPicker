# Changelog

All notable changes to MovieNightPicker will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.65.0] - 2025-01-XX

### Fixed
- **About Button Positioning**: Fixed desktop About button causing movie card layout shift
  - Changed to absolute positioning with zero-width container
  - Button no longer affects card position when appearing
- **Get Movie Button**: Fixed button appearing between movie card and footer
  - Button now appears correctly on all devices when description closes
  - Updated button rendering logic to respond to `showDescriptionButton` changes

### Added
- **Interstitial Ad Pause**: Implemented media pause functionality for interstitial ads
  - Created `utils/mediaPause.ts` utility
  - Pauses all videos, audio, and iframe media when ads appear
  - Integrated into `PropellerInterstitialAd.tsx`

### Changed
- Improved button rendering callback logic in `MovieCard.tsx`
- Updated `useEffect` dependencies to ensure proper button visibility

### Removed
- Removed unused `hasCalledCallbackRef` variable
- Removed unused `ChevronUp` import

---

## [0.64.0] - Previous Version

### Previous Changes
- Core functionality implementation
- Filter system
- Watchlist management
- Responsive design
- Ad system architecture

---

## [Unreleased]

### Planned
- Production ad integration
- Enhanced filtering options
- Performance optimizations
- User preferences persistence

---

## Version History Format

- **[Major.Minor.Patch]** - Version number
- **YYYY-MM-DD** - Release date
- **Fixed** - Bug fixes
- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Security** - Security fixes

---

**Note**: For detailed implementation history, see `docs/archive/` directory.

