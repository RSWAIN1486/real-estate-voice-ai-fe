# Changelog

This document tracks all significant changes made to the Real Estate Voice Agent project.

## [0.1.0] - 2023-03-21

### Added
- Initial conversion from restaurant voice agent to real estate voice agent
- New HeroSection component with property search functionality
- SearchFilters component with price range slider and property filters
- PropertyList component with mock property data
- Updated theme with real estate branding (blue and orange color scheme)
- Updated Header and Footer components for real estate context
- Real estate specific navigation (Buy, Rent, Sell, About, Contact)
- Project documentation including README, feature design, and current state

### Changed
- Modified App.tsx to include new real estate components
- Updated theme colors and typography to match real estate branding
- Restructured UI layout to feature property search prominently
- Integrated existing voice agent with new real estate UI
- Changed navigation labels and functionality to match real estate context

### Maintained
- Core voice agent functionality (voice recognition and synthesis)
- User authentication system
- Theme toggling functionality
- Voice agent settings management
- Responsive design approach

## Next Release Planning

Features planned for upcoming releases:

- Adaptation of voice agent responses for real estate queries
- Connection to a real property database API
- Property detail pages with comprehensive information
- Map integration for property locations
- Advanced filtering options for property search
- Saved properties functionality
- User account management for saved preferences

- Removed property search tool and all related code (frontend and backend)
- Removed DeepInfra RAG-based property search
- Added support for Ultravox Agent API via new /agent-calls endpoint in backend
- Added requirement for ULTRAVOX_AGENT_ID environment variable
- Updated documentation and README accordingly 