# Real Estate Voice Agent

A voice-powered real estate search platform that allows users to search for properties using natural language voice commands.

## Project Overview

This project converts a restaurant voice agent into a real estate property search application. It uses a voice-powered AI assistant to help users search for properties across multiple locations and with various criteria.

The frontend is built using React, TypeScript, and Material-UI. The voice agent functionality is powered by Ultravox, and property search leverages DeepInfra's Llama 3.2 model with a Retrieval-Augmented Generation (RAG) approach.

## Key Features

- Modern real estate search interface
- Voice-powered property search assistant
- AI-powered property search using RAG and LLM processing
- Natural language understanding for property search queries
- Property filtering by location, price, bedrooms, and more
- Property results displayed directly in chat interface
- Responsive design for desktop and mobile devices

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
│   │   │   ├── propertyService.ts      # Property search service
│   │   │   └── clientTools.ts          # Tool implementations
│   │   └── utils/      # Utility functions
│   ├── public/         # Static assets
├── backend/            # Backend API server
│   ├── routes/         # API routes
│   │   └── voice_agent.py  # Voice agent routes including property search
│   ├── public/         # Public assets
│   │   └── properties_rows.csv # Property data
│   └── ...
└── docs/              # Documentation files
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- Python (v3.8 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

### Configuration

Create a `.env` file in the backend directory with the following:

```
# Ultravox API Configuration (for voice agent)
ULTRAVOX_API_KEY=your_ultravox_api_key
ULTRAVOX_BASE_URL=https://api.ultravox.ai

# DeepInfra API Configuration (for RAG-based property search)
DEEPINFRA_API_KEY=your_deepinfra_api_key
```

### Running the Application

1. Start the backend:
   ```
   cd backend
   python main.py
   ```
2. Start the frontend:
   ```
   cd frontend
   npm start
   ```

## Voice Commands

The voice agent can understand and process requests like:

- "Find properties in Dubai Marina"
- "Show me apartments with 2 bedrooms"
- "Search for houses under $2 million"
- "Find rental properties in Business Bay"
- "Find properties with a pool in Palm Jumeirah"

## How It Works

1. When a user speaks to the voice agent asking about properties, the agent recognizes this as a property search query
2. The agent calls the `propertySearch` tool with the user's query
3. On the backend, the query is processed by DeepInfra's Llama 3.2 model to extract search parameters
4. The backend performs a RAG (Retrieval-Augmented Generation) search on the property database
5. Results are returned to the frontend and displayed in an easy-to-read format
6. The voice agent can then answer follow-up questions about the properties

## Technologies Used

- **Frontend**: React, TypeScript, Material-UI, Redux
- **Backend**: FastAPI, Python
- **Voice Processing**: Ultravox API
- **Natural Language Understanding**: DeepInfra Llama 3.2 model
- **Search**: RAG (Retrieval-Augmented Generation) 