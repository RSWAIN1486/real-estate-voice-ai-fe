import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/CONSTANTS';

// Create API client with proper configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Include credentials in requests
  headers: {
    'Content-Type': 'application/json',
  }
});

// Log requests in development
api.interceptors.request.use(request => {
  console.debug('🚀 API Request:', request.method?.toUpperCase(), request.url);
  return request;
});

// Log responses in development
api.interceptors.response.use(
  response => {
    console.debug('✅ API Response:', response.status, response.config.method?.toUpperCase(), response.config.url);
    return response;
  },
  error => {
    if (axios.isAxiosError(error)) {
      console.error('❌ API Error:', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    } else {
      console.error('❌ Unknown API Error:', error);
    }
    return Promise.reject(error);
  }
);

/**
 * Get all menu items from the API
 */
export const getMenuItems = async () => {
  try {
    console.info('Fetching menu items from API...');
    const response = await api.get('/api/menu/');
    console.info(`Successfully fetched ${response.data.length} menu items`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    throw error;
  }
};

/**
 * Get all menu categories from the API
 */
export const getCategories = async () => {
  try {
    console.info('Fetching menu categories from API...');
    const response = await api.get('/api/menu/categories/');
    console.info(`Successfully fetched ${response.data.categories.length} categories`);
    return response.data.categories;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};

/**
 * Get menu items by category from the API
 */
export const getItemsByCategory = async (category: string) => {
  try {
    console.info(`Fetching menu items for category: ${category}`);
    const response = await api.get(`/api/menu/category/${category}/`);
    console.info(`Successfully fetched ${response.data.length} items for category: ${category}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch items for category: ${category}`, error);
    throw error;
  }
}; 