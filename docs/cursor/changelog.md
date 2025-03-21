# Changelog

All notable changes to the Restaurant Voice Agent project will be documented in this file.

## [Unreleased]

### Changed
- Completely overhauled call termination with multi-layered robust approach:
  - Added direct session-level call termination for more reliable hangup
  - Implemented timeout protection to prevent hanging on termination calls
  - Added WebRTC peer connection direct closing for more thorough cleanup
  - Added distinctive emoji-prefixed logging for better debugging
  - Implemented fallback strategies if primary termination methods fail
  - Added direct audio track stopping for immediate audio resource release
- Enhanced user experience with automatic loading of previous conversations
  - Removed the "Load Previous" button as it's no longer needed
  - Added automatic detection and loading of past conversations when the dialog opens
  - Improved transcript validation for more reliable conversation resumption

### Fixed
- Simplified call termination by using the Ultravox SDK's native leaveCall() method
  - Removed unnecessary backend hangup endpoint
  - Removed custom hangUp tool registration
  - Fixed inactivitySettings key name in API request
  - Added proper cleanup of the uvSession reference after call termination
- Fixed FastAPI query parameter handling in voice_agent.py (`request.query_items()` replaced with `request.query_params`)
- Added tests for FastAPI endpoint query parameter handling
- Enhanced VoiceAgent dialog component cleanup to ensure proper resource management in all closing scenarios
- Fixed issue with the dialog close button not properly terminating the voice call
- Improved call termination logic with multiple levels of protection:
  - Custom dialog title with properly configured close button
  - Enhanced handleClose function for thorough cleanup
  - Reinforced component unmount cleanup function
  - Prevented accidental dialog closure via backdrop clicks without cleanup
- Added detailed logging for call termination process to help with debugging

## [0.3.3] - 2023-03-23

### Fixed
- Fixed critical 400 error when using priorCallId by moving it from request body to query parameter
- Correctly implemented Ultravox API specification for conversation resumption
- Fixed regression in conversation persistence functionality

### Changed
- Improved request structure for Ultravox API calls
- Enhanced error logging for API parameter issues
- Updated documentation with proper API parameter usage

## [0.3.2] - 2023-03-22

### Fixed
- Fixed critical "Invalid hook call" error that was crashing the application on startup
- Corrected improper hook usage in useEffect cleanup functions
- Implemented proper Redux state access in cleanup functions using store.getState()

### Changed
- Updated VoiceAgent component to follow React hooks rules correctly
- Improved error handling during component cleanup

## [0.3.1] - 2023-03-21

### Fixed
- Fixed critical bug where voice agent continued to run in the background after closing the dialog
- Implemented proper resource cleanup when the conversation ends
- Added multi-layered call termination on both server and client sides
- Enhanced component lifecycle management for better resource handling

### Changed
- Improved error handling for call termination
- Added logging for better debugging of call lifecycle
- Enhanced audio resource cleanup

## [0.3.0] - 2023-03-20

### Added
- Implemented conversation persistence using `priorCallId` from Ultravox API
- Added multi-layered storage for call IDs (memory, sessionStorage, localStorage)
- Visual feedback when resuming previous conversations
- Fallback mechanism when no previous conversations are available

### Changed
- Refactored message handling to use priorCallId instead of manual message formatting
- Improved error handling for conversation resumption
- Enhanced storage strategy for persistence across page refreshes and browser sessions

### Fixed
- Message format errors when using initialMessages with the Ultravox API
- Conflicts between initialMessages and priorCallId parameters

## [0.2.0] - 2023-03-19

### Added
- New image optimization utilities in `reusableFns.ts` for better performance
- Memory cache for image requests to reduce API calls
- More detailed error handling for failed image loads
- Documentation for all major components and features

### Fixed
- Voice agent message format handling for previous conversations
- Voice selection now properly uses user-defined settings
- Image loading errors now provide helpful fallbacks
- Error recovery for microphone permission issues

### Changed
- Improved `VoiceAgent.tsx` component with better error handling
- Enhanced `backend/routes/voice_agent.py` with robust message transformation
- Optimized `Menu.tsx` with better image loading performance
- Standardized error handling approach across components

## [0.1.0] - 2023-03-18

### Added
- Initial VoiceAgent component implementation
- VoiceAgentSettings component for voice customization
- Backend proxy for Ultravox API
- Voice selection dropdown with default options
- Basic conversation history functionality
- Real-time audio level visualization
- Microphone and speaker mute/unmute controls

### Fixed
- Initial communication issues with Ultravox API
- Menu component image loading with placeholders

### Changed
- Updated Redux store to handle voice agent state
- Modified backend routes for optimized API access 