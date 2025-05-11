# Real Estate Voice Agent

A voice-powered real estate search platform that allows users to search for properties using natural language voice commands.

## Project Overview

This project provides a real estate property search application with a voice-powered AI assistant to help users search for properties across multiple locations and with various criteria.

The frontend is built using React, TypeScript, and Material-UI. The voice agent functionality is powered by Ultravox. Property search is handled by the agent's pretrained knowledge (no external property search tool or RAG).

## Key Features

- Modern real estate search interface
- Voice-powered property search assistant
- AI-powered property search using Ultravox Agent API (pretrained knowledge)
- Natural language understanding for property search queries
- Property filtering by location, price, bedrooms, and more (using agent's knowledge)
- Property results displayed directly in chat interface
- Responsive design for desktop and mobile devices
- Frontend-only mode for easy deployment without a backend server

## Project Structure

```
├── frontend/          # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── HeroSection.tsx      # Hero section with search
│   │   │   ├── PropertyList.tsx     # Property listing component
│   │   │   ├── SearchFilters.tsx    # Search filters component
│   │   │   ├── VoiceAgent/          # Voice agent components
│   │   │   │   ├── VoiceAgent.tsx            # Main voice agent component
│   │   │   │   ├── VoiceAgentTranscript.tsx  # Transcript display component
│   │   │   │   └── VoiceAgentSettings.tsx    # Settings component
│   │   │   ├── Header/              # Header components
│   │   │   └── Footer/              # Footer components
│   │   ├── store/      # Redux store and slices
│   │   │   └── slices/ # Redux slices for state management
│   │   │       └── voiceAgentSlice.ts  # Voice agent state management
│   │   ├── services/   # API services
│   │   │   ├── voiceAgentService.ts    # Voice agent service
│   │   │   └── clientTools.ts          # Tool implementations
│   │   └── utils/      # Utility functions
│   ├── public/         # Static assets
└── docs/              # Documentation files
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Configuration

Create or update the `.env` file in the frontend directory with:

```
# Ultravox API Configuration
VITE_ULTRAVOX_API_KEY=your_ultravox_api_key
VITE_ULTRAVOX_API_URL=https://api.ultravox.ai
VITE_ULTRAVOX_VOICE_ID=Emily-English
VITE_ULTRAVOX_AGENT_ID=your_ultravox_agent_id

# Application Mode
# Set to 'true' to enable direct API calls to Ultravox (no backend required)
# Set to 'false' to use a backend server as a proxy
VITE_FRONTEND_ONLY_MODE=true

# Voice Agent Configuration
VITE_DEFAULT_LANGUAGE=en-US
VITE_VOICE_AGENT_NAME=Global Estates Assistant
```

### Running the Application

Start the frontend:
```
cd frontend
npm run dev
```

### Deployment

#### Frontend-Only Mode Deployment (Recommended)

The application can be deployed as a standalone frontend app in "frontend-only mode" without needing a backend server:

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Set the following environment variables in your Vercel project settings:
   - `VITE_ULTRAVOX_API_KEY` - Your Ultravox API key
   - `VITE_ULTRAVOX_AGENT_ID` - Your Ultravox agent ID
   - `VITE_FRONTEND_ONLY_MODE` - Set to `true`
4. Deploy the project

When in frontend-only mode, the application makes direct calls to the Ultravox API from the browser, avoiding the need for a backend server.

#### With Backend Deployment (Optional)

If you need to deploy with a backend server (for additional features or security):

1. Deploy both the frontend and backend servers
2. Set `VITE_FRONTEND_ONLY_MODE` to `false`
3. Configure the backend server to proxy requests to the Ultravox API
4. Ensure CORS is properly configured

## Voice Commands

The voice agent can understand and process requests like:

- "Find properties in Dubai Marina"
- "Show me apartments with 2 bedrooms"
- "Search for houses under $2 million"
- "Find rental properties in Business Bay"
- "Find properties with a pool in Palm Jumeirah"

## How It Works

1. When a user speaks to the voice agent asking about properties, the agent uses its own pretrained knowledge to answer the query.
2. The frontend calls the Ultravox Agent API directly using a proxy to avoid CORS issues.
3. The agent responds to property search questions using its built-in knowledge and can provide dummy data as needed.
4. Results are displayed in an easy-to-read format in the conversation interface.
5. The voice agent can then answer follow-up questions about the properties.

## Technologies Used

- **Frontend**: React, TypeScript, Material-UI, Redux
- **Voice Processing**: Ultravox API
- **Natural Language Understanding**: Ultravox Agent (pretrained knowledge)
- **Search**: Ultravox Agent (no external property search tool) 