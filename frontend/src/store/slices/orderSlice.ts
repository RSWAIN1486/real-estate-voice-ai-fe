import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

interface OrderState {
  items: OrderItem[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: OrderState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<OrderItem>) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },
    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.quantity = action.payload.quantity;
        state.total = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
    },
    clearOrder: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearOrder } = orderSlice.actions;
export default orderSlice.reducer; 