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
│   │   ├── redux/           # Redux state management
│   │   ├── services/        # API services and utilities
│   │   ├── styles/          # Global styles and themes
│   │   └── utils/           # Utility functions
├── backend/                 # Optional backend (for future development)
└── docs/                    # Project documentation
    └── cursor/              # Development documentation
```

## Setup

### Requirements

- Node.js (v16 or later)
- npm or yarn

### Frontend Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/real-estate-voiceiai.git
   cd real-estate-voiceiai
   ```

2. Install dependencies:
   ```
   cd frontend
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Backend Installation (Optional)

Currently, the application uses mock data and does not require a backend. A backend may be implemented in future versions for real property data integration.

## Using the Voice Agent

1. Click the microphone button in the hero section
2. Speak a natural language query such as:
   - "Show me apartments for rent in Dubai"
   - "Find villas in New York with at least 3 bedrooms"
   - "I'm looking for properties under $500,000 in Los Angeles"
   - "Show me new developments with a pool in Miami"

## Demo Login

For demonstration purposes, you can use the following credentials:
- Email: demo@example.com
- Password: password123

## Technologies Used

- React
- TypeScript
- Material-UI (MUI)
- Redux Toolkit
- Vite
- React Router

## Recent Updates

- Added demo login functionality
- Implemented 100 local property images
- Enhanced filter synchronization between voice search and UI
- Fixed listing type filter issues
- Added demo video

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
