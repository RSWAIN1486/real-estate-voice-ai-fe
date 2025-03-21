// API Configuration
export const API_BASE_URL = 'http://localhost:8000';
export const API_TIMEOUT = 10000; // 10 seconds

// Client Configuration
export const CLIENT_PORT = 5173; // Default Vite dev server port
export const CLIENT_URL = `http://localhost:${CLIENT_PORT}`;

// Log API and client information to console
console.info('%c🍕 Dontminos Restaurant App 🍕', 'font-size: 16px; font-weight: bold; color: #d32f2f;');
console.info(`Frontend running at: ${CLIENT_URL}`);
console.info(`API server expected at: ${API_BASE_URL}`);

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