import axios from 'axios';
import { API_BASE_URL } from '../utils/CONSTANTS';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  withCredentials: true, // Include credentials in requests
});

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

export interface OrderData {
  items: OrderItem[];
  total: number;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method: string;
}

export const createOrder = async (orderData: OrderData) => {
  try {
    console.log('Creating order with data:', orderData);
    const response = await api.post('/api/orders/', orderData);
    console.log('Order created:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error creating order:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } else {
      console.error('Error creating order:', error);
    }
    throw error;
  }
};

export const getOrderById = async (orderId: string) => {
  try {
    console.log('Fetching order:', orderId);
    const response = await api.get(`/api/orders/${orderId}/`);
    console.log('Order received:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Axios error fetching order:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } else {
      console.error('Error fetching order:', error);
    }
    throw error;
  }
}; 