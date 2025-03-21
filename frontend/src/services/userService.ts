import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../utils/CONSTANTS';

// Create axios instance with timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
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

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  landmark?: string;
}

export interface UserAddressResponse extends Address {
  name?: string;
}

/**
 * Update user's delivery address
 */
export const updateUserAddress = async (address: Address) => {
  try {
    console.log('Updating user address:', address);
    
    // Validate address data before sending
    if (!address.street || !address.city || !address.state || !address.zipCode || !address.phone) {
      throw new Error('Missing required address fields');
    }

    // Clean up the address data
    const addressData = {
      street: address.street.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      zipCode: address.zipCode.trim(),
      phone: address.phone.trim(),
      landmark: address.landmark?.trim() || ''
    };

    console.log('Sending address data:', addressData);
    
    const response = await api.post('/api/users/address', addressData);
    console.log('Address updated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in updateUserAddress:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please try again later.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      throw new Error(
        error.response?.data?.detail || 
        error.response?.statusText || 
        'Failed to update address'
      );
    }
    
    throw error;
  }
};

/**
 * Get user's saved addresses
 */
export const getUserAddresses = async (): Promise<UserAddressResponse> => {
  try {
    const response = await api.get('/api/users/address');
    
    // Log the response for debugging
    console.log('Address data received:', response.data);
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Error fetching addresses:', error.response?.data);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Connection timeout. Please try again later.');
      }
      if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }
      if (error.response.status === 404) {
        // Return empty address if not found
        return {} as UserAddressResponse;
      }
      throw new Error(error.response?.data?.detail || 'Failed to fetch addresses');
    }
    throw error;
  }
}; 