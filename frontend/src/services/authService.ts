import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/CONSTANTS';

// Create axios instance with timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Include credentials in requests
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  username: string; // Using username for email as FastAPI OAuth2 expects username
  password: string;
}

export const register = async (userData: RegisterData) => {
  try {
    const response = await api.post('/api/auth/register/', userData);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Registration error:', error.response?.data);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please try again later.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
    throw error;
  }
};

export const login = async (credentials: LoginData) => {
  try {
    console.log('Attempting login for:', credentials.username);
    
    // Convert to URLSearchParams as required by OAuth2
    const params = new URLSearchParams();
    params.append('username', credentials.username);
    params.append('password', credentials.password);

    console.log('Sending login request to:', `${API_BASE_URL}/api/auth/token-nocors`);
    
    // Use the no-cors endpoint with fetch API
    const response = await fetch(`${API_BASE_URL}/api/auth/token-nocors`, {
      method: 'POST',
      body: params,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login response error:', response.status, errorData);
      throw new Error(errorData.detail || `Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Login successful:', data);
    
    // Save token to localStorage immediately
    if (data.access_token) {
      localStorage.setItem('token', data.access_token);
      console.log('Token saved to localStorage');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Login failed');
  }
};

export const getCurrentUser = async () => {
  try {
    // Get token directly from localStorage to ensure it's the latest
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No authentication token found');
      throw new Error('No authentication token found');
    }

    console.log('Fetching user data with token:', token.substring(0, 10) + '...');
    
    const response = await api.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('User data received:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Get user error:', error.response?.data);
      
      // Handle token expiration or invalid token
      if (error.response?.status === 401) {
        console.warn('Token expired or invalid, clearing local storage');
        localStorage.removeItem('token');
      }
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please try again later.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw new Error(error.response?.data?.detail || 'Failed to get user data');
    }
    throw error;
  }
}; 