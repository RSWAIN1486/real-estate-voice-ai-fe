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

## YYYY-MM-DD
- **Removed Backend Components:** Deleted unused files and directories: `backend/models/user.py`, `backend/public/imagedump/`, `backend/public/menuitems.json`, `backend/public/properties_rows.csv`, `backend/routes/auth.py`, `backend/routes/menu.py`, `backend/routes/order.py`, `backend/routes/users.py`, `backend/utils/auth.py`, and `backend/database.py`.
- **Updated `backend/main.py`:** Removed imports, router inclusions, and database connection logic related to the deleted components. Streamlined the root endpoint.
- **Switched to Ultravox Agent API:**
  - **Backend (`voice_agent.py`):** Removed the old `/calls` (POST) and `/voices` (GET) endpoints. The `/agent-calls` (POST) endpoint is now the primary method for creating calls. Enhanced logging for agent call creation.
  - **Frontend (`voiceAgentService.ts`):** 
    - Modified `createVoiceAgentCall` to use the new `/api/voice-agent/agent-calls` backend endpoint and simplified its payload (removed model, voice, systemPrompt, temperature, selectedTools, priorCallId).
    - Deleted constants: `DEFAULT_VOICE_ID`, `DEFAULT_VOICE_MODEL`, `DEFAULT_VOICE_OPTIONS`, `SYSTEM_PROMPT`.
    - Deleted functions: `fetchAvailableVoices`, `getSystemPrompt`, `getVoiceModel`.
  - **Frontend (`VoiceAgent.tsx`):** Removed logic for resuming calls using `lastCallId` (which was tied to `priorCallId`) from `initializeAgent`. The agent now always starts a new call, optionally with past transcripts.
- **Documentation:** 
  - Created `docs/cursor/api_routing_layman.md` with a layman-friendly explanation of the API routing.
  - Created `docs/cursor/api_routing.md` with a technical explanation of the API routing.
  - Deleted old `docs/api_routing.md`.
  - Updated `docs/cursor/current-state.md` and `docs/cursor/changelog.md`.
- **Minor Fixes:** 
  - Corrected `MESSAGE_ROLE_ASSISTANT` to `MESSAGE_ROLE_AGENT` in `frontend/src/services/voiceAgentService.ts` for Ultravox Agent API compatibility. 
  - Updated logger name in `backend/routes/voice_agent.py`.
  - Removed unused DeepInfra API key from `backend/routes/voice_agent.py`. 