# Dontminos Pizza Restaurant Voice Agent

An advanced voice-enabled ordering system for Dontminos Pizza Restaurant. This application allows customers to place orders through natural language voice commands while providing a seamless user experience.

## Features

- **Voice Agent Ordering**: Place orders by speaking naturally to the AI voice agent
- **Voice Customization**: Choose from different voice options for the agent
- **Real-time Order Updates**: See your order updated in real-time as you speak
- **Conversation History**: Resume previous conversations when returning
- **Menu Exploration**: Browse the full menu with high-quality images
- **Secure Checkout**: Complete your order with a streamlined checkout process

## Recent Optimizations

- Image loading system with memory caching to improve performance
- Robust message format handling for voice agent conversations
- Improved error recovery for microphone permissions
- Enhanced audio visualization feedback for voice interactions

## Project Structure

```
/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Menu/          # Menu display components
│   │   │   ├── VoiceAgent/    # Voice agent components
│   │   │   ├── Cart/          # Shopping cart components
│   │   │   └── ...
│   │   ├── services/          # Service layer for API calls
│   │   ├── store/             # Redux store and slices
│   │   └── utils/             # Utility functions
│   └── public/                # Static assets
│
├── backend/                   # FastAPI backend server
│   ├── routes/                # API route handlers
│   │   ├── menu.py            # Menu endpoints
│   │   ├── order.py           # Order endpoints 
│   │   ├── voice_agent.py     # Voice agent proxy endpoints
│   │   └── ...
│   ├── public/                # Publicly accessible files
│   │   ├── imagedump/         # Product images
│   │   └── ...
│   └── main.py                # FastAPI application entry point
│
└── docs/                      # Documentation
    ├── cursor/                # Project documentation
    │   ├── feature-design.md  # Feature specifications
    │   ├── current-state.md   # Current project status
    │   ├── changelog.md       # Version history
    │   └── memory.md          # Development learnings
    └── ...
```

## Tech Stack

### Frontend
- React with TypeScript
- Material UI for components
- Redux for state management
- Ultravox client SDK for voice agent

### Backend
- FastAPI (Python)
- MongoDB for data storage
- Ultravox API integration for voice capabilities

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.10+)
- MongoDB
- API keys for Ultravox (see .env.example)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/dontminos-voice-agent.git
cd dontminos-voice-agent
```

2. Set up backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your API keys
```

3. Set up frontend
```bash
cd ../frontend
npm install
cp .env.example .env  # Edit with your settings
```

### Running the Application

1. Start backend server
```bash
cd backend
python main.py  # API will run on http://localhost:8000
```

2. Start frontend development server
```bash
cd frontend
npm run dev  # Frontend will run on http://localhost:5173
```

3. Access the application at http://localhost:5173

## Voice Agent Usage

1. Click on "Try our Voice Agent" button on the menu page
2. Grant microphone permissions when prompted
3. Speak naturally to order food, e.g., "I'd like to order a large pepperoni pizza"
4. The agent will guide you through the ordering process
5. View your order in the cart and complete checkout

## Troubleshooting

- **Microphone not working**: Check browser permissions and ensure you're using a compatible browser (Chrome, Firefox, Edge)
- **Images not loading**: Verify that the backend server is running and accessible
- **Voice agent errors**: Check the console for detailed error messages and ensure your Ultravox API key is properly configured

## Contributing

Contributions are welcome! Please check the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 