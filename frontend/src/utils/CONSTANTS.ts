// API Configuration
// No longer needed for frontend-only mode
// export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_TIMEOUT = 10000; // 10 seconds

// Ultravox Configuration
export const ULTRAVOX_BASE_URL = import.meta.env.VITE_ULTRAVOX_API_URL || 'https://api.ultravox.ai';
// Parse the FRONTEND_ONLY_MODE from environment variables
export const FRONTEND_ONLY_MODE = (import.meta.env.VITE_FRONTEND_ONLY_MODE === 'true');

// Client Configuration
export const CLIENT_PORT = 5173; // Default Vite dev server port
export const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;

// Log API and client information to console
console.info('%c🏠 Global Estates Real Estate App 🏠', 'font-size: 16px; font-weight: bold; color: #2B4162;');
console.info(`Frontend running at: ${CLIENT_URL}`);
console.info(`Frontend-only mode: ${FRONTEND_ONLY_MODE ? 'Enabled' : 'Disabled'}`);
console.info(`Using direct Ultravox API calls via proxy to: ${ULTRAVOX_BASE_URL}`);

// Menu Categories
export const MENU_CATEGORIES = {
  PIZZA: 'pizza',
  SIDES: 'sides',
  BEVERAGES: 'beverages',
  DESSERTS: 'desserts',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
} as const;

// Financial Constants
export const TAX_RATE = 0.18; // 18% GST
export const MIN_ORDER_AMOUNT = 100;
export const DELIVERY_CHARGE = 40;
export const FREE_DELIVERY_THRESHOLD = 500;

// Theme Options
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
} as const; 