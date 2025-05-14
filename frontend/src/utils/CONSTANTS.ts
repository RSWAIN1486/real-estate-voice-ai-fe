// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_TIMEOUT = 10000; // 10 seconds

// Client Configuration
export const CLIENT_PORT = 5173; // Default Vite dev server port
export const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;

// Log API and client information to console
console.info('%c🏠 Real Estate Voice AI 🏠', 'font-size: 16px; font-weight: bold; color: #0D47A1;');
console.info(`Frontend running at: ${CLIENT_URL}`);
console.info(`API server expected at: ${API_BASE_URL}`);
