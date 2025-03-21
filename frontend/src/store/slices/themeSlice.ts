import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { THEME } from '../../utils/CONSTANTS';

interface ThemeState {
  mode: typeof THEME[keyof typeof THEME];
}

const initialState: ThemeState = {
  mode: THEME.LIGHT,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === THEME.LIGHT ? THEME.DARK : THEME.LIGHT;
    },
    setTheme: (state, action: PayloadAction<typeof THEME[keyof typeof THEME]>) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer; 