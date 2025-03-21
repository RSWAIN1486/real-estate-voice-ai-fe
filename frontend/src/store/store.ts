import { configureStore } from '@reduxjs/toolkit';
import menuReducer from './slices/menuSlice';
import orderReducer from './slices/orderSlice';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';
import voiceAgentReducer from './slices/voiceAgentSlice';
import voiceAgentSettingsReducer from './slices/voiceAgentSettingsSlice';

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    order: orderReducer,
    theme: themeReducer,
    auth: authReducer,
    voiceAgent: voiceAgentReducer,
    voiceAgentSettings: voiceAgentSettingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 