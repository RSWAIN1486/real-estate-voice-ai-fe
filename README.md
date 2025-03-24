# Real Estate Voice AI

A voice-powered real estate search application allowing users to find properties using natural language voice commands.

## Demo
Check out the demo video to see the application in action.

https://github.com/user-attachments/assets/85c13659-de89-4497-bfe3-6c1be315d8da

## Project Overview

Real Estate Voice AI is a modern web application that allows users to search for properties using both traditional UI controls and natural language voice commands. Users can filter properties by location, price range, number of bedrooms/bathrooms, property type, and listing type (For Sale, For Rent, New Development).

### Key Features

- **Voice-powered search**: Search properties using natural language voice commands
- **Comprehensive filtering**: Filter properties by location, price, rooms, property type, and more
- **Modern UI**: Clean, responsive design with property cards and filter controls
- **Property listings**: Browse through property cards with images, details, and features
- **Demo login**: Test the application with demo credentials

## Project Structure

```
real-estate-voiceiai/
├── frontend/                # React frontend application
│   ├── public/              # Public assets including property images
│   ├── src/                 # Source code
│   │   ├── assets/          # Images, icons, and other static assets
│   │   ├── components/      # React components
│   │   ├── store/           # Redux state management
│   │   ├── services/        # API services and utilities
│   │   └── utils/           # Utility functions
├── backend/                 # FastAPI backend with Ultravox integration
│   ├── routes/              # API route handlers
│   ├── models/              # Data models
│   ├── utils/               # Helper utilities
│   └── public/              # Static files
└── docs/                    # Project documentation
    └── cursor/              # Development documentation
```

## Setup

### Requirements

- Node.js (v16 or later)
- Python (v3.9 or later)
- npm or yarn
- Conda (recommended for managing Python environments)

### Frontend Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/real-estate-voiceiai.git
   cd real-estate-voiceiai
   ```

2. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

3. Start the frontend development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Backend Installation

The backend is required for voice agent functionality as it integrates with the Ultravox service for voice processing.

1. Create a Python environment (using conda):
   ```
   conda create -n real-estate-backend python=3.9
   conda activate real-estate-backend
   ```

2. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   - The backend uses a `.env` file in the `backend` directory
   - Ensure your Ultravox API key is properly configured in the `.env` file
   - Default MongoDB connection settings can be used for demo purposes

4. Start the backend server:
   ```
   cd backend
   uvicorn main:app --reload
   ```

5. The backend API will be available at `http://localhost:8000`

## Voice Agent Integration

The Real Estate Voice AI uses the Ultravox service to power its voice interaction capabilities:

- Voice recognition for converting speech to text
- Natural language understanding for extracting search criteria
- Voice synthesis for spoken responses

To use the voice features:
1. Ensure the backend server is running (required for voice processing)
2. Click the microphone button in the hero section
3. Grant microphone permissions when prompted
4. Speak your property search query naturally

## Using the Voice Agent

The voice agent can process natural language queries such as:

- "Show me apartments for rent in Dubai"
- "Find villas in New York with at least 3 bedrooms"
- "I'm looking for properties under $500,000 in Los Angeles"
- "Show me new developments with a pool in Miami"
- "What properties are available near downtown Chicago?"
- "Find me a 2-bedroom apartment with a balcony in San Francisco"

## Demo Login

For demonstration purposes, you can use the following credentials:
- Email: demo@example.com
- Password: password123

## Technologies Used

- **Frontend**: React, TypeScript, Material-UI (MUI), Redux Toolkit, Vite
- **Backend**: FastAPI, Python, MongoDB, Ultravox API
- **Voice Processing**: Ultravox voice recognition and synthesis
- **State Management**: Redux with Redux Toolkit
- **Authentication**: JWT-based authentication (mock for demo)

## Recent Updates

- Added demo login functionality
- Implemented 100 local property images
- Enhanced filter synchronization between voice search and UI
- Fixed listing type filter issues
- Added demo video
- Updated branding to Global Estates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
