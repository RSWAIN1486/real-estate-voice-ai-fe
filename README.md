# Real Estate Voice Agent

A voice-powered real estate search platform that allows users to search for properties using natural language voice commands.

## Project Overview

This project converts a restaurant voice agent into a real estate property search application. It uses a voice-powered AI assistant to help users search for properties across multiple locations and with various criteria.

The frontend is built using React, TypeScript, and Material-UI. The voice agent functionality is maintained from the original project while the user interface has been updated to reflect a real estate property search application.

## Key Features

- Modern real estate search interface
- Voice-powered property search assistant
- Property filtering by location, price, bedrooms, and more
- Mock property listings with images and details
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
│   │   │   ├── Header/              # Header components
│   │   │   └── Footer/              # Footer components
│   │   ├── store/      # Redux store and slices
│   │   ├── services/   # API services
│   │   └── utils/      # Utility functions
│   ├── public/         # Static assets
├── backend/            # Backend API server
│   └── ...
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
3. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

### Running the Application

1. Start the backend:
   ```
   cd backend
   npm start
   ```
2. Start the frontend:
   ```
   cd frontend
   npm start
   ```

## Voice Commands

The voice agent can understand and process requests like:

- "Find properties in New York"
- "Show me apartments with 2 bedrooms"
- "Search for houses in London under $2 million"
- "Find properties with a pool in Dubai"

## Technologies Used

- **Frontend**: React, TypeScript, Material-UI, Redux
- **Voice Processing**: Integration with existing voice agent system
- **APIs**: RESTful API with Express.js backend 