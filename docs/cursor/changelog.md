# Changelog

This document tracks all significant changes made to the Real Estate Voice Agent project.

## [Unreleased]

## [1.2.0] - 2023-07-03
- Converted to frontend-only mode
- Removed backend dependency
- Added Vite proxy for Ultravox API calls
- Updated documentation for frontend-only deployment
- Simplified environment variable configuration

## [1.1.0] - 2023-06-28
- Implemented frontend-only mode option
- Added environment variable `VITE_FRONTEND_ONLY_MODE` to toggle between backend proxy and frontend-only mode
- Added VoiceAgentStatus component to display connection mode
- Updated documentation with frontend-only mode instructions

## [1.0.0] - 2023-06-15
- Converted restaurant voice agent to real estate voice agent
- Removed menu-related components and functionality
- Added property search interface
- Integrated with Ultravox Agent API for property search using agent's knowledge
- Implemented property display in conversation interface
- Updated system prompt for real estate domain
- Added voice commands for property search
- Updated UI with real estate branding and styling

## [0.2.0] - 2023-05-20
- Added voice agent settings panel
- Implemented voice selection
- Added call recording toggle
- Implemented temperature adjustment for agent responses
- Added system prompt customization
- Improved error handling for microphone access
- Enhanced call termination reliability

## [0.1.0] - 2023-05-01
- Initial release
- Basic voice agent functionality
- Menu ordering capabilities
- Order management
- User authentication
- Basic UI components

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

## [0.2.0] - 2023-04-15

### Added
- Frontend-only mode to directly call Ultravox Agent API without backend
- VoiceAgentStatus component to display the current connection mode
- Support for environment variables in the frontend (.env)
- Direct API call implementation in voiceAgentService.ts

### Changed
- Updated createVoiceAgentCall to check for frontend-only mode
- Modified CONSTANTS.ts to support frontend-only configuration
- Updated documentation to reflect new deployment options

- Removed property search tool and all related code (frontend and backend)
- Removed DeepInfra RAG-based property search
- Added support for Ultravox Agent API via new /agent-calls endpoint in backend
- Added requirement for ULTRAVOX_AGENT_ID environment variable
- Updated documentation and README accordingly

## [2023-09-08] - Production Deployment Fixes for Frontend-Only Mode

### Fixed
- Fixed 404 errors when making direct Ultravox API calls in production environment by:
  - Adding environment detection to distinguish between development and production
  - Using the direct Ultravox API URL in production instead of the Vite proxy path
  - Adding proper API key headers for direct API calls
  - Fixing the Ultravox client session initialization and management
  - Updating environment variable handling in constants

### Changed
- Updated README with clearer deployment instructions for frontend-only mode
- Added memory documentation about the deployment issue and solution
- Changed environment variable handling to use a proper VITE_FRONTEND_ONLY_MODE flag

### Added
- Added environment detection logic to all Ultravox API calls
- Added detailed logging for API call URLs and paths for easier debugging

## [2023-09-09] - CORS Fix with Serverless Proxy

### Fixed
- Resolved CORS issues when calling Ultravox API in production by implementing a serverless proxy function
- Fixed API key authentication issues with direct Ultravox API calls
- Fixed URL handling for joinCall function to correctly work with the proxy in production

### Added
- Added serverless function `/api/ultravox-proxy.js` to proxy API calls to Ultravox
- Added environment detection logic in API calls to use different strategies for dev vs prod
- Added better error handling and response parsing in the proxy function
- Added vercel.json for proper configuration of the serverless function

### Changed
- Updated voiceAgentService.ts to use the serverless proxy in production
- Modified handling of Ultravox joinUrl to work with the proxy
- Added documentation about CORS issues and serverless proxy solution 